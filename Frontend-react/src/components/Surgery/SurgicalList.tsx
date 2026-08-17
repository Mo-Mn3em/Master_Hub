import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Patient, ProgramData, CompletedSurgery } from '../../types';
import DEPARTMENTS from '../../utils/departmentsData';
import { getAutoBlockers, getPatientAlarms, getHighestPriority, getLocalDateString } from '../../utils/clinicalRules';
import { Search, Calendar, ChevronDown, ChevronUp, AlertCircle, ShieldCheck, CheckCircle2, CheckCheck, Clock, Layers, History, Save, Check } from 'lucide-react';

export const SurgicalList: React.FC = () => {
  const { patients, savePatient, setEditingPatientId } = useApp();
  
  // State for search and filter selections
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [statusView, setStatusView] = useState<'scheduled' | 'completed' | 'all'>('scheduled');
  
  // Save feedback state
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedFeedback, setSavedFeedback] = useState<Record<string, boolean>>({});

  const handleSavePatient = async (patient: Patient) => {
    setSavingId(patient.id);
    const res = await savePatient(patient);
    setSavingId(null);
    if (res.success) {
      setSavedFeedback(prev => ({ ...prev, [patient.id]: true }));
      setTimeout(() => {
        setSavedFeedback(prev => ({ ...prev, [patient.id]: false }));
      }, 3000);
    } else {
      alert(`Save Error: ${res.error || 'Failed to update database'}`);
    }
  };

  // Track open/collapsed state of date groups
  const [collapsedGroups, setCollapsedGroups] = useState<{ [date: string]: boolean }>({});

  const toggleGroup = (date: string) => {
    setCollapsedGroups(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Active clinical departments where patient is currently enrolled
  const getActiveDepts = (p: Patient) => {
    return DEPARTMENTS.filter(d => d.code !== 'anes' && d.code !== 'surg' && p.programs?.[d.code]?.enrolled);
  };

  // Departments where patient was genuinely previously assigned (has real diagnosis, planned operation, visit date or notes, but currently un-enrolled)
  const getPreviousDepts = (p: Patient) => {
    return DEPARTMENTS.filter(d => {
      if (d.code === 'anes' || d.code === 'surg') return false;
      const prog = p.programs?.[d.code];
      if (!prog || prog.enrolled) return false;
      const pfx = d.pfx || d.code;
      
      const diag = prog.primary_diagnosis || prog[`${pfx}Diag`] || prog[`${d.code}Diag`];
      const op = prog.planned_operation || prog.opName || prog[`${pfx}OpName`];
      const visit = prog.first_visit_date || prog[`${pfx}FirstVisit`];
      const notes = (typeof prog.notes === 'string' && prog.notes.trim().length > 0) ||
                    (typeof prog[`${pfx}Notes`] === 'string' && prog[`${pfx}Notes`].trim().length > 0);

      // Must have at least one non-empty real clinical field
      return !!(diag || op || visit || notes);
    });
  };

  const getPrimaryClinicLabel = (p: Patient) => {
    const active = getActiveDepts(p);
    if (active.length > 0) return active.map(c => c.label).join(', ');
    
    // Check if any clinic has a planned operation or diagnosis
    for (const d of DEPARTMENTS) {
      if (d.code === 'anes' || d.code === 'surg') continue;
      const prog = p.programs?.[d.code];
      const pfx = d.pfx || d.code;
      if (prog && (prog.primary_diagnosis || prog[`${pfx}Diag`] || prog.planned_operation || prog[`${pfx}OpName`])) {
        return d.label;
      }
    }
    return 'Specialty Clinic';
  };

  // Get previous completed surgeries for this patient
  const getPastSurgeries = (p: Patient): CompletedSurgery[] => {
    const list: CompletedSurgery[] = [];
    if (Array.isArray(p.pastSurgeries)) {
      list.push(...p.pastSurgeries);
    }
    if (Array.isArray(p.research?.past_surgeries)) {
      p.research.past_surgeries.forEach((s: any) => {
        if (!list.some(existing => existing.id === s.id || (existing.opName === s.opName && existing.completedDate === s.completedDate))) {
          list.push(s);
        }
      });
    }
    if (Array.isArray(p.programs?.surg?.pastSurgeries)) {
      p.programs.surg.pastSurgeries.forEach(s => {
        if (!list.some(existing => existing.id === s.id || (existing.opName === s.opName && existing.completedDate === s.completedDate))) {
          list.push(s);
        }
      });
    }
    return list;
  };

  // Mark a surgery as completed / done while retaining all clinical data
  const markSurgeryAsDone = async (patient: Patient) => {
    const surg: ProgramData = patient.programs?.surg || { enrolled: true };
    
    // Gather all requested procedures and all referring departments
    const opsList: string[] = [];
    const deptLabelsList: string[] = [];

    if (surg.opName) opsList.push(surg.opName);

    for (const d of DEPARTMENTS) {
      if (d.code === 'anes' || d.code === 'surg') continue;
      const prog = patient.programs?.[d.code];
      const pfx = d.pfx || d.code;
      if (prog && prog.enrolled) {
        const op = prog.planned_operation || prog.opName || prog[`${pfx}OpName`];
        if (op && !opsList.includes(op)) {
          opsList.push(op);
        }
        if (!deptLabelsList.includes(d.label)) {
          deptLabelsList.push(d.label);
        }
      }
    }

    const completedOp = opsList.join(' + ') || 'Surgical Operation';
    const todayStr = getLocalDateString();
    const activeDepts = deptLabelsList.join(', ') || getActiveDepts(patient).map(d => d.label).join(', ');

    const newPastSurgery: CompletedSurgery = {
      id: 'surg_' + Date.now(),
      opName: completedOp,
      completedDate: todayStr,
      departmentName: activeDepts || 'Surgical Unit',
      notes: 'Surgery completed in operating theater'
    };

    const currentPast = getPastSurgeries(patient);
    const updatedPast = [newPastSurgery, ...currentPast];

    const cloned: Patient = JSON.parse(JSON.stringify(patient));
    if (!cloned.programs) cloned.programs = {};
    if (!cloned.programs.surg) cloned.programs.surg = { enrolled: false };

    cloned.programs.surg.stage = 'completed';
    cloned.programs.surg.enrolled = false;
    cloned.programs.surg.status = 'discharged';
    cloned.programs.surg.completedDate = todayStr;
    cloned.programs.surg.pastSurgeries = updatedPast;
    cloned.pastSurgeries = updatedPast;
    if (!cloned.research) cloned.research = {};
    cloned.research.past_surgeries = updatedPast;
    cloned.research.surg_stage = 'completed';

    // Deactivate surgery booking alarms and unenroll from the active clinic queue for departments that performed the surgery
    DEPARTMENTS.forEach(d => {
      if (d.code === 'anes' || d.code === 'surg') return;
      const prog = cloned.programs?.[d.code];
      const pfx = d.pfx || d.code;
      if (prog) {
        prog[`${pfx}OpReqAlarmActive`] = false;
        prog[`${pfx}OpReqAlarmDate`] = null;
        prog.surgery_booking_active = false;
        prog.surgery_booking_date = null;
        prog.enrolled = false;
        prog.status = 'discharged';
      }
    });

    const logEntry = `[${todayStr}] ✅ Completed Surgery: ${completedOp}`;
    cloned.bas_history = cloned.bas_history ? `${cloned.bas_history}\n${logEntry}` : logEntry;

    await savePatient(cloned);
  };

  // Check if patient is actively scheduled for surgery
  const isActivelyScheduled = (p: Patient): boolean => {
    if (p.isArchived) return false;
    const surg = p.programs?.surg;
    if (surg?.stage === 'completed' || surg?.status === 'discharged') return false;
    if (surg?.enrolled) return true;
    if (surg?.opName || surg?.scheduledDate) return true;
    
    // Check if specialty clinic booked surgery
    for (const d of DEPARTMENTS) {
      if (d.code === 'anes' || d.code === 'surg') continue;
      const prog = p.programs?.[d.code];
      const pfx = d.pfx || d.code;
      if (prog?.enrolled && (prog[`${pfx}OpReqAlarmActive`] || prog.surgery_booking_active)) {
        return true;
      }
    }
    return false;
  };

  // Check if patient has completed surgery
  const hasCompletedSurgery = (p: Patient): boolean => {
    if (p.isArchived) return false;
    const surg = p.programs?.surg;
    if (surg?.stage === 'completed') return true;
    if (Array.isArray(p.pastSurgeries) && p.pastSurgeries.length > 0) return true;
    if (Array.isArray(p.research?.past_surgeries) && p.research.past_surgeries.length > 0) return true;
    if (Array.isArray(surg?.pastSurgeries) && surg.pastSurgeries.length > 0) return true;
    return false;
  };

  // Calculate counts for view switcher tabs
  const scheduledCount = patients.filter(isActivelyScheduled).length;
  const completedCount = patients.filter(hasCompletedSurgery).length;
  const totalSurgicalCount = patients.filter(p => isActivelyScheduled(p) || hasCompletedSurgery(p)).length;

  // Filter surgical patients
  const surgicalPatients = patients.filter(p => {
    if (p.isArchived) return false;

    // View filter
    if (statusView === 'scheduled') {
      if (!isActivelyScheduled(p)) return false;
    } else if (statusView === 'completed') {
      if (!hasCompletedSurgery(p)) return false;
    } else {
      if (!isActivelyScheduled(p) && !hasCompletedSurgery(p)) return false;
    }

    // Search filter (Name or MRN)
    const matchesSearch = 
      p.bas_name.toLowerCase().includes(search.toLowerCase()) ||
      p.bas_mrn.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // Department filter
    if (deptFilter !== 'all') {
      const isEnrolledInDept = !!p.programs?.[deptFilter]?.enrolled;
      const hasPastSurgeryFromDept = Array.isArray(p.pastSurgeries) && p.pastSurgeries.some(s => s.departmentName?.toLowerCase().includes(deptFilter));
      if (!isEnrolledInDept && !hasPastSurgeryFromDept) return false;
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      const surg: ProgramData = p.programs?.surg || { enrolled: false };
      const urgency = surg.urgency || 'none';
      if (urgency !== urgencyFilter) return false;
    }

    return true;
  });

  // Group patients by scheduled or completed date
  const groupedPatients: { [date: string]: Patient[] } = {};
  const unscheduledPatients: Patient[] = [];

  surgicalPatients.forEach(p => {
    const surg: ProgramData = p.programs?.surg || { enrolled: false };
    const date = statusView === 'completed'
      ? (surg.completedDate || p.pastSurgeries?.[0]?.completedDate || surg.scheduledDate)
      : (surg.scheduledDate || surg.completedDate || p.pastSurgeries?.[0]?.completedDate);

    if (date) {
      if (!groupedPatients[date]) {
        groupedPatients[date] = [];
      }
      groupedPatients[date].push(p);
    } else {
      unscheduledPatients.push(p);
    }
  });

  // Sort dates (descending for completed, ascending for scheduled)
  const sortedDates = Object.keys(groupedPatients).sort((a, b) => {
    if (statusView === 'completed') {
      return b.localeCompare(a);
    }
    return a.localeCompare(b);
  });

  // Inline value editor helper
  const handleInlineEdit = (patient: Patient, field: string, value: string | number | boolean) => {
    const cloned = JSON.parse(JSON.stringify(patient));
    if (!cloned.programs) cloned.programs = {};
    if (!cloned.programs.surg) cloned.programs.surg = { enrolled: true };
    cloned.programs.surg[field] = value;
    
    if (field === 'stage' && value === 'completed') {
      markSurgeryAsDone(patient);
      return;
    }
    
    savePatient(cloned);
  };

  // Find blockers across all clinical programs of this patient
  const getAllPatientBlockers = (p: Patient): string[] => {
    const blockers: string[] = [];
    DEPARTMENTS.forEach(dept => {
      if (p.programs?.[dept.code]?.enrolled) {
        const deptBlockers = getAutoBlockers(p, dept);
        deptBlockers.forEach(b => blockers.push(`[${dept.code.toUpperCase()}] ${b}`));
      }
    });
    return blockers;
  };

  // Get single patient alarm priority (red, yellow, blue, or none)
  const getPatientAlarmPriority = (p: Patient): 'red' | 'yellow' | 'blue' | 'none' => {
    const alarms = getPatientAlarms(p);
    const highestAlarm = getHighestPriority(alarms);
    if (highestAlarm === 'red') return 'red';

    const surg: ProgramData = p.programs?.surg || { enrolled: false };
    const urg = (surg.urgency || '').toLowerCase();
    const pri = (surg.priority || surg.surgPriority || '').toLowerCase();

    if (urg === 'urgent' || urg === 'emergency' || pri === 'red') return 'red';
    if (highestAlarm === 'yellow' || urg === 'semi_urgent' || pri === 'yellow') return 'yellow';
    if (highestAlarm === 'blue' || urg === 'elective' || urg === 'routine' || pri === 'blue') return 'blue';

    return highestAlarm;
  };

  // Determine header background color theme based on alarm priority in card group
  const getGroupAlarmTheme = (patients: Patient[]) => {
    const priorities = patients.map(getPatientAlarmPriority);
    if (priorities.includes('red')) {
      return {
        gradient: 'linear-gradient(135deg, #b91c1c, #7f1d1d)',
        shadow: '0 4px 14px rgba(185, 28, 28, 0.35)',
        iconColor: '#fca5a5',
        badge: 'URGENT (RED ALARM)',
        badgeBg: 'rgba(0, 0, 0, 0.25)',
        border: '#ef4444'
      };
    }
    if (priorities.includes('yellow')) {
      return {
        gradient: 'linear-gradient(135deg, #d97706, #92400e)',
        shadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
        iconColor: '#fde68a',
        badge: 'IMPORTANT (YELLOW ALARM)',
        badgeBg: 'rgba(0, 0, 0, 0.25)',
        border: '#f59e0b'
      };
    }
    if (priorities.includes('blue')) {
      return {
        gradient: 'linear-gradient(135deg, #2563eb, #1e40af)',
        shadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
        iconColor: '#bfdbfe',
        badge: 'ROUTINE (BLUE ALARM)',
        badgeBg: 'rgba(0, 0, 0, 0.25)',
        border: '#3b82f6'
      };
    }
    return {
      gradient: 'linear-gradient(135deg, #1e293b, #0f172a)',
      shadow: 'none',
      iconColor: '#2dd4bf',
      badge: '',
      badgeBg: 'transparent',
      border: 'transparent'
    };
  };

  // Determine overall surgical state / clinical status of the patient (aligned with DB enum)
  const getSurgicalCaseState = (patient: Patient) => {
    const anes: ProgramData = patient.programs?.anes || { enrolled: false };
    const surg: ProgramData = patient.programs?.surg || { enrolled: false };
    const blockers = getAllPatientBlockers(patient);

    const dbStatus = surg.surgical_status;

    if (surg.stage === 'completed' || dbStatus === 'completed') {
      return {
        label: '✅ COMPLETED — Operation Done',
        short: 'DONE',
        color: '#15803d',
        bg: '#dcfce7',
        border: '#86efac',
        type: 'completed',
        enumValue: 'completed'
      };
    }

    if (anes.assessmentStatus === 'unfit' || dbStatus === 'unfit') {
      return {
        label: `✕ UNFIT: ${anes.unfitReason || 'Clinical Hold by Anesthesia'}`,
        short: 'UNFIT',
        color: '#991b1b',
        bg: '#fee2e2',
        border: '#fca5a5',
        type: 'unfit',
        enumValue: 'unfit'
      };
    }

    if (anes.assessmentStatus === 'fit' || dbStatus === 'anesthesia_fit_ready' || dbStatus === 'anesthesia_fit_checks_pending') {
      if (blockers.length > 0 || dbStatus === 'anesthesia_fit_checks_pending') {
        return {
          label: `⚠️ Anesthesia Fit (${blockers.length} Check${blockers.length > 1 ? 's' : ''} Pending)`,
          short: 'CHECKS PENDING',
          color: '#c2410c',
          bg: '#ffedd5',
          border: '#fdba74',
          type: 'blocked',
          enumValue: 'anesthesia_fit_checks_pending'
        };
      }
      return {
        label: '✓ Anesthesia Confirmed — Fit for OR',
        short: 'FIT FOR OR',
        color: '#15803d',
        bg: '#dcfce7',
        border: '#86efac',
        type: 'fit',
        enumValue: 'anesthesia_fit_ready'
      };
    }

    // Default: 1. Waiting for confirm from Anesthesia Clinic
    return {
      label: '⏳ Awaiting Confirmation from Anesthesia Clinic',
      short: 'AWAITING ANESTHESIA',
      color: '#7e22ce',
      bg: '#f3e8ff',
      border: '#d8b4fe',
      type: 'awaiting_anes',
      enumValue: 'waiting_anesthesia_confirm'
    };
  };

  const formatHeaderDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', options);
  };

  return (
    <div className="container fade-in">
      {/* ── View Switcher Tabs ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button 
          onClick={() => setStatusView('scheduled')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            border: statusView === 'scheduled' ? '2px solid #0d9488' : '1px solid var(--border)',
            background: statusView === 'scheduled' ? '#ccfbf1' : 'var(--surface)',
            color: statusView === 'scheduled' ? '#0f766e' : 'var(--text-secondary)',
            boxShadow: statusView === 'scheduled' ? '0 2px 8px rgba(13, 148, 136, 0.2)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Clock className="w-4 h-4" />
          <span>Active Roster / Scheduled ({scheduledCount})</span>
        </button>

        <button 
          onClick={() => setStatusView('completed')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            border: statusView === 'completed' ? '2px solid #16a34a' : '1px solid var(--border)',
            background: statusView === 'completed' ? '#dcfce7' : 'var(--surface)',
            color: statusView === 'completed' ? '#15803d' : 'var(--text-secondary)',
            boxShadow: statusView === 'completed' ? '0 2px 8px rgba(22, 163, 74, 0.2)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Completed Surgeries ({completedCount})</span>
        </button>

        <button 
          onClick={() => setStatusView('all')}
          style={{
            padding: '8px 18px',
            borderRadius: 10,
            fontWeight: 700,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            border: statusView === 'all' ? '2px solid #6366f1' : '1px solid var(--border)',
            background: statusView === 'all' ? '#e0e7ff' : 'var(--surface)',
            color: statusView === 'all' ? '#4338ca' : 'var(--text-secondary)',
            boxShadow: statusView === 'all' ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Layers className="w-4 h-4" />
          <span>All Cases ({totalSurgicalCount})</span>
        </button>
      </div>

      {/* ── Filters Bar ── */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 2 }}>
          <label>Search Surgical List</label>
          <div style={{ position: 'relative' }}>
            <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search scheduled patients by Name or MRN..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Surgical Department</label>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="all">All Specialties</option>
            {DEPARTMENTS.filter(d => d.code !== 'anes' && d.code !== 'surg').map(d => (
              <option key={d.code} value={d.code}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Urgency Level</label>
          <select value={urgencyFilter} onChange={(e) => setUrgencyFilter(e.target.value)}>
            <option value="all">All Urgencies</option>
            <option value="emergency">Emergency / Salvage</option>
            <option value="urgent">Urgent</option>
            <option value="semi_urgent">Semi-Urgent</option>
            <option value="elective">Elective</option>
          </select>
        </div>
      </div>

      {/* ── Grouped Schedules List ── */}
      {sortedDates.length > 0 || unscheduledPatients.length > 0 ? (
        <div>
          {/* A. Grouped by Date */}
          {sortedDates.map(date => {
            const datePatients = groupedPatients[date];
            const isCollapsed = !!collapsedGroups[date];
            const groupTheme = getGroupAlarmTheme(datePatients);

            return (
              <div key={date} className={`surg-group ${!isCollapsed ? 'open' : ''}`}>
                <div 
                  className="surg-group-header" 
                  style={{ 
                    background: groupTheme.gradient,
                    boxShadow: groupTheme.shadow,
                    transition: 'all 0.25s ease'
                  }}
                  onClick={() => toggleGroup(date)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Calendar className="w-4 h-4" style={{ color: groupTheme.iconColor }} />
                    <strong>{formatHeaderDate(date)}</strong>
                    <span style={{ fontSize: 12, opacity: 0.85 }}>({datePatients.length} {statusView === 'completed' ? 'completed' : 'scheduled'})</span>
                    {groupTheme.badge && (
                      <span style={{ 
                        marginLeft: 6, 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        background: groupTheme.badgeBg, 
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        letterSpacing: '0.02em'
                      }}>
                        {groupTheme.badge}
                      </span>
                    )}
                  </span>
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>

                {!isCollapsed && (
                  <div className="surg-group-content">
                    {datePatients.map(patient => {
                      const surg: ProgramData = patient.programs?.surg || { enrolled: false };
                      const blockers = getAllPatientBlockers(patient);
                      const caseState = getSurgicalCaseState(patient);
                      const pAlarm = getPatientAlarmPriority(patient);
                      const pBorder = pAlarm === 'red' ? '4px solid #ef4444' : (pAlarm === 'yellow' ? '4px solid #f59e0b' : (pAlarm === 'blue' ? '4px solid #3b82f6' : '1px solid var(--border)'));
                      const activeDepts = getActiveDepts(patient);
                      const previousDepts = getPreviousDepts(patient);
                      const pastSurgeries = getPastSurgeries(patient);
                      const isCompleted = surg.stage === 'completed';

                      return (
                        <div 
                          key={patient.id} 
                          className="surg-row" 
                          style={{ borderLeft: pBorder }}
                          onClick={() => setEditingPatientId(patient.id)}
                        >
                          
                          {/* Col 1: Patient details & Clinics */}
                          <div>
                            <div className="surg-row-title">{patient.bas_name}</div>
                            <div className="surg-row-sub">
                              <span>MRN: {patient.bas_mrn}</span>
                              <span style={{ marginLeft: 10 }}>Blood: {patient.bas_blood || 'Unknown'}</span>
                            </div>

                            <div style={{ marginTop: 6, fontSize: '0.75rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Clinic: </span>
                              {activeDepts.length > 0 ? (
                                activeDepts.map(d => (
                                  <span 
                                    key={d.code}
                                    style={{
                                      padding: '2px 7px',
                                      borderRadius: 4,
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      background: '#ccfbf1',
                                      color: '#0f766e',
                                      border: '1px solid #99f6e4',
                                      marginRight: 4
                                    }}
                                  >
                                    🟢 {d.label}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getPrimaryClinicLabel(patient)}</span>
                              )}
                            </div>

                            {previousDepts.length > 0 && (
                              <div style={{ marginTop: 4 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginRight: 4 }}>
                                  Prior Clinics:
                                </span>
                                {previousDepts.map(d => (
                                  <span 
                                    key={d.code}
                                    style={{
                                      padding: '1px 6px',
                                      borderRadius: 4,
                                      fontSize: '0.68rem',
                                      fontWeight: 500,
                                      background: '#f1f5f9',
                                      color: '#64748b',
                                      border: '1px solid #cbd5e1',
                                      marginRight: 4
                                    }}
                                  >
                                    ⚪ {d.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Col 2: Procedure, Gate Blockers, Clinical State & Past Surgeries History */}
                          <div>
                            <div className="surg-row-title" style={{ color: 'var(--accent)' }}>
                              {surg.opName || 'No Procedure Assigned'}
                            </div>

                            {/* Case State in Surgical List */}
                            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ 
                                padding: '3px 10px', 
                                borderRadius: 6, 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                background: caseState.bg, 
                                color: caseState.color, 
                                border: `1px solid ${caseState.border}`,
                                letterSpacing: '0.01em',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                {caseState.label}
                              </span>
                            </div>

                            {blockers.length > 0 && !isCompleted ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate" title={blockers.join(', ')}>
                                  Blockers: {blockers.join(', ')}
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, color: 'var(--success)', fontSize: 11, fontWeight: 600 }}>
                                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{isCompleted ? 'Operation completed successfully.' : 'All checklist gates cleared. Ready for theater.'}</span>
                              </div>
                            )}

                            {/* Previous Surgeries Done for this case */}
                            <div style={{ 
                              marginTop: 8, 
                              padding: '5px 8px', 
                              borderRadius: 6, 
                              background: pastSurgeries.length > 0 ? '#f0fdf4' : 'var(--surface-sunken)', 
                              border: pastSurgeries.length > 0 ? '1px solid #bbf7d0' : '1px solid var(--border)' 
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, color: pastSurgeries.length > 0 ? '#15803d' : 'var(--text-muted)' }}>
                                <History className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Previous Surgeries Done ({pastSurgeries.length}):</span>
                              </div>
                              {pastSurgeries.length > 0 ? (
                                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {pastSurgeries.map((ps, idx) => (
                                    <div key={ps.id || idx} style={{ fontSize: '0.72rem', color: '#1e293b' }}>
                                      ✓ <strong>{ps.opName}</strong> — <span style={{ color: '#047857', fontWeight: 600 }}>{ps.completedDate}</span> {ps.departmentName ? `(${ps.departmentName})` : ''}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  No previous surgical operations recorded for this case.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Col 3: Urgency, Operational State & Mark As Done Action */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span className={`surg-urgency urg-${surg.urgency || 'none'}`}>
                              {surg.urgency || 'none'}
                            </span>

                            <select
                              value={surg.stage || 'scheduled'}
                              onChange={(e) => handleInlineEdit(patient, 'stage', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '0.72rem', 
                                fontWeight: 600,
                                borderRadius: 6,
                                border: '1px solid var(--border)',
                                background: isCompleted ? '#dcfce7' : 'var(--surface-sunken)',
                                color: isCompleted ? '#15803d' : 'var(--text-primary)',
                                width: 'auto'
                              }}
                            >
                              <option value="scheduled">State: Scheduled</option>
                              <option value="preop_ready">State: Pre-Op Ready</option>
                              <option value="in_theater">State: In Theater</option>
                              <option value="completed">State: Completed (Done)</option>
                              <option value="postponed">State: Postponed</option>
                            </select>

                            {/* Save Record to DB Button */}
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await handleSavePatient(patient);
                              }}
                              disabled={savingId === patient.id}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.70rem',
                                fontWeight: 700,
                                borderRadius: 6,
                                border: savedFeedback[patient.id] ? '1px solid #86efac' : '1px solid var(--border)',
                                background: savedFeedback[patient.id] ? '#dcfce7' : 'var(--surface)',
                                color: savedFeedback[patient.id] ? '#15803d' : 'var(--text-primary)',
                                cursor: savingId === patient.id ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                transition: 'all 0.2s'
                              }}
                            >
                              {savingId === patient.id ? (
                                <span>Saving...</span>
                              ) : savedFeedback[patient.id] ? (
                                <>
                                  <Check className="w-3 h-3 text-green-600" />
                                  <span>✓ Saved in DB</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3 h-3 text-slate-500" />
                                  <span>Save Record</span>
                                </>
                              )}
                            </button>

                            {/* Mark As Done Button */}
                            {!isCompleted ? (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  await markSurgeryAsDone(patient);
                                }}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5,
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                                }}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark as Done</span>
                              </button>
                            ) : (
                              <span style={{ 
                                padding: '3px 8px', 
                                borderRadius: 6, 
                                fontSize: '0.70rem', 
                                fontWeight: 700, 
                                background: '#dcfce7', 
                                color: '#15803d', 
                                border: '1px solid #86efac',
                                textAlign: 'center' 
                              }}>
                                ✓ Done ({surg.completedDate || 'Recorded'})
                              </span>
                            )}
                          </div>

                          {/* Col 4: Inline toggles (consent, labs) */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Labs:</span>
                              <select 
                                value={surg.labsOk || ''}
                                onChange={(e) => handleInlineEdit(patient, 'labsOk', e.target.value)}
                                style={{ padding: '3px 8px', fontSize: 11, width: 'auto' }}
                              >
                                <option value="">Awaiting</option>
                                <option value="yes">Normal (Yes)</option>
                                <option value="no">Abnormal (No)</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Consent:</span>
                              <select 
                                value={surg.consent || ''}
                                onChange={(e) => handleInlineEdit(patient, 'consent', e.target.value)}
                                style={{ padding: '3px 8px', fontSize: 11, width: 'auto' }}
                              >
                                <option value="">Awaiting</option>
                                <option value="yes">Signed (Yes)</option>
                                <option value="no">Problem (No)</option>
                              </select>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* B. Unscheduled (TBD Surgery Date) */}
          {unscheduledPatients.length > 0 && (() => {
            const tbdTheme = getGroupAlarmTheme(unscheduledPatients);

            return (
              <div className="surg-group open">
                <div 
                  className="surg-group-header" 
                  style={{ 
                    background: tbdTheme.gradient !== 'linear-gradient(135deg, #1e293b, #0f172a)' 
                      ? tbdTheme.gradient 
                      : 'linear-gradient(135deg, #475569, #334155)',
                    boxShadow: tbdTheme.shadow,
                    transition: 'all 0.25s ease'
                  }}
                  onClick={() => toggleGroup('tbd')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <Calendar className="w-4 h-4" style={{ color: tbdTheme.iconColor }} />
                    <strong>Date to be Determined (TBD) / Unscheduled</strong>
                    <span style={{ fontSize: 12, opacity: 0.85 }}>({unscheduledPatients.length} cases)</span>
                    {tbdTheme.badge && (
                      <span style={{ 
                        marginLeft: 6, 
                        padding: '2px 8px', 
                        borderRadius: 4, 
                        fontSize: '0.72rem', 
                        fontWeight: 700, 
                        background: tbdTheme.badgeBg, 
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        letterSpacing: '0.02em'
                      }}>
                        {tbdTheme.badge}
                      </span>
                    )}
                  </span>
                  {collapsedGroups['tbd'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>

                {!collapsedGroups['tbd'] && (
                  <div className="surg-group-content">
                    {unscheduledPatients.map(patient => {
                      const surg: ProgramData = patient.programs?.surg || { enrolled: false };
                      const blockers = getAllPatientBlockers(patient);
                      const caseState = getSurgicalCaseState(patient);
                      const pAlarm = getPatientAlarmPriority(patient);
                      const pBorder = pAlarm === 'red' ? '4px solid #ef4444' : (pAlarm === 'yellow' ? '4px solid #f59e0b' : (pAlarm === 'blue' ? '4px solid #3b82f6' : '1px solid var(--border)'));
                      const activeDepts = getActiveDepts(patient);
                      const previousDepts = getPreviousDepts(patient);
                      const pastSurgeries = getPastSurgeries(patient);
                      const isCompleted = surg.stage === 'completed';

                      return (
                        <div 
                          key={patient.id} 
                          className="surg-row" 
                          style={{ borderLeft: pBorder }}
                          onClick={() => setEditingPatientId(patient.id)}
                        >
                          {/* Col 1: Patient details & Clinics */}
                          <div>
                            <div className="surg-row-title">{patient.bas_name}</div>
                            <div className="surg-row-sub">
                              <span>MRN: {patient.bas_mrn}</span>
                              <span style={{ marginLeft: 10 }}>Blood: {patient.bas_blood || 'Unknown'}</span>
                            </div>

                            <div style={{ marginTop: 6, fontSize: '0.75rem' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Clinic: </span>
                              {activeDepts.length > 0 ? (
                                activeDepts.map(d => (
                                  <span 
                                    key={d.code}
                                    style={{
                                      padding: '2px 7px',
                                      borderRadius: 4,
                                      fontSize: '0.72rem',
                                      fontWeight: 600,
                                      background: '#ccfbf1',
                                      color: '#0f766e',
                                      border: '1px solid #99f6e4',
                                      marginRight: 4
                                    }}
                                  >
                                    🟢 {d.label}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getPrimaryClinicLabel(patient)}</span>
                              )}
                            </div>

                            {previousDepts.length > 0 && (
                              <div style={{ marginTop: 4 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', marginRight: 4 }}>
                                  Prior Clinics:
                                </span>
                                {previousDepts.map(d => (
                                  <span 
                                    key={d.code}
                                    style={{
                                      padding: '1px 6px',
                                      borderRadius: 4,
                                      fontSize: '0.68rem',
                                      fontWeight: 500,
                                      background: '#f1f5f9',
                                      color: '#64748b',
                                      border: '1px solid #cbd5e1',
                                      marginRight: 4
                                    }}
                                  >
                                    ⚪ {d.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Col 2: Procedure, Gate Blockers, Clinical State & Past Surgeries History */}
                          <div>
                            <div className="surg-row-title" style={{ color: 'var(--accent)' }}>
                              {surg.opName || 'No Procedure Assigned'}
                            </div>

                            {/* Case State in Surgical List */}
                            <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ 
                                padding: '3px 10px', 
                                borderRadius: 6, 
                                fontSize: '0.75rem', 
                                fontWeight: 700, 
                                background: caseState.bg, 
                                color: caseState.color, 
                                border: `1px solid ${caseState.border}`,
                                letterSpacing: '0.01em',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}>
                                {caseState.label}
                              </span>
                            </div>

                            {blockers.length > 0 && !isCompleted ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate" title={blockers.join(', ')}>
                                  Blockers: {blockers.join(', ')}
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5, color: 'var(--success)', fontSize: 11, fontWeight: 600 }}>
                                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>{isCompleted ? 'Operation completed successfully.' : 'All checklist gates cleared. Ready to schedule.'}</span>
                              </div>
                            )}

                            {/* Previous Surgeries Done for this case */}
                            <div style={{ 
                              marginTop: 8, 
                              padding: '5px 8px', 
                              borderRadius: 6, 
                              background: pastSurgeries.length > 0 ? '#f0fdf4' : 'var(--surface-sunken)', 
                              border: pastSurgeries.length > 0 ? '1px solid #bbf7d0' : '1px solid var(--border)' 
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, color: pastSurgeries.length > 0 ? '#15803d' : 'var(--text-muted)' }}>
                                <History className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>Previous Surgeries Done ({pastSurgeries.length}):</span>
                              </div>
                              {pastSurgeries.length > 0 ? (
                                <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  {pastSurgeries.map((ps, idx) => (
                                    <div key={ps.id || idx} style={{ fontSize: '0.72rem', color: '#1e293b' }}>
                                      ✓ <strong>{ps.opName}</strong> — <span style={{ color: '#047857', fontWeight: 600 }}>{ps.completedDate}</span> {ps.departmentName ? `(${ps.departmentName})` : ''}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  No previous surgical operations recorded for this case.
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Col 3: Urgency, Operational State & Mark As Done Action */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <span className={`surg-urgency urg-${surg.urgency || 'none'}`}>
                              {surg.urgency || 'none'}
                            </span>

                            <select
                              value={surg.stage || 'scheduled'}
                              onChange={(e) => handleInlineEdit(patient, 'stage', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '0.72rem', 
                                fontWeight: 600,
                                borderRadius: 6,
                                border: '1px solid var(--border)',
                                background: isCompleted ? '#dcfce7' : 'var(--surface-sunken)',
                                color: isCompleted ? '#15803d' : 'var(--text-primary)',
                                width: 'auto'
                              }}
                            >
                              <option value="scheduled">State: Scheduled</option>
                              <option value="preop_ready">State: Pre-Op Ready</option>
                              <option value="in_theater">State: In Theater</option>
                              <option value="completed">State: Completed (Done)</option>
                              <option value="postponed">State: Postponed</option>
                            </select>

                            {/* Save Record to DB Button */}
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await handleSavePatient(patient);
                              }}
                              disabled={savingId === patient.id}
                              style={{
                                padding: '4px 8px',
                                fontSize: '0.70rem',
                                fontWeight: 700,
                                borderRadius: 6,
                                border: savedFeedback[patient.id] ? '1px solid #86efac' : '1px solid var(--border)',
                                background: savedFeedback[patient.id] ? '#dcfce7' : 'var(--surface)',
                                color: savedFeedback[patient.id] ? '#15803d' : 'var(--text-primary)',
                                cursor: savingId === patient.id ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 4,
                                transition: 'all 0.2s'
                              }}
                            >
                              {savingId === patient.id ? (
                                <span>Saving...</span>
                              ) : savedFeedback[patient.id] ? (
                                <>
                                  <Check className="w-3 h-3 text-green-600" />
                                  <span>✓ Saved in DB</span>
                                </>
                              ) : (
                                <>
                                  <Save className="w-3 h-3 text-slate-500" />
                                  <span>Save Record</span>
                                </>
                              )}
                            </button>

                            {/* Mark As Done Button */}
                            {!isCompleted ? (
                              <button
                                type="button"
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  await markSurgeryAsDone(patient);
                                }}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  borderRadius: 6,
                                  border: 'none',
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
                                  color: '#ffffff',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 5,
                                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                                }}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark as Done</span>
                              </button>
                            ) : (
                              <span style={{ 
                                padding: '3px 8px', 
                                borderRadius: 6, 
                                fontSize: '0.70rem', 
                                fontWeight: 700, 
                                background: '#dcfce7', 
                                color: '#15803d', 
                                border: '1px solid #86efac',
                                textAlign: 'center' 
                              }}>
                                ✓ Done ({surg.completedDate || 'Recorded'})
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Labs:</span>
                              <select 
                                value={surg.labsOk || ''}
                                onChange={(e) => handleInlineEdit(patient, 'labsOk', e.target.value)}
                                style={{ padding: '3px 8px', fontSize: 11, width: 'auto' }}
                              >
                                <option value="">Awaiting</option>
                                <option value="yes">Normal (Yes)</option>
                                <option value="no">Abnormal (No)</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Consent:</span>
                              <select 
                                value={surg.consent || ''}
                                onChange={(e) => handleInlineEdit(patient, 'consent', e.target.value)}
                                style={{ padding: '3px 8px', fontSize: 11, width: 'auto' }}
                              >
                                <option value="">Awaiting</option>
                                <option value="yes">Signed (Yes)</option>
                                <option value="no">Problem (No)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)'
        }}>
          <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3>No {statusView === 'completed' ? 'Completed Surgeries' : 'Scheduled Procedures'} Found</h3>
          <p style={{ marginTop: 6, fontSize: 13 }}>Try adjusting filters, search query, or change tab view above.</p>
        </div>
      )}
    </div>
  );
};
