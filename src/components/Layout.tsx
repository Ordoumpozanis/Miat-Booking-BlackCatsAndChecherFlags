'use client';

import React from 'react';
import { Ticket, LayoutDashboard, ScanLine, LogOut } from 'lucide-react';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
  setView: (view: string) => void;
  currentView: string;
  auth: { isAuthenticated: boolean; role: string };
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, setView, currentView, auth, onLogout }) => {
  const navItemClass = (view: string) => `
    flex flex-col items-center justify-center p-4 cursor-pointer transition-all duration-300 border-t-4
    ${currentView === view ? 'border-yellow-400 text-yellow-400 bg-neutral-900' : 'border-transparent text-neutral-500 hover:text-white hover:bg-white/5'}
  `;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-black text-white">
      {/* Minimalist Header */}
      <header className="bg-black border-b-2 border-white/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center cursor-pointer group" onClick={() => setView('home')}>
            <Image 
              src="/Logo MIAT_NEG.png" 
              alt="Black Cats & Chequered Flags Experience"
              width={300}
              height={80}
              className="h-14 w-auto md:h-12 lg:h-14 object-contain transition-transform group-hover:scale-105"
              priority
            />
          </div>
          
          <div className="flex items-center gap-8">
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-bold tracking-widest uppercase font-maxwell">
                <button onClick={() => setView('home')} className={`transition hover:text-yellow-400 ${currentView === 'home' ? 'text-white border-b-2 border-white' : 'text-neutral-500'}`}>Visitor</button>
                <button onClick={() => setView('admin')} className={`transition hover:text-yellow-400 ${currentView === 'admin' ? 'text-white border-b-2 border-white' : 'text-neutral-500'}`}>Admin</button>
                <button onClick={() => setView('staff')} className={`transition hover:text-yellow-400 ${currentView === 'staff' ? 'text-white border-b-2 border-white' : 'text-neutral-500'}`}>Staff</button>
              </nav>

              {/* Logout Button */}
              {auth.isAuthenticated && (
                  <button onClick={onLogout} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-black bg-white hover:bg-red-600 hover:text-white px-4 py-2 transition rounded-none">
                      <LogOut className="w-3 h-3" /> Logout
                  </button>
              )}
          </div>
        </div>
      </header>

      {/* Main Content Area - Added pb-24 for mobile padding */}
      <main className="flex-grow pb-24 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t-2 border-white/20 grid grid-cols-3 pb-safe z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div onClick={() => setView('home')} className={navItemClass('home')}>
          <Ticket className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold tracking-widest uppercase font-maxwell">Visit</span>
        </div>
        <div onClick={() => setView('admin')} className={navItemClass('admin')}>
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold tracking-widest uppercase font-maxwell">Admin</span>
        </div>
        <div onClick={() => setView('staff')} className={navItemClass('staff')}>
          <ScanLine className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-bold tracking-widest uppercase font-maxwell">Staff</span>
        </div>
      </nav>
    </div>
  );
};
