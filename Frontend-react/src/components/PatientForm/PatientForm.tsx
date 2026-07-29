import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { Patient, ProgramData } from '../../types';
import DEPARTMENTS from '../../utils/departmentsData';
import { 
  getAutoBlockers, 
  getDynamicAge,
  getLocalDateString,
  isFitnessExpired
} from '../../utils/clinicalRules';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Clock, 
  User, 
  Calendar,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const PatientForm: React.FC = () => {
  const { 
    editingPatientId, 
    setEditingPatientId, 
    patients, 
    savePatient, 
    archivePatient,
    researchTemplates
  } = useApp();

  const isNew = editingPatientId === 'new';
  const existingPatient = patients.find(p => p.id === editingPatientId);

  // 1. Initial State Definition
  const [localPatient, setLocalPatient] = useState<Partial<Patient>>({
    bas_name: '',
    bas_mrn: '',
    bas_gender: '',
    bas_dob: '',
    bas_age: 'Unknown',
    bas_phone: '',
    bas_gov: '',
    bas_blood: '',
    bas_motorProblem: 'no',
    bas_motorProblemDetail: '',
    bas_history: '',
    bas_social: '',
    bas_joinRequestDate: getLocalDateString(),
    bas_acceptanceCause: '',
    programs: {},
    research: {},
  });

  const [activeAccordion, setActiveAccordion] = useState<string>('demographics');
  const [enrolledClinics, setEnrolledClinics] = useState<{ [code: string]: boolean }>({});
  const [dirty, setDirty] = useState<boolean>(false);
  const [showDirtyWarning, setShowDirtyWarning] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Initialize form with patient data
  useEffect(() => {
    if (!isNew && existingPatient) {
      // Clone existing patient
      const cloned = JSON.parse(JSON.stringify(existingPatient));
      setLocalPatient(cloned);
      
      // Map enrolled clinics
      const enrolls: { [code: string]: boolean } = {};
      DEPARTMENTS.forEach(d => {
        enrolls[d.code] = !!cloned.programs?.[d.code]?.enrolled;
      });
      setEnrolledClinics(enrolls);
    } else {
      // Setup empty structure
      const emptyEnrolls: { [code: string]: boolean } = {};
      const initPrograms: { [code: string]: ProgramData } = {};
      DEPARTMENTS.forEach(d => {
        emptyEnrolls[d.code] = false;
        initPrograms[d.code] = { enrolled: false };
      });
      setEnrolledClinics(emptyEnrolls);
      setLocalPatient({
        bas_name: '',
        bas_mrn: '',
        bas_gender: '',
        bas_dob: '',
        bas_age: 'Unknown',
        bas_phone: '',
        bas_gov: '',
        bas_blood: '',
        bas_motorProblem: 'no',
        bas_motorProblemDetail: '',
        bas_history: '',
        bas_social: '',
        bas_joinRequestDate: getLocalDateString(),
        bas_acceptanceCause: '',
        programs: initPrograms,
        research: {},
      });
    }
    setDirty(false);
  }, [editingPatientId, existingPatient, isNew]);

  // Recalculate age on DOB change
  useEffect(() => {
    if (localPatient.bas_dob) {
      const calculatedAge = getDynamicAge(localPatient.bas_dob);
      setLocalPatient(prev => ({ ...prev, bas_age: calculatedAge }));
    }
  }, [localPatient.bas_dob]);

  // Dynamic input populator for custom HTML forms after DOM renders
  useEffect(() => {
    if (!formRef.current) return;
    
    // For each department, find its mounted HTML container and set child inputs values
    DEPARTMENTS.forEach(dept => {
      const block = document.getElementById(`block_${dept.code}`);
      if (!block) return;

      const pfx = dept.pfx || dept.code;
      const prog: Record<string, any> = localPatient.programs?.[dept.code] || {};

      block.querySelectorAll('input, select, textarea').forEach((el: any) => {
        if (!el.id) return;
        
        // Skip alarm elements, handle them separately
        if (/AlarmActive|AlarmDate|AlarmNote|Priority/.test(el.id)) return;
        if (el.id.startsWith('enr_')) return;

        let key = el.id;
        if (key.startsWith(pfx + '_')) key = key.slice(pfx.length + 1);
        else if (key.startsWith(dept.code + '_')) key = key.slice(dept.code.length + 1);

        if (!key) return;

        const val = prog[key];
        if (el.type === 'checkbox') {
          el.checked = !!val;
        } else {
          el.value = val !== undefined ? val : '';
        }
      });
    });

    // Populate blood bank fields (Special case)
    const anesBlock = document.getElementById('block_anes');
    if (anesBlock && localPatient.programs?.anes) {
      const anes: Record<string, any> = localPatient.programs.anes;
      ['rbc', 'ffp', 'cryo', 'fwb', 'plt'].forEach(b => {
        const unitsEl = document.getElementById(`anes_${b}Units`) as HTMLInputElement;
        const statusEl = document.getElementById(`anes_${b}Status`) as HTMLSelectElement;
        if (unitsEl) unitsEl.value = anes[`${b}Units`] || '';
        if (statusEl) statusEl.value = anes[`${b}Status`] || 'not_needed';
      });
      const overallEl = document.getElementById('anes_overallBloodReady') as HTMLSelectElement;
      if (overallEl) overallEl.value = anes.overallBloodReady || 'pending';
    }

    // Populate surgery fields
    if (localPatient.programs?.surg) {
      const surg: Record<string, any> = localPatient.programs.surg;
      ['opName', 'fitDate', 'consent', 'postDest', 'labsOk'].forEach(f => {
        const el = document.getElementById(`surg_${f}`) as HTMLInputElement | HTMLSelectElement;
        if (el) el.value = surg[f] || '';
      });
    }

  }, [localPatient.programs, enrolledClinics, activeAccordion]);

  // 2. Global change handler for input delegation
  const handleFormChange = (e: React.FormEvent<HTMLFormElement>) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    if (!el.id) return;
    setDirty(true);

    const val = el.type === 'checkbox' ? (el as HTMLInputElement).checked : el.value;

    // A. Demographic inputs
    if (el.id.startsWith('bas_')) {
      if (el.id === 'bas_motorProblem') {
        const checkedVal = (el as HTMLInputElement).value;
        setLocalPatient(prev => ({
          ...prev,
          bas_motorProblem: checkedVal as 'yes' | 'no',
          bas_motorProblemDetail: checkedVal === 'no' ? '' : prev.bas_motorProblemDetail
        }));
      } else {
        setLocalPatient(prev => ({ ...prev, [el.id]: val }));
      }
      return;
    }

    // B. Alarms elements (e.g. spinOpReqAlarmActive, anesPreopAlarmDate)
    const alarmMatch = el.id.match(/^(\w+)(AlarmActive|AlarmDate|AlarmNote|Priority)$/);
    if (alarmMatch) {
      const prefix = alarmMatch[1]; // e.g. spinOpReq or anesPreop
      const field = alarmMatch[2]; // e.g. AlarmActive
      
      // Find which department this prefix belongs to
      const dept = DEPARTMENTS.find(d => {
        const pfx = d.pfx || d.code;
        return prefix.startsWith(pfx) || prefix === 'anesPreop';
      });

      if (dept) {
        setLocalPatient(prev => {
          const prog = prev.programs?.[dept.code] || { enrolled: true };
          return {
            ...prev,
            programs: {
              ...prev.programs,
              [dept.code]: {
                ...prog,
                enrolled: true,
                [`${prefix}${field}`]: val
              }
            }
          };
        });
      } else if (prefix === 'basSoc') {
        // Basic social alarm is top-level
        setLocalPatient(prev => ({ ...prev, [`${prefix}${field}`]: val }));
      }
      return;
    }

    // C. Department program fields
    // Determine which department the element belongs to
    let deptCode = '';
    let key = el.id;

    for (const d of DEPARTMENTS) {
      const pfx = d.pfx || d.code;
      if (el.id.startsWith(pfx + '_')) {
        deptCode = d.code;
        key = el.id.slice(pfx.length + 1);
        break;
      } else if (el.id.startsWith(d.code + '_')) {
        deptCode = d.code;
        key = el.id.slice(d.code.length + 1);
        break;
      }
    }

    if (deptCode) {
      setLocalPatient(prev => {
        const prog = prev.programs?.[deptCode] || { enrolled: true };
        return {
          ...prev,
          programs: {
            ...prev.programs,
            [deptCode]: {
              ...prog,
              enrolled: true,
              [key]: val
            }
          }
        };
      });
      return;
    }

    // D. Surgical List Fields
    if (el.id.startsWith('surg_')) {
      const field = el.id.slice(5);
      setLocalPatient(prev => {
        const surg = prev.programs?.surg || { enrolled: true };
        return {
          ...prev,
          programs: {
            ...prev.programs,
            surg: {
              ...surg,
              enrolled: true,
              [field]: val
            }
          }
        };
      });
    }
  };

  // 3. Department Enrollment Toggle
  const handleEnrollmentToggle = (code: string, enrolled: boolean) => {
    setDirty(true);
    setEnrolledClinics(prev => ({ ...prev, [code]: enrolled }));

    setLocalPatient(prev => {
      const prog = prev.programs?.[code] || { enrolled: false };
      return {
        ...prev,
        programs: {
          ...prev.programs,
          [code]: {
            ...prog,
            enrolled: enrolled
          }
        }
      };
    });
  };

  // 4. Save Submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verification check for Anesthesia unfit reason
    if (enrolledClinics.anes && (localPatient.programs?.anes as Record<string, any>)?.assessmentStatus === 'unfit') {
      const reason = (localPatient.programs?.anes as Record<string, any>)?.unfitReason;
      if (!reason || !reason.trim()) {
        alert("Action Blocked: You marked the patient as Unfit for Anesthesia but did not provide a reason.\n\nPlease fill the Anesthesia block's Unfit Reason field.");
        setActiveAccordion('anes');
        return;
      }
    }

    // Call Context Save
    const res = await savePatient(localPatient);
    if (res.success) {
      setDirty(false);
      setEditingPatientId(null);
      if (res.duplicateRestored) {
        alert("Found duplicate patient record in Archive. The archived file has been restored and loaded.");
      }
    } else {
      alert(`Error saving patient record: ${res.error}`);
    }
  };

  const transferToSurgicalList = () => {
    const anes: Record<string, any> = localPatient.programs?.anes || {};
    const assessmentDate = anes.assessmentDate;
    if (!assessmentDate) {
      alert("Transfer Blocked: You must enter the 'Preoperative assessment Done Date'. The system requires this date to track the 30-day fitness expiration.");
      return;
    }
    
    if (isFitnessExpired(assessmentDate)) {
      alert(`Transfer Blocked: The assessment date (${assessmentDate}) is 30 or more days old.\n\nThe patient requires a fresh clinical assessment before they can be transferred to the Surgical List.`);
      return;
    }

    if (window.confirm("Patient is FIT. Transfer data to the Surgical List and empty the Anesthesia Clinic?")) {
      setDirty(true);
      setLocalPatient(prev => {
        const programs = { ...prev.programs };
        
        let surgConsent = '';
        if (anes.consentSigned === 'done') surgConsent = 'yes';
        else if (anes.consentSigned === 'refused') surgConsent = 'no';

        let surgLabs = '';
        if (anes.labsOk === 'done') surgLabs = 'yes';
        else if (anes.labsOk === 'abnormal') surgLabs = 'no';

        let surgDest = '';
        if (anes.postDest === 'ward') surgDest = 'ward';
        else if (anes.postDest === 'picu') surgDest = 'icu';
        else if (anes.postDest === 'day_case') surgDest = 'day_case';

        const surg = programs.surg || { enrolled: true };
        programs.surg = {
          ...surg,
          enrolled: true,
          opName: anes.reqOpName || '',
          fitDate: assessmentDate,
          consent: surgConsent,
          postDest: surgDest,
          labsOk: surgLabs,
          scheduledDate: surg.scheduledDate || '',
          urgency: surg.urgency || 'none'
        };

        programs.anes = {
          enrolled: false,
          reqOpName: '',
          assessmentStatus: 'pending',
          assessmentDate: '',
          unfitReason: '',
          consentSigned: 'pending',
          postDest: 'pending',
          labsOk: 'pending',
          cardiacClear: 'pending',
          rbcUnits: '', rbcStatus: 'not_needed',
          ffpUnits: '', ffpStatus: 'not_needed',
          cryoUnits: '', cryoStatus: 'not_needed',
          fwbUnits: '', fwbStatus: 'not_needed',
          pltUnits: '', pltStatus: 'not_needed',
          overallBloodReady: 'not_needed'
        };

        setEnrolledClinics(prevClinics => ({
          ...prevClinics,
          anes: false,
          surg: true
        }));

        DEPARTMENTS.forEach(dept => {
          if (dept.code === 'anes' || dept.code === 'surg') return;
          const prog = programs[dept.code];
          if (prog?.enrolled) {
            programs[dept.code] = {
              ...prog,
              anesFeedback: '✓ FIT FOR OR',
              approvedDate: assessmentDate,
              postDest: anes.postDest || 'pending',
              labsOk: anes.labsOk || 'pending',
              consent: anes.consentSigned === 'done' ? 'signed' : anes.consentSigned === 'refused' ? 'refused' : 'pending',
              blood: anes.overallBloodReady || 'pending'
            };
          }
        });

        return {
          ...prev,
          programs
        };
      });

      alert("Patient is FIT and successfully transferred to the Surgical List. Please save the record to apply changes.");
      setActiveAccordion('surg');
    }
  };

  const rejectFromAnesthesia = () => {
    const anes: Record<string, any> = localPatient.programs?.anes || {};
    const reason = anes.unfitReason?.trim();
    if (!reason) {
      alert("Action Blocked: You must provide a clear reason for the Unfit status before returning the patient to the surgeon.");
      return;
    }

    if (window.confirm("Are you sure you want to reject this patient?\n\nThis will un-enroll them from Anesthesia, cancel the surgeon's Operation Request, and log the rejection to their medical history.")) {
      setDirty(true);
      setLocalPatient(prev => {
        const programs = { ...prev.programs };
        
        programs.anes = {
          enrolled: false,
          reqOpName: '',
          assessmentStatus: 'pending',
          assessmentDate: '',
          unfitReason: '',
          consentSigned: 'pending',
          postDest: 'pending',
          labsOk: 'pending',
          cardiacClear: 'pending',
          rbcUnits: '', rbcStatus: 'not_needed',
          ffpUnits: '', ffpStatus: 'not_needed',
          cryoUnits: '', cryoStatus: 'not_needed',
          fwbUnits: '', fwbStatus: 'not_needed',
          pltUnits: '', pltStatus: 'not_needed',
          overallBloodReady: 'not_needed'
        };
        
        setEnrolledClinics(prevClinics => ({
          ...prevClinics,
          anes: false
        }));

        DEPARTMENTS.forEach(dept => {
          if (dept.code === 'anes' || dept.code === 'surg') return;
          const pfx = dept.pfx || dept.code;
          const prog = programs[dept.code];
          if (prog?.enrolled) {
            programs[dept.code] = {
              ...prog,
              [`${pfx}OpReqAlarmActive`]: false,
              [`${pfx}OpReqAlarmDate`]: '',
              [`${pfx}OpReqAlarmNote`]: '',
              [`${pfx}OpReqPriority`]: 'red',
              anesFeedback: '✗ UNFIT: ' + reason,
              approvedDate: ''
            };
          }
        });

        const todayStr = getLocalDateString();
        const logEntry = `[${todayStr}] ❌ Rejected by Anesthesia Clinic. Reason: ${reason}`;
        const newSocial = prev.bas_social ? prev.bas_social + '\n' + logEntry : logEntry;

        return {
          ...prev,
          bas_social: newSocial,
          programs
        };
      });

      alert("Patient rejected and returned to the surgical department. Please save the record to apply changes.");
      setEditingPatientId(null);
    }
  };

  // 5. Back Button Warning Check
  const handleBack = () => {
    if (dirty) {
      setShowDirtyWarning(true);
    } else {
      setEditingPatientId(null);
    }
  };

  const confirmBackWithoutSave = () => {
    setDirty(false);
    setShowDirtyWarning(false);
    setEditingPatientId(null);
  };

  // 6. Delete Action
  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (localPatient.id) {
      archivePatient(localPatient.id);
    }
    setShowDeleteConfirm(false);
    setEditingPatientId(null);
  };

  // 7. Dynamic presets for dates (+1 week, +1 month)
  const setDatePreset = (targetId: string, weeks: number, months: number) => {
    setDirty(true);
    const d = new Date();
    if (weeks) d.setDate(d.getDate() + weeks * 7);
    if (months) d.setMonth(d.getMonth() + months);
    const dateStr = d.toISOString().split('T')[0];

    // Find input element in DOM
    const el = document.getElementById(targetId) as HTMLInputElement;
    if (el) {
      el.value = dateStr;
      
      // Trigger change update manually by writing to state
      const alarmMatch = targetId.match(/^(\w+)(AlarmDate)$/);
      if (alarmMatch) {
        const prefix = alarmMatch[1];
        const dept = DEPARTMENTS.find(d => prefix.startsWith(d.pfx || d.code) || prefix === 'anesPreop');
        if (dept) {
          setLocalPatient(prev => {
            const prog = prev.programs?.[dept.code] || { enrolled: true };
            return {
              ...prev,
              programs: {
                ...prev.programs,
                [dept.code]: { ...prog, [`${prefix}AlarmDate`]: dateStr }
              }
            };
          });
        } else if (prefix === 'basSoc') {
          setLocalPatient(prev => ({ ...prev, basSocAlarmDate: dateStr }));
        }
      } else if (targetId.startsWith('surg_')) {
        const field = targetId.slice(5);
        setLocalPatient(prev => {
          const surg = prev.programs?.surg || { enrolled: true };
          return {
            ...prev,
            programs: {
              ...prev.programs,
              surg: { ...surg, [field]: dateStr }
            }
          };
        });
      }
    }
  };

  // Helper: Append standard procedures
  const appendProcedure = (pfx: string, text: string) => {
    setDirty(true);
    const opEl = document.getElementById(`${pfx}_opName`) as HTMLInputElement;
    if (opEl) {
      const current = opEl.value;
      const separator = current ? ' + ' : '';
      const newVal = current + separator + text;
      opEl.value = newVal;

      // Update state
      if (pfx === 'surg') {
        setLocalPatient(prev => {
          const surg = prev.programs?.surg || { enrolled: true };
          return { ...prev, programs: { ...prev.programs, surg: { ...surg, opName: newVal } } };
        });
      } else {
        const dept = DEPARTMENTS.find(d => (d.pfx || d.code) === pfx);
        if (dept) {
          setLocalPatient(prev => {
            const prog = prev.programs?.[dept.code] || { enrolled: true };
            return { ...prev, programs: { ...prev.programs, [dept.code]: { ...prog, opName: newVal } } };
          });
        }
      }
    }
  };

  const clearProcedure = (pfx: string) => {
    setDirty(true);
    const opEl = document.getElementById(`${pfx}_opName`) as HTMLInputElement;
    if (opEl) {
      opEl.value = '';
      if (pfx === 'surg') {
        setLocalPatient(prev => {
          const surg = prev.programs?.surg || { enrolled: true };
          return { ...prev, programs: { ...prev.programs, surg: { ...surg, opName: '' } } };
        });
      } else {
        const dept = DEPARTMENTS.find(d => (d.pfx || d.code) === pfx);
        if (dept) {
          setLocalPatient(prev => {
            const prog = prev.programs?.[dept.code] || { enrolled: true };
            return { ...prev, programs: { ...prev.programs, [dept.code]: { ...prog, opName: '' } } };
          });
        }
      }
    }
  };

  // Alarm block renderer helper
  const renderAlarmBlock = (ap: string, suffixLabel: string, deptCode: string) => {
    const prog: Record<string, any> = localPatient.programs?.[deptCode] || {};
    const pat: Record<string, any> = localPatient as Record<string, any>;
    const isActive = !!(prog[`${ap}AlarmActive`] || pat[`${ap}AlarmActive`]);
    const alarmDate = prog[`${ap}AlarmDate`] || pat[`${ap}AlarmDate`] || '';
    const alarmNote = prog[`${ap}AlarmNote`] || pat[`${ap}AlarmNote`] || '';
    const priority = prog[`${ap}Priority`] || pat[`${ap}Priority`] || 'red';

    return (
      <div className="alarm-wrapper" key={ap}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '.5rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            id={`${ap}AlarmActive`} 
            checked={isActive}
            onChange={() => {}} // handled by handleFormChange via event delegation
          />
          <strong>Enable Alarm ({suffixLabel})</strong>
        </label>
        
        {isActive && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
            <div className="form-grid">
              <div>
                <label>Alarm Target Date</label>
                <input 
                  type="date" 
                  id={`${ap}AlarmDate`} 
                  value={alarmDate}
                  onChange={() => {}}
                />
                <div style={{ display: 'flex', gap: '.25rem', marginTop: '.5rem' }}>
                  <button type="button" className="btn-preset" onClick={() => setDatePreset(`${ap}AlarmDate`, 1, 0)}>+1w</button>
                  <button type="button" className="btn-preset" onClick={() => setDatePreset(`${ap}AlarmDate`, 0, 1)}>+1m</button>
                </div>
              </div>
              <div>
                <label>Alarm Note / Reason</label>
                <input 
                  type="text" 
                  id={`${ap}AlarmNote`} 
                  placeholder="Note / Reason..."
                  value={alarmNote}
                  onChange={() => {}}
                />
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                  <label style={{ color: '#C0392B', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="radio" name={`${ap}Priority`} value="red" checked={priority === 'red'} onChange={() => {}} /> Urgent
                  </label>
                  <label style={{ color: '#F1C40F', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="radio" name={`${ap}Priority`} value="yellow" checked={priority === 'yellow'} onChange={() => {}} /> Important
                  </label>
                  <label style={{ color: '#3498DB', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input type="radio" name={`${ap}Priority`} value="blue" checked={priority === 'blue'} onChange={() => {}} /> Routine
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container fade-in">
      {/* ── Form Actions Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isNew && (
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
              Archive Patient
            </button>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save Record
          </button>
        </div>
      </div>

      <form ref={formRef} id="masterForm" onChange={handleFormChange} onSubmit={handleSave}>
        {/* ── Enrollment Toggle Panel ── */}
        <div className="enrollment-panel" style={{ borderRadius: '16px', marginBottom: 24 }}>
          <div className="enrollment-header">Department Clinic Enrollments</div>
          <div className="enrollment-grid">
            {DEPARTMENTS.map(dept => {
              const enrolled = !!enrolledClinics[dept.code];
              const activeClass = enrolled ? `active-${dept.code}` : '';
              return (
                <label 
                  key={dept.code} 
                  className={`enroll-toggle ${activeClass}`}
                  style={{ borderLeft: enrolled ? `4px solid ${dept.color}` : '1px solid rgba(255,255,255,0.08)' }}
                >
                  <input 
                    type="checkbox" 
                    id={`enr_${dept.code}`}
                    checked={enrolled}
                    onChange={(e) => handleEnrollmentToggle(dept.code, e.target.checked)}
                  />
                  {dept.label}
                </label>
              );
            })}
          </div>
        </div>

        {/* ── Accordion Panels ── */}
        <div className="master-form">
          {/* ============================================================== */}
          {/* 1. Demographics Panel */}
          {/* ============================================================== */}
          <div className={`program-block ${activeAccordion === 'demographics' ? 'active' : ''}`}>
            <div 
              className="program-block-header" 
              style={{ backgroundColor: 'var(--nav-bg)' }}
              onClick={() => setActiveAccordion(activeAccordion === 'demographics' ? '' : 'demographics')}
            >
              <span>1. General Patient Demographics</span>
              {activeAccordion === 'demographics' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            
            {activeAccordion === 'demographics' && (
              <div className="program-block-content">
                <div className="form-grid three">
                  <div className="form-group">
                    <label>Medical Record Number (MRN) *</label>
                    <input 
                      type="text" 
                      id="bas_mrn" 
                      required 
                      placeholder="e.g. 2026-9041"
                      value={localPatient.bas_mrn || ''}
                      onChange={() => {}} // bound in onChange wrapper
                    />
                  </div>
                  <div className="form-group">
                    <label>Full Patient Name *</label>
                    <input 
                      type="text" 
                      id="bas_name" 
                      required 
                      placeholder="First Middle Lastname"
                      value={localPatient.bas_name || ''}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Gender *</label>
                    <select 
                      id="bas_gender" 
                      required 
                      value={localPatient.bas_gender || ''}
                      onChange={() => {}}
                    >
                      <option value="" disabled>Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid three">
                  <div className="form-group">
                    <label>Date of Birth (DOB) *</label>
                    <input 
                      type="date" 
                      id="bas_dob" 
                      required
                      value={localPatient.bas_dob || ''}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Calculated Age</label>
                    <input 
                      type="text" 
                      id="bas_age" 
                      readOnly 
                      value={localPatient.bas_age || 'Unknown'}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone / Contact Number</label>
                    <input 
                      type="tel" 
                      id="bas_phone" 
                      placeholder="+20 100 000 0000"
                      value={localPatient.bas_phone || ''}
                      onChange={() => {}}
                    />
                  </div>
                </div>

                <div className="form-grid three">
                  <div className="form-group">
                    <label>Governorate (Location)</label>
                    <select 
                      id="bas_gov"
                      value={localPatient.bas_gov || ''}
                      onChange={() => {}}
                    >
                      <option value="">Select Governorate</option>
                      <option value="Alexandria">Alexandria</option>
                      <option value="Cairo">Cairo</option>
                      <option value="Giza">Giza</option>
                      <option value="Beheira">Beheira</option>
                      <option value="Luxor">Luxor</option>
                      <option value="Aswan">Aswan</option>
                      <option value="Other">Other / International</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Blood Group</label>
                    <select 
                      id="bas_blood"
                      value={localPatient.bas_blood || ''}
                      onChange={() => {}}
                    >
                      <option value="">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Join Request Date</label>
                    <input 
                      type="date" 
                      id="bas_joinRequestDate"
                      value={localPatient.bas_joinRequestDate || ''}
                      onChange={() => {}}
                    />
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Motor / Mobility Status</label>
                    <div className="radio-group">
                      <label className="radio-item">
                        <input 
                          type="radio" 
                          name="bas_motorProblem" 
                          value="no" 
                          checked={localPatient.bas_motorProblem === 'no'}
                          onChange={() => {}}
                        /> Normal Mobility
                      </label>
                      <label className="radio-item">
                        <input 
                          type="radio" 
                          name="bas_motorProblem" 
                          value="yes" 
                          checked={localPatient.bas_motorProblem === 'yes'}
                          onChange={() => {}}
                        /> Impaired Mobility (Motor Issue)
                      </label>
                    </div>
                    {localPatient.bas_motorProblem === 'yes' && (
                      <input 
                        type="text" 
                        id="bas_motorProblemDetail" 
                        placeholder="Specify motor details (e.g. wheelchair, limp, palsy)..."
                        value={localPatient.bas_motorProblemDetail || ''}
                        onChange={() => {}}
                        style={{ marginTop: 8 }}
                      />
                    )}
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label>Medical History Comments</label>
                    <textarea 
                      id="bas_history" 
                      placeholder="Add clinical context, previous surgeries, comorbidities..."
                      value={localPatient.bas_history || ''}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="form-group">
                    <label>Social Coordinator Notes</label>
                    <textarea 
                      id="bas_social" 
                      placeholder="Financial issues, charity sponsorships, travel accommodations..."
                      value={localPatient.bas_social || ''}
                      onChange={() => {}}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Acceptance Cause / Referral Reason</label>
                  <input 
                    type="text" 
                    id="bas_acceptanceCause" 
                    placeholder="e.g. Charity orthopedic program sponsor"
                    value={localPatient.bas_acceptanceCause || ''}
                    onChange={() => {}}
                  />
                </div>

                {/* Social Alarm inside Demographics */}
                <div style={{ marginTop: 20 }}>
                  {renderAlarmBlock('basSoc', 'Demographics / Social Followup', 'hub')}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 2. Specialized Clinic Accordions (Dynamic HTML insertion) */}
          {/* ============================================================== */}
          {DEPARTMENTS.filter(d => d.code !== 'anes').map(dept => {
            const isEnrolled = !!enrolledClinics[dept.code];
            if (!isEnrolled) return null;

            const pfx = dept.pfx || dept.code;
            const autoBlockers = getAutoBlockers(localPatient as Patient, dept);

            return (
              <div 
                key={dept.code} 
                className={`program-block ${activeAccordion === dept.code ? 'active' : ''}`}
                id={`block_${dept.code}`}
              >
                <div 
                  className="program-block-header" 
                  style={{ backgroundColor: dept.color }}
                  onClick={() => setActiveAccordion(activeAccordion === dept.code ? '' : dept.code)}
                >
                  <span>{dept.label} Operations Panel</span>
                  {activeAccordion === dept.code ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>

                {activeAccordion === dept.code && (
                  <div className="program-block-content">
                    
                    {/* Custom HTML Form Injected from departmentsData */}
                    {dept.customForm && (
                      <div 
                        dangerouslySetInnerHTML={{ __html: dept.customForm }} 
                        style={{ marginBottom: 20 }}
                      />
                    )}

                    {/* Standard Department Alarms */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                      <h4 style={{ fontSize: 13, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                        Coordinator Action Alarms
                      </h4>
                      {renderAlarmBlock(`${pfx}OpReq`, 'Decision for Surgery / Booking', dept.code)}
                      {renderAlarmBlock(`${pfx}Follow`, 'Follow-up Task Reminder', dept.code)}
                      {dept.code === 'sbif' && renderAlarmBlock('sbifNeuro', 'Neuro-Urology Clinic Alarm', dept.code)}
                      {dept.code === 'livt' && renderAlarmBlock('livtPrep', 'Pre-transplant Prep Alarm', dept.code)}
                    </div>

                    {/* Checklist Gates Section */}
                    {dept.customGates && (
                      <div className="gate-block">
                        <h5>✓ Clinical Gatekeeper Checklist</h5>
                        <div 
                          dangerouslySetInnerHTML={{ __html: dept.customGates }}
                        />
                      </div>
                    )}

                    {/* Manual Blocker Switches */}
                    <div className="gate-block" style={{ background: '#f8fafc', borderLeft: '3px solid #64748b' }}>
                      <h5 style={{ color: '#475569' }}>⚠️ Manual Administrative Blockers</h5>
                      <div className="form-grid">
                        {[1, 2, 3].map(i => {
                          const blkActive = !!(localPatient.programs?.[dept.code]?.[`${pfx}Blk${i}AlarmActive`]);
                          const blkNote = localPatient.programs?.[dept.code]?.[`${pfx}Blk${i}AlarmNote`] || '';
                          return (
                            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  id={`${pfx}Blk${i}AlarmActive`}
                                  checked={blkActive}
                                  onChange={() => {}}
                                />
                                <strong>Enable Blocker #{i}</strong>
                              </label>
                              {blkActive && (
                                <input 
                                  type="text" 
                                  id={`${pfx}Blk${i}AlarmNote`} 
                                  placeholder="Reason for blocker (e.g. pending MRI report)..."
                                  value={blkNote}
                                  onChange={() => {}}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Blockers Live View */}
                    <div style={{
                      marginTop: 20,
                      padding: 16,
                      borderRadius: 8,
                      background: autoBlockers.length > 0 ? '#fef2f2' : '#f0fdf4',
                      border: autoBlockers.length > 0 ? '1px solid #fca5a5' : '1px solid #bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      {autoBlockers.length > 0 ? (
                        <>
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          <div>
                            <div style={{ fontWeight: 700, color: '#991b1b', fontSize: 13 }}>Live Blocker Warnings ({autoBlockers.length})</div>
                            <div style={{ color: '#b91c1c', fontSize: 12, marginTop: 4 }}>
                              {autoBlockers.join(' | ')}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <div style={{ fontWeight: 700, color: '#065f46', fontSize: 13 }}>
                            All checklist gates cleared. Ready for surgery scheduling.
                          </div>
                        </>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}

          {/* ============================================================== */}
          {/* 3. Anesthesia Program Accordion (Fit/Unfit, blood requirements) */}
          {/* ============================================================== */}
          {enrolledClinics.anes && (
            <div 
              className={`program-block ${activeAccordion === 'anes' ? 'active' : ''}`}
              id="block_anes"
            >
              <div 
                className="program-block-header" 
                style={{ backgroundColor: 'var(--color-anes)' }}
                onClick={() => setActiveAccordion(activeAccordion === 'anes' ? '' : 'anes')}
              >
                <span>Anesthesia Pre-op Fitness Panel</span>
                {activeAccordion === 'anes' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {activeAccordion === 'anes' && (
                <div className="program-block-content">
                  <div className="form-group">
                    <label>Requested Operation / Surgical Procedure</label>
                    <input 
                      type="text" 
                      id="anes_reqOpName"
                      placeholder="Type operation name or append below..."
                      value={localPatient.programs?.anes?.reqOpName || ''}
                      onChange={() => {}}
                    />
                  </div>

                  <div className="form-grid three">
                    <div className="form-group">
                      <label>Anesthesia Fitness Status</label>
                      <select 
                        id="anes_assessmentStatus"
                        value={localPatient.programs?.anes?.assessmentStatus || 'pending'}
                        onChange={() => {}}
                      >
                        <option value="pending">Pending Review</option>
                        <option value="fit">Fit for Surgery</option>
                        <option value="unfit">Unfit (Rejected)</option>
                        <option value="postponed">Postponed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Fitness Decision Date</label>
                      <input 
                        type="date" 
                        id="anes_assessmentDate"
                        value={localPatient.programs?.anes?.assessmentDate || ''}
                        onChange={() => {}}
                      />
                    </div>
                    <div className="form-group">
                      <label>Signed Informed Consent</label>
                      <select 
                        id="anes_consentSigned"
                        value={localPatient.programs?.anes?.consentSigned || 'pending'}
                        onChange={() => {}}
                      >
                        <option value="pending">Awaiting / Missing</option>
                        <option value="done">Done / Signed</option>
                        <option value="refused">Patient Refused</option>
                      </select>
                    </div>
                  </div>

                  {localPatient.programs?.anes?.assessmentStatus === 'unfit' && (
                    <div className="form-group" style={{ padding: 12, background: '#fef2f2', borderLeft: '3px solid var(--danger)', borderRadius: 6 }}>
                      <label style={{ color: 'var(--danger)' }}>Clinical Cause for Rejection (Unfit Reason) *</label>
                      <input 
                        type="text" 
                        id="anes_unfitReason" 
                        placeholder="e.g. Severe chest infection, high cardiac risks..."
                        value={localPatient.programs?.anes?.unfitReason || ''}
                        onChange={() => {}}
                        required
                      />
                    </div>
                  )}

                  {localPatient.programs?.anes?.assessmentStatus === 'fit' && (
                    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-primary" 
                        onClick={transferToSurgicalList}
                        style={{ width: '100%', background: '#27AE60', borderColor: '#27AE60', fontSize: '1rem', padding: '0.75rem' }}
                      >
                        ✅ Confirm Fitness & Transfer to Surgical List
                      </button>
                    </div>
                  )}

                  {localPatient.programs?.anes?.assessmentStatus === 'unfit' && (
                    <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                      <button 
                        type="button" 
                        className="btn btn-danger" 
                        onClick={rejectFromAnesthesia}
                        style={{ width: '100%', fontSize: '1rem', padding: '0.75rem' }}
                      >
                        ❌ Reject & Return Patient to Surgeon
                      </button>
                    </div>
                  )}

                  <div className="form-grid three">
                    <div className="form-group">
                      <label>Labs Assessment</label>
                      <select 
                        id="anes_labsOk"
                        value={localPatient.programs?.anes?.labsOk || 'pending'}
                        onChange={() => {}}
                      >
                        <option value="pending">Pending</option>
                        <option value="done">Normal / Ok</option>
                        <option value="abnormal">Abnormal (Review required)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Cardiac Clearance</label>
                      <select 
                        id="anes_cardiacClear"
                        value={localPatient.programs?.anes?.cardiacClear || 'pending'}
                        onChange={() => {}}
                      >
                        <option value="pending">Pending Clear</option>
                        <option value="done">Cleared / Normal</option>
                        <option value="not_needed">Not needed</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Post-Op Destination</label>
                      <select 
                        id="anes_postDest"
                        value={localPatient.programs?.anes?.postDest || 'pending'}
                        onChange={() => {}}
                      >
                        <option value="pending">Pending Choice</option>
                        <option value="ward">Ward</option>
                        <option value="picu">PICU / ICU</option>
                        <option value="day_case">Day Case (Outpatient)</option>
                      </select>
                    </div>
                  </div>

                  {/* Blood bank crossmatch requirements */}
                  <div className="gate-block" style={{ background: '#f1f5f9' }}>
                    <h5 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>🩸 Blood Bank Crossmatch Status</span>
                      <select 
                        id="anes_overallBloodReady" 
                        style={{ width: 'auto', padding: '4px 28px 4px 10px', fontSize: 12 }}
                        value={localPatient.programs?.anes?.overallBloodReady || 'pending'}
                        onChange={() => {}}
                      >
                        <option value="not_needed">Not Needed</option>
                        <option value="pending">Pending Crossmatch</option>
                        <option value="ready">Physically Ready</option>
                      </select>
                    </h5>
                    
                    <div className="form-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                      {['rbc', 'ffp', 'cryo', 'fwb', 'plt'].map(bloodType => {
                        const units = localPatient.programs?.anes?.[`${bloodType}Units`] || '';
                        const status = localPatient.programs?.anes?.[`${bloodType}Status`] || 'not_needed';
                        return (
                          <div key={bloodType} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <label style={{ fontSize: 10 }}>{bloodType.toUpperCase()}</label>
                            <input 
                              type="number" 
                              id={`anes_${bloodType}Units`} 
                              placeholder="Units" 
                              style={{ padding: 6, fontSize: 12 }}
                              value={units}
                              onChange={() => {}}
                            />
                            <select 
                              id={`anes_${bloodType}Status`} 
                              style={{ padding: 6, fontSize: 11 }}
                              value={status}
                              onChange={() => {}}
                            >
                              <option value="not_needed">None</option>
                              <option value="pending">Pending</option>
                              <option value="crossmatched">Crossmatched</option>
                              <option value="ready">Ready</option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Anesthesia Followup Alarm */}
                  <div style={{ marginTop: 20 }}>
                    {renderAlarmBlock('anesPreop', 'Anesthesia Fitness / Pre-op Followup', 'anes')}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. Surgery Booking Accordion (Schedules, urgency) */}
          {/* ============================================================== */}
          {enrolledClinics.surg && (
            <div 
              className={`program-block ${activeAccordion === 'surg' ? 'active' : ''}`}
              id="block_surg"
            >
              <div 
                className="program-block-header" 
                style={{ backgroundColor: 'var(--success)' }}
                onClick={() => setActiveAccordion(activeAccordion === 'surg' ? '' : 'surg')}
              >
                <span>Surgical List Booking Panel</span>
                {activeAccordion === 'surg' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {activeAccordion === 'surg' && (
                <div className="program-block-content">
                  
                  {/* Procedural String builder */}
                  <div className="form-group">
                    <label>Operating Room Procedure Name *</label>
                    <input 
                      type="text" 
                      id="surg_opName"
                      placeholder="Build procedural string below or type here..."
                      value={localPatient.programs?.surg?.opName || ''}
                      onChange={() => {}}
                      required
                    />
                    
                    <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {['Posterior Spinal Fusion', 'Adolescent Scoliosis Instrumentation', 'MMC Repair', 'Tethered Cord Release', 'Classic Bladder Closure', 'Pelvic Osteotomy', 'Hypospadias Repair', 'Cochlear Implant'].map(proc => (
                        <button 
                          key={proc}
                          type="button" 
                          className="btn-preset" 
                          onClick={() => appendProcedure('surg', proc)}
                        >
                          + {proc}
                        </button>
                      ))}
                      <button 
                        type="button" 
                        className="btn-preset" 
                        style={{ background: '#fecaca', border: '1px solid #fca5a5', color: '#b91c1c' }}
                        onClick={() => clearProcedure('surg')}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="form-grid three">
                    <div className="form-group">
                      <label>Operation Schedule Date</label>
                      <input 
                        type="date" 
                        id="surg_scheduledDate"
                        value={localPatient.programs?.surg?.scheduledDate || ''}
                        onChange={() => {}}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Surgical Urgency Classification</label>
                      <select 
                        id="surg_urgency"
                        value={localPatient.programs?.surg?.urgency || 'none'}
                        onChange={() => {}}
                      >
                        <option value="none">Not Scheduled / None</option>
                        <option value="emergency">Emergency / Salvage</option>
                        <option value="urgent">Urgent</option>
                        <option value="semi_urgent">Semi-Urgent</option>
                        <option value="elective">Elective</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Anesthesia Assessment Reference Date</label>
                      <input 
                        type="date" 
                        id="surg_fitDate"
                        value={localPatient.programs?.surg?.fitDate || ''}
                        onChange={() => {}}
                      />
                    </div>
                  </div>

                  <div className="form-grid three">
                    <div className="form-group">
                      <label>Surgical Informed Consent</label>
                      <select 
                        id="surg_consent"
                        value={localPatient.programs?.surg?.consent || ''}
                        onChange={() => {}}
                      >
                        <option value="">Awaiting</option>
                        <option value="yes">Signed & Verified (Yes)</option>
                        <option value="no">Refused / Problem (No)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Special ICU / Ward Booking</label>
                      <select 
                        id="surg_postDest"
                        value={localPatient.programs?.surg?.postDest || ''}
                        onChange={() => {}}
                      >
                        <option value="">Select Destination</option>
                        <option value="ward">Ward Bed</option>
                        <option value="icu">PICU / ICU Bed</option>
                        <option value="day_case">Outpatient Daycase</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Pre-op Lab Clearances</label>
                      <select 
                        id="surg_labsOk"
                        value={localPatient.programs?.surg?.labsOk || ''}
                        onChange={() => {}}
                      >
                        <option value="">Awaiting Results</option>
                        <option value="yes">Normal / Ready (Yes)</option>
                        <option value="no">Abnormal findings (No)</option>
                      </select>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 5. Dynamic Research Study Data Entry Fields */}
          {/* ============================================================== */}
          {Object.keys(researchTemplates).length > 0 && (
            <div className={`program-block ${activeAccordion === 'research_studies' ? 'active' : ''}`}>
              <div 
                className="program-block-header" 
                style={{ backgroundColor: 'var(--accent)' }}
                onClick={() => setActiveAccordion(activeAccordion === 'research_studies' ? '' : 'research_studies')}
              >
                <span>Research Studies Data Entry</span>
                {activeAccordion === 'research_studies' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>

              {activeAccordion === 'research_studies' && (
                <div className="program-block-content">
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
                    Associate this patient record with research studies and enter data points.
                  </p>
                  
                  {Object.values(researchTemplates).map(study => {
                    const enrolledInStudy = !!(localPatient.research?.[study.id]);
                    return (
                      <div key={study.id} style={{
                        padding: 16,
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        marginBottom: 16,
                        background: enrolledInStudy ? '#f8fafc' : 'white'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <h4 style={{ color: 'var(--text-primary)', fontSize: 14 }}>{study.title}</h4>
                          <button 
                            type="button" 
                            className={`btn btn-sm ${enrolledInStudy ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => {
                              setDirty(true);
                              setLocalPatient(prev => {
                                const research = { ...prev.research };
                                if (enrolledInStudy) {
                                  delete research[study.id];
                                } else {
                                  research[study.id] = {};
                                }
                                return { ...prev, research };
                              });
                            }}
                          >
                            {enrolledInStudy ? 'Remove from Study' : 'Enroll in Study'}
                          </button>
                        </div>

                        {enrolledInStudy && (
                          <div className="form-grid">
                            {study.fields.map(field => {
                              const studyVal = localPatient.research?.[study.id]?.[field.name] || '';
                              return (
                                <div className="form-group" key={field.name} style={{ marginBottom: 0 }}>
                                  <label>{field.name}</label>
                                  {field.type === 'select' ? (
                                    <select 
                                      value={studyVal}
                                      onChange={(e) => {
                                        setDirty(true);
                                        const val = e.target.value;
                                        setLocalPatient(prev => {
                                          const research = { ...prev.research };
                                          research[study.id] = {
                                            ...research[study.id],
                                            [field.name]: val
                                          };
                                          return { ...prev, research };
                                        });
                                      }}
                                    >
                                      <option value="">Select Option</option>
                                      {(Array.isArray(field.options) 
                                        ? field.options 
                                        : (typeof field.options === 'string' ? field.options.split(',') : [])
                                      ).map((opt: string) => (
                                        <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input 
                                      type={field.type === 'number' ? 'number' : 'text'}
                                      value={studyVal}
                                      onChange={(e) => {
                                        setDirty(true);
                                        const val = field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
                                        setLocalPatient(prev => {
                                          const research = { ...prev.research };
                                          research[study.id] = {
                                            ...research[study.id],
                                            [field.name]: val
                                          };
                                          return { ...prev, research };
                                        });
                                      }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </form>

      {/* ── Warning Dialogs (Dirty Form / Delete confirmations) ── */}
      {showDirtyWarning && (
        <div className="modal">
          <div className="modal-content">
            <h3 style={{ color: 'var(--warning)', marginBottom: 12 }}>Unsaved Changes</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              You have modified this patient file but have not saved. If you leave now, all your edits will be discarded.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowDirtyWarning(false)}>Stay Here</button>
              <button className="btn btn-danger" onClick={confirmBackWithoutSave}>Discard Edits</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal">
          <div className="modal-content">
            <h3 style={{ color: 'var(--danger)', marginBottom: 12 }}>Confirm Archival</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Are you sure you want to archive this patient file? They will be removed from all active operations lists. Their medical files can be restored later if they re-register.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Yes, Archive File</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
