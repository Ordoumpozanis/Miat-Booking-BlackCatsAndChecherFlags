// === src/app/components/StaffDashboard.tsx ===
'use client';

import React, { useMemo, useState } from 'react';
import { Scan, UserCheck, XCircle, Search, CheckSquare, Square, X } from 'lucide-react';
import { QRScanner } from './QRScanner';
import { storageService } from '../../services/storageService';
import { Booking } from '../../types';

export const StaffDashboard: React.FC = () => {
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  const [attendance, setAttendance] = useState<Set<number>>(new Set());
  const [scanStatus, setScanStatus] = useState<'idle' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [confirmedResult, setConfirmedResult] = useState<{ message: string; count: number } | null>(null);

  const isMobileCheckIn = !!pendingBooking;
  const isMobileVerified = !!confirmedResult;

  const scannerActive = useMemo(() => {
    // Scanner should only run when we are on the scanning screen
    return !pendingBooking && !confirmedResult;
  }, [pendingBooking, confirmedResult]);

  const clearError = () => {
    setScanStatus('idle');
    setErrorMessage('');
  };

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

      // Empty input guard
      if (!bookingId && (!refCode || refCode.length === 0)) {
        setScanStatus('error');
        setErrorMessage('Enter a code');
        return;
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
        try {
          await storageService.validateTicket(match.id);

          // VALID
          setConfirmedResult(null);
          setPendingBooking(match);

          // Auto-select all guests by default
          const allIndices = new Set<number>();
          (match.attendeeNames ?? []).forEach((_, idx) => allIndices.add(idx));
          setAttendance(allIndices);

          setScanStatus('idle');
          setErrorMessage('');
        } catch (validationErr: any) {
          setScanStatus('error');
          setErrorMessage(validationErr?.message || 'Ticket Invalid');
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

  const confirmCheckIn = async () => {
    if (!pendingBooking) return;

    try {
      const actualCount = attendance.size;

      const guestIds = pendingBooking.guestIds || [];
      const arrivedIds = guestIds.filter((_, idx) => attendance.has(idx));

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
      setErrorMessage(e?.message || 'Check-in failed');
      setScanStatus('error');
    }
  };

  const cancelCheckIn = () => {
    setPendingBooking(null);
    setConfirmedResult(null);
    setAttendance(new Set());
    clearError();
  };

  const ManualLookupRow = (
    <div className="flex w-full">
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
        aria-label="Find ticket"
      >
        <Search className="w-5 h-5" />
      </button>
    </div>
  );

  const ErrorModal = scanStatus === 'error' ? (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-neutral-900 border-4 border-red-600 shadow-[0_0_60px_rgba(220,38,38,0.35)] relative">
        <button
          onClick={clearError}
          className="absolute top-4 right-4 text-neutral-500 hover:text-white"
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-600">
            <XCircle className="w-9 h-9 text-red-500" />
          </div>

          <h3 className="text-2xl font-maxwell font-bold uppercase text-white mb-2">Not Accepted</h3>
          <p className="text-red-200 font-mono text-sm uppercase tracking-wide mb-6">{errorMessage}</p>

          <button
            onClick={clearError}
            className="w-full bg-white text-black font-bold uppercase py-4 tracking-widest hover:bg-red-600 hover:text-white transition-colors shadow-[4px_4px_0px_0px_#fff] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  ) : null;

  // =========================
  // MOBILE (2-step flow)
  // 1) Scan + manual lookup on one screen
  // 2) Result (roll call / verified) on a separate screen
  // Errors shown as modal
  // =========================
  const MobileView = (
    <div className="md:hidden flex flex-col h-[calc(100vh-80px)] bg-black">
      {!isMobileCheckIn && !isMobileVerified && (
        <>
          <div className="flex-1 border-b-2 border-white/20">
            <QRScanner onScan={processCode} isActive={scannerActive} />
          </div>

          <div className="bg-neutral-900 p-4 border-t-2 border-white/20">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Manual Lookup</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">REF CODE</div>
            </div>
            {ManualLookupRow}
          </div>

          {ErrorModal}
        </>
      )}

      {pendingBooking && (
        <div className="flex flex-col h-full bg-neutral-900">
          <div className="p-6 border-b-4 border-white bg-black">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-maxwell font-bold uppercase tracking-tighter text-yellow-400">
                Gate Control
              </h2>
              <button
                onClick={cancelCheckIn}
                className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white border border-white/30 px-3 py-2"
              >
                Close
              </button>
            </div>
            <div className="mt-4 bg-black border-2 border-white p-4">
              <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-widest block mb-1">
                Pass Holder
              </span>
              <h3 className="text-3xl font-maxwell font-bold uppercase tracking-tighter leading-none text-white">
                {pendingBooking.visitorName}
              </h3>
              <div className="flex gap-4 mt-2 text-xs font-mono text-neutral-400 border-t border-neutral-800 pt-2">
                <span>{pendingBooking.time}</span>
                <span>REF: {pendingBooking.referenceCode}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-2">
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

          <div className="p-6 border-t-2 border-white/20 bg-black space-y-3">
            <button
              onClick={() => void confirmCheckIn()}
              className="w-full py-5 bg-red-600 text-white font-maxwell font-bold uppercase text-xl tracking-widest hover:bg-white hover:text-black transition-colors shadow-[6px_6px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              Confirm Entry
            </button>
            <button
              onClick={cancelCheckIn}
              className="w-full py-3 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-white border border-white/20"
            >
              Cancel
            </button>
          </div>

          {ErrorModal}
        </div>
      )}

      {confirmedResult && (
        <div className="flex flex-col h-full bg-black">
          <div className="p-6 border-b-2 border-white/20 bg-black flex items-center justify-between">
            <h2 className="text-3xl font-maxwell font-bold uppercase tracking-tighter text-yellow-400">Verified</h2>
            <button
              onClick={() => {
                setConfirmedResult(null);
                clearError();
              }}
              className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white border border-white/30 px-3 py-2"
            >
              Close
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-yellow-400 text-black flex items-center justify-center mb-6 shadow-[8px_8px_0px_0px_#dc2626]">
              <UserCheck className="w-12 h-12" />
            </div>
            <p className="font-mono text-sm text-neutral-400 mb-8 max-w-xs mx-auto">{confirmedResult.message}</p>
            <button
              onClick={() => {
                setConfirmedResult(null);
                clearError();
              }}
              className="bg-white text-black border-2 border-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Next Scan
            </button>
          </div>

          {ErrorModal}
        </div>
      )}
    </div>
  );

  // =========================
  // DESKTOP (keep existing split)
  // =========================
  const DesktopView = (
    <div className="hidden md:flex h-[calc(100vh-90px)] md:h-[calc(100vh-90px)] flex-col md:flex-row bg-black">
      {/* Scanner Section */}
      <div
        className={`relative flex-grow md:w-1/2 bg-black border-r-2 border-white/20 ${
          pendingBooking ? 'opacity-20 pointer-events-none' : 'opacity-100'
        }`}
      >
        <QRScanner onScan={processCode} isActive={scannerActive} />
      </div>

      {/* Control Panel Section */}
      <div className="h-2/3 md:h-full md:w-1/2 bg-neutral-900 p-6 flex flex-col overflow-y-auto border-l-4 border-white">
        <div className="flex items-center justify-between mb-8 border-b-2 border-white pb-4">
          <h2 className="text-3xl font-maxwell font-bold uppercase tracking-tighter text-yellow-400">Gate Control</h2>
          <div className="w-3 h-3 bg-red-600 animate-pulse"></div>
        </div>

        {!pendingBooking && !confirmedResult && <div className="flex mb-8">{ManualLookupRow}</div>}

        {/* Desktop error stays inline (as before) */}
        {scanStatus === 'error' && !pendingBooking && (
          <div className="bg-red-600 text-white p-6 text-center border-2 border-white shadow-[8px_8px_0px_0px_#fff]">
            <XCircle className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-2xl font-maxwell font-bold uppercase">{errorMessage}</h3>
            <button onClick={clearError} className="mt-4 text-xs font-bold uppercase underline">
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

  return (
    <div className="bg-black">
      {DesktopView}
      {MobileView}
    </div>
  );
};
