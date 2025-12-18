'use client';

import React, { useState } from 'react';
import { Scan, UserCheck, XCircle, Search, CheckSquare, Square } from 'lucide-react';
import { QRScanner } from './QRScanner';
import { storageService } from '../services/storageService';
import { Booking } from '../types';

export const StaffDashboard: React.FC = () => {
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [attendance, setAttendance] = useState<Set<number>>(new Set());
  const [scanStatus, setScanStatus] = useState<'idle' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [confirmedResult, setConfirmedResult] = useState<{ message: string; count: number } | null>(null);

  // ... inside StaffDashboard component ...

  const processCode = async (dataStr: string) => {
    try {
      // 1. Parse Code from QR or Manual Input
      let bookingId: string | undefined;
      let refCode: string;
      try {
        const data = JSON.parse(dataStr);
        bookingId = typeof data?.id === 'string' ? data.id : undefined;
        refCode = typeof data?.ref === 'string' ? data.ref : String(dataStr).toUpperCase().trim();
      } catch {
        refCode = String(dataStr).toUpperCase().trim();
      }

      // 2. Find Locally (Fast Lookup)
      const bookings = await Promise.resolve(storageService.getBookings());
      let match: Booking | undefined;
      if (bookingId) {
        match = bookings.find((b) => b.id === bookingId);
      } else {
        match = bookings.find((b) => b.referenceCode === refCode);
      }

      if (match) {
        // 3. IMMEDIATE SERVER VALIDATION
        // We ask the DB: "Is this ticket allowed at this exact second?"
        try {
            await storageService.validateTicket(match.id);
            
            // --- IF SUCCESSFUL (VALID) ---
            setConfirmedResult(null);
            setPendingBooking(match);
            
            // Auto-select all guests by default
            const allIndices = new Set<number>();
            (match.attendeeNames ?? []).forEach((_, idx) => allIndices.add(idx));
            setAttendance(allIndices);
            
            setScanStatus('idle');
            setErrorMessage('');
            
        } catch (validationErr: any) {
            // --- IF FAILED (TOO EARLY / EXPIRED) ---
            setScanStatus('error');
            // The DB error message (e.g., "Too Early. Check-in opens at 14:15") is displayed directly
            setErrorMessage(validationErr.message || 'Ticket Invalid');
            setPendingBooking(null);
        }
      } else {
        setScanStatus('error');
        setErrorMessage('Ticket Not Found');
        setPendingBooking(null);
      }
    } catch {
      setScanStatus('error');
      setErrorMessage('Read Error');
      setPendingBooking(null);
    }
  };

  const toggleAttendance = (index: number) => {
    setAttendance((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

 // Find confirmCheckIn and replace with:
  const confirmCheckIn = async () => {
    if (!pendingBooking) return;

    try {
        const actualCount = attendance.size;
        
        // Use the guestIds mapped in storageService.getBookings
        const guestIds = pendingBooking.guestIds || [];
        
        // Filter IDs based on the selected indices
        const arrivedIds = guestIds.filter((_, idx) => attendance.has(idx));

        // Call RPC via Service
        await storageService.processCheckIn(pendingBooking.id, arrivedIds);

        setConfirmedResult({
            message:
                actualCount < pendingBooking.pax
                ? `Checked in ${actualCount}. ${pendingBooking.pax - actualCount} released.`
                : `Success. ${actualCount} checked in.`,
            count: actualCount,
        });

        setPendingBooking(null);
    } catch (e: any) {
        setErrorMessage(e?.message || "Check-in failed");
        setScanStatus('error');
    }
  };

  const cancelCheckIn = () => {
    setPendingBooking(null);
    setScanStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-90px)] flex flex-col md:flex-row bg-black">
      {/* Scanner Section */}
      <div
        className={`relative flex-grow md:w-1/2 bg-black border-r-2 border-white/20 ${
          pendingBooking ? 'opacity-20 pointer-events-none' : 'opacity-100'
        }`}
      >
        <QRScanner onScan={processCode} isActive={!pendingBooking} />
      </div>

      {/* Control Panel Section */}
      <div className="h-2/3 md:h-full md:w-1/2 bg-neutral-900 p-6 flex flex-col overflow-y-auto border-l-4 border-white">
        <div className="flex items-center justify-between mb-8 border-b-2 border-white pb-4">
          <h2 className="text-3xl font-maxwell font-bold uppercase tracking-tighter text-yellow-400">Gate Control</h2>
          <div className="w-3 h-3 bg-red-600 animate-pulse"></div>
        </div>

        {!pendingBooking && !confirmedResult && (
          <div className="flex mb-8">
            <input
              type="text"
              className="flex-grow bg-black border-2 border-white border-r-0 p-4 font-mono uppercase focus:border-yellow-400 outline-none text-white"
              placeholder="REF CODE..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && processCode(manualCode)}
            />
            <button
              onClick={() => processCode(manualCode)}
              className="bg-white text-black px-6 font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>
        )}

        {scanStatus === 'error' && !pendingBooking && (
          <div className="bg-red-600 text-white p-6 text-center border-2 border-white shadow-[8px_8px_0px_0px_#fff]">
            <XCircle className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-2xl font-maxwell font-bold uppercase">{errorMessage}</h3>
            <button onClick={() => setScanStatus('idle')} className="mt-4 text-xs font-bold uppercase underline">
              Reset Scanner
            </button>
          </div>
        )}

        {pendingBooking && (
          <div className="flex-grow flex flex-col animate-in slide-in-from-right-8 duration-300">
            <div className="mb-6 bg-black border-2 border-white p-4">
              <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest block mb-1">Pass Holder</span>
              <h3 className="text-3xl font-maxwell font-bold uppercase tracking-tighter leading-none text-white">
                {pendingBooking.visitorName}
              </h3>
              <div className="flex gap-4 mt-2 text-xs font-mono text-neutral-400 border-t border-neutral-800 pt-2">
                <span>{pendingBooking.time}</span>
                <span>REF: {pendingBooking.referenceCode}</span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase text-yellow-400">Roll Call</p>
                <span className="text-xs font-mono text-neutral-400">
                  ({attendance.size}/{pendingBooking.attendeeNames.length})
                </span>
              </div>

              {pendingBooking.attendeeNames.map((name, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleAttendance(idx)}
                  className={`p-4 border-2 flex items-center gap-4 cursor-pointer transition-all ${
                    attendance.has(idx)
                      ? 'border-yellow-400 bg-yellow-400 text-black'
                      : 'border-neutral-700 text-neutral-500 bg-black'
                  }`}
                >
                  {attendance.has(idx) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  <span className="font-bold uppercase font-mono text-sm">{name || `Pilot ${idx + 1}`}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-4">
              <button
                onClick={() => void confirmCheckIn()}
                className="w-full py-5 bg-red-600 text-white font-maxwell font-bold uppercase text-xl tracking-widest hover:bg-white hover:text-black transition-colors shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                Confirm Entry
              </button>
              <button
                onClick={cancelCheckIn}
                className="w-full py-3 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {confirmedResult && (
          <div className="text-center w-full animate-in zoom-in duration-300 flex flex-col items-center justify-center flex-grow">
            <div className="w-24 h-24 bg-yellow-400 text-black flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_#dc2626]">
              <UserCheck className="w-12 h-12" />
            </div>
            <h3 className="text-3xl font-maxwell font-bold uppercase mb-2 text-white">Verified</h3>
            <p className="font-mono text-sm text-neutral-400 mb-8 max-w-xs mx-auto">{confirmedResult.message}</p>
            <button
              onClick={() => setConfirmedResult(null)}
              className="bg-white text-black border-2 border-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Next Scan
            </button>
          </div>
        )}

        {!pendingBooking && !confirmedResult && scanStatus === 'idle' && (
          <div className="text-center text-neutral-600 mt-12">
            <Scan className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-mono text-xs uppercase">System Ready</p>
          </div>
        )}
      </div>
    </div>
  );
};
