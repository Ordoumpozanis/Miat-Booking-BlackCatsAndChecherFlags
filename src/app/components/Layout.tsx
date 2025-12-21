'use client';

import React from 'react';
import { LogOut } from 'lucide-react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { HamburgerMenu } from './HamburgerMenu';

interface LayoutProps {
  children: React.ReactNode;
  auth?: { isAuthenticated: boolean; role: string };
  onLogout?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, auth, onLogout }) => {
  // Determine menu items based on User Role, not path
  let menuItems: { label: string; href: string }[] = [];

  if (auth?.isAuthenticated) {
    if (auth.role === 'ADMIN') {
      menuItems = [
        { label: 'Visitor', href: '/' },
        { label: 'Staff', href: '/staff' },
        { label: 'Admin', href: '/admin' },
      ];
    } else if (auth.role === 'STAFF') {
      menuItems = [
        { label: 'Visitor', href: '/' },
        { label: 'Staff', href: '/staff' },
      ];
    }
  }

  // Only show Hamburger if there are items (Authenticated users see menu)
  const showMenu = menuItems.length > 0;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-black text-white">
      {/* Minimalist Header */}
      <header className="bg-black border-b-2 border-white/20 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <Link href="/" className="flex items-center cursor-pointer group">
            <Image 
              src="/Logo MIAT_NEG.png" 
              alt="Black Cats & Chequered Flags Experience"
              width={300}
              height={80}
              className="h-14 w-auto md:h-12 lg:h-14 object-contain transition-transform group-hover:scale-105"
              priority
            />
          </Link>
          
          <div className="flex items-center gap-4">
              {/* Hamburger Menu - Logout is now inside */}
              {showMenu && <HamburgerMenu items={menuItems} onLogout={onLogout} />}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Bottom Nav Removed */}
    </div>
  );
};
