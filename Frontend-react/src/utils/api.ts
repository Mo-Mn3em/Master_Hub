import type { Patient, UserAccount } from '../types';
import { patientToApi, caseFromApi, type BackendCase } from './apiMapper';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// ── Token helpers ─────────────────────────────────────────────────────────────
const TOKEN_KEY = 'master_hub_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

function checkUnauthorized(response: Response) {
  if (response.status === 401) {
    clearToken();
    localStorage.removeItem('master_hub_user_account');
    localStorage.removeItem('master_hub_user');
    localStorage.removeItem('master_hub_expires_at');
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    throw new Error('Your session has expired or is unauthenticated. Please log in again.');
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── Auth API ──────────────────────────────────────────────────────────────────
export async function loginApi(username: string, password: string): Promise<UserAccount> {
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
  if (data.expires_at) {
    localStorage.setItem('master_hub_expires_at', String(new Date(data.expires_at).getTime()));
  }
  return data.user;
}

export async function fetchCurrentUserApi(): Promise<UserAccount | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE}/user`, {
      headers: authHeaders(),
    });

    if (response.status === 401) {
      clearToken();
      localStorage.removeItem('master_hub_user_account');
      localStorage.removeItem('master_hub_user');
      localStorage.removeItem('master_hub_expires_at');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      return null;
    }

    if (!response.ok) return null;

    const data = await response.json();
    return data;
  } catch (e) {
    return null;
  }
}

export async function changePasswordApi(
  currentPassword: string,
  newPassword: string,
  newPasswordConfirmation: string
): Promise<{ status: string; message: string }> {
  const response = await fetch(`${API_BASE}/user/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    }),
  });

  checkUnauthorized(response);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.errors?.current_password?.[0] || 'Failed to change password.');
  }

  return data;
}

export async function fetchUsersApi(): Promise<UserAccount[]> {
  const response = await fetch(`${API_BASE}/users`, {
    headers: authHeaders(),
  });

  checkUnauthorized(response);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to fetch users.');
  }

  const data = await response.json();
  return data.data || [];
}

export async function createUserApi(payload: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  department_code?: string | null;
  department_codes?: string[] | null;
}): Promise<UserAccount> {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  checkUnauthorized(response);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create user.');
  }

  return data.data;
}

export async function updateUserApi(
  id: number,
  payload: {
    name?: string;
    email?: string;
    password?: string;
    role?: 'admin' | 'user';
    department_code?: string | null;
    department_codes?: string[] | null;
  }
): Promise<UserAccount> {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  checkUnauthorized(response);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update user.');
  }

  return data.data;
}

export async function deleteUserApi(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });

  checkUnauthorized(response);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Failed to delete user.');
  }
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
    let errorMessage = `Failed to update case (HTTP ${response.status})`;
    try {
      const text = await response.text();
      try {
        const errData = JSON.parse(text);
        errorMessage = errData.message || errData.error || errorMessage;
      } catch {
        // Response is not JSON (e.g. IIS HTML error page)
        const match = text.match(/<title>([^<]+)<\/title>/i);
        if (match) {
          errorMessage = `Server error: ${match[1].trim()}`;
        }
        console.error('[updateCaseApi] Non-JSON error response:', text.substring(0, 500));
      }
    } catch {
      errorMessage = `Failed to update case: ${response.statusText}`;
    }
    throw new Error(errorMessage);
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

// ── Nile Patient Personal Summary API ──────────────────────────────────────────
export interface NilePersonalSummaryPayload {
  patientID: string | number;
}

export interface NilePersonalSummaryData {
  PatientID?: string | null;
  PatientNameAr?: string | null;
  PatientNameEn?: string | null;
  Age?: string | null;
  IDTypeAr?: string | null;
  IDTypeEn?: string | null;
  IDNumber?: string | null;
  ReligionAr?: string | null;
  ReligionEn?: string | null;
  Phone1?: string | null;
  Phone2?: string | null;
  NationalityEn?: string | null;
  NationalityAr?: string | null;
  MaterialStatusAr?: string | null;
  MaterialStatusEn?: string | null;
  Email?: string | null;
  Gender?: string | null;
  DateOfBirth?: string | null;
  error?: string | null;
  [key: string]: any;
}

export interface NileVerificationResponse {
  status: 'success' | 'error';
  data?: NilePersonalSummaryData;
  message?: string;
  details?: any;
}

export async function fetchNilePersonalSummary(payload: NilePersonalSummaryPayload): Promise<NileVerificationResponse> {
  const response = await fetch(`${API_BASE}/nile/personal-summary`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Patient personal summary lookup failed');
  }

  return data;
}

// Backward compatibility wrapper
export async function verifyPatientNileApi(payload: any): Promise<NileVerificationResponse> {
  const patientId = payload.patientID || payload.patientId || payload.identificationNumber || payload.IdentificationNumber || payload.mrn || payload.mobile || '';
  return fetchNilePersonalSummary({ patientID: patientId });
}

