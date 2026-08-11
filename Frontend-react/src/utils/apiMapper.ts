import type { Patient } from '../types';

export interface BackendDepartment {
  id: number;
  code: string;
  name: string;
  color?: string;
  pfx?: string;
}

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
  social_alarm_active?: boolean;
  social_alarm_date?: string | null;
  social_alarm_note?: string | null;
  social_alarm_priority?: string | null;
  programs?: string | string[] | null;
  departments?: BackendDepartment[];

  // Dedicated department model relations
  dept_anesthesia?: Record<string, any> | null;
  dept_spinal_surgery?: Record<string, any> | null;
  dept_hopbe?: Record<string, any> | null;
  dept_cardiac?: Record<string, any> | null;
  dept_colorectal?: Record<string, any> | null;
  dept_orthopedic?: Record<string, any> | null;
  dept_neurosurgery?: Record<string, any> | null;
  dept_urology?: Record<string, any> | null;
  dept_ent?: Record<string, any> | null;
  dept_general_surgery?: Record<string, any> | null;
  dept_maxillofacial?: Record<string, any> | null;
  dept_reconstructive?: Record<string, any> | null;
  dept_abci?: Record<string, any> | null;
  dept_hope_start?: Record<string, any> | null;
  dept_hypospadias?: Record<string, any> | null;
  dept_spina_bifida?: Record<string, any> | null;
  dept_neurodevelopmental?: Record<string, any> | null;
  dept_dental?: Record<string, any> | null;
  dept_liver_transplant?: Record<string, any> | null;
  dept_surgical_list?: Record<string, any> | null;

  // Legacy fallback fields
  clinic_anesthesia?: Record<string, any> | null;
  clinic_spinal_surgery?: Record<string, any> | null;
  clinic_orthopedic?: Record<string, any> | null;
  clinic_cardiac?: Record<string, any> | null;
  clinic_colorectal?: Record<string, any> | null;
  clinic_neurosurgery?: Record<string, any> | null;
  clinic_urology?: Record<string, any> | null;
  clinic_ent?: Record<string, any> | null;
  clinic_general_surgery?: Record<string, any> | null;
  clinic_maxillofacial?: Record<string, any> | null;
  clinic_reconstructive?: Record<string, any> | null;
  clinic_abci?: Record<string, any> | null;
  clinic_hopbe?: Record<string, any> | null;
  clinic_hypospadias?: Record<string, any> | null;
  clinic_spina_bifida?: Record<string, any> | null;
  clinic_neurodevelopmental?: Record<string, any> | null;
  clinic_dental?: Record<string, any> | null;
  clinic_hope_start?: Record<string, any> | null;
  clinic_liver_transplant?: Record<string, any> | null;
  clinic_surgical_list?: Record<string, any> | null;

  research?: any;
  created_at?: string;
  updated_at?: string;
}

interface DeptConfig {
  code: string;
  label: string;
  pfx: string;
  relation: keyof BackendCase;
  legacyColumn: keyof BackendCase;
}

const DEPTS: DeptConfig[] = [
  { code: 'anes', label: 'Anesthesia Clinic',       pfx: 'anes', relation: 'dept_anesthesia',         legacyColumn: 'clinic_anesthesia' },
  { code: 'spin', label: 'Spinal Surgery',          pfx: 'spin', relation: 'dept_spinal_surgery',      legacyColumn: 'clinic_spinal_surgery' },
  { code: 'orth', label: 'Orthopedic Surgery',      pfx: 'orth', relation: 'dept_orthopedic',          legacyColumn: 'clinic_orthopedic' },
  { code: 'hi',   label: 'Cardiac Congenital',      pfx: 'hi',   relation: 'dept_cardiac',             legacyColumn: 'clinic_cardiac' },
  { code: 'cprp', label: 'Colorectal & Pelvic',     pfx: 'cprp', relation: 'dept_colorectal',          legacyColumn: 'clinic_colorectal' },
  { code: 'neur', label: 'Neurosurgery',            pfx: 'neur', relation: 'dept_neurosurgery',        legacyColumn: 'clinic_neurosurgery' },
  { code: 'urol', label: 'Urology Surgery',         pfx: 'urol', relation: 'dept_urology',             legacyColumn: 'clinic_urology' },
  { code: 'ent',  label: 'ENT & Airway',            pfx: 'ent',  relation: 'dept_ent',                 legacyColumn: 'clinic_ent' },
  { code: 'gps',  label: 'General Pediatric Surgery', pfx: 'gps', relation: 'dept_general_surgery',  legacyColumn: 'clinic_general_surgery' },
  { code: 'maxf', label: 'Maxillofacial Surgery',   pfx: 'maxf', relation: 'dept_maxillofacial',       legacyColumn: 'clinic_maxillofacial' },
  { code: 'recon', label: 'Reconstructive Surgery',  pfx: 'recon', relation: 'dept_reconstructive',     legacyColumn: 'clinic_reconstructive' },
  { code: 'abci', label: 'ABCI (Cochlear Implant)', pfx: 'abci', relation: 'dept_abci',                legacyColumn: 'clinic_abci' },
  { code: 'hopb', label: 'HOPBE Program',           pfx: 'hop',  relation: 'dept_hopbe',               legacyColumn: 'clinic_hopbe' },
  { code: 'hypo', label: 'Hypospadias Clinic',      pfx: 'hypo', relation: 'dept_hypospadias',         legacyColumn: 'clinic_hypospadias' },
  { code: 'sbif', label: 'Spina Bifida Clinic',     pfx: 'sbif', relation: 'dept_spina_bifida',         legacyColumn: 'clinic_spina_bifida' },
  { code: 'ndev', label: 'Neurodevelopmental',    pfx: 'ndev', relation: 'dept_neurodevelopmental',  legacyColumn: 'clinic_neurodevelopmental' },
  { code: 'dent', label: 'Dental',                  pfx: 'dent', relation: 'dept_dental',              legacyColumn: 'clinic_dental' },
  { code: 'hope', label: 'Hope Start (Prenatal)',   pfx: 'hope', relation: 'dept_hope_start',          legacyColumn: 'clinic_hope_start' },
  { code: 'livt', label: 'Liver Transplant',        pfx: 'livt', relation: 'dept_liver_transplant',     legacyColumn: 'clinic_liver_transplant' },
  { code: 'surg', label: 'Surgical List',           pfx: 'surg', relation: 'dept_surgical_list',       legacyColumn: 'clinic_surgical_list' },
];

