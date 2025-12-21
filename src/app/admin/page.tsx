'use client';

import React, { useEffect, useState } from 'react';
import { AdminDashboard } from '../components/AdminDashboard';
import { LoginScreen } from '../components/LoginScreen';
import { Layout } from '../components/Layout';
import { useRouter } from 'next/navigation';

type Role = 'VISITOR' | 'ADMIN' | 'STAFF';

type StoredAuth = {
  isAuthenticated: boolean;
  role: Role;
  userId?: string;
  email?: string;
};

const STORAGE_KEY = 'ef_auth_v1';

export default function AdminPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth>({
    isAuthenticated: false,
    role: 'VISITOR',
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredAuth;
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

  const handleCancel = () => {
    router.push('/');
  };

  if (!isClient) return null; // Avoid hydration mismatch

  if (auth.isAuthenticated && auth.role === 'ADMIN') {
    return (
      <Layout 
        auth={auth} 
        onLogout={() => {
          localStorage.removeItem(STORAGE_KEY);
          setAuth({ isAuthenticated: false, role: 'VISITOR' });
          router.push('/');
        }}
      >
        <AdminDashboard />
      </Layout>
    );
  }

  return (
    <LoginScreen 
      targetView="admin" 
      onLogin={handleLogin} 
      onCancel={handleCancel} 
    />
  );
}
