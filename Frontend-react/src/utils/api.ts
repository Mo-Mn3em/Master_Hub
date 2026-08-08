import type { Patient } from '../types';
import { patientToApi, caseFromApi, type BackendCase } from './apiMapper';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'master_hub_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export async function loginApi(username: string, password: string): Promise<{ id: number; name: string }> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Invalid username or password.');
  }

  const data = await response.json();
  setToken(data.token);
  return data.user;
}

export async function logoutApi(): Promise<void> {
  const token = getToken();
  if (!token) return;
  await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', Authorization: `Bearer ${token}` },
  }).catch(() => {});
  clearToken();
}

// ── Case API ──────────────────────────────────────────────────────────────────
export async function fetchCasesApi(search?: string): Promise<Patient[]> {
  const url = search ? `${API_BASE}/case?search=${encodeURIComponent(search)}` : `${API_BASE}/case`;
  const response = await fetch(url, { headers: authHeaders() });

  if (!response.ok) {
    throw new Error(`Failed to fetch cases: ${response.statusText}`);
  }

  const data = await response.json();
  const casesList: BackendCase[] = Array.isArray(data) ? data : (data.data || []);
  return casesList.map(caseFromApi);
}

export async function createCaseApi(patient: Partial<Patient>): Promise<Patient> {
  const payload = patientToApi(patient);
  const response = await fetch(`${API_BASE}/case`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create case: ${response.statusText}`);
  }

  const createdCase: BackendCase = await response.json();
  return caseFromApi(createdCase);
}

export async function updateCaseApi(id: string, patient: Partial<Patient>): Promise<Patient> {
  const payload = patientToApi(patient);
  const response = await fetch(`${API_BASE}/case/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update case: ${response.statusText}`);
  }

  const updatedCase: BackendCase = await response.json();
  return caseFromApi(updatedCase);
}

export async function deleteCaseApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/case/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete case: ${response.statusText}`);
  }
}

/**
 * Fetch cases using the backend filter endpoint.
 * Pass an object with any supported query parameters (search, status, date_from, date_to, etc.).
 */
export async function fetchFilteredCasesApi(params: Record<string, string | undefined> = {}): Promise<Patient[]> {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') {
      query.append(key, value);
    }
  });
  const url = `${API_BASE}/case/filter${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await fetch(url, { headers: authHeaders() });

  if (!response.ok) {
    throw new Error(`Failed to fetch filtered cases: ${response.statusText}`);
  }

  const data = await response.json();
  const casesList: BackendCase[] = Array.isArray(data) ? data : (data.data || []);
  return casesList.map(caseFromApi);
}

// ── Nile Patient Verification API ──────────────────────────────────────────────
export interface NileVerificationPayload {
  mobile: string;
  TypeOfIdentification?: string;
  IdentificationNumber?: string;
}

export interface NileVerificationResponse {
  status: 'success' | 'error';
  data?: any;
  message?: string;
  details?: any;
}

export async function verifyPatientNileApi(payload: NileVerificationPayload): Promise<NileVerificationResponse> {
  const response = await fetch(`${API_BASE}/nile/verify-patient`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Patient verification failed');
  }

  return data;
}
