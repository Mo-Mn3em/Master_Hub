import React from 'react';
import { useApp } from '../../context/AppContext';
import DEPARTMENTS from '../../utils/departmentsData';
import { 
  Users, 
  Calendar, 
  CalendarCheck,
  Activity,
  PieChart, 
  Clipboard, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Heart,
  Brain,
  Bone,
  Stethoscope,
  Droplet,
  Scissors,
  Sparkles,
  Shield,
  Crosshair,
  Radio,
  Layers,
  Volume2,
  Target,
  Smile
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

  const getDeptIcon = (code: string, color?: string) => {
    const iconColor = color || '#0f766e';
    switch (code) {
      case 'spin': return <Activity className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'hopb': return <Stethoscope className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'hi':   return <Heart className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'cprp': return <Layers className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'orth': return <Bone className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'neur': return <Brain className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'urol': return <Droplet className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'ent':  return <Volume2 className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'gps':  return <Scissors className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'maxf': return <Smile className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'recon':return <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'abci': return <Shield className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'hope': return <Target className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'hypo': return <Crosshair className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'sbif': return <Radio className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'ndev': return <Brain className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'livt': return <Heart className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      case 'dent': return <Smile className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
      default:     return <Activity className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {!collapsed && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
          onClick={() => setCollapsed(true)}
        />
      )}

      <nav id="sidebar" className={collapsed ? 'collapsed' : ''}>
        {/* Brand/Logo Header */}
        <div className="brand">
          <div className="brand-icon" style={{ padding: 2, background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
            <img src="/NOH_logo.jpg" alt="NOH Logo" className="w-full h-full object-contain" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="brand-text">Master Hub</div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="nav-links">
          <div className="nav-section-label">General Operations</div>
          
          <div 
            className={`nav-item ${currentModule === 'hub' ? 'active' : ''}`}
            onClick={() => handleNavClick('hub')}
          >
            <Users className="w-4 h-4 flex-shrink-0" style={{ color: '#0d9488' }} />
            <span>Global Directory</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'anes' ? 'active' : ''}`}
            onClick={() => handleNavClick('anes')}
          >
            <Activity className="w-4 h-4 flex-shrink-0" style={{ color: '#8b5cf6' }} />
            <span>Anesthesia Clinic</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'surg' ? 'active' : ''}`}
            onClick={() => handleNavClick('surg')}
          >
            <CalendarCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#10b981' }} />
            <span>Surgical List</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'analytics' ? 'active' : ''}`}
            onClick={() => handleNavClick('analytics')}
          >
            <PieChart className="w-4 h-4 flex-shrink-0" style={{ color: '#f59e0b' }} />
            <span>Analytics & BI</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'research' ? 'active' : ''}`}
            onClick={() => handleNavClick('research')}
          >
            <Clipboard className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
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
                {getDeptIcon(dept.code, dept.color)}
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
              <div className="text-[11px] text-slate-400">Coordinator Session</div>
            </div>
            <button 
              onClick={logout}
              className="sidebar-logout-pill"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </nav>
    </>
  );
};