const getFieldMappings = (code: string, pfx: string): Record<string, string> => {
  if (code === 'anes') {
    return {
      assessmentStatus: 'assessment_status',
      assessmentDate: 'assessment_date',
      unfitReason: 'unfit_reason',
      reqOpName: 'requested_operation',
      reqTargetDate: 'requested_date',
      consentSigned: 'consent_signed',
      postDest: 'post_destination',
      labsOk: 'labs_status',
      cardiacClear: 'cardiac_clear',
      rbcUnits: 'rbc_units',
      rbcStatus: 'rbc_status',
      ffpUnits: 'ffp_units',
      ffpStatus: 'ffp_status',
      cryoUnits: 'cryo_units',
      cryoStatus: 'cryo_status',
      fwbUnits: 'fwb_units',
      fwbStatus: 'fwb_status',
      pltUnits: 'plt_units',
      pltStatus: 'plt_status',
      overallBloodReady: 'overall_blood_ready',
      anesFeedback: 'anesthesia_feedback',
      approvedDate: 'approved_date',
      anesPreopAlarmActive: 'preop_alarm_active',
      anesPreopAlarmDate: 'preop_alarm_date',
      anesPreopAlarmNote: 'preop_alarm_note',
      anesPreopPriority: 'preop_alarm_priority',
    };
  }
  if (code === 'surg') {
    return {
      opName: 'operation_name',
      scheduledDate: 'scheduled_date',
      urgency: 'urgency',
      fitDate: 'fitness_date',
      consent: 'consent_status',
      postDest: 'post_destination',
      labsOk: 'labs_status',
      approvedDate: 'approved_date',
    };
  }
  return {
    visit: 'first_visit_date',
    lastVisit: 'last_visit_date',
    condition: 'primary_diagnosis',
    conditionOther: 'diagnosis_other',
    limbAffected: 'limb_affected',
    limbOther: 'limb_other',
    shunt: 'shunt_status',
    trachStatus: 'trach_status',
    osteotomy: 'osteotomy_status',
    xrayCt: 'xray_ct_done',
    hardware: 'hardware_available',
    echoRecent: 'echo_recent',
    ctMri: 'ct_mri_done',
    perfusionist: 'perfusionist_confirmed',
    ctDone: 'ct_done',
    mriPresent: 'mri_present',
    echoDone: 'echo_done',
    neuroMonitor: 'neuro_monitoring',
    opDecided: 'op_decided',
    gestationalAge: 'gestational_age_weeks',
    opName: 'planned_operation',
    consent: 'consent_status',
    postDest: 'post_destination',
    labsOk: 'labs_status',
    blood: 'blood_status',
    detailedHistory: 'detailed_history',
    [`${pfx}OpReqAlarmActive`]: 'surgery_booking_active',
    [`${pfx}OpReqAlarmDate`]: 'surgery_booking_date',
    [`${pfx}OpReqAlarmNote`]: 'surgery_booking_note',
    [`${pfx}OpReqPriority`]: 'surgery_booking_priority',
    [`${pfx}FollowAlarmActive`]: 'followup_alarm_active',
    [`${pfx}FollowAlarmDate`]: 'followup_alarm_date',
    [`${pfx}FollowAlarmNote`]: 'followup_alarm_note',
    [`${pfx}FollowPriority`]: 'followup_alarm_priority',
    sbifNeuroAlarmActive: 'neuro_alarm_active',
    sbifNeuroAlarmDate: 'neuro_alarm_date',
    sbifNeuroAlarmNote: 'neuro_alarm_note',
    sbifNeuroPriority: 'neuro_alarm_priority',
    livtPrepAlarmActive: 'prep_alarm_active',
    livtPrepAlarmDate: 'prep_alarm_date',
    livtPrepAlarmNote: 'prep_alarm_note',
    livtPrepPriority: 'prep_alarm_priority',
    anesFeedback: 'anesthesia_feedback',
    approvedDate: 'approved_date',
  };
};

