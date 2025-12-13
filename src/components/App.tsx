'use client';

import React, { useState } from 'react';
import { Layout } from './Layout';
import { VisitorBooking } from './VisitorBooking';
import { AdminDashboard } from './AdminDashboard';
import { StaffDashboard } from './StaffDashboard';
import { LoginScreen } from './LoginScreen';

const App: React.FC = () => {
  const [view, setView] = useState('home');
  const [auth, setAuth] = useState<{ isAuthenticated: boolean; role: 'VISITOR' | 'ADMIN' | 'STAFF' }>({
    isAuthenticated: false,
    role: 'VISITOR'
  });

  const handleLogin = (role: 'ADMIN' | 'STAFF') => {
      setAuth({ isAuthenticated: true, role });
  };

  const handleLogout = () => {
      setAuth({ isAuthenticated: false, role: 'VISITOR' });
      setView('home');
  };

  const renderView = () => {
    switch (view) {
      case 'home':
        return <VisitorBooking />;
      
      case 'admin':
        // Only ADMIN role can see AdminDashboard
        if (auth.isAuthenticated && auth.role === 'ADMIN') {
            return <AdminDashboard />;
        }
        return (
            <LoginScreen 
                targetView="admin" 
                onLogin={handleLogin} 
                onCancel={() => setView('home')} 
            />
        );

      case 'staff':
        // ADMIN or STAFF can see StaffDashboard
        if (auth.isAuthenticated && (auth.role === 'STAFF' || auth.role === 'ADMIN')) {
            return <StaffDashboard />;
        }
        return (
            <LoginScreen 
                targetView="staff" 
                onLogin={handleLogin} 
                onCancel={() => setView('home')} 
            />
        );

      default:
        return <VisitorBooking />;
    }
  };

  return (
    <Layout setView={setView} currentView={view} auth={auth} onLogout={handleLogout}>
      {renderView()}
    </Layout>
  );
};

export default App;
