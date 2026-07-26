import React from 'react';
import { useApp } from '../../context/AppContext';
import DEPARTMENTS from '../../utils/departmentsData';
import { Menu, Plus, RefreshCw } from 'lucide-react';

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, setCollapsed }) => {
  const { currentModule, setEditingPatientId, patients } = useApp();

  const getModuleInfo = () => {
    if (currentModule === 'hub') {
      return {
        title: 'Global Patient Directory',
        subtitle: `Viewing all registered patients (${patients.filter(p => !p.isArchived).length} active records)`
      };
    } else if (currentModule === 'anes') {
      return {
        title: 'Anesthesia Pre-op Clinic',
        subtitle: 'Pre-anesthetic evaluation, physical fitness state, and blood bank crossmatch operations.'
      };
    } else if (currentModule === 'surg') {
      return {
        title: 'Surgical List Scheduler',
        subtitle: 'Patients booked for operating rooms grouped chronologically with active clinical blocker checks.'
      };
    } else if (currentModule === 'analytics') {
      return {
        title: 'Analytics & BI Dashboard',
        subtitle: 'Real-time charts, metrics, and KPI summaries of department loads, fitness, and surgical bookings.'
      };
    } else if (currentModule === 'research') {
      return {
        title: 'Research Study Hub',
        subtitle: 'Define custom data templates and export structured spreadsheet databases for medical studies.'
      };
    } else {
      const dept = DEPARTMENTS.find(d => d.code === currentModule);
      return {
        title: dept ? `${dept.label} Clinic` : 'Specialty Clinic',
        subtitle: 'Record demographic details, clinical checklist gates, and configure custom follow-up alarms.'
      };
    }
  };

  const { title, subtitle } = getModuleInfo();

  const handleCreatePatient = () => {
    // Setting editing id to 'new' triggers App to render the form view
    setEditingPatientId('new');
  };

  return (
    <header>
      <div className="header-left">
        <button 
          className="sidebar-toggle" 
          onClick={() => setCollapsed(!collapsed)}
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="header-title">{title}</h1>
          <div className="header-subtitle">{subtitle}</div>
        </div>
      </div>

      <div className="header-actions">
        {/* Register Patient Button (Shown in Hub and Department Views) */}
        {(currentModule === 'hub' || DEPARTMENTS.some(d => d.code === currentModule)) && (
          <button className="btn btn-primary" onClick={handleCreatePatient}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Register Patient</span>
          </button>
        )}
      </div>
    </header>
  );
};
