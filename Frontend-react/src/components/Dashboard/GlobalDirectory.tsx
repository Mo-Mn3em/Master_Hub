import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StatCard } from './StatCard';
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
  CalendarCheck
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

  const [deptFilter, setDeptFilter] = useState<string>('all');

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

  // 2. Apply Filters
  const filteredPatients = activePatients.filter(p => {
    // Search Query (Name or MRN)
    const matchesSearch = 
      p.bas_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bas_mrn.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Specialty surgical clinic filter (Locked if inside a department module)
    const deptToCheck = isDeptModule ? currentModule : filterPurpose === 'all' ? deptFilter : 'all';
    if (deptToCheck !== 'all') {
      if (!p.programs?.[deptToCheck]?.enrolled) return false;
    }

    // Status Filter (Stalled, VIP, Priorities)
    if (filterStatus !== 'all') {
      if (filterStatus === 'stalled') {
        if (!isPatientStalled(p)) return false;
      } else if (filterStatus === 'vip') {
        if (getVIPBadges(p).length === 0) return false;
      } else {
        // Alarm priority matching (red, yellow, blue)
        const alarms = getPatientAlarms(p);
        const highest = getHighestPriority(alarms);
        if (highest !== filterStatus) return false;
      }
    }

    // Urgency Filter
    if (filterUrgency !== 'all') {
      const surgUrgency = p.programs?.surg?.urgency;
      if (surgUrgency !== filterUrgency) return false;
    }

    // Purpose Filter (op = scheduled for surgery, followup = enrolled in general clinic)
    if (filterPurpose !== 'all') {
      if (filterPurpose === 'op') {
        if (!p.programs?.surg?.enrolled) return false;
      } else if (filterPurpose === 'followup') {
        // Enrolled in at least one program other than surg and anes
        const hasFollowup = Object.keys(p.programs || {}).some(
          code => code !== 'surg' && code !== 'anes' && p.programs?.[code]?.enrolled
        );
        if (!hasFollowup) return false;
      }
    }

    return true;
  });

  // 3. Paginate Results
  const totalItems = filteredPatients.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + itemsPerPage);

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

        {!isDeptModule && (
          <div className="form-group">
            <label>Filter Specialty</label>
            <select 
              value={deptFilter}
              onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1); }}
            >
              <option value="all">All Specialties</option>
              {DEPARTMENTS.filter(d => d.code !== 'anes').map(d => (
                <option key={d.code} value={d.code}>{d.label}</option>
              ))}
            </select>
          </div>
        )}

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
      </div>

      {/* ── Patient Cards Grid ── */}
      {paginatedPatients.length > 0 ? (
        <div className="patient-grid">
          {paginatedPatients.map(patient => {
            const isStalledCase = isPatientStalled(patient);
            const badges = getVIPBadges(patient);
            const alarms = getPatientAlarms(patient);
            
            // Collect enrolled clinics
            const enrolledDepts = Object.keys(patient.programs || {}).filter(
              code => code !== 'surg' && patient.programs?.[code]?.enrolled
            );

            return (
              <div 
                key={patient.id} 
                className={`card ${isStalledCase ? 'stalled' : ''} ${badges.length > 0 ? 'vip-card' : ''}`}
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
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4
                  }} onClick={(e) => e.stopPropagation()}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, color: 'var(--warning)', letterSpacing: '0.04em' }}>
                      ⚠️ Active Alarms ({alarms.length})
                    </span>
                    <span className="truncate" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {alarms[0].note || 'Pending review'}
                    </span>
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
