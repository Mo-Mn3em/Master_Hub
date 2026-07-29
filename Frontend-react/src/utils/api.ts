import type { Patient } from '../types';
import { patientToApi, caseFromApi, type BackendCase } from './apiMapper';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function fetchCasesApi(search?: string): Promise<Patient[]> {
  const url = search ? `${API_BASE}/case?search=${encodeURIComponent(search)}` : `${API_BASE}/case`;
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

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
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
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
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to delete case: ${response.statusText}`);
  }
}
