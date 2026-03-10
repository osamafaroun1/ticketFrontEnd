import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import AdminDashboard from './components/AdminDashboard';
import { Role } from './types';

const AppContent: React.FC = () => {
  const { user, loading } = useApp();

  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => {}} />;
  }

  switch (user.role) {
    case Role.CIVIL:
      return <EmployeeDashboard />;
    case Role.ADMIN:
    case Role.SUPERADMIN:
      return <AdminDashboard />;
    default:
      return <div>Unknown Role</div>;
  }
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
