import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Patient } from '../../types';
import DEPARTMENTS from '../../utils/departmentsData';
import { getAutoBlockers, getLocalDateString } from '../../utils/clinicalRules';
import { Search, Calendar, ChevronDown, ChevronUp, AlertCircle, PlayCircle, ShieldCheck } from 'lucide-react';

export const SurgicalList: React.FC = () => {
  const { patients, savePatient, setEditingPatientId } = useApp();
  
  // State for search and filter selections
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  
  // Track open/collapsed state of date groups
  const [collapsedGroups, setCollapsedGroups] = useState<{ [date: string]: boolean }>({});

  const toggleGroup = (date: string) => {
    setCollapsedGroups(prev => ({ ...prev, [date]: !prev[date] }));
  };

  // Filter surgical patients
  const surgicalPatients = patients.filter(p => {
    if (p.isArchived) return false;
    
    // Check if enrolled in surgery
    const surg = p.programs?.surg;
    if (!surg?.enrolled) return false;

    // Search filter (Name or MRN)
    const matchesSearch = 
      p.bas_name.toLowerCase().includes(search.toLowerCase()) ||
      p.bas_mrn.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // Department filter
    if (deptFilter !== 'all') {
      if (!p.programs?.[deptFilter]?.enrolled) return false;
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      const urgency = surg.urgency || 'none';
      if (urgency !== urgencyFilter) return false;
    }

    return true;
  });

  // Group patients by scheduled date
  const groupedPatients: { [date: string]: Patient[] } = {};
  const unscheduledPatients: Patient[] = [];

  surgicalPatients.forEach(p => {
    const date = p.programs?.surg?.scheduledDate;
    if (date) {
      if (!groupedPatients[date]) {
        groupedPatients[date] = [];
      }
      groupedPatients[date].push(p);
    } else {
      unscheduledPatients.push(p);
    }
  });

  // Sort dates (closest/past dates first)
  const sortedDates = Object.keys(groupedPatients).sort();

  // Inline value editor helper
  const handleInlineEdit = (patient: Patient, field: string, value: any) => {
    const cloned = JSON.parse(JSON.stringify(patient));
    if (!cloned.programs) cloned.programs = {};
    if (!cloned.programs.surg) cloned.programs.surg = { enrolled: true };
    cloned.programs.surg[field] = value;
    savePatient(cloned);
  };

  const getPrimaryClinicLabel = (p: Patient) => {
    const clinics = DEPARTMENTS.filter(d => d.code !== 'anes' && p.programs?.[d.code]?.enrolled);
    if (clinics.length === 0) return 'No Specialty Clinic';
    return clinics.map(c => c.label).join(', ');
  };

  const getPrimaryClinicPrefix = (p: Patient): string => {
    const clinics = DEPARTMENTS.filter(d => d.code !== 'anes' && p.programs?.[d.code]?.enrolled);
    if (clinics.length === 0) return '';
    return clinics[0].pfx || clinics[0].code;
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

  const formatHeaderDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', options);
  };

  return (
    <div className="container fade-in">
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
            {DEPARTMENTS.filter(d => d.code !== 'anes').map(d => (
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

            return (
              <div key={date} className={`surg-group ${!isCollapsed ? 'open' : ''}`}>
                <div 
                  className="surg-group-header" 
                  style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)' }}
                  onClick={() => toggleGroup(date)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Calendar className="w-4 h-4 text-teal-400" />
                    <strong>{formatHeaderDate(date)}</strong>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>({datePatients.length} scheduled)</span>
                  </span>
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </div>

                {!isCollapsed && (
                  <div className="surg-group-content">
                    {datePatients.map(patient => {
                      const surg = patient.programs?.surg || {};
                      const blockers = getAllPatientBlockers(patient);
                      return (
                        <div key={patient.id} className="surg-row" onClick={() => setEditingPatientId(patient.id)}>
                          
                          {/* Col 1: Patient details */}
                          <div>
                            <div className="surg-row-title">{patient.bas_name}</div>
                            <div className="surg-row-sub">
                              <span>MRN: {patient.bas_mrn}</span>
                              <span style={{ marginLeft: 10 }}>Blood: {patient.bas_blood || 'Unknown'}</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
                              Clinic: {getPrimaryClinicLabel(patient)}
                            </div>
                          </div>

                          {/* Col 2: Procedure and gate blockers list */}
                          <div>
                            <div className="surg-row-title" style={{ color: 'var(--accent)' }}>
                              {surg.opName || 'No Procedure Assigned'}
                            </div>
                            {blockers.length > 0 ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="truncate" title={blockers.join(', ')}>
                                  Blockers: {blockers.join(', ')}
                                </span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--success)', fontSize: 11, fontWeight: 600 }}>
                                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>All checklist gates cleared. Ready for theater.</span>
                              </div>
                            )}
                          </div>

                          {/* Col 3: Urgency Classification */}
                          <div>
                            <span className={`surg-urgency urg-${surg.urgency || 'none'}`}>
                              {surg.urgency || 'none'}
                            </span>
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
          {unscheduledPatients.length > 0 && (
            <div className="surg-group open">
              <div 
                className="surg-group-header" 
                style={{ background: 'linear-gradient(135deg, #475569, #334155)' }}
                onClick={() => toggleGroup('tbd')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Calendar className="w-4 h-4 text-slate-300" />
                  <strong>Date to be Determined (TBD) / Unscheduled</strong>
                  <span style={{ fontSize: 12, opacity: 0.8 }}>({unscheduledPatients.length} cases)</span>
                </span>
                {collapsedGroups['tbd'] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </div>

              {!collapsedGroups['tbd'] && (
                <div className="surg-group-content">
                  {unscheduledPatients.map(patient => {
                    const surg = patient.programs?.surg || {};
                    const blockers = getAllPatientBlockers(patient);
                    return (
                      <div key={patient.id} className="surg-row" onClick={() => setEditingPatientId(patient.id)}>
                        <div>
                          <div className="surg-row-title">{patient.bas_name}</div>
                          <div className="surg-row-sub">
                            <span>MRN: {patient.bas_mrn}</span>
                            <span style={{ marginLeft: 10 }}>Blood: {patient.bas_blood || 'Unknown'}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600 }}>
                            Clinic: {getPrimaryClinicLabel(patient)}
                          </div>
                        </div>

                        <div>
                          <div className="surg-row-title" style={{ color: 'var(--accent)' }}>
                            {surg.opName || 'No Procedure Assigned'}
                          </div>
                          {blockers.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate" title={blockers.join(', ')}>
                                Blockers: {blockers.join(', ')}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: 'var(--success)', fontSize: 11, fontWeight: 600 }}>
                              <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>All checklist gates cleared. Ready to schedule.</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <span className={`surg-urgency urg-${surg.urgency || 'none'}`}>
                            {surg.urgency || 'none'}
                          </span>
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
          )}
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
          <h3>No Scheduled Procedures</h3>
          <p style={{ marginTop: 6, fontSize: 13 }}>Try adjusting filters or search query.</p>
        </div>
      )}
    </div>
  );
};