/** Map frontend program state → DB dedicated table columns */
function mapProgToColumn(progData: Record<string, any>, mappings: Record<string, string>): Record<string, any> {
  const colData: Record<string, any> = {
    status: progData.status || (progData.enrolled ? 'enrolled' : 'discharged')
  };

  Object.entries(progData).forEach(([key, val]) => {
    if (key === 'enrolled' || key === 'status' || val === undefined) return;
    const dbKey = mappings[key];
    colData[dbKey || key] = val;
  });

  return colData;
}

/** Map DB dedicated table columns → frontend program state */
function mapColumnToProg(colData: Record<string, any>, mappings: Record<string, string>): Record<string, any> {
  const reverseMap: Record<string, string> = {};
  Object.entries(mappings).forEach(([stateKey, dbKey]) => {
    reverseMap[dbKey] = stateKey;
  });

  const progData: Record<string, any> = {
    enrolled: colData.status === 'enrolled' || colData.enrolled === true,
    status: colData.status || 'enrolled',
  };

  Object.entries(colData).forEach(([key, val]) => {
    if (key === 'enrolled' || key === 'status' || key === 'id' || key === 'case_id' || val === undefined || val === null) return;
    const stateKey = reverseMap[key];
    progData[stateKey || key] = val;
  });

  return progData;
}

function getProgramsObject(patient: Partial<Patient>): Record<string, any> {
  if (patient.programs && !Array.isArray(patient.programs)) {
    return patient.programs as Record<string, any>;
  }
  return {};
}

export function patientToApi(patient: Partial<Patient>): BackendCase {
  const p = patient as Record<string, any>;

  const payload: BackendCase = {
    mrn: patient.bas_mrn || '',
    full_name: patient.bas_name || '',
    gender: (patient.bas_gender as 'male' | 'female') || 'male',
    national_id: patient.bas_ssn || null,
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
    social_alarm_active: !!p.basSocAlarmActive,
    social_alarm_date: p.basSocAlarmDate || null,
    social_alarm_note: p.basSocAlarmNote || null,
    social_alarm_priority: p.basSocPriority || null,
    programs: [],
    research: patient.research || {},
    departments: [],
  };

  const programsObj = getProgramsObject(patient);
  const enrolledLabels: string[] = [];

  DEPTS.forEach(dept => {
    const progData = programsObj[dept.code] || {};
    const mappings = getFieldMappings(dept.code, dept.pfx);
    const colData = mapProgToColumn(progData, mappings);

    if (progData.enrolled) {
      enrolledLabels.push(dept.label);
      (payload.departments as any[]).push({
        code: dept.code,
        data: colData,
      });
    }

    (payload as any)[dept.relation] = colData;
    (payload as any)[dept.legacyColumn] = colData;
  });

  payload.programs = enrolledLabels.join('\n');
  return payload;
}

export function caseFromApi(caseData: BackendCase): Patient {
  const patient: Patient = {
    id: String(caseData.id),
    bas_name: caseData.full_name || '',
    bas_mrn: caseData.mrn || '',
    bas_ssn: caseData.national_id || '',
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
    research: typeof caseData.research === 'object' && caseData.research !== null ? caseData.research : {},
    createdAt: caseData.created_at,
    updatedAt: caseData.updated_at,
    programs: {},
  };

  const p = patient as Record<string, any>;
  p.basSocAlarmActive = !!(caseData.social_alarm_active ?? caseData.bas_soc_alarm_active);
  p.basSocAlarmDate = (caseData.social_alarm_date || caseData.bas_soc_alarm_date) ? String(caseData.social_alarm_date || caseData.bas_soc_alarm_date).split('T')[0] : '';
  p.basSocAlarmNote = caseData.social_alarm_note || caseData.bas_soc_alarm_note || '';
  p.basSocPriority = caseData.social_alarm_priority || caseData.bas_soc_alarm_priority || 'red';

  const programsObj: Record<string, any> = {};
  const dbEnrolledLabels = typeof caseData.programs === 'string'
    ? caseData.programs.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)
    : (Array.isArray(caseData.programs) ? caseData.programs : []);

  // Enrolled department codes from pure pivot table
  const pivotEnrolledCodes = Array.isArray(caseData.departments) ? caseData.departments.map(d => d.code) : [];

  DEPTS.forEach(dept => {
    const colData = (caseData as any)[dept.relation] || (caseData as any)[dept.legacyColumn] || {};
    const mappings = getFieldMappings(dept.code, dept.pfx);
    const isEnrolled = pivotEnrolledCodes.includes(dept.code) || dbEnrolledLabels.includes(dept.label) || colData.status === 'enrolled';
    const progData = mapColumnToProg(colData, mappings);
    progData.enrolled = isEnrolled;
    programsObj[dept.code] = progData;
  });

  patient.programs = programsObj;
  return patient;
}
