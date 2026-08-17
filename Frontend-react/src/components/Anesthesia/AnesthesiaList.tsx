import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Patient } from '../../types';
import DEPARTMENTS from '../../utils/departmentsData';
import { Search, Heart, ShieldCheck, Save } from 'lucide-react';

export const AnesthesiaList: React.FC = () => {
  const { patients, savePatient, setEditingPatientId } = useApp();
  
  // State for search and filter selections
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [bloodFilter, setBloodFilter] = useState('all');
  const [fitnessFilter, setFitnessFilter] = useState('all');

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

  // Filter patients needing Pre-Op Fitness Clearance
  const anesPatients = patients.filter(p => {
    if (p.isArchived) return false;
    
    const anes = (p.programs?.anes || {}) as Record<string, any>;
    const surg = (p.programs?.surg || {}) as Record<string, any>;

    // Do not show completed surgeries in active pre-op fitness queue
    if (surg.stage === 'completed') return false;

    // Check if patient requires anesthesia clearance:
    // 1. Enrolled in Anesthesia Clinic, OR
    // 2. On Surgical List, OR
    // 3. Any active clinic has requested surgery / operation
    let requiresAnes = anes.enrolled && anes.status !== 'discharged';
    if (!requiresAnes && (surg.enrolled || surg.opName || surg.scheduledDate) && surg.status !== 'discharged') {
      requiresAnes = true;
    }
    if (!requiresAnes) {
      for (const d of DEPARTMENTS) {
        if (d.code === 'anes' || d.code === 'surg') continue;
        const prog = (p.programs?.[d.code] || {}) as Record<string, any>;
        const pfx = d.pfx || d.code;
        if (prog.enrolled && (prog[`${pfx}OpReqAlarmActive`] || prog.surgery_booking_active || prog.opName || prog.planned_operation)) {
          requiresAnes = true;
          break;
        }
      }
    }

    if (!requiresAnes) return false;

    // Search filter (Name or MRN)
    const matchesSearch = 
      p.bas_name.toLowerCase().includes(search.toLowerCase()) ||
      p.bas_mrn.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // Specialty surgical clinic filter
    if (deptFilter !== 'all') {
      if (!p.programs?.[deptFilter]?.enrolled) return false;
    }

    // Blood bank status filter
    if (bloodFilter !== 'all') {
      const status = anes.overallBloodReady;
      if (status !== bloodFilter) return false;
    }

    // Fitness status filter
    if (fitnessFilter !== 'all') {
      const status = anes.assessmentStatus || 'pending';
      if (status !== fitnessFilter) return false;
    }

    return true;
  });

  // Inline value editor helper
  const handleInlineEdit = (patient: Patient, path: string, value: any) => {
    const cloned = JSON.parse(JSON.stringify(patient));
    if (!cloned.programs) cloned.programs = {};
    if (!cloned.programs.anes) cloned.programs.anes = { enrolled: true };
    
    // Handle nested fields
    if (path.includes('.')) {
      const parts = path.split('.');
      let current = cloned;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      cloned.programs.anes[path] = value;
    }

    // Recalculate overall blood ready status if a blood bank status changed
    if (path.endsWith('Status')) {
      const products = ['rbc', 'ffp', 'cryo', 'fwb', 'plt'];
      let hasPending = false;
      let hasReady = false;
      let allNotNeeded = true;

      products.forEach(prod => {
        const val = cloned.programs.anes[`${prod}Status` || 'not_needed'];
        if (val && val !== 'not_needed') allNotNeeded = false;
        if (val === 'pending' || val === 'crossmatched') hasPending = true;
        if (val === 'ready') hasReady = true;
      });

      let overall = 'not_needed';
      if (hasPending) overall = 'pending';
      else if (hasReady) overall = 'ready';
      else if (allNotNeeded) overall = 'not_needed';

      cloned.programs.anes.overallBloodReady = overall;
    }

    // Save changes using AppContext
    savePatient(cloned);
  };

  const getPrimaryClinicLabel = (p: Patient) => {
    const clinics = DEPARTMENTS.filter(d => d.code !== 'anes' && p.programs?.[d.code]?.enrolled);
    if (clinics.length === 0) return 'No Surgical Clinic';
    return clinics.map(c => c.label).join(', ');
  };

  return (
    <div className="container fade-in">
      {/* ── Filters Bar ── */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 2 }}>
          <label>Search Anesthesia Patients</label>
          <div style={{ position: 'relative' }}>
            <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by Name or MRN number..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Surgical Specialty Clinic</label>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="all">All Clinics</option>
            {DEPARTMENTS.filter(d => d.code !== 'anes').map(d => (
              <option key={d.code} value={d.code}>{d.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Anesthetic Fitness</label>
          <select value={fitnessFilter} onChange={(e) => setFitnessFilter(e.target.value)}>
            <option value="all">All Fitness States</option>
            <option value="pending">Pending Fitness Assessment</option>
            <option value="fit">Cleared (Fit for Anesthesia)</option>
            <option value="unfit">Unfit (Rejected / Risks)</option>
            <option value="postponed">Postponed</option>
          </select>
        </div>

        <div className="form-group">
          <label>Blood Crossmatch</label>
          <select value={bloodFilter} onChange={(e) => setBloodFilter(e.target.value)}>
            <option value="all">All Crossmatches</option>
            <option value="ready">Physically Ready</option>
            <option value="pending">Pending Crossmatch</option>
            <option value="not_needed">None / Not Needed</option>
          </select>
        </div>
      </div>

      {/* ── Patients Roster List ── */}
      {anesPatients.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {anesPatients.map(patient => {
            const anes = (patient.programs?.anes || {}) as Record<string, any>;
            const fitStatus = anes.assessmentStatus || 'pending';
            
            let cardColor = 'var(--border)';
            if (fitStatus === 'fit') cardColor = 'var(--success)';
            else if (fitStatus === 'unfit') cardColor = 'var(--danger)';
            else if (fitStatus === 'postponed') cardColor = 'var(--warning)';

            return (
              <div 
                key={patient.id} 
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  border: '1px solid var(--border)',
                  borderLeft: `5px solid ${cardColor}`,
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 2fr 1fr',
                  gap: 20,
                  alignItems: 'start'
                }}
              >
                {/* 1. Patient Info Column */}
                <div>
                  <h3 
                    onClick={() => setEditingPatientId(patient.id)}
                    style={{ fontSize: 16, fontWeight: 700, cursor: 'pointer', color: 'var(--text-primary)' }}
                  >
                    {patient.bas_name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', marginTop: 4, gap: 8 }}>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{patient.bas_mrn}</span>
                    <span className={`blood-tag ${patient.bas_blood?.includes('-') ? 'blood-neg' : 'blood-pos'}`}>
                      {patient.bas_blood || 'O+'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, fontWeight: 500 }}>
                    Surgical Clinic: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{getPrimaryClinicLabel(patient)}</span>
                  </div>
                  {anes.reqOpName && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                      Op: {anes.reqOpName}
                    </div>
                  )}
                </div>

                {/* 2. Inline Anesthesia Checklist Column */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10 }}>Informed Consent</label>
                    <select 
                      value={anes.consentSigned || 'pending'} 
                      onChange={(e) => handleInlineEdit(patient, 'consentSigned', e.target.value)}
                      style={{ padding: '6px 10px', fontSize: 12 }}
                    >
                      <option value="pending">Awaiting</option>
                      <option value="done">Signed (Yes)</option>
                      <option value="refused">Refused</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10 }}>Cardiac Clearance</label>
                    <select 
                      value={anes.cardiacClear || 'pending'} 
                      onChange={(e) => handleInlineEdit(patient, 'cardiacClear', e.target.value)}
                      style={{ padding: '6px 10px', fontSize: 12 }}
                    >
                      <option value="pending">Pending</option>
                      <option value="done">Cleared (Normal)</option>
                      <option value="not_needed">Not Needed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10 }}>Labs Assessment</label>
                    <select 
                      value={anes.labsOk || 'pending'} 
                      onChange={(e) => handleInlineEdit(patient, 'labsOk', e.target.value)}
                      style={{ padding: '6px 10px', fontSize: 12 }}
                    >
                      <option value="pending">Pending</option>
                      <option value="done">Normal / Ok</option>
                      <option value="abnormal">Abnormal</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 10 }}>ICU / Post-Op Bed</label>
                    <select 
                      value={anes.postDest || 'pending'} 
                      onChange={(e) => handleInlineEdit(patient, 'postDest', e.target.value)}
                      style={{ padding: '6px 10px', fontSize: 12 }}
                    >
                      <option value="pending">Awaiting Choice</option>
                      <option value="ward">Ward Bed</option>
                      <option value="icu">PICU / ICU Bed</option>
                      <option value="day_case">Day Case</option>
                    </select>
                  </div>
                </div>

                {/* 3. Preop Fitness Evaluation & Blood Status */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10 }}>Anesthesia Clearance</label>
                    <select 
                      value={fitStatus} 
                      onChange={(e) => handleInlineEdit(patient, 'assessmentStatus', e.target.value)}
                      style={{
                        padding: '8px 10px',
                        fontSize: 13,
                        fontWeight: 700,
                        backgroundColor: fitStatus === 'fit' ? '#f0fdf4' : fitStatus === 'unfit' ? '#fef2f2' : 'white',
                        borderColor: fitStatus === 'fit' ? 'var(--success)' : fitStatus === 'unfit' ? 'var(--danger)' : 'var(--border-strong)',
                        color: fitStatus === 'fit' ? 'var(--success)' : fitStatus === 'unfit' ? 'var(--danger)' : 'var(--text-primary)'
                      }}
                    >
                      <option value="pending">Pending Assessment</option>
                      <option value="fit">Fit for Surgery</option>
                      <option value="unfit">Unfit (Rejected)</option>
                      <option value="postponed">Postponed</option>
                    </select>
                  </div>

                  {fitStatus === 'unfit' && (
                    <div style={{ fontSize: 11, color: 'var(--danger)', padding: '6px 8px', background: '#fef2f2', borderRadius: 6, border: '1px solid #fca5a5' }}>
                      <strong>Unfit Reason:</strong> {anes.unfitReason || 'Reason not specified.'}
                    </div>
                  )}

                  {/* Overall Blood bank badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    background: anes.overallBloodReady === 'ready' ? '#f0fdf4' : anes.overallBloodReady === 'pending' ? '#fffbeb' : '#f1f5f9',
                    border: `1px solid ${anes.overallBloodReady === 'ready' ? '#bbf7d0' : anes.overallBloodReady === 'pending' ? '#fde68a' : '#cbd5e1'}`,
                    color: anes.overallBloodReady === 'ready' ? 'var(--success)' : anes.overallBloodReady === 'pending' ? 'var(--warning)' : 'var(--text-secondary)'
                  }}>
                    <span style={{ fontSize: 14 }}>🩸</span>
                    <span>
                      {anes.overallBloodReady === 'ready' && 'Crossmatch: Ready'}
                      {anes.overallBloodReady === 'pending' && 'Crossmatch: Pending'}
                      {(!anes.overallBloodReady || anes.overallBloodReady === 'not_needed') && 'Blood Not Needed'}
                    </span>
                  </div>

                  {/* Explicit Save / Confirm Assessment Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSavePatient(patient);
                    }}
                    disabled={savingId === patient.id}
                    style={{
                      marginTop: 4,
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: 8,
                      border: 'none',
                      background: savedFeedback[patient.id] ? '#16a34a' : 'linear-gradient(135deg, #0f766e, #0d9488)',
                      color: '#ffffff',
                      cursor: savingId === patient.id ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(13, 148, 136, 0.25)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {savingId === patient.id ? (
                      <span>Saving to DB...</span>
                    ) : savedFeedback[patient.id] ? (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Saved in Database</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Confirm & Save</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
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
          <Heart className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3>No Anesthesia Pre-op Cases</h3>
          <p style={{ marginTop: 6, fontSize: 13 }}>There are no active patients scheduled for pre-op clearance.</p>
        </div>
      )}
    </div>
  );
};
