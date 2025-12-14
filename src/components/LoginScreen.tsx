'use client';

import React, { useState } from 'react';
import { Lock, ShieldAlert, KeyRound, ArrowRight, User } from 'lucide-react';

interface LoginScreenProps {
  targetView: string;
  onLogin: (role: 'ADMIN' | 'STAFF') => void;
  onCancel: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ targetView, onLogin, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
        if (username.toLowerCase() === 'admin' && password === 'admin') {
            onLogin('ADMIN');
        } else if (username.toLowerCase() === 'staff' && password === 'staff') {
            onLogin('STAFF');
        } else {
            setError('Access Denied');
            setLoading(false);
        }
    }, 800);
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
                    // AUTHENTICATION REQUIRED<br/>
                    Enter credentials for {targetView} clearance.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-2">
                        <User className="w-3 h-3" /> Agent ID
                    </label>
                    <input 
                        autoFocus
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full bg-black border-2 border-neutral-700 p-3 font-mono text-sm focus:border-yellow-400 outline-none transition uppercase text-white"
                        placeholder="ID"
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-neutral-400 flex items-center gap-2">
                        <KeyRound className="w-3 h-3" /> Passcode
                    </label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
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
