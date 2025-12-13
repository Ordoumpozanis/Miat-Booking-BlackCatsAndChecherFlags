'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isActive: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, isActive }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "html5qr-code-full-region";

  useEffect(() => {
    // Only initialize if active and library loaded
    if (isActive && typeof Html5Qrcode !== 'undefined' && !scannerRef.current) {
        startScanner();
    }

    return () => {
       if (scannerRef.current) {
           scannerRef.current.stop().catch(console.error);
           scannerRef.current = null;
       }
    };
  }, [isActive]);

  const startScanner = async () => {
      try {
          const html5QrCode = new Html5Qrcode(regionId);
          scannerRef.current = html5QrCode;
          
          await html5QrCode.start(
              { facingMode: "environment" }, 
              { fps: 10, qrbox: { width: 250, height: 250 } },
              (decodedText: string) => {
                  onScan(decodedText);
                  // Optional: pause or stop scanning? We keep scanning for Staff flow usually.
              },
              () => {
                  // ignore frame errors
              }
          );
      } catch (err) {
          console.error(err);
          setError("Could not access camera. Please allow permissions.");
      }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
       <div id={regionId} className="w-full h-full object-cover"></div>
       {error && <div className="absolute inset-0 flex items-center justify-center text-white bg-black/80 p-6 text-center">{error}</div>}
       <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-lg pointer-events-none"></div>
       <div className="absolute bottom-8 left-0 right-0 text-center text-white/70 text-sm font-medium">Align QR Code within frame</div>
    </div>
  );
};
