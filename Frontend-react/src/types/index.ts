export interface Department {
  code: string;
  label: string;
  color: string;
  pfx?: string;
  customForm?: string; // HTML string for form (from legacy or custom React render)
  customGates?: string; // HTML string for gates check (from legacy or custom React render)
}

export interface ClinicData {
  // Common fields all clinics share
  first_visit_date?: string;
  primary_diagnosis?: string;
  diagnosis_other?: string;
  surgery_booking_active?: boolean;
  surgery_booking_date?: string;
  surgery_booking_note?: string;
  surgery_booking_priority?: 'red' | 'yellow' | 'blue';
  planned_operation?: string;
  anesthesia_feedback?: string;
  approved_date?: string;
  // Allow any other dynamic clinical fields
  [key: string]: any;
}

export interface AnesthesiaClinicData {
  assessment_status?: 'pending' | 'fit' | 'unfit';
  assessment_date?: string;
  unfit_reason?: string;
  requested_operation?: string;
  requested_date?: string;
  consent_signed?: 'pending' | 'done' | 'refused';
  post_destination?: 'pending' | 'ward' | 'icu' | 'picu' | 'nicu';
  labs_ok?: 'pending' | 'done' | 'not_needed';
  cardiac_clear?: 'pending' | 'done' | 'not_needed';
  rbc_units?: string;
  rbc_status?: string;
  ffp_units?: string;
  ffp_status?: string;
  cryo_units?: string;
  cryo_status?: string;
  fwb_units?: string;
  fwb_status?: string;
  plt_units?: string;
  plt_status?: string;
  overall_blood_ready?: string;
  anesthesia_feedback?: string;
  approved_date?: string;
  [key: string]: any;
}

export interface Patient {
  id: string;
  bas_name: string;
  bas_mrn: string;
  bas_ssn?: string;
  bas_typeOfId?: string;
  bas_gender: 'male' | 'female' | '';
  bas_dob: string;
  bas_age: string;
  bas_phone?: string;
  bas_gov?: string;
  bas_blood: string;
  bas_motorProblem: 'yes' | 'no';
  bas_motorProblemDetail?: string;
  bas_history?: string;
  bas_social?: string;
  bas_joinRequestDate?: string;
  bas_acceptanceCause?: string;
  
  // Custom metadata
  isArchived?: boolean;
  archivedAt?: string;
  isVIP?: boolean;
  isStalled?: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  
  // Past surgical history
  pastSurgeries?: CompletedSurgery[];

  // Department-specific program data (UI state; apiMapper converts to per-clinic DB columns)
  programs?: {
    [deptCode: string]: ProgramData;
  };

  // Custom research study entries & unstructured clinical metadata
  research?: {
    [key: string]: any;
  };

  // Inline index signature for dynamic fields accessed by elements
  [key: string]: any;
}

export interface ProgramData {
  enrolled: boolean;
  // Dynamic form fields for standard departments
  [key: string]: any;
}


export interface CompletedSurgery {
  id: string;
  opName: string;
  completedDate: string;
  departmentCode?: string;
  departmentName?: string;
  surgeon?: string;
  outcome?: string;
  notes?: string;
}

export interface Alarm {
  prefix: string;
  priority: 'red' | 'yellow' | 'blue';
  date: string;
  note: string;
  deptLabel?: string;
  patientName?: string;
  patientMrn?: string;
  patientId?: string;
}

export interface ResearchField {
  name: string;
  type: 'text' | 'number' | 'select';
  options?: string[] | string; // array of options or comma-separated string for select dropdown
}

export interface ResearchTemplate {
  id: string;
  title: string;
  fields: ResearchField[];
}

export interface ClinicalLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
