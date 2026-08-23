import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import DEPARTMENTS from '../../utils/departmentsData';
import { ChangePasswordModal } from '../Auth/ChangePasswordModal';
import { UserManagementModal } from '../Admin/UserManagementModal';
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
  Smile,
  KeyRound,
  UserCog,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { currentModule, setCurrentModule, currentUser, isAdmin, logout } = useApp();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUserMgmtModalOpen, setIsUserMgmtModalOpen] = useState(false);

  const handleNavClick = (moduleCode: string) => {
    setCurrentModule(moduleCode);
    if (window.innerWidth <= 768) {
      setCollapsed(true);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ')[0].substring(0, 2).toUpperCase();
  };

  const getDeptLabel = (code?: string | null) => {
    if (!code) return null;
    const dept = DEPARTMENTS.find(d => d.code.toLowerCase() === code.toLowerCase());
    return dept?.label || code.toUpperCase();
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
      case 'surg': return <Scissors className="w-4 h-4 flex-shrink-0" style={{ color: iconColor }} />;
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

      <nav id="sidebar" className={`bg-white border-r border-slate-200 flex flex-col h-screen ${collapsed ? 'collapsed' : ''}`}>
        {/* Header with Collapse Button & Brand */}
        <div className="p-4 pb-3 border-b border-slate-100 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-xs transition-colors"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <div>
            <div className="w-9 h-9 rounded-xl bg-slate-100/90 border border-slate-200/80 flex items-center justify-center text-slate-800 shadow-xs mb-2">
              <ShieldAlert className="w-5 h-5 text-slate-800 stroke-[2.2]" />
            </div>
            <div className="text-[14px] font-black tracking-wide text-[#0f2d59] uppercase leading-tight font-sans">
              MASTER HUB
            </div>
            <div className="text-[10.5px] font-bold tracking-wider text-slate-500 uppercase mt-0.5 font-sans">
              PATIENT COORDINATOR CENTER
            </div>
          </div>
        </div>

        {/* Scrollable Nav List */}
        <div className="nav-links flex-1 overflow-y-auto py-2">
          {/* Main Views */}
          <div className="nav-section-label">Main Views</div>
          
          <div 
            className={`nav-item ${currentModule === 'hub' ? 'active' : ''}`}
            style={{ '--nav-accent': '#0f766e' } as React.CSSProperties}
            onClick={() => handleNavClick('hub')}
          >
            <Users className="w-4 h-4 flex-shrink-0" style={{ color: '#0f766e' }} />
            <span>Patient Hub</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'coordinator' ? 'active' : ''}`}
            style={{ '--nav-accent': '#0891b2' } as React.CSSProperties}
            onClick={() => handleNavClick('coordinator')}
          >
            <Calendar className="w-4 h-4 flex-shrink-0" style={{ color: '#0891b2' }} />
            <span>Coordinator Operations</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'anes' ? 'active' : ''}`}
            style={{ '--nav-accent': '#8e44ad' } as React.CSSProperties}
            onClick={() => handleNavClick('anes')}
          >
            <CalendarCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#8e44ad' }} />
            <span>Pre-Anesthesia Clinic</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'stats' ? 'active' : ''}`}
            style={{ '--nav-accent': '#6366f1' } as React.CSSProperties}
            onClick={() => handleNavClick('stats')}
          >
            <PieChart className="w-4 h-4 flex-shrink-0" style={{ color: '#6366f1' }} />
            <span>Analytics & Reports</span>
          </div>

          <div 
            className={`nav-item ${currentModule === 'research' ? 'active' : ''}`}
            style={{ '--nav-accent': '#3b82f6' } as React.CSSProperties}
            onClick={() => handleNavClick('research')}
          >
            <Clipboard className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} />
            <span>Research Hub</span>
          </div>

          {/* Admin Management Section */}
          {isAdmin && (
            <>
              <div className="nav-section-label">Administration</div>
              <div 
                className="nav-item"
                style={{ '--nav-accent': '#0d9488' } as React.CSSProperties}
                onClick={() => setIsUserMgmtModalOpen(true)}
              >
                <UserCog className="w-4 h-4 flex-shrink-0 text-teal-600" />
                <span>Manage Users & Roles</span>
              </div>
            </>
          )}

          {/* Specialty Clinics Section */}
          <div className="nav-section-label">Clinical Programs</div>
          {DEPARTMENTS.filter(d => d.code !== 'anes').map(dept => {
            const isActive = currentModule === dept.code;
            const itemColor = dept.color || '#0f766e';
            const isUserDept = currentUser?.department_code?.toLowerCase() === dept.code.toLowerCase();

            return (
              <div 
                key={dept.code}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ '--nav-accent': itemColor } as React.CSSProperties}
                onClick={() => handleNavClick(dept.code)}
              >
                {getDeptIcon(dept.code, itemColor)}
                <span className="truncate flex-1">{dept.label}</span>
                {isUserDept && (
                  <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-1.5 py-0.5 rounded border border-teal-200">
                    My Dept
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* User Profile Footer */}
        {currentUser && (
          <div className="user-profile">
            <div className="user-avatar" title={currentUser.name}>
              {getInitials(currentUser.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="user-name truncate flex items-center gap-1" title={currentUser.name}>
                <span>{currentUser.name}</span>
                {isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {isAdmin ? (
                  <span className="text-purple-600 font-medium">Administrator</span>
                ) : currentUser.department_code ? (
                  <span className="text-teal-600 font-medium">{getDeptLabel(currentUser.department_code)}</span>
                ) : (
                  <span>Coordinator</span>
                )}
              </div>
            </div>

            {/* User Action Controls */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="sidebar-logout-pill"
                title="Change Password"
              >
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button 
                onClick={logout}
                className="sidebar-logout-pill"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Change Password Modal */}
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      {/* Admin User Management Modal */}
      {isAdmin && (
        <UserManagementModal 
          isOpen={isUserMgmtModalOpen} 
          onClose={() => setIsUserMgmtModalOpen(false)} 
        />
      )}
    </>
  );
};
