import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from './StatCard';
import type { Patient } from '../../types';
import { fetchFilteredCasesApi } from '../../utils/api';
import { 
  Users, 
  AlertTriangle, 
  Clock, 
  Crown,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CalendarCheck,
  RotateCcw,
  Filter
} from 'lucide-react';
import { 
  getDynamicAge, 
  getVIPBadges, 
  isPatientStalled, 
  getPatientAlarms, 
  getHighestPriority 
} from '../../utils/clinicalRules';
import DEPARTMENTS from '../../utils/departmentsData';

export const GlobalDirectory: React.FC = () => {
  const {
    patients,
    currentModule,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterUrgency,
    setFilterUrgency,
    filterPurpose,
    setFilterPurpose,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setEditingPatientId,
  } = useApp();

  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Pagination helpers (derived from filtered patients)
  const totalItems = filteredPatients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIdx, startIdx + itemsPerPage);
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('surgery_asc');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [applyCounter, setApplyCounter] = useState<number>(0);

  // Sync deptFilter with currentModule if user clicks a clinical program in the sidebar
  useEffect(() => {
    if (DEPARTMENTS.some(d => d.code === currentModule)) {
      setDeptFilter(currentModule);
    } else if (currentModule === 'hub') {
      setDeptFilter('all');
    }
  }, [currentModule]);

  const effectiveDept = DEPARTMENTS.some(d => d.code === currentModule) ? currentModule : deptFilter;

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setApplyCounter(prev => prev + 1);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterUrgency('all');
    setFilterPurpose('all');
    setDeptFilter('all');
    setSortBy('surgery_asc');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    setApplyCounter(prev => prev + 1);
  };

  const getCardAccentGradient = (alarms: any[], isStalled: boolean) => {
    if (isStalled) return '#ef4444';
    if (!alarms || alarms.length === 0) return '#0f766e';
    
    const uniquePriorities = Array.from(new Set(alarms.map(a => a.priority)));
    if (uniquePriorities.length === 1) {
      const p = uniquePriorities[0];
      return p === 'red' ? '#ef4444' : p === 'yellow' ? '#f59e0b' : '#3b82f6';
    }
    
    const colorMap: Record<string, string> = {
      red: '#ef4444',
      yellow: '#f59e0b',
      blue: '#3b82f6'
    };
    const stops = uniquePriorities.map(p => colorMap[p] || '#0f766e').join(', ');
    return `linear-gradient(90deg, ${stops})`;
  };

  const getPatientSurgeryTimestamp = (p: Patient): number => {
    const dates: number[] = [];
    if (p.programs) {
      Object.values(p.programs).forEach((prog: any) => {
        const dStr = prog.scheduledDate || prog.surgeryBookingDate || prog.reqTargetDate || prog.visit;
        if (dStr) {
          const t = new Date(dStr).getTime();
          if (!isNaN(t)) dates.push(t);
        }
      });
    }
    return dates.length > 0 ? Math.min(...dates) : Infinity;
  };

  const getPatientDobTimestamp = (p: Patient): number => {
    if (p.bas_dob) {
      const t = new Date(p.bas_dob).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  // Fetch cases and apply local/clinical rules filtering and sorting
  useEffect(() => {
    const query: Record<string, string | undefined> = { 
      sort_by: sortBy,
      department_code: effectiveDept !== 'all' ? effectiveDept : undefined
    };
    if (searchQuery) query.search = searchQuery;
    if (dateFrom) query.date_from = dateFrom;
    if (dateTo) query.date_to = dateTo;

    fetchFilteredCasesApi(query)
      .then(fetchedCases => {
        let result = [...fetchedCases];

        // 1. Filter Specialty / Department
        if (effectiveDept && effectiveDept !== 'all') {
          result = result.filter(p => p.programs?.[effectiveDept]?.enrolled);
        }

        // 2. Coordinator Alarms
        if (filterStatus && filterStatus !== 'all') {
          if (filterStatus === 'stalled') {
            result = result.filter(p => isPatientStalled(p));
          } else if (filterStatus === 'vip') {
            result = result.filter(p => getVIPBadges(p).length > 0);
          } else if (['red', 'yellow', 'blue'].includes(filterStatus)) {
            result = result.filter(p => {
              const alarms = getPatientAlarms(p);
              return alarms.some(a => a.priority === filterStatus);
            });
          }
        }

        // 3. Surgical Urgency
        if (filterUrgency && filterUrgency !== 'all') {
          result = result.filter(p => {
            const hasSurgery = p.programs?.surg?.enrolled;
            if (filterUrgency === 'none') {
              return !hasSurgery;
            }
            if (!hasSurgery) return false;
            const surgPriority = p.programs?.surg?.surgPriority || p.programs?.surg?.priority || '';
            return surgPriority.toLowerCase() === filterUrgency.toLowerCase();
          });
        }

        // 4. Visit Purpose
        if (filterPurpose && filterPurpose !== 'all') {
          result = result.filter(p => {
            if (filterPurpose === 'op') {
              return !!p.programs?.surg?.enrolled;
            } else if (filterPurpose === 'followup') {
              return !p.programs?.surg?.enrolled;
            }
            return true;
          });
        }

        // 5. Date Range Filtering (if client-side)
        if (dateFrom) {
          const fromTime = new Date(dateFrom + 'T00:00:00').getTime();
          result = result.filter(p => {
            const dateStr = p.createdAt || p.bas_joinRequestDate;
            if (!dateStr) return true;
            const patientTime = new Date(dateStr).getTime();
            return !isNaN(patientTime) && patientTime >= fromTime;
          });
        }
        if (dateTo) {
          const toTime = new Date(dateTo + 'T23:59:59').getTime();
          result = result.filter(p => {
            const dateStr = p.createdAt || p.bas_joinRequestDate;
            if (!dateStr) return true;
            const patientTime = new Date(dateStr).getTime();
            return !isNaN(patientTime) && patientTime <= toTime;
          });
        }

        // 6. Apply Surgery Date & Age Sorting
        result.sort((a, b) => {
          if (sortBy === 'surgery_asc') {
            const surgA = getPatientSurgeryTimestamp(a);
            const surgB = getPatientSurgeryTimestamp(b);
            if (surgA !== surgB) return surgA - surgB;
            return getPatientDobTimestamp(b) - getPatientDobTimestamp(a);
          }
          if (sortBy === 'surgery_desc') {
            const surgA = getPatientSurgeryTimestamp(a);
            const surgB = getPatientSurgeryTimestamp(b);
            if (surgA === Infinity) return 1;
            if (surgB === Infinity) return -1;
            return surgB - surgA;
          }
          if (sortBy === 'age_asc') {
            return getPatientDobTimestamp(b) - getPatientDobTimestamp(a);
          }
          if (sortBy === 'age_desc') {
            return getPatientDobTimestamp(a) - getPatientDobTimestamp(b);
          }
          return 0;
        });

        setFilteredPatients(result);
      })
      .catch(err => console.error('Failed to fetch filtered cases', err));
  }, [searchQuery, filterStatus, filterUrgency, filterPurpose, deptFilter, currentModule, sortBy, dateFrom, dateTo, applyCounter]);

  // 1. Calculate operational stats
  const isDeptModule = DEPARTMENTS.some(d => d.code === currentModule);
  const activeDept = isDeptModule ? currentModule : 'all';

  const activePatients = patients.filter(p => !p.isArchived);
  
  const stalledCount = activePatients.filter(p => {
    if (isDeptModule && !p.programs?.[currentModule]?.enrolled) return false;
    return isPatientStalled(p);
  }).length;
  
  const totalAlarmsCount = activePatients.reduce((sum, p) => {
    if (isDeptModule && !p.programs?.[currentModule]?.enrolled) return 0;
    return sum + getPatientAlarms(p).length;
  }, 0);
  
  const vipCount = activePatients.filter(p => {
    if (isDeptModule && !p.programs?.[currentModule]?.enrolled) return false;
    return getVIPBadges(p).length > 0;
  }).length;



  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 4. Color Helper for Department badges
  const getDeptColor = (code: string) => {
    const dept = DEPARTMENTS.find(d => d.code === code);
    return dept ? dept.color : '#64748b';
  };

  const getDeptLabel = (code: string) => {
    const dept = DEPARTMENTS.find(d => d.code === code);
    return dept ? dept.label : code;
  };

  return (
    <div className="container fade-in">
      {/* ── Stats Grid ── */}
      <div className="stats-grid">
        <StatCard 
          title="Active Patients" 
          value={activePatients.length} 
          icon={<Users className="w-5 h-5 text-teal-600" />} 
          variant="all"
          onClick={() => { setFilterStatus('all'); setFilterUrgency('all'); setFilterPurpose('all'); }}
        />
        <StatCard 
          title="Stalled Cases" 
          value={stalledCount} 
          icon={<Clock className="w-5 h-5 text-red-600" />} 
          variant="red"
          onClick={() => { setFilterStatus('stalled'); setFilterUrgency('all'); setFilterPurpose('all'); }}
        />
        <StatCard 
          title="Active Alarms" 
          value={totalAlarmsCount} 
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />} 
          variant="yellow"
          onClick={() => { setFilterStatus('red'); setFilterUrgency('all'); setFilterPurpose('all'); }}
        />
        <StatCard 
          title="VIP / Travelers" 
          value={vipCount} 
          icon={<Crown className="w-5 h-5 text-indigo-600" />} 
          variant="blue"
          onClick={() => { setFilterStatus('vip'); setFilterUrgency('all'); setFilterPurpose('all'); }}
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className="filter-bar">
        <div className="form-group" style={{ flex: 2 }}>
          <label>Search Directory</label>
          <div style={{ position: 'relative' }}>
            <Search className="w-4 h-4 text-slate-400" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search by Patient Name or MRN number..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Sort Cases By</label>
          <select 
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
          >
            <option value="surgery_asc">Surgery Date: Closest to Farthest</option>
            <option value="surgery_desc">Surgery Date: Farthest to Closest</option>
            <option value="age_asc">Age: Youngest to Oldest</option>
            <option value="age_desc">Age: Oldest to Youngest</option>
          </select>
        </div>

        <div className="form-group">
          <label>Coordinator Alarms</label>
          <select 
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Cases</option>
            <option value="stalled">Stalled Cases Only</option>
            <option value="vip">VIP / Complex Flags</option>
            <option value="red">Urgent Priority (Red)</option>
            <option value="yellow">Important Priority (Yellow)</option>
            <option value="blue">Routine Priority (Blue)</option>
          </select>
        </div>



        <div className="form-group">
          <label>Surgical Urgency</label>
          <select 
            value={filterUrgency}
            onChange={(e) => { setFilterUrgency(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Scheduled</option>
            <option value="emergency">Emergency / Salvage</option>
            <option value="urgent">Urgent</option>
            <option value="semi_urgent">Semi-Urgent</option>
            <option value="elective">Elective</option>
            <option value="none">Not Scheduled / None</option>
          </select>
        </div>

        <div className="form-group">
          <label>Visit Purpose</label>
          <select 
            value={filterPurpose}
            onChange={(e) => { setFilterPurpose(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Visits</option>
            <option value="op">Scheduled for Surgery</option>
            <option value="followup">General Clinical Follow-up</option>
          </select>
        </div>

        <div className="form-group">
          <label>Registered From</label>
          <input 
            type="date" 
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="form-group">
          <label>Registered To</label>
          <input 
            type="date" 
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="form-group" style={{ flex: '0 0 auto', alignSelf: 'flex-end', display: 'flex', gap: 10 }}>
          <button 
            type="button"
            className="btn btn-secondary flex items-center gap-1.5"
            onClick={handleResetFilters}
            title="Reset All Filters"
            style={{ padding: '9px 16px', fontSize: '13px' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>

          <button 
            type="button"
            className="btn flex items-center gap-1.5"
            onClick={handleApplyFilters}
            title="Apply Filter & Sort Rules"
            style={{ padding: '9px 16px', fontSize: '13px', background: '#0f766e', color: '#ffffff', border: '1px solid #0f766e' }}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Apply Filter & Sort</span>
          </button>
        </div>
      </div>

      {/* ── Patient Cards Grid ── */}
      {paginatedPatients.length > 0 ? (
        <div className="patient-grid">
          {paginatedPatients.map(patient => {
            const isStalledCase = isPatientStalled(patient);
            const badges = getVIPBadges(patient);
            const alarms = getPatientAlarms(patient);
            const highestPriority = getHighestPriority(alarms);
            const uniquePriorities = Array.from(new Set(alarms.map(a => a.priority)));
            const cardAccentStyle = { '--card-accent': getCardAccentGradient(alarms, isStalledCase) } as React.CSSProperties;
            
            // Collect enrolled clinics
            const enrolledDepts = Object.keys(patient.programs || {}).filter(
              code => code !== 'surg' && patient.programs?.[code]?.enrolled
            );

            return (
              <div 
                key={patient.id} 
                className={`card ${isStalledCase ? 'stalled' : ''} ${highestPriority !== 'none' ? `alarm-${highestPriority}` : ''} ${badges.length > 0 ? 'vip-card' : ''}`}
                style={cardAccentStyle}
                onClick={() => setEditingPatientId(patient.id)}
              >
                <div className="card-header">
                  <div className="flex-1 min-w-0">
                    <h3 className="card-name truncate" title={patient.bas_name}>
                      {patient.bas_name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="card-mrn">{patient.bas_mrn}</span>
                      <span className={`blood-tag ${patient.bas_blood?.includes('-') ? 'blood-neg' : 'blood-pos'}`}>
                        {patient.bas_blood || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  {/* Action/Edit Indicator */}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {getDynamicAge(patient.bas_dob)}
                  </div>
                </div>

                {/* VIP / Travel Badges */}
                {badges.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                    {badges.map((badge, idx) => (
                      <span 
                        key={idx} 
                        className="vip-badge" 
                        style={{ backgroundColor: badge.color }}
                        title={badge.detail}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Enrolled Departments list */}
                <div className="program-badges">
                  {enrolledDepts.map(code => (
                    <span 
                      key={code} 
                      className="prog-badge" 
                      style={{ backgroundColor: getDeptColor(code) }}
                      title={getDeptLabel(code)}
                    >
                      {code}
                    </span>
                  ))}
                  {patient.programs?.surg?.enrolled && (
                    <span 
                      className="prog-badge" 
                      style={{ backgroundColor: '#15803d' }}
                      title="Scheduled for Surgery"
                    >
                      SURGERY
                    </span>
                  )}
                </div>

                {/* Alarms alerts section inside the card */}
                {alarms.length > 0 && (
                  <div style={{
                    marginTop: 'auto',
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: '#475569', letterSpacing: '0.04em' }}>
                        ⚠️ Active Alarms ({alarms.length})
                      </span>
                      {/* Multi-priority color dots */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {uniquePriorities.map(prio => (
                          <span 
                            key={prio} 
                            style={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              background: prio === 'red' ? '#ef4444' : prio === 'yellow' ? '#f59e0b' : '#3b82f6' 
                            }} 
                            title={`${String(prio).toUpperCase()} Alarm`}
                          />
                        ))}
                      </div>
                    </div>

                    {alarms.map((alarm, idx) => {
                      const isRed = alarm.priority === 'red';
                      const isYellow = alarm.priority === 'yellow';
                      const bg = isRed ? '#fef2f2' : isYellow ? '#fff7ed' : '#eff6ff';
                      const border = isRed ? '#fecaca' : isYellow ? '#ffedd5' : '#dbeafe';
                      const color = isRed ? '#dc2626' : isYellow ? '#c2410c' : '#1e40af';
                      
                      return (
                        <div key={idx} style={{
                          padding: '6px 10px',
                          borderRadius: '8px',
                          background: bg,
                          border: `1px solid ${border}`,
                          fontSize: '11px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              color: color,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: 'rgba(255,255,255,0.85)',
                              lineHeight: 1
                            }}>
                              {alarm.priority}
                            </span>
                            {alarm.deptLabel && (
                              <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#334155' }}>
                                [{alarm.deptLabel}]
                              </span>
                            )}
                            {alarm.date && (
                              <span style={{ fontSize: '10px', color: '#64748b', marginLeft: 'auto', fontWeight: 500 }}>
                                📅 {alarm.date}
                              </span>
                            )}
                          </div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '11.5px', lineHeight: 1.35, wordBreak: 'break-word' }}>
                            {alarm.note || 'Pending review'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="card-footer">
                  Last Update: {new Date(patient.updatedAt || '').toLocaleDateString()} by {patient.updatedBy || 'Coordinator'}
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
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <h3>No Patient Records Found</h3>
          <p style={{ marginTop: 6, fontSize: 13 }}>Try adjusting your search queries or active filters.</p>
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
            Page {currentPage} of {totalPages} ({totalItems} total patients)
          </span>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
