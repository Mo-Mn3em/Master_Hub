import type { Patient } from '../types';

export interface BackendCase {
  id?: number | string;
  mrn: string;
  full_name: string;
  gender: 'male' | 'female' | '';
  national_id?: string | null;
  date_of_birth?: string | null;
  age?: string | null;
  phone_number?: string | null;
  government?: string | null;
  outside_egypt_details?: string | null;
  blood_group?: string | null;
  motor_problem?: string | null;
  motor_problem_detail?: string | null;
  date_of_joining_request?: string | null;
  cause_of_acceptance?: string | null;
  general_medical_history?: string | null;
  social_notes?: string | null;
  bas_soc_alarm_active?: boolean;
  bas_soc_alarm_date?: string | null;
  bas_soc_alarm_note?: string | null;
  bas_soc_alarm_priority?: string | null;
  programs?: any;
  research?: any;
  created_at?: string;
  updated_at?: string;
}

export function patientToApi(patient: Partial<Patient>): BackendCase {
  return {
    mrn: patient.bas_mrn || '',
    full_name: patient.bas_name || '',
    gender: (patient.bas_gender as 'male' | 'female') || 'male',
    date_of_birth: patient.bas_dob || null,
    age: patient.bas_age || null,
    phone_number: patient.bas_phone || null,
    government: patient.bas_gov || null,
    blood_group: patient.bas_blood || null,
    motor_problem: patient.bas_motorProblem || 'no',
    motor_problem_detail: patient.bas_motorProblemDetail || null,
    date_of_joining_request: patient.bas_joinRequestDate || null,
    cause_of_acceptance: patient.bas_acceptanceCause || null,
    general_medical_history: patient.bas_history || null,
    social_notes: patient.bas_social || null,
    programs: patient.programs || {},
    research: patient.research || {},
  };
}

export function caseFromApi(caseData: BackendCase): Patient {
  return {
    id: String(caseData.id),
    bas_name: caseData.full_name || '',
    bas_mrn: caseData.mrn || '',
    bas_gender: caseData.gender || '',
    bas_dob: caseData.date_of_birth ? String(caseData.date_of_birth).split('T')[0] : '',
    bas_age: caseData.age || '',
    bas_phone: caseData.phone_number || '',
    bas_gov: caseData.government || '',
    bas_blood: caseData.blood_group || '',
    bas_motorProblem: (caseData.motor_problem as 'yes' | 'no') || 'no',
    bas_motorProblemDetail: caseData.motor_problem_detail || '',
    bas_history: caseData.general_medical_history || '',
    bas_social: caseData.social_notes || '',
    bas_joinRequestDate: caseData.date_of_joining_request ? String(caseData.date_of_joining_request).split('T')[0] : '',
    bas_acceptanceCause: caseData.cause_of_acceptance || '',
    programs: typeof caseData.programs === 'object' && caseData.programs !== null ? caseData.programs : {},
    research: typeof caseData.research === 'object' && caseData.research !== null ? caseData.research : {},
    createdAt: caseData.created_at,
    updatedAt: caseData.updated_at,
  };
}
