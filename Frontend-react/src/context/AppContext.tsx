import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Patient, ResearchTemplate, ClinicalLog, Alarm } from '../types';
import DEPARTMENTS from '../utils/departmentsData';
import { getPatientAlarms } from '../utils/clinicalRules';

interface AppContextType {
  patients: Patient[];
  researchTemplates: { [id: string]: ResearchTemplate };
  currentModule: string;
  currentUser: string | null;
  isDevBypass: boolean;
  editingPatientId: string | null;
  currentPage: number;
  itemsPerPage: number;
  filterStatus: string;
  filterUrgency: string;
  filterPurpose: string;
  searchQuery: string;
  clinicalLogs: ClinicalLog[];
  isLoading: boolean;
  
  // Setters & Switchers
  setCurrentModule: (module: string) => void;
  setEditingPatientId: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
  setFilterStatus: (status: string) => void;
  setFilterUrgency: (urgency: string) => void;
  setFilterPurpose: (purpose: string) => void;
  setSearchQuery: (query: string) => void;
  
  // Actions
  loginDev: () => void;
  logout: () => void;
  savePatient: (patient: Partial<Patient>) => { success: boolean; error?: string; duplicateRestored?: boolean };
  archivePatient: (id: string) => void;
  restorePatient: (id: string) => void;
  saveResearchTemplate: (template: ResearchTemplate) => void;
  deleteResearchTemplate: (id: string) => void;
  logAction: (action: string, details: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const MOCK_RESEARCH_TEMPLATES: { [id: string]: ResearchTemplate } = {
  'study_scoliosis': {
    id: 'study_scoliosis',
    title: 'Pediatric Scoliosis Outcomes Study',
    fields: [
      { name: 'Cobb Angle Preop (degrees)', type: 'number' },
      { name: 'Cobb Angle Postop (degrees)', type: 'number' },
      { name: 'Hardware Type Used', type: 'select', options: 'Stainless Steel, Titanium, Cobalt Chrome' },
      { name: 'Neuromonitoring Signal Loss', type: 'select', options: 'No, Transient Loss, Permanent Loss' },
    ]
  },
  'study_exstrophy': {
    id: 'study_exstrophy',
    title: 'Classic Bladder Exstrophy Primary Repair Database',
    fields: [
      { name: 'Bladder Template Size (cm)', type: 'number' },
      { name: 'Pelvic Osteotomy Performed', type: 'select', options: 'Yes - Anterior, Yes - Posterior, No' },
      { name: 'Uteral Stents Exited Day', type: 'number' },
      { name: 'Continence Status', type: 'select', options: 'Dry, Wet/Dribbling, Intermittent Dry' },
    ]
  }
};

const MOCK_PATIENTS: Patient[] = [
  {
    id: 'pat_1',
    bas_name: 'Youssef Ibrahim Mahmoud',
    bas_mrn: '2024-5891',
    bas_gender: 'male',
    bas_dob: '2012-05-14',
    bas_age: '14 yrs',
    bas_phone: '+201012345678',
    bas_gov: 'Luxor', // Traveler VIP
    bas_blood: 'A-',
    bas_motorProblem: 'yes', // Motor VIP
    bas_motorProblemDetail: 'Scoliotic gait with left-sided limp',
    bas_history: 'Adolescent idiopathic scoliosis diagnosed in 2022. Rapid progression.',
    bas_social: 'Family travels from Luxor for hospital visits.',
    bas_joinRequestDate: '2024-01-10',
    bas_acceptanceCause: 'Complex spinal deformity charity case',
    isVIP: true,
    isStalled: false,
    createdAt: '2024-01-10T10:00:00.000Z',
    updatedAt: '2026-05-20T12:00:00.000Z',
    updatedBy: 'Dr. Gad',
    programs: {
      spin: {
        enrolled: true,
        visit: '2024-01-12',
        condition: 'scoliosis_adolescent',
        opDecided: 'yes',
        conditionOther: '',
        ctDone: 'yes',
        mriPresent: 'yes',
        echoDone: 'done',
        hardware: 'available',
        neuroMonitor: 'confirmed',
        spinOpReqAlarmActive: true,
        spinOpReqAlarmDate: '2026-05-29',
        spinOpReqAlarmNote: 'Schedule posterior spinal fusion T4-L1',
        spinOpReqPriority: 'red',
        spinFollowAlarmActive: true,
        spinFollowAlarmDate: '2026-05-24', // Active Follow-up alarm (Due tomorrow)
        spinFollowAlarmNote: 'Confirm neurophysiologist availability',
        spinFollowPriority: 'yellow',
      },
      anes: {
        enrolled: true,
        reqOpName: 'Posterior Spinal Instrumentation & Fusion T4-L1',
        assessmentStatus: 'fit',
        assessmentDate: '2026-05-20',
        consentSigned: 'done',
        postDest: 'icu',
        labsOk: 'done',
        cardiacClear: 'done',
        rbcUnits: '4',
        rbcStatus: 'ready',
        ffpUnits: '2',
        ffpStatus: 'ready',
        cryoUnits: '0',
        cryoStatus: 'not_needed',
        fwbUnits: '0',
        fwbStatus: 'not_needed',
        pltUnits: '0',
        pltStatus: 'not_needed',
        overallBloodReady: 'ready',
      },
      surg: {
        enrolled: true,
        opName: 'Posterior Spinal Instrumentation & Fusion T4-L1',
        fitDate: '2026-05-20',
        consent: 'yes',
        postDest: 'icu',
        labsOk: 'yes',
        scheduledDate: '2026-05-29',
        urgency: 'urgent',
      }
    },
    research: {
      study_scoliosis: {
        'Cobb Angle Preop (degrees)': 72,
        'Cobb Angle Postop (degrees)': 18,
        'Hardware Type Used': 'Titanium',
        'Neuromonitoring Signal Loss': 'No',
      }
    }
  },
  {
    id: 'pat_2',
    bas_name: 'Mariam Hassan Kamel',
    bas_mrn: '2025-0144',
    bas_gender: 'female',
    bas_dob: '2025-02-10',
    bas_age: '3 mos',
    bas_phone: '+201287654321',
    bas_gov: 'Alexandria',
    bas_blood: 'O+',
    bas_motorProblem: 'no',
    bas_history: 'Prenatal diagnosis of bladder exstrophy.',
    bas_social: 'Parents live in central Alexandria, highly cooperative.',
    bas_joinRequestDate: '2025-02-15',
    bas_acceptanceCause: 'Classic bladder exstrophy reconstruction',
    isVIP: false,
    isStalled: true, // Stalled due to overdue follow up
    createdAt: '2025-02-15T09:00:00.000Z',
    updatedAt: '2026-05-18T14:30:00.000Z',
    updatedBy: 'Dr. Gad',
    programs: {
      hopb: {
        enrolled: true,
        visit: '2025-02-18',
        condition: 'classic_exstrophy',
        hopFollowAlarmActive: true,
        hopFollowAlarmDate: '2026-05-10', // OVERDUE alarm (>2 days ago) -> Stalled
        hopFollowAlarmNote: 'Examine pelvic compliance and schedule osteotomy prep',
        hopFollowPriority: 'red',
        hopOpReqAlarmActive: true,
        hopOpReqAlarmDate: '2026-06-15',
        hopOpReqAlarmNote: 'Primary Bladder Closure & Pelvic Osteotomy',
        hopOpReqPriority: 'yellow',
      }
    }
  },
  {
    id: 'pat_3',
    bas_name: 'Malek Amr Abdelrahman',
    bas_mrn: '2025-9922',
    bas_gender: 'male',
    bas_dob: '2023-11-20',
    bas_age: '2 yrs',
    bas_phone: '+201555566677',
    bas_gov: 'Giza', // Traveler VIP
    bas_blood: 'B+',
    bas_motorProblem: 'no',
    bas_history: 'Tetralogy of Fallot, severe infundibular stenosis.',
    bas_social: 'Referred from Abu El Reesh hospital.',
    bas_joinRequestDate: '2025-10-01',
    bas_acceptanceCause: 'Total intracardiac correction of TOF',
    isVIP: true,
    isStalled: false,
    createdAt: '2025-10-01T11:00:00.000Z',
    updatedAt: '2026-05-22T09:15:00.000Z',
    updatedBy: 'Dr. Gad',
    programs: {
      hi: {
        enrolled: true,
        visit: '2025-10-15',
        hiOpReqAlarmActive: true,
        hiOpReqAlarmDate: '2026-06-02',
        hiOpReqAlarmNote: 'Complete repair of Tetralogy of Fallot',
        hiOpReqPriority: 'red',
      },
      anes: {
        enrolled: true,
        reqOpName: 'Total Intracardiac Correction of TOF',
        assessmentStatus: 'pending',
        consentSigned: 'pending',
        postDest: 'icu',
        labsOk: 'pending',
        cardiacClear: 'pending',
        rbcUnits: '2',
        rbcStatus: 'pending',
        ffpUnits: '2',
        ffpStatus: 'pending',
        cryoUnits: '0',
        cryoStatus: 'not_needed',
        fwbUnits: '0',
        fwbStatus: 'not_needed',
        pltUnits: '0',
        pltStatus: 'not_needed',
        overallBloodReady: 'pending',
      }
    }
  }
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [researchTemplates, setResearchTemplates] = useState<{ [id: string]: ResearchTemplate }>({});
  const [currentModule, setCurrentModule] = useState<string>('hub');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isDevBypass, setIsDevBypass] = useState<boolean>(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(15);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterPurpose, setFilterPurpose] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clinicalLogs, setClinicalLogs] = useState<ClinicalLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize DB from Local Storage
  useEffect(() => {
    try {
      const storedPatients = localStorage.getItem('master_hub_patients');
      const storedTemplates = localStorage.getItem('master_hub_research_templates');
      const storedUser = localStorage.getItem('master_hub_user');
      const storedLogs = localStorage.getItem('master_hub_logs');
      const devBypassStatus = localStorage.getItem('master_hub_dev_bypass') === 'true';

      if (storedPatients) {
        setPatients(JSON.parse(storedPatients));
      } else {
        setPatients(MOCK_PATIENTS);
        localStorage.setItem('master_hub_patients', JSON.stringify(MOCK_PATIENTS));
      }

      if (storedTemplates) {
        setResearchTemplates(JSON.parse(storedTemplates));
      } else {
        setResearchTemplates(MOCK_RESEARCH_TEMPLATES);
        localStorage.setItem('master_hub_research_templates', JSON.stringify(MOCK_RESEARCH_TEMPLATES));
      }

      if (storedLogs) {
        setClinicalLogs(JSON.parse(storedLogs));
      } else {
        const initLogs: ClinicalLog[] = [
          { id: 'log_1', timestamp: new Date().toISOString(), user: 'System', action: 'DATABASE_INITIALIZATION', details: 'Offline fallback database loaded with mock clinical records.' }
        ];
        setClinicalLogs(initLogs);
        localStorage.setItem('master_hub_logs', JSON.stringify(initLogs));
      }

      if (storedUser) {
        setCurrentUser(storedUser);
      }
      setIsDevBypass(devBypassStatus);
    } catch (e) {
      console.error('Failed to load database from LocalStorage', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToStorage = (updatedPatients: Patient[]) => {
    setPatients(updatedPatients);
    localStorage.setItem('master_hub_patients', JSON.stringify(updatedPatients));
  };

  const saveTemplatesToStorage = (updatedTemplates: { [id: string]: ResearchTemplate }) => {
    setResearchTemplates(updatedTemplates);
    localStorage.setItem('master_hub_research_templates', JSON.stringify(updatedTemplates));
  };

  const saveLogsToStorage = (updatedLogs: ClinicalLog[]) => {
    setClinicalLogs(updatedLogs);
    localStorage.setItem('master_hub_logs', JSON.stringify(updatedLogs));
  };

  // Log audit action
  const logAction = (action: string, details: string) => {
    const newLog: ClinicalLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser || 'Guest (Dev)',
      action,
      details
    };
    const updated = [newLog, ...clinicalLogs].slice(0, 100); // cap at 100 logs
    saveLogsToStorage(updated);
  };

  const loginDev = () => {
    setCurrentUser('Coordinator Dr. Gad');
    setIsDevBypass(true);
    localStorage.setItem('master_hub_user', 'Coordinator Dr. Gad');
    localStorage.setItem('master_hub_dev_bypass', 'true');
    logAction('LOGIN', 'User entered via Offline Developer Access.');
  };

  const logout = () => {
    setCurrentUser(null);
    setIsDevBypass(false);
    localStorage.removeItem('master_hub_user');
    localStorage.removeItem('master_hub_dev_bypass');
    logAction('LOGOUT', 'User logged out.');
  };

  // Save Patient Record
  const savePatient = (patientData: Partial<Patient>): { success: boolean; error?: string; duplicateRestored?: boolean } => {
    if (!patientData.bas_mrn || !patientData.bas_name) {
      return { success: false, error: 'Name and MRN are required fields.' };
    }

    const checkMRN = patientData.bas_mrn.trim().toLowerCase();
    const checkName = patientData.bas_name.trim().toLowerCase();

    // Check for duplicates
    const duplicate = patients.find(p => 
      p.id !== patientData.id && 
      ((checkMRN && p.bas_mrn && String(p.bas_mrn).trim().toLowerCase() === checkMRN) || 
       (checkName && p.bas_name && String(p.bas_name).trim().toLowerCase() === checkName))
    );

    if (duplicate && duplicate.isArchived) {
      // If it is archived, we auto-restore it and exit
      const updated = patients.map(p => p.id === duplicate.id ? { ...p, isArchived: false, archivedAt: undefined } : p);
      saveToStorage(updated);
      logAction('PATIENT_RESTORE', `Duplicate match found. Restored archived patient: ${duplicate.bas_name} (MRN ${duplicate.bas_mrn})`);
      return { success: true, duplicateRestored: true };
    }

    if (duplicate) {
      return { success: false, error: `A patient record with this MRN or Name already exists: ${duplicate.bas_name} (MRN ${duplicate.bas_mrn})` };
    }

    let updatedPatients: Patient[];
    const now = new Date().toISOString();
    const updater = currentUser || 'System';

    if (patientData.id) {
      // Update
      const existing = patients.find(p => p.id === patientData.id);
      if (!existing) return { success: false, error: 'Patient record not found.' };

      const updatedRecord: Patient = {
        ...existing,
        ...patientData,
        updatedAt: now,
        updatedBy: updater,
      } as Patient;

      // recalculate custom attributes
      updatedRecord.isStalled = isPatientStalled(updatedRecord);
      
      updatedPatients = patients.map(p => p.id === patientData.id ? updatedRecord : p);
      logAction('PATIENT_UPDATE', `Updated patient record: ${updatedRecord.bas_name} (MRN ${updatedRecord.bas_mrn})`);
    } else {
      // Insert
      const newRecord: Patient = {
        ...patientData,
        id: `pat_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        updatedBy: updater,
      } as Patient;

      newRecord.isStalled = isPatientStalled(newRecord);

      updatedPatients = [...patients, newRecord];
      logAction('PATIENT_CREATE', `Created new patient record: ${newRecord.bas_name} (MRN ${newRecord.bas_mrn})`);
    }

    saveToStorage(updatedPatients);
    return { success: true };
  };

  // Archive Patient
  const archivePatient = (id: string) => {
    const record = patients.find(p => p.id === id);
    if (!record) return;
    const updated = patients.map(p => p.id === id ? { ...p, isArchived: true, archivedAt: new Date().toISOString() } : p);
    saveToStorage(updated);
    logAction('PATIENT_ARCHIVE', `Archived patient: ${record.bas_name} (MRN ${record.bas_mrn})`);
  };

  // Restore Patient
  const restorePatient = (id: string) => {
    const record = patients.find(p => p.id === id);
    if (!record) return;
    const updated = patients.map(p => p.id === id ? { ...p, isArchived: false, archivedAt: undefined } : p);
    saveToStorage(updated);
    logAction('PATIENT_RESTORE', `Restored patient: ${record.bas_name} (MRN ${record.bas_mrn})`);
  };

  // Save Research Study Template
  const saveResearchTemplate = (template: ResearchTemplate) => {
    const updated = { ...researchTemplates, [template.id]: template };
    saveTemplatesToStorage(updated);
    logAction('RESEARCH_TEMPLATE_SAVE', `Saved research study template: ${template.title}`);
  };

  // Delete Research Template
  const deleteResearchTemplate = (id: string) => {
    const template = researchTemplates[id];
    if (!template) return;
    const updated = { ...researchTemplates };
    delete updated[id];
    saveTemplatesToStorage(updated);
    logAction('RESEARCH_TEMPLATE_DELETE', `Deleted research study template: ${template.title}`);
  };

  return (
    <AppContext.Provider
      value={{
        patients,
        researchTemplates,
        currentModule,
        currentUser,
        isDevBypass,
        editingPatientId,
        currentPage,
        itemsPerPage,
        filterStatus,
        filterUrgency,
        filterPurpose,
        searchQuery,
        clinicalLogs,
        isLoading,
        
        setCurrentModule,
        setEditingPatientId,
        setCurrentPage,
        setFilterStatus,
        setFilterUrgency,
        setFilterPurpose,
        setSearchQuery,
        
        loginDev,
        logout,
        savePatient,
        archivePatient,
        restorePatient,
        saveResearchTemplate,
        deleteResearchTemplate,
        logAction,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
