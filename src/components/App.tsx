'use client';

import React, { useEffect, useState } from 'react';
import { Layout } from './Layout';
import { VisitorBooking } from './VisitorBooking';
import { AdminDashboard } from './AdminDashboard';
import { StaffDashboard } from './StaffDashboard';
import { LoginScreen } from './LoginScreen';

type Role = 'VISITOR' | 'ADMIN' | 'STAFF';

type StoredAuth = {
  isAuthenticated: boolean;
  role: Role;
  userId?: string;
  email?: string;
};

const STORAGE_KEY = 'ef_auth_v1';

const App: React.FC = () => {
  const [view, setView] = useState('home');
  const [auth, setAuth] = useState<StoredAuth>({
    isAuthenticated: false,
    role: 'VISITOR',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredAuth;
      if (parsed?.isAuthenticated && (parsed.role === 'ADMIN' || parsed.role === 'STAFF')) {
        setAuth(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogin = (role: 'ADMIN' | 'STAFF', user: { userId: string; email: string }) => {
    const next: StoredAuth = { isAuthenticated: true, role, userId: user.userId, email: user.email };
    setAuth(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const handleLogout = () => {
    setAuth({ isAuthenticated: false, role: 'VISITOR' });
    localStorage.removeItem(STORAGE_KEY);
    setView('home');
  };

  const renderView = () => {
    switch (view) {
      case 'home':
        return <VisitorBooking />;

      case 'admin':
        if (auth.isAuthenticated && auth.role === 'ADMIN') return <AdminDashboard />;
        return <LoginScreen targetView="admin" onLogin={handleLogin} onCancel={() => setView('home')} />;

      case 'staff':
        if (auth.isAuthenticated && (auth.role === 'STAFF' || auth.role === 'ADMIN')) return <StaffDashboard />;
        return <LoginScreen targetView="staff" onLogin={handleLogin} onCancel={() => setView('home')} />;

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
