'use client';

import React from 'react';

export const BrandLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 500 150" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="checkers" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <rect x="0" y="0" width="10" height="10" fill="white" fillOpacity="0.2"/>
        <rect x="10" y="10" width="10" height="10" fill="white" fillOpacity="0.2"/>
      </pattern>
    </defs>
    
    {/* Stylized Text */}
    <text x="250" y="60" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="700" fontSize="60" fill="white" letterSpacing="0.05em">
      BLACK CATS
    </text>
    
    <text x="250" y="100" textAnchor="middle" fontFamily="Oswald, sans-serif" fontWeight="400" fontSize="24" fill="#FACC15" letterSpacing="0.2em">
      & CHEQUERED FLAGS
    </text>

    {/* Decorative Flags (Stylized) */}
    <path d="M40 50 Q 60 20 100 50 T 160 50" stroke="#FACC15" strokeWidth="2" fill="none" opacity="0.5" />
    <path d="M340 50 Q 360 80 400 50 T 460 50" stroke="#FACC15" strokeWidth="2" fill="none" opacity="0.5" />
  </svg>
);
