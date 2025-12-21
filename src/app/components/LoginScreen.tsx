'use client';

import React, { useState } from 'react';
import { ShieldAlert, KeyRound, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface LoginScreenProps {
  targetView: 'admin' | 'staff';
  onLogin: (role: 'ADMIN' | 'STAFF', user: { userId: string; email: string }) => void;
  onCancel: () => void;
}

type RoleRow = { role: 'ADMIN' | 'STAFF'; is_active: boolean };

export const LoginScreen: React.FC<LoginScreenProps> = ({ targetView, onLogin, onCancel }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const deny = async (msg: string) => {
    await supabase.auth.signOut();
    setError(msg);
    setLoading(false);
  };

// Find handleSubmit and replace with:
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (signInError || !data.session?.user) {
        setLoading(false);
        return deny('Invalid credentials');
      }

      const userId = data.session.user.id;

      // Check V12 Table: access_control
      const { data: roleRow, error: roleError } = await supabase
        .from('access_control')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) return deny('System error: role lookup failed');
      if (!roleRow) return deny('Access denied: no active role assigned');

      if (targetView === 'admin' && roleRow.role !== 'ADMIN') {
        return deny('Access denied: admin only');
      }

      onLogin(roleRow.role as any, { userId, email: cleanEmail });
      setLoading(false);
    } catch (err) {
      console.error(err);
      await supabase.auth.signOut();
      setError('System error: could not login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="w-full max-w-md bg-neutral-900 border-4 border-white shadow-[15px_15px_0px_0px_#facc15] relative">
        <div className="bg-yellow-400 p-4 text-black flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5" />
            <span className="font-mono font-bold uppercase tracking-widest text-xs">Restricted Area</span>
          </div>
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
        </div>

        <div className="p-10">
          <div className="mb-10">
            <h2 className="text-4xl font-maxwell font-bold uppercase tracking-tighter mb-2 text-white">
              {targetView === 'admin' ? 'Command' : 'Paddock'}
            </h2>
            <div className="h-1 w-12 bg-red-600"></div>
            <p className="text-neutral-400 text-xs font-mono mt-4 uppercase">
              // AUTHENTICATION REQUIRED
              <br />
              Enter email + password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email
              </label>
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border-2 border-neutral-700 p-3 font-mono text-sm focus:border-yellow-400 outline-none transition text-white"
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-2">
                <KeyRound className="w-3 h-3" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border-2 border-neutral-700 p-3 font-mono text-sm focus:border-yellow-400 outline-none transition text-white"
                placeholder="******"
              />
            </div>

            {error && (
              <div className="bg-red-600 text-white p-3 text-xs font-mono uppercase tracking-wide flex items-center justify-center gap-2 animate-in slide-in-from-top-2 border-2 border-white">
                <ShieldAlert className="w-4 h-4" /> {error}
              </div>
            )}

            <div className="pt-6 space-y-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-black font-maxwell font-bold text-xl uppercase tracking-widest py-4 hover:bg-yellow-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 border-2 border-transparent"
              >
                {loading ? 'Verifying...' : 'Authorize'}
              </button>

              <button
                type="button"
                onClick={onCancel}
                className="w-full text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-white py-2"
              >
                Abort Sequence
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
