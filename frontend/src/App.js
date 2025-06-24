import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import {StudentsPage} from './pages/StudentsPage';
import { DirectionsPage } from './pages/DirectionsPage';
import { studentApi } from './services/api';
import {ModelTrainingPage} from "./pages/ModelTrainingPage";

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState([]);


  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage dashboardData={dashboardData} />;
      case 'directions':
        return <DirectionsPage />;
      case 'students':
        return <StudentsPage />;
      case 'analytics':
        return <ModelTrainingPage />
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto p-8">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;