'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  isActive: boolean;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScan, isActive }) => {
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "html5qr-code-full-region";
  // Track if we are currently unmounting to prevent race conditions
  const isUnmountingRef = useRef(false);

  useEffect(() => {
    isUnmountingRef.current = false;

    const initScanner = async () => {
      // If already active or unmounting, skip
      if (scannerRef.current || isUnmountingRef.current) return;

      try {
        const html5QrCode = new Html5Qrcode(regionId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Success callback
            if (!isUnmountingRef.current) {
              onScan(decodedText);
            }
          },
          (errorMessage) => {
            // Parse error (common, ignore)
          }
        );
      } catch (err) {
        console.warn("Scanner start failed", err);
        if (!isUnmountingRef.current) {
            setError("Camera permission denied or not available.");
        }
      }
    };

    if (isActive) {
      initScanner();
    }

    return () => {
      isUnmountingRef.current = true;
      const scanner = scannerRef.current;

      if (scanner) {
        // Safe Cleanup Logic
        try {
            // Check state if available, or just attempt stop with catch
            const state = scanner.getState();
            
            if (state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED) {
                scanner.stop()
                    .then(() => scanner.clear())
                    .catch((err) => {
                        // Suppress "not running" errors during cleanup
                        console.log("Scanner cleanup info:", err);
                        scanner.clear();
                    });
            } else {
                scanner.clear();
            }
        } catch (e) {
             console.warn("Scanner cleanup error", e);
        }
        scannerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]); 

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center">
       <div id={regionId} className="w-full h-full object-cover"></div>
       {error && <div className="absolute inset-0 flex items-center justify-center text-white bg-black/80 p-6 text-center">{error}</div>}
       
       {/* UI Overlays */}
       <div className="absolute inset-0 border-[40px] border-black/50 pointer-events-none"></div>
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/50 rounded-lg pointer-events-none"></div>
       <div className="absolute bottom-8 left-0 right-0 text-center text-white/70 text-sm font-medium">Align QR Code within frame</div>
    </div>
  );
};