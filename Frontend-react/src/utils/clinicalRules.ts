import DEPARTMENTS from './departmentsData';
import type { Department } from './departmentsData';
import type { Patient, Alarm } from '../types';

export const REPORT_LBL_MAP: { [key: string]: string } = {
  'reqOpName': 'Requested Operation', 'targetDate': 'Target OR Date', 'priority': 'Booking Priority',
  'orSlot': 'OR Slot Confirmed?', 'blocker': 'Current Blocker', 'anesFeedback': 'Anesthesia Decision',
  'approvedDate': 'Preop Assessment Date', 'echoRecent': 'ECHO Status', 'ctMri': 'CT / MRI Status',
  'perfusionist': 'Perfusionist', 'lesion': 'Primary Lesion', 'interventionType': 'Intervention Category',
  'labsOk': 'Lab Investigations', 'postDest': 'Post-Op Destination', 'opName': 'Planned Operation',
  'opStatus': 'Operation Status', 'visit': 'First Clinic Visit', 'consent': 'Consent Status',
  'blood': 'Blood Products Status', 'cardiacClear': 'Cardiac Clearance', 'assessmentStatus': 'Assessment Decision',
  'assessmentDate': 'Assessment Date', 'unfitReason': 'Reason for Unfit', 'fitDate': 'Date Declared Fit',
  'bloodMatch': 'Blood Matching', 'urineCulture': 'Urine Culture', 'renalUS': 'Renal Ultrasound',
  'osteotomy': 'Osteotomy Status', 'lastVisit': 'Last Clinic Visit', 'bloodGroup': 'Blood Group',
  
  // Blood Bank
  'overallBloodReady': 'Overall Blood Preparedness', 'rbcUnits': 'Packed RBCs (Units)', 'rbcStatus': 'Packed RBCs Status',
  'ffpUnits': 'FFP/Plasma (Units)', 'ffpStatus': 'FFP/Plasma Status', 'cryoUnits': 'Cryoprecipitate (Units)', 'cryoStatus': 'Cryoprecipitate Status',
  'fwbUnits': 'Fresh Whole Blood (Units)', 'fwbStatus': 'Fresh Whole Blood Status', 'pltUnits': 'Platelets (Units)', 'pltStatus': 'Platelets Status',
  
  // Custom Gates & Diagnostics
  'ctDone': '3D CT Done?', 'mriPresent': 'MRI Present?', 'echoDone': 'Final Preop ECHO', 'neuroMonitor': 'Neuro Monitoring',
  'hardware': 'Hardware/Implant', 'opDecided': 'Decision for Surgery', 'limbAffected': 'Limb / Side Affected',
  'xrayCt': 'X-Ray / CT Done?', 'trachStatus': 'Tracheostomy Status', 'continence': 'Continence Status', 
  'shunt': 'Shunt Status', 'gestationalAge': 'Gestational Age (Weeks)', 'condition': 'Primary Diagnosis', 
  'conditionOther': 'Other Diagnosis Detail', 'primaryDone': 'Primary Closure Done',

  // History & Cancellations
  'cancelType': 'Cancellation Type', 'cancelReason': 'Reason for Cancellation', 'opDoneDate': 'Date Operation Completed',
  'suspendedOpName': 'Suspended Operation', 'exitDate': 'Discharge Date'
};

export function getLocalDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getDynamicAge(dobString: string): string {
  if (!dobString) return 'Unknown';
  const birth = new Date(dobString + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (birth > now) return 'Invalid Date';

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const parts = [];
  if (years > 0) parts.push(years + (years === 1 ? ' yr' : ' yrs'));
  if (months > 0) parts.push(months + (months === 1 ? ' mo' : ' mos'));
  if (days > 0 && years === 0) parts.push(days + 'd'); // Only show days for infants

  return parts.length ? parts.join(', ') : 'Newborn';
}

export function isOverdue(dateStr: string): number {
  if (!dateStr) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((today.getTime() - d.getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

export function isFitnessExpired(dateStr: string): boolean {
  if (!dateStr) return false;
  return isOverdue(dateStr) >= 30;
}

export function getPatientAlarms(p: Patient): Alarm[] {
  const alarms: Alarm[] = [];
  const seen = new Set<string>();

  const tryAdd = (pfxKey: string, pri: 'red' | 'yellow' | 'blue', date: string, note: string, deptLabel?: string) => {
    const k = pfxKey + (date || '');
    if (!seen.has(k)) {
      seen.add(k);
      alarms.push({
        prefix: pfxKey,
        priority: pri || 'red',
        date: date || '',
        note: note || '',
        deptLabel,
        patientName: p.bas_name,
        patientMrn: p.bas_mrn,
        patientId: p.id,
      });
    }
  };

  const alarmPrefixes = [
    'basSoc', 'anesPreop',
    'spinOpReq', 'spinFollow',
    'hopOpReq', 'hopFollow',
    'hiOpReq', 'hiFollow',
    'cprpOpReq', 'cprpFollow',
    'orthOpReq', 'orthFollow',
    'neurOpReq', 'neurFollow',
    'urolOpReq', 'urolFollow',
    'entOpReq', 'entFollow',
    'gpsOpReq', 'gpsFollow',
    'maxfOpReq', 'maxfFollow',
    'reconOpReq', 'reconFollow',
    'abciOpReq', 'abciFollow',
    'hopeOpReq', 'hopeFollow',
    'hypoOpReq', 'hypoFollow',
    'sbifOpReq', 'sbifFollow', 'sbifNeuro',
    'ndevOpReq', 'ndevFollow',
    'livtOpReq', 'livtFollow', 'livtPrep',
    'dentOpReq', 'dentFollow'
  ];

  DEPARTMENTS.forEach(dept => {
    const pfx = dept.pfx || dept.code;
    alarmPrefixes.push(`${pfx}Blk1`, `${pfx}Blk2`, `${pfx}Blk3`);
  });

  alarmPrefixes.forEach(ap => {
    // 1. Patient level
    if (p[`${ap}AlarmActive`]) {
      const dept = DEPARTMENTS.find(d => ap.startsWith(d.pfx || d.code) || ap === 'anesPreop');
      tryAdd(ap, p[`${ap}Priority`], p[`${ap}AlarmDate`], p[`${ap}AlarmNote`], dept?.label || 'Global Directory');
    }
    // 2. Program level
    if (p.programs) {
      DEPARTMENTS.forEach(dept => {
        const prog = p.programs?.[dept.code];
        if (prog?.enrolled && prog[`${ap}AlarmActive`]) {
          tryAdd(ap, prog[`${ap}Priority`], prog[`${ap}AlarmDate`], prog[`${ap}AlarmNote`], dept.label);
        }
      });
    }
  });

  // Last Clinic Visit Dynamic Alarm Generator
  if (p.programs) {
    DEPARTMENTS.forEach(dept => {
      const prog = p.programs?.[dept.code];
      const pfx = dept.pfx || dept.code;
      if (prog?.enrolled && prog[`${pfx}OpReqAlarmActive`]) {
        if (!prog.lastVisit) {
          tryAdd(`${pfx}Visit`, 'yellow', '', 'Last Clinic Visit Missing', dept.label);
        } else {
          const lastV = new Date(prog.lastVisit);
          const now = new Date();
          const diffDays = (now.getTime() - lastV.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 30) {
            tryAdd(`${pfx}Visit`, 'red', prog.lastVisit, 'Last Clinic Visit > 1 Month Ago', dept.label);
          }
        }
      }
    });
  }

  return alarms;
}

export function isPatientStalled(p: Patient): boolean {
  return getPatientAlarms(p).some(a => {
    if (a.prefix.endsWith('OpReq')) return false;
    return isOverdue(a.date) >= 2;
  });
}

export interface VIPBadge {
  label: string;
  detail: string;
  color: string;
}

export function getVIPBadges(p: Patient): VIPBadge[] {
  const flags: VIPBadge[] = [];
  if (p.bas_gov && p.bas_gov !== 'Alexandria') {
    flags.push({ label: 'TRAVELER', detail: p.bas_gov, color: '#E67E22' });
  }
  if (p.bas_motorProblem === 'yes') {
    flags.push({ label: 'MOTOR', detail: p.bas_motorProblemDetail || 'Impaired mobility', color: '#9B59B6' });
  }
  const enrolledDepts = DEPARTMENTS.filter(
    c => c.code !== 'anes' && c.code !== 'surg' && p.programs?.[c.code]?.enrolled
  );
  if (enrolledDepts.length >= 2) {
    flags.push({ label: 'MULTI-PROG', detail: `${enrolledDepts.length} programs`, color: '#E74C3C' });
  }
  return flags;
}

export function getAutoBlockers(p: Patient, dept: Department): string[] {
  const blockers: string[] = [];
  const prog = p.programs?.[dept.code];
  if (!prog || !prog.enrolled) return blockers;

  const pfx = dept.pfx || dept.code;
  const blockedValues = ['pending', 'no', 'not_done', 'infected', 'impaired', 'signing_problem', 'refused', 'abnormal'];
  const skipKeys = ['opStatus', 'enrolled', 'priority', 'orSlot', 'anesFeedback', '_activeBlockers', 'journeyLog', 'visit', 'cancelReason', 'isRebook', 'originalDecisionDate', 'originalPriority', 'lastVisit'];

  // Loop through all program keys like the legacy code
  Object.keys(prog).forEach(k => {
    if (skipKeys.includes(k) || k.includes('Alarm') || k.includes('Priority') || k.includes('Date') || k.includes('Name')) return;
    const val = String(prog[k] || '').toLowerCase().trim();
    if (val === 'not_needed' || val === 'not needed' || val === 'normal' || val === 'done') return;

    if (blockedValues.some(bv => bv === 'no' ? val === 'no' : val.includes(bv)) || (k === 'postDest' && (val.includes('awaiting') || val === ''))) {
      const fallbackLbl = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      blockers.push((REPORT_LBL_MAP[k] || fallbackLbl) + " Pending");
    }
  });

  // Check manual blockers
  [1, 2, 3].forEach(i => {
    const active = prog[`${pfx}Blk${i}AlarmActive`] || p[`${pfx}Blk${i}AlarmActive`];
    const note = prog[`${pfx}Blk${i}AlarmNote`] || p[`${pfx}Blk${i}AlarmNote`] || '';
    if (active && note) {
      blockers.push(`Manual: ${note}`);
    }
  });

  // 30-Day Fitness Expiry Blocker (if patient is scheduled/enrolled for surgery)
  if (p.programs?.surg?.enrolled) {
    const fitDate = p.programs?.surg?.fitDate;
    if (fitDate && isFitnessExpired(fitDate)) {
      blockers.push("Fitness Expired (>30 Days) - Needs Reassessment");
    }
  }

  // Last Clinic Visit Blocker
  const opReqActive = prog[`${pfx}OpReqAlarmActive`] || p[`${pfx}OpReqAlarmActive`];
  const lastVisit = prog.lastVisit || prog[`${pfx}_lastVisit`];
  if (opReqActive) {
    if (!lastVisit) {
      blockers.push("Last Clinic Visit Missing");
    } else {
      const lastV = new Date(lastVisit);
      const now = new Date();
      const diffDays = (now.getTime() - lastV.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 30) {
        blockers.push("Last Clinic Visit > 1 Month Ago");
      }
    }
  }

  // Global Social Alarm Blocker
  if (p.basSocAlarmActive) {
    const socialNote = p.basSocAlarmNote ? ` (${p.basSocAlarmNote})` : '';
    blockers.push(`🌍 Social Issue${socialNote}`);
  }

  return blockers;
}


export function getHighestPriority(alarms: Alarm[]): 'red' | 'yellow' | 'blue' | 'none' {
  if (alarms.some(a => a.priority === 'red')) return 'red';
  if (alarms.some(a => a.priority === 'yellow')) return 'yellow';
  if (alarms.some(a => a.priority === 'blue')) return 'blue';
  return 'none';
}
