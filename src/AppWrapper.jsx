import React, { useState, useEffect } from 'react';
import MaintenanceService from './firebase/services/maintenanceService';
import MaintenancePage from './pages/MaintenancePage';
import App from './App';

const AppWrapper = () => {
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial maintenance status
    const checkMaintenance = async () => {
      try {
        const status = await MaintenanceService.getMaintenanceStatus();
        setMaintenanceData(status);
      } catch (error) {
        console.error('Error checking maintenance:', error);
        setMaintenanceData({ isActive: false });
      } finally {
        setLoading(false);
      }
    };

    checkMaintenance();

    // Subscribe to real-time updates
    const unsubscribe = MaintenanceService.subscribeToMaintenanceStatus((data) => {
      setMaintenanceData(data);
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show maintenance page if maintenance is active
  if (maintenanceData?.isActive) {
    return <MaintenancePage maintenanceData={maintenanceData} />;
  }

  // Otherwise show the normal app
  return <App />;
};

export default AppWrapper;