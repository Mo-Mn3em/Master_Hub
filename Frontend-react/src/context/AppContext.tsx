import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Patient, ResearchTemplate, ClinicalLog } from '../types';
import { fetchCasesApi, createCaseApi, updateCaseApi, deleteCaseApi, loginApi, logoutApi, getToken } from '../utils/api';
import { isPatientStalled } from '../utils/clinicalRules';

interface AppContextType {
  patients: Patient[];
  researchTemplates: { [id: string]: ResearchTemplate };
  currentModule: string;
  currentUser: string | null;
  editingPatientId: string | null;
  currentPage: number;
  itemsPerPage: number;
  filterStatus: string;
  filterUrgency: string;
  filterPurpose: string;
  searchQuery: string;
  clinicalLogs: ClinicalLog[];
  isLoading: boolean;
  isOnline: boolean;
  
  // Setters & Switchers
  setCurrentModule: (module: string) => void;
  setEditingPatientId: (id: string | null) => void;
  setCurrentPage: (page: number) => void;
  setFilterStatus: (status: string) => void;
  setFilterUrgency: (urgency: string) => void;
  setFilterPurpose: (purpose: string) => void;
  setSearchQuery: (query: string) => void;
  
  // Actions
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  savePatient: (patient: Partial<Patient>) => Promise<{ success: boolean; error?: string; duplicateRestored?: boolean }>;
  archivePatient: (id: string) => Promise<void>;
  restorePatient: (id: string) => Promise<void>;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [researchTemplates, setResearchTemplates] = useState<{ [id: string]: ResearchTemplate }>({});
  const [currentModule, setCurrentModule] = useState<string>('hub');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(15);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [filterPurpose, setFilterPurpose] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [clinicalLogs, setClinicalLogs] = useState<ClinicalLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  // Load patients from API or fallback to LocalStorage
  const loadPatients = async () => {
    setIsLoading(true);
    try {
      const apiPatients = await fetchCasesApi();
      setPatients(apiPatients);
      setIsOnline(true);
      localStorage.setItem('master_hub_patients', JSON.stringify(apiPatients));
    } catch (e) {
      console.warn('API unavailable. Falling back to local storage.', e);
      setIsOnline(false);
      const storedPatients = localStorage.getItem('master_hub_patients');
      if (storedPatients) {
        setPatients(JSON.parse(storedPatients));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Always start on login screen every time application opens
    setCurrentUser(null);
    localStorage.removeItem('master_hub_user');

    loadPatients();

    try {
      const storedTemplates = localStorage.getItem('master_hub_research_templates');
      const storedLogs = localStorage.getItem('master_hub_logs');

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
          { id: 'log_1', timestamp: new Date().toISOString(), user: 'System', action: 'DATABASE_INITIALIZATION', details: 'Database connection initialized.' }
        ];
        setClinicalLogs(initLogs);
        localStorage.setItem('master_hub_logs', JSON.stringify(initLogs));
      }
    } catch (e) {
      console.error('Failed to load local config', e);
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

  const logAction = (action: string, details: string) => {
    const newLog: ClinicalLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: currentUser || 'Guest (Dev)',
      action,
      details
    };
    const updated = [newLog, ...clinicalLogs].slice(0, 100);
    saveLogsToStorage(updated);
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = await loginApi(username, password);
      setCurrentUser(user.name);
      localStorage.setItem('master_hub_user', user.name);
      logAction('LOGIN', `User logged in: ${user.name}`);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Login failed.' };
    }
  };

  const logout = () => {
    logoutApi();
    setCurrentUser(null);
    localStorage.removeItem('master_hub_user');
    logAction('LOGOUT', 'User logged out.');
  };

  // Save Patient Record (API integration)
  const savePatient = async (patientData: Partial<Patient>): Promise<{ success: boolean; error?: string; duplicateRestored?: boolean }> => {
    if (!patientData.bas_mrn || !patientData.bas_name) {
      return { success: false, error: 'Name and MRN are required fields.' };
    }

    const checkMRN = patientData.bas_mrn.trim().toLowerCase();
    const checkName = patientData.bas_name.trim().toLowerCase();

    const duplicate = patients.find(p => 
      p.id !== patientData.id && 
      ((checkMRN && p.bas_mrn && String(p.bas_mrn).trim().toLowerCase() === checkMRN) || 
       (checkName && p.bas_name && String(p.bas_name).trim().toLowerCase() === checkName))
    );

    if (duplicate && duplicate.isArchived) {
      const updated = patients.map(p => p.id === duplicate.id ? { ...p, isArchived: false, archivedAt: undefined } : p);
      saveToStorage(updated);
      logAction('PATIENT_RESTORE', `Duplicate match found. Restored archived patient: ${duplicate.bas_name} (MRN ${duplicate.bas_mrn})`);
      return { success: true, duplicateRestored: true };
    }

    if (duplicate) {
      return { success: false, error: `A patient record with this MRN or Name already exists: ${duplicate.bas_name} (MRN ${duplicate.bas_mrn})` };
    }

    try {
      let savedRecord: Patient;
      if (patientData.id && !patientData.id.startsWith('pat_')) {
        savedRecord = await updateCaseApi(patientData.id, patientData);
        logAction('PATIENT_UPDATE', `Updated patient API record: ${savedRecord.bas_name} (MRN ${savedRecord.bas_mrn})`);
      } else {
        savedRecord = await createCaseApi(patientData);
        logAction('PATIENT_CREATE', `Created new patient API record: ${savedRecord.bas_name} (MRN ${savedRecord.bas_mrn})`);
      }

      savedRecord.isStalled = isPatientStalled(savedRecord);
      
      const updatedPatients = patientData.id 
        ? patients.map(p => p.id === patientData.id ? savedRecord : p)
        : [...patients, savedRecord];

      saveToStorage(updatedPatients);
      setIsOnline(true);
      return { success: true };
    } catch (e: any) {
      console.warn('API error during save, falling back to local storage', e);
      setIsOnline(false);

      const now = new Date().toISOString();
      const updater = currentUser || 'System';
      let fallbackRecord: Patient;

      if (patientData.id) {
        const existing = patients.find(p => p.id === patientData.id);
        if (!existing) return { success: false, error: 'Patient record not found.' };
        fallbackRecord = { ...existing, ...patientData, updatedAt: now, updatedBy: updater } as Patient;
      } else {
        fallbackRecord = { ...patientData, id: `pat_${Date.now()}`, createdAt: now, updatedAt: now, updatedBy: updater } as Patient;
      }

      fallbackRecord.isStalled = isPatientStalled(fallbackRecord);
      const updatedPatients = patientData.id 
        ? patients.map(p => p.id === patientData.id ? fallbackRecord : p)
        : [...patients, fallbackRecord];

      saveToStorage(updatedPatients);
      return { success: true };
    }
  };

  const archivePatient = async (id: string) => {
    const record = patients.find(p => p.id === id);
    if (!record) return;

    try {
      if (!id.startsWith('pat_')) {
        await deleteCaseApi(id);
      }
      setIsOnline(true);
    } catch (e) {
      console.warn('API delete failed, performing local archive', e);
      setIsOnline(false);
    }

    const updated = patients.filter(p => p.id !== id);
    saveToStorage(updated);
    logAction('PATIENT_ARCHIVE', `Archived/Deleted patient: ${record.bas_name} (MRN ${record.bas_mrn})`);
  };

  const restorePatient = async (id: string) => {
    const record = patients.find(p => p.id === id);
    if (!record) return;
    const updated = patients.map(p => p.id === id ? { ...p, isArchived: false, archivedAt: undefined } : p);
    saveToStorage(updated);
    logAction('PATIENT_RESTORE', `Restored patient: ${record.bas_name} (MRN ${record.bas_mrn})`);
  };

  const saveResearchTemplate = (template: ResearchTemplate) => {
    const updated = { ...researchTemplates, [template.id]: template };
    saveTemplatesToStorage(updated);
    logAction('RESEARCH_TEMPLATE_SAVE', `Saved research study template: ${template.title}`);
  };

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
        editingPatientId,
        currentPage,
        itemsPerPage,
        filterStatus,
        filterUrgency,
        filterPurpose,
        searchQuery,
        clinicalLogs,
        isLoading,
        isOnline,
        
        setCurrentModule,
        setEditingPatientId,
        setCurrentPage,
        setFilterStatus,
        setFilterUrgency,
        setFilterPurpose,
        setSearchQuery,
        
        login,
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
