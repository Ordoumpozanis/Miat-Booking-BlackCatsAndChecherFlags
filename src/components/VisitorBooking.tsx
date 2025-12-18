'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  Check,

  Calendar,
  ShieldCheck,
  Trophy,
  ChevronLeft,
  Clock,
  Zap,
  QrCode,
  X,
  AlertTriangle,
  Search,
  User
} from 'lucide-react';
import { Experience, Booking, Slot } from '../types';
import { storageService } from '../services/storageService';
import { bookingService } from '../services/bookingService';
import { generateQRImage } from './TicketPDF';
import { format } from 'date-fns';
import Image from 'next/image';

export const VisitorBooking: React.FC = () => {
  // Scene Control
  const [scene, setScene] = useState(1);
  const [pax, setPax] = useState(2);

  // Data State
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoadingExperiences, setIsLoadingExperiences] = useState(true);
  const [selectedExpId, setSelectedExpId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [nextSlots, setNextSlots] = useState<{ [key: string]: { label: string; available: boolean } }>({});
  const [slotsForDate, setSlotsForDate] = useState<Slot[]>([]);

  // User Input State
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [confirmedBookings, setConfirmedBookings] = useState<Booking[]>([]);

  // Cancellation State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelStep, setCancelStep] = useState<'INPUT' | 'CONFIRM' | 'SUCCESS'>('INPUT');
  const [cName, setCName] = useState(''); // Kept in state but unused in form to prevent TS errors if referenced elsewhere
  const [cEmail, setCEmail] = useState('');
  const [cRef, setCRef] = useState('');
  const [cError, setCError] = useState('');
  const [cLoading, setCLoading] = useState(false);
  const [ticketToCancel, setTicketToCancel] = useState<any>(null);

  // 1. Load Experiences
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoadingExperiences(true);

      const allExps = await Promise.resolve(storageService.getExperiences());
      const exps = allExps.filter((e) => e.isActive);

      if (cancelled) return;
      setExperiences(exps);

      const nextSlotMap: { [key: string]: { label: string; available: boolean } } = {};
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();

      const results = await Promise.all(
        exps.map(async (exp) => {
          const daySlots = await bookingService.generateSlotsForDateAsync(exp, todayStr);

          const upcoming = daySlots
            .filter((s) => s.startTime > now && s.remainingCapacity >= pax)
            .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

          if (upcoming.length > 0) {
            const next = upcoming[0];
            return [
              exp.id,
              {
                label: `NEXT: TODAY ${next.formattedTime}`,
                available: true,
              },
            ] as const;
          }

          const anyFuture = daySlots.filter((s) => s.startTime > now);
          return [
            exp.id,
            {
              label: anyFuture.length > 0 ? 'GROUP TOO LARGE' : 'NO SLOTS TODAY',
              available: false,
            },
          ] as const;
        })
      );

      for (const [id, status] of results) nextSlotMap[id] = status;

      if (cancelled) return;
      setNextSlots(nextSlotMap);
      setIsLoadingExperiences(false);
    };

    run();
    return () => { cancelled = true; };
  }, [pax, scene]);

  // 2. Load Slots
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (scene !== 4 || !selectedExpId) return;

      const freshExps = await Promise.resolve(storageService.getExperiences());
      const freshExp = freshExps.find((e) => e.id === selectedExpId);
      if (!freshExp) {
        if (!cancelled) setSlotsForDate([]);
        return;
      }

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const rawSlots = await bookingService.generateSlotsForDateAsync(freshExp, todayStr);
      
      const now = new Date();
      // Filter out passed slots based on local system time comparison for simplicity in UI
      const filtered = rawSlots.filter((s) => s.endTime > now);

      if (cancelled) return;
      setSlotsForDate(filtered);
    };

    run();
    return () => { cancelled = true; };
  }, [scene, selectedExpId]);

  // --- Cancellation Handlers ---
  const handleLookupTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCError('');
    setCLoading(true);

    try {
        const ticket = await bookingService.lookupBooking(cEmail.trim(), cRef.trim());
        
        if (!ticket) {
            setCError('Ticket not found. Check code or email.');
            setCLoading(false);
            return;
        }

        if (ticket.status === 'CANCELLED') {
            setCError('This ticket has already been cancelled.');
            setCLoading(false);
            return;
        }

        setTicketToCancel(ticket);
        setCancelStep('CONFIRM');
    } catch (err: any) {
        setCError(err.message || 'Lookup failed.');
    } finally {
        setCLoading(false);
    }
  };

  const handleFinalizeCancellation = async () => {
    setCLoading(true);
    try {
        const result = await bookingService.cancelBooking(cEmail.trim(), cRef.trim());
        
        if (result.success) {
            setCancelStep('SUCCESS');
        } else {
            setCError(result.message || 'Cancellation failed.');
        }
    } catch (err: any) {
        setCError(err.message || 'System error.');
    } finally {
        setCLoading(false);
    }
  };

  const closeCancelModal = () => {
      setIsCancelModalOpen(false);
      setCancelStep('INPUT');
      setCName('');
      setCEmail('');
      setCRef('');
      setCError('');
      setTicketToCancel(null);
  };

  // --- Booking Handler ---
  const handleValidationSubmit = async () => {
    if (!selectedSlot || !selectedExpId) return;

    const booking = await Promise.resolve(
      bookingService.createBooking(selectedSlot, pax, visitorName, visitorEmail, attendees)
    );

    setConfirmedBookings([booking]);
    setScene(7);
  };

  const selectedExpName = experiences.find((e) => e.id === selectedExpId)?.name;

  // --- SCENE 1: WELCOME ---
  if (scene === 1) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 relative overflow-hidden bg-black">
        <div className="absolute top-0 left-0 w-32 h-32 border-l-4 border-t-4 border-yellow-400/20"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-r-4 border-b-4 border-yellow-400/20"></div>

        <div className="mb-8 relative  max-w-sm flex justify-center">
          <Image
            src="/logo-bc.png"
            alt="Logo"
            width={200}
            height={80}
            className="w-full xl:w-3/12 md:w-full h-auto relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          />
        </div>

        <h1 className="text-6xl md:text-8xl !font-revolution font-bold tracking-tighter mb-6 uppercase leading-[0.9] text-yellow-400">
          The Legend <br />
          <span className="text-white !font-revolution">Awaits</span>
        </h1>

        <div className="w-24 h-1 bg-yellow-400 mb-8 mx-auto"></div>

        <p className="text-xl md:text-2xl text-neutral-100 max-w-2xl font-light mb-12 tracking-wide font-maxwell uppercase mx-auto">
          Step into the mind of Alberto Ascari.
          <br />
          Race against destiny.
        </p>

        <button
          onClick={() => setScene(2)}
          className="group relative px-16 py-6 bg-red-600 text-white !font-revolution font-bold text-xl tracking-[0.2em] uppercase overflow-hidden hover:bg-white hover:text-black transition-colors shadow-[8px_8px_0px_0px_#facc15] hover:shadow-[4px_4px_0px_0px_#facc15] hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          Enter Experience
        </button>

        <button
            onClick={() => setIsCancelModalOpen(true)}
            className="mt-12 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-red-500 border-b border-transparent hover:border-red-500 pb-1 transition-all"
        >
            Cancel Ticket
        </button>

        {isCancelModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="w-full max-w-md bg-neutral-900 border-2 border-white relative shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                    <button 
                        onClick={closeCancelModal}
                        className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    <div className="p-8 text-left">
                        <h3 className="text-3xl font-maxwell font-bold uppercase text-red-600 mb-2">Cancel Ticket</h3>
                        <div className="h-1 w-12 bg-white mb-6"></div>

                        {cancelStep === 'INPUT' && (
                            <form onSubmit={handleLookupTicket} className="space-y-4">
                                <p className="text-sm font-mono text-neutral-400 mb-4">
                                    Enter details exactly as they appear on your ticket.
                                </p>
                                
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Booking Ref (6 Chars)</label>
                                    <input 
                                        required
                                        maxLength={6}
                                        value={cRef}
                                        onChange={(e) => setCRef(e.target.value.toUpperCase())}
                                        className="w-full bg-black border border-neutral-700 p-3 font-mono text-lg text-white uppercase focus:border-red-600 outline-none"
                                        placeholder="EX: A1B2C3"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">Email Address</label>
                                    <input 
                                        required
                                        type="email"
                                        value={cEmail}
                                        onChange={(e) => setCEmail(e.target.value)}
                                        className="w-full bg-black border border-neutral-700 p-3 font-mono text-sm text-white focus:border-red-600 outline-none"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                {cError && (
                                    <div className="bg-red-900/30 border border-red-600 text-red-200 text-xs font-mono p-3 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> {cError}
                                    </div>
                                )}

                                <button 
                                    type="submit"
                                    disabled={cLoading}
                                    className="w-full bg-white text-black font-bold uppercase py-4 tracking-widest hover:bg-red-600 hover:text-white transition-colors mt-4 flex justify-center gap-2 disabled:opacity-50"
                                >
                                    {cLoading ? 'Searching...' : <><Search className="w-4 h-4" /> Find Ticket</>}
                                </button>
                            </form>
                        )}

                        {cancelStep === 'CONFIRM' && ticketToCancel && (
                            <div className="space-y-6 animate-in slide-in-from-right-8">
                                <div className="bg-black border border-neutral-700 p-4">
                                    <div className="text-xs font-bold uppercase text-neutral-500 mb-1">Ticket Found</div>
                                    <div className="text-xl font-bold uppercase text-white mb-1">{ticketToCancel.title}</div>
                                    <div className="font-mono text-yellow-400">
                                        {format(new Date(ticketToCancel.date), 'dd MMM yyyy')} @ {ticketToCancel.time}
                                    </div>
                                </div>

                                <div className="text-neutral-300 text-sm font-medium border-l-2 border-red-600 pl-4 py-1">
                                    Are you sure? This action is <span className="text-white font-bold uppercase">permanent</span>. 
                                    Your spot will be immediately released to other visitors.
                                </div>

                                {cError && (
                                    <div className="bg-red-900/30 border border-red-600 text-red-200 text-xs font-mono p-3">
                                        {cError}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => setCancelStep('INPUT')}
                                        className="w-1/2 border border-white text-white font-bold uppercase py-3 hover:bg-white hover:text-black"
                                    >
                                        Back
                                    </button>
                                    <button 
                                        onClick={handleFinalizeCancellation}
                                        disabled={cLoading}
                                        className="w-1/2 bg-red-600 text-white font-bold uppercase py-3 hover:bg-red-700 disabled:opacity-50"
                                    >
                                        {cLoading ? 'Processing...' : 'Confirm Cancel'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {cancelStep === 'SUCCESS' && (
                            <div className="text-center py-8 animate-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-neutral-600">
                                    <X className="w-8 h-8 text-neutral-400" />
                                </div>
                                <h4 className="text-2xl font-maxwell font-bold uppercase text-white mb-2">Ticket Cancelled</h4>
                                <p className="text-neutral-400 text-sm mb-8">
                                    Your booking has been removed. We hope to see you another time.
                                </p>
                                <button 
                                    onClick={closeCancelModal}
                                    className="border-b border-white text-white font-bold uppercase pb-1 hover:text-yellow-400 hover:border-yellow-400"
                                >
                                    Close Window
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // --- SCENE 2: CREW SIZE ---
  if (scene === 2) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 animate-in slide-in-from-right-8 duration-500 bg-black">
        <h2 className="text-5xl !font-revolution font-bold tracking-tighter mb-6 uppercase leading-[0.9] text-yellow-400">
          Crew Size
        </h2>
        <p className="text-white mb-12 text-center max-w-md uppercase !font-bold font-revolution tracking-widest text-sm">
          Select your mechanics count
        </p>

        <div className="flex items-center gap-4 mb-12 select-none">
          <button
            onClick={() => setPax(Math.max(1, pax - 1))}
            className="w-20 h-20 border-2 border-white text-4xl text-white hover:bg-white hover:text-black transition flex items-center justify-center font-maxwell font-bold"
          >
            −
          </button>

          <div className="flex flex-col items-center w-40 py-4 border-t-2 border-b-2 border-white bg-neutral-900">
            <span className="text-8xl font-maxwell font-bold tracking-tighter leading-none text-white">{pax}</span>
            <span className="text-[10px] font-bold uppercase text-yellow-400 tracking-[0.3em]">PEOPLE</span>
          </div>

          <button
            onClick={() => setPax(pax + 1)}
            className="w-20 h-20 bg-white text-black text-4xl hover:bg-yellow-400 transition flex items-center justify-center font-maxwell font-bold shadow-[4px_4px_0px_0px_#dc2626]"
          >
            +
          </button>
        </div>

        <div className="w-full max-w-xs space-y-2 mb-8">
          <div className="flex items-center justify-between border border-white/50 bg-neutral-900/50 px-5 py-3 backdrop-blur-sm shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
             <span className="font-revolution text-white font-bold tracking-wider text-sm mt-0.5">The Pit Lane</span>
             <div className="flex items-center gap-1.5 font-maxwell text-xl leading-none text-white">
               <User className="w-5 h-5 text-neutral-400" strokeWidth={2.5} />
               <span className="text-[10px] text-neutral-500 font-bold font-sans">X</span>
               <span className="mt-0.5">4</span>
             </div>
          </div>
          <div className="flex items-center justify-between border border-white/50 bg-neutral-900/50 px-5 py-3 backdrop-blur-sm shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)]">
             <span className="font-revolution text-white font-bold tracking-wider text-sm mt-0.5">The Prophecy</span>
             <div className="flex items-center gap-1.5 font-maxwell text-xl leading-none text-white">
               <User className="w-5 h-5 text-neutral-400" strokeWidth={2.5} />
               <span className="text-[10px] text-neutral-500 font-bold font-sans">X</span>
               <span className="mt-0.5">12</span>
             </div>
          </div>
        </div>

        <button
          onClick={() => setScene(3)}
          className="w-full max-w-xs bg-red-600 text-white py-5 font-revolution font-bold text-xl tracking-widest uppercase hover:bg-white hover:text-black transition-colors shadow-[8px_8px_0px_0px_#fff] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px]"
        >
          Confirm Size
        </button>
      </div>
    );
  }

  // --- SCENE 3: EXPERIENCE SELECTION ---
  if (scene === 3) {
    if (isLoadingExperiences) {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-12 text-center font-maxwell text-3xl uppercase text-white">
          Loading Experiences…
        </div>
      );
    }

    if (experiences.length === 0) {
      return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-12 text-center font-maxwell font-revolution text-3xl uppercase text-white">
          No Experiences Loaded
        </div>
      );
    }

    const primaryExp = experiences[0];
    const secondaryExp = experiences[1] || experiences[0];
    const exp1Status = nextSlots[primaryExp.id] || { label: 'Checking...', available: false };
    const exp2Status = nextSlots[secondaryExp.id] || { label: 'Checking...', available: false };

    const isExp1Disabled = !exp1Status.available || pax > primaryExp.maxCapacity;
    const isExp2Disabled = !exp2Status.available || pax > secondaryExp.maxCapacity;

    return (
      <div className="max-w-6xl mx-auto p-6 animate-in fade-in duration-500">
        <button
          onClick={() => setScene(2)}
          className="mb-8 flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 hover:text-white uppercase group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Crew
        </button>

        <div className="mb-12 border-b-4 border-white pb-6">
          <h2 className="text-6xl md:text-8xl !font-revolution font-bold uppercase tracking-tighter mb-2 text-yellow-400">
            Select Mode
          </h2>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-red-600"></div>
            <p className="font-maxwell font-bold uppercase tracking-widest text-sm text-white">Choose your entry point</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* EXP 1 */}
          <div
            onClick={() => {
              if (!isExp1Disabled) {
                setSelectedExpId(primaryExp.id);
                setScene(4);
              }
            }}
            className={`group relative border-2 border-white p-8 transition-all duration-300 flex flex-col min-h-[500px]
              ${
                isExp1Disabled
                  ? 'bg-neutral-900 opacity-60 cursor-not-allowed pattern-diagonal-lines'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer shadow-[12px_12px_0px_0px_#dc2626] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[16px_16px_0px_0px_#dc2626]'
              }`}
          >
            <div className="flex justify-between items-start mb-12">
              <ShieldCheck className={`w-16 h-16 ${isExp1Disabled ? 'text-neutral-600' : 'text-white'}`} strokeWidth={1} />
              <span
                className={`text-[10px] font-bold border border-current px-2 py-1 uppercase tracking-widest ${
                  isExp1Disabled ? 'text-neutral-500' : 'text-yellow-400 border-yellow-400'
                }`}
              >
                Multiplayer
              </span>
            </div>

            <h3 className="text-4xl !font-revolution font-bold uppercase tracking-tighter mb-4 leading-none text-white">
              The Pit Lane
            </h3>
            <p className={`text-sm font-mono leading-relaxed mb-8 flex-grow ${isExp1Disabled ? 'text-neutral-500' : 'text-neutral-400'}`}>
              // TEAM SYNC REQUIRED
              <br />
              Suit up as a 1950s mechanic. Change tires, refuel, and work as a unit. High intensity collaboration.
            </p>

            <div className="mt-auto pt-6 border-t border-white/20">
              <div className="flex justify-between items-center">
                <span className={`font-mono text-xs uppercase ${isExp1Disabled ? 'text-red-600 font-bold' : 'text-green-400'}`}>
                  {pax > primaryExp.maxCapacity ? `MAX ${primaryExp.maxCapacity} PAX` : exp1Status.label}
                </span>
                {!isExp1Disabled && <ArrowRight className="w-6 h-6 text-yellow-400 group-hover:translate-x-2 transition-transform" />}
              </div>
            </div>
          </div>

          {/* EXP 2 */}
          <div
            onClick={() => {
              if (!isExp2Disabled) {
                setSelectedExpId(secondaryExp.id);
                setScene(4);
              }
            }}
            className={`group relative border-2 border-white p-8 transition-all duration-300 flex flex-col min-h-[500px] bg-white text-black
              ${
                isExp2Disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer shadow-[12px_12px_0px_0px_#facc15] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[16px_16px_0px_0px_#facc15]'
              }`}
          >
            <div className="flex justify-between items-start mb-12">
              <Trophy className="w-16 h-16 text-black" strokeWidth={1} />
              <span className="text-[10px] font-bold border border-black px-2 py-1 uppercase tracking-widest bg-black text-white">
                Cinematic
              </span>
            </div>

            <h3 className="text-4xl !font-revolution font-bold uppercase tracking-tighter mb-4 leading-none text-black">The Prophecy</h3>
            <p className="text-sm font-mono leading-relaxed mb-8 flex-grow text-neutral-800">
              // OBSERVER MODE
              <br />
              Immerse yourself directly in the cinematic VR story. No pit duties. Pure narrative experience.
            </p>

            <div className="mt-auto pt-6 border-t border-black/10">
              <div className="flex justify-between items-center">
                <span className={`font-mono text-xs uppercase ${isExp2Disabled ? 'text-red-600 font-bold' : 'text-green-600'}`}>
                  {pax > secondaryExp.maxCapacity ? `MAX ${secondaryExp.maxCapacity} PAX` : exp2Status.label}
                </span>
                {!isExp2Disabled && <ArrowRight className="w-6 h-6 text-black group-hover:translate-x-2 transition-transform" />}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- SCENE 4: SLOT SELECTION ---
  if (scene === 4) {
    return (
      <div className="max-w-4xl mx-auto p-6 animate-in slide-in-from-right-8 duration-500">
        <button
          onClick={() => setScene(3)}
          className="mb-8 flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 hover:text-white uppercase group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Return to Mode
        </button>

        <div className="flex justify-between items-end mb-8 border-b-4 border-white pb-4">
          <div>
            <h2 className="text-5xl md:text-7xl !font-revolution font-bold uppercase tracking-tighter text-yellow-400">Schedule</h2>
            <div className="flex items-center gap-2 mt-2">
              <Calendar className="w-4 h-4 text-red-600" />
              <span className="text-sm font-bold uppercase tracking-widest font-maxwell text-white">
                {format(new Date(), 'MMMM d, yyyy')}
              </span>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <div className="text-xs font-bold uppercase tracking-widest text-neutral-500">Event Time</div>
            <div className="font-mono font-bold text-white uppercase">
                {experiences.find(e => e.id === selectedExpId)?.timezone || 'UTC'}
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border-2 border-white shadow-[8px_8px_0px_0px_#333]">
          <div className="grid grid-cols-12 bg-white text-black p-3 text-[10px] font-bold uppercase tracking-widest">
            <div className="col-span-3">Start Time</div>
            <div className="col-span-6">Status</div>
            <div className="col-span-3 text-right">Action</div>
          </div>

          <div className="divide-y-2 divide-neutral-800">
            {slotsForDate.length === 0 ? (
              <div className="p-16 text-center">
                <Clock className="w-12 h-12 mx-auto text-neutral-600 mb-4" />
                <p className="font-maxwell font-bold uppercase text-xl text-neutral-500">Track Closed</p>
              </div>
            ) : (
              slotsForDate.map((slot) => {
                const isPassed = slot.status === 'PASSED';
                const cantFit = slot.remainingCapacity < pax;
                const isDisabled = isPassed || cantFit;

                return (
                  <div
                    key={slot.id}
                    className={`grid grid-cols-12 items-center p-5 transition-all group ${
                      isDisabled ? 'bg-black text-neutral-600' : 'hover:bg-neutral-800 cursor-pointer text-white'
                    }`}
                    onClick={() => {
                      if (!isDisabled) {
                        setSelectedSlot(slot);
                        setAttendees(Array(pax).fill(''));
                        setScene(5);
                      }
                    }}
                  >
                    {/* Time displayed safely using string from DB */}
                    <div className="col-span-3 font-mono text-xl font-bold tracking-tighter">{slot.formattedTime}</div>

                    <div className="col-span-6">
                      {isPassed ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 line-through">Departed</span>
                      ) : cantFit ? (
                        slot.remainingCapacity === 0 ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">Full Grid</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">
                            Only {slot.remainingCapacity} Seats
                          </span>
                        )
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-none animate-pulse"></div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">Available</span>
                        </div>
                      )}
                    </div>

                    <div className="col-span-3 flex justify-end">
                      {!isDisabled && (
                        <div className="bg-white text-black p-2 group-hover:bg-yellow-400 transition-colors">
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- SCENE 5: REGISTRATION ---
  if (scene === 5 && selectedSlot) {
    return (
      <div className="max-w-3xl mx-auto p-6 animate-in slide-in-from-right-8 duration-500">
        <button
          onClick={() => setScene(4)}
          className="mb-8 flex items-center gap-2 text-xs font-bold tracking-widest text-neutral-500 hover:text-white uppercase group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Schedule
        </button>

        <div className="mb-8 border-b-4 border-white pb-4">
          <h2 className="text-5xl md:text-5xl !font-revolution font-bold uppercase tracking-tighter text-yellow-400">Driver Details</h2>
          <p className="font-mono text-xs mt-2 text-neutral-500">// MANDATORY TELEMETRY DATA</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <div className="bg-neutral-900 border-2 border-white p-6 shadow-[8px_8px_0px_0px_#333]">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-neutral-700 pb-2 flex items-center gap-2 text-white">
                <Zap className="w-4 h-4 text-yellow-400" /> Team Principle
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400 mb-1 block">Full Name</label>
                  <input
                    required
                    className="w-full bg-black border-b-2 border-neutral-700 p-3 font-mono text-sm focus:border-yellow-400 focus:bg-neutral-800 outline-none transition uppercase placeholder-neutral-700 text-white"
                    placeholder="ENTER NAME"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-neutral-400 mb-1 block">Contact Email</label>
                  <input
                    required
                    type="email"
                    className="w-full bg-black border-b-2 border-neutral-700 p-3 font-mono text-sm focus:border-yellow-400 focus:bg-neutral-800 outline-none transition uppercase placeholder-neutral-700 text-white"
                    placeholder="ENTER EMAIL"
                    value={visitorEmail}
                    onChange={(e) => setVisitorEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border-2 border-white p-6 shadow-[8px_8px_0px_0px_#333]">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6 border-b border-neutral-700 pb-2 text-white">
                Drivers ({pax})
              </h3>
              <div className="space-y-3">
                {attendees.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-[10px] font-bold uppercase w-12 text-right text-neutral-500 font-mono">0{idx + 1}</span>
                    <input
                      required
                      className="flex-grow bg-black border-b-2 border-neutral-700 p-2 font-mono text-sm focus:border-yellow-400 outline-none transition uppercase placeholder-neutral-700 text-white"
                      placeholder="PILOT NAME"
                      value={name}
                      onChange={(e) => {
                        const next = [...attendees];
                        next[idx] = e.target.value;
                        setAttendees(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-white text-black p-6 sticky top-24 border-2 border-white">
              <h4 className="font-maxwell font-revolution font-bold uppercase text-2xl mb-4 border-b border-black/20 pb-4">Summary</h4>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Date</span>
                  <span className="font-bold">{format(selectedSlot.startTime, 'dd.MM.yy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Time</span>
                  <span className="font-bold">{selectedSlot.formattedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Pax</span>
                  <span className="font-bold">{pax}</span>
                </div>
              </div>
              <button
                disabled={!visitorName || !visitorEmail || attendees.some((a) => !a)}
                onClick={() => setScene(6)}
                className="w-full mt-8 bg-red-600 text-white py-4 !font-revolution font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- SCENE 6: VALIDATION ---
  if (scene === 6 && selectedSlot) {
    return (
      <div className="max-w-2xl mx-auto p-6 animate-in zoom-in-95 duration-500">
        <h2 className="text-5xl !font-revolution font-bold uppercase tracking-tighter mb-8 text-center text-yellow-400">Safety Check</h2>

        <div className="bg-neutral-900 border-2 border-white p-8 relative overflow-hidden mb-8 shadow-[12px_12px_0px_0px_#fff]">
          <div className="space-y-6 relative z-10 text-white">
            <div className="flex justify-between border-b-2 border-dashed border-neutral-700 pb-4">
              <span className="text-xs font-bold uppercase text-neutral-400 tracking-widest">Event</span>
              <span className="font-bold uppercase font-maxwell tracking-wide text-yellow-400">Black Cats & Chequered Flags</span>
            </div>
            <div className="flex justify-between border-b-2 border-dashed border-neutral-700 pb-4">
              <span className="text-xs font-bold uppercase text-neutral-400 tracking-widest">Experience</span>
              <span className="font-bold uppercase font-maxwell tracking-wide">{selectedExpName}</span>
            </div>
            <div className="flex justify-between border-b-2 border-dashed border-neutral-700 pb-4">
              <span className="text-xs font-bold uppercase text-neutral-400 tracking-widest">Launch</span>
              <div className="text-right">
                <div className="font-bold uppercase font-mono text-xl">{selectedSlot.formattedTime}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-4 mb-8 p-6 bg-neutral-900 border border-neutral-700">
          <div
            onClick={() => setAgreedToTerms(!agreedToTerms)}
            className={`mt-1 flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center cursor-pointer ${
              agreedToTerms ? 'bg-yellow-400 border-yellow-400 text-black' : 'border-white bg-black'
            }`}
          >
            {agreedToTerms && <Check className="w-4 h-4" />}
          </div>
          <p
            className="text-sm font-medium leading-relaxed cursor-pointer select-none text-neutral-300"
            onClick={() => setAgreedToTerms(!agreedToTerms)}
          >
            <span className="font-bold uppercase block mb-1 text-white">Email Consent</span>I agree to provide my email address which
            will be used only for booking confirmation.
          </p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setScene(5)}
            className="w-1/3 bg-black border-2 border-white text-white font-bold uppercase tracking-widest py-5 hover:bg-neutral-800"
          >
            Back
          </button>
          <button
            disabled={!agreedToTerms}
            onClick={handleValidationSubmit}
            className="w-2/3 bg-red-600 text-white !font-revolution  font-bold uppercase text-lg tracking-widest py-5 hover:bg-white hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-[8px_8px_0px_0px_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_#fff] transition-all"
          >
            Authorize Entry
          </button>
        </div>
      </div>
    );
  }

  // --- SCENE 7: TICKET ---
  if (scene === 7 && confirmedBookings.length > 0) {
    const booking = confirmedBookings[0];
    const expName = experiences.find((e) => e.id === booking.experienceId)?.name || 'The Legend';
    const tz = experiences.find((e) => e.id === booking.experienceId)?.timezone || 'UTC';

    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-700">
        <div className="mb-10">
          <h2 className="text-7xl md:text-9xl !font-revolution  font-bold uppercase tracking-tighter leading-none mb-2 text-yellow-400">
            Access
            <br />
            Granted
          </h2>
          <p className="text-xl font-mono uppercase tracking-widest mt-4 text-white">See you on the grid.</p>
        </div>

        <div className="bg-white p-8 max-w-sm w-full border-4 border-double border-black shadow-[0_0_50px_rgba(255,255,255,0.2)] rotate-1 hover:rotate-0 transition-transform duration-500 relative text-black">
          <div className="border-2 border-black p-6 text-center">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 border-b-2 border-black pb-2">Scuderia Pass</div>

            <div className="w-40 h-40 bg-black mx-auto mb-6 flex items-center justify-center text-white">
              <Check className="w-20 h-20" />
            </div>

            <div className="font-mono text-3xl font-bold tracking-widest mb-1">{booking.referenceCode}</div>
            <div className="text-[10px] uppercase text-neutral-500 mb-8">Experience Pass Identifier</div>

            <div className="text-sm font-bold uppercase border-t-2 border-black pt-4 flex justify-between">
              <span>{format(new Date(booking.date), 'dd.MM.yy')}</span>
              <span>{booking.time} HRS</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 mt-8 w-full max-w-sm">
          <button
            onClick={() => generateQRImage(booking, expName, tz)}
            className="bg-neutral-900 border-2 border-white text-white font-bold uppercase py-4 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" /> Save QR Code (Image)
          </button>
        </div>

        <button
          onClick={() => {
            setScene(1);
            setPax(1);
            setConfirmedBookings([]);
            setVisitorName('');
            setVisitorEmail('');
            setAttendees([]);
            setAgreedToTerms(false);
            setSelectedExpId(null);
            setSelectedSlot(null);
          }}
          className="mt-8 text-xs font-bold uppercase tracking-widest border-b-2 border-white pb-1 text-white hover:text-yellow-400 hover:border-yellow-400 transition-colors"
        >
          Book Another Session
        </button>
      </div>
    );
  }

  return null;
};