import React, { useState } from 'react';
import { useApp, AppProvider } from './context/AppContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Login } from './components/Auth/Login';
import { GlobalDirectory } from './components/Dashboard/GlobalDirectory';
import { PatientForm } from './components/PatientForm/PatientForm';
import { AnesthesiaList } from './components/Anesthesia/AnesthesiaList';
import { SurgicalList } from './components/Surgery/SurgicalList';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { ResearchHub } from './components/Research/ResearchHub';

function AppContent() {
  const { currentUser, currentModule, editingPatientId } = useApp();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // If there is no coordinator logged in, enforce the login barrier screen
  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    // If editing or registering a patient, override the module view with the PatientForm editor
    if (editingPatientId !== null) {
      return <PatientForm />;
    }

    switch (currentModule) {
      case 'hub':
        return <GlobalDirectory />;
      case 'anes':
        return <AnesthesiaList />;
      case 'surg':
        return <SurgicalList />;
      case 'analytics':
        return <AnalyticsDashboard />;
      case 'research':
        return <ResearchHub />;
      default:
        // Clicking a specific department (e.g. 'spin') renders the GlobalDirectory
        // which auto-filters to show patients active in that clinic.
        return <GlobalDirectory />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <div id="main-content">
        <Header collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        {renderContent()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
