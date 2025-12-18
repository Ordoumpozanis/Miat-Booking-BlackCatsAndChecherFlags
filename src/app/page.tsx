'use client';

import React, { useEffect, useState } from 'react';
import { VisitorBooking } from '../components/VisitorBooking';
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

export default function Home() {
  const router = useRouter();
  const [auth, setAuth] = useState<StoredAuth>({
    isAuthenticated: false,
    role: 'VISITOR',
  });

  useEffect(() => {
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

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth({ isAuthenticated: false, role: 'VISITOR' });
    router.refresh();
  };

  return (
    <Layout auth={auth} onLogout={handleLogout}>
      <VisitorBooking />
    </Layout>
  );
}
