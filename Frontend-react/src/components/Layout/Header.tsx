import React from 'react';
import { useApp } from '../../context/AppContext';
import DEPARTMENTS from '../../utils/departmentsData';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Users,
  Activity,
  CalendarCheck,
  PieChart,
  Clipboard,
  UserPlus,
  FileText,
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

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ collapsed, setCollapsed }) => {
  const { currentModule, editingPatientId, setEditingPatientId } = useApp();

  const getModuleTitle = () => {
    if (editingPatientId) {
      return editingPatientId === 'new' ? 'Register New Patient' : 'Patient Clinical Record';
    }
    if (currentModule === 'hub') {
      return 'Global Patient Directory';
    } else if (currentModule === 'anes') {
      return 'Anesthesia Pre-Op Fitness';
    } else if (currentModule === 'surg') {
      return 'Surgical List Scheduler';
    } else if (currentModule === 'analytics') {
      return 'Analytics & BI Dashboard';
    } else if (currentModule === 'research') {
      return 'Research Hub';
    } else {
      const dept = DEPARTMENTS.find(d => d.code === currentModule);
      return dept ? `${dept.label} Clinic` : 'Specialty Clinic';
    }
  };

  const getHeaderIcon = () => {
    if (editingPatientId) {
      return editingPatientId === 'new' 
        ? <UserPlus className="w-5 h-5 flex-shrink-0" style={{ color: '#0d9488' }} />
        : <FileText className="w-5 h-5 flex-shrink-0" style={{ color: '#0d9488' }} />;
    }
    if (currentModule === 'hub') {
      return <Users className="w-5 h-5 flex-shrink-0" style={{ color: '#0d9488' }} />;
    } else if (currentModule === 'anes') {
      return <Activity className="w-5 h-5 flex-shrink-0" style={{ color: '#8b5cf6' }} />;
    } else if (currentModule === 'surg') {
      return <CalendarCheck className="w-5 h-5 flex-shrink-0" style={{ color: '#10b981' }} />;
    } else if (currentModule === 'analytics') {
      return <PieChart className="w-5 h-5 flex-shrink-0" style={{ color: '#f59e0b' }} />;
    } else if (currentModule === 'research') {
      return <Clipboard className="w-5 h-5 flex-shrink-0" style={{ color: '#3b82f6' }} />;
    } else {
      const dept = DEPARTMENTS.find(d => d.code === currentModule);
      const iconColor = dept?.color || '#0f766e';
      switch (currentModule) {
        case 'spin': return <Activity className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'hopb': return <Stethoscope className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'hi':   return <Heart className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'cprp': return <Layers className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'orth': return <Bone className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'neur': return <Brain className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'urol': return <Droplet className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'ent':  return <Volume2 className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'gps':  return <Scissors className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'maxf': return <Smile className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'recon':return <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'abci': return <Shield className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'hope': return <Target className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'hypo': return <Crosshair className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'sbif': return <Radio className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'ndev': return <Brain className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'livt': return <Heart className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        case 'dent': return <Smile className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
        default:     return <Activity className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />;
      }
    }
  };

  const title = getModuleTitle();

  const handleCreatePatient = () => {
    setEditingPatientId('new');
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle" 
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Open Navigation Sidebar" : "Close Navigation Sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5 text-emerald-700" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-emerald-700" />
          )}
        </button>

        <div className="header-brand-box" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {getHeaderIcon()}
          <h1 className="header-title">{title}</h1>
        </div>
      </div>

      <div className="header-actions">
        {/* Register Patient Button */}
        {!editingPatientId && (
          <button className="header-btn-primary" onClick={handleCreatePatient}>
            <Plus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        )}
      </div>
    </header>
  );
};
