export interface Department {
  code: string;
  label: string;
  color: string;
  pfx?: string;
  customForm?: string; // HTML string for form (from legacy or custom React render)
  customGates?: string; // HTML string for gates check (from legacy or custom React render)
}

export interface Patient {
  id: string;
  bas_name: string;
  bas_mrn: string;
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

  // Department-specific programs
  programs?: {
    [deptCode: string]: ProgramData;
  };

  // Custom research study entries
  research?: {
    [studyId: string]: {
      [fieldName: string]: any;
    };
  };

  // Inline index signature for dynamic fields accessed by elements
  [key: string]: any;
}

export interface ProgramData {
  enrolled: boolean;
  // Dynamic form fields for standard departments
  [key: string]: any;
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
