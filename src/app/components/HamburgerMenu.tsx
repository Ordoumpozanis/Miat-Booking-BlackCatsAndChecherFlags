'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
}

interface HamburgerMenuProps {
  items: MenuItem[];
  onLogout?: () => void;
}

export const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ items, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <button 
        onClick={toggleMenu} 
        className="text-white hover:text-yellow-400 z-50 relative p-2"
        aria-label="Toggle Menu"
      >
        {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
      </button>

      {/* Full Screen Overlay */}
      <div 
        className={`fixed inset-0 bg-black/95 z-40 flex flex-col items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <nav className="flex flex-col gap-8 text-center">
          {items.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              onClick={() => setIsOpen(false)}
              className="text-4xl font-maxwell font-bold uppercase tracking-widest text-white hover:text-yellow-400 transition-colors"
            >
              {item.label}
            </Link>
          ))}

          {onLogout && (
            <button 
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="mt-8 text-xl font-maxwell font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </>
  );
};
