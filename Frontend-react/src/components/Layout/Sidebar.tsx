import React from 'react';
import { useApp } from '../../context/AppContext';
import DEPARTMENTS from '../../utils/departmentsData';
import { 
  Users, 
  Activity, 
  Calendar, 
  PieChart, 
  Clipboard, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { currentModule, setCurrentModule, currentUser, logout } = useApp();

  const handleNavClick = (moduleCode: string) => {
    setCurrentModule(moduleCode);
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ')[0].substring(0, 2).toUpperCase();
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <nav id="sidebar" className={collapsed ? 'collapsed' : ''}>
        {/* Brand/Logo Header */}
        <div className="brand">
          <div className="brand-icon">
            <Activity className="w-6 h-6 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="brand-text">Master Hub</div>
            <div className="brand-sub">Clinical Database</div>
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="nav-links">
          <div className="nav-section-label">General Operations</div>
          
          <div 
            className={`nav-item ${currentModule === 'hub' ? 'active' : ''}`}
            onClick={() => handleNavClick('hub')}
          >
            <Users className="w-4 h-4 text-teal-400" />
            <span>Global Directory</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'anes' ? 'active' : ''}`}
            onClick={() => handleNavClick('anes')}
            style={{ color: '#c084fc', fontWeight: 'bold' }}
          >
            <span className="nav-item-dot" style={{ background: '#9333ea', opacity: 1 }} />
            <span>Anesthesia Clinic</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'surg' ? 'active' : ''}`}
            onClick={() => handleNavClick('surg')}
            style={{ color: '#4ade80', fontWeight: 'bold' }}
          >
            <span className="nav-item-dot" style={{ background: '#15803d', opacity: 1 }} />
            <span>Surgical List</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'analytics' ? 'active' : ''}`}
            onClick={() => handleNavClick('analytics')}
            style={{ color: '#fbbf24', fontWeight: 'bold' }}
          >
            <PieChart className="w-4 h-4 text-amber-400" />
            <span>Analytics & BI</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'research' ? 'active' : ''}`}
            onClick={() => handleNavClick('research')}
            style={{ color: '#2dd4bf', fontWeight: 'bold' }}
          >
            <Clipboard className="w-4 h-4 text-teal-400" />
            <span>Research Hub</span>
          </div>

          {/* Specialty Clinics Section */}
          <div className="nav-section-label">Clinical Programs</div>
          {DEPARTMENTS.filter(d => d.code !== 'anes').map(dept => {
            const isActive = currentModule === dept.code;
            return (
              <div 
                key={dept.code}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(dept.code)}
              >
                <span 
                  className="nav-item-dot" 
                  style={{ 
                    background: dept.color, 
                    opacity: isActive ? 1 : 0.4,
                    boxShadow: isActive ? `0 0 8px ${dept.color}` : 'none'
                  }} 
                />
                <span className="truncate">{dept.label}</span>
              </div>
            );
          })}
        </div>

        {/* User Profile Footer */}
        {currentUser && (
          <div className="user-profile">
            <div className="user-avatar">
              {getInitials(currentUser)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="user-name truncate" title={currentUser}>
                {currentUser}
              </div>
              <button 
                onClick={logout}
                className="user-logout flex items-center gap-1 hover:text-red-400"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};
