'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Trash2, Lock, Unlock, AlertOctagon, RotateCcw, AlertTriangle, X} from 'lucide-react'; // Added icons
import { Experience, TimeInterval } from '../../types';
import { storageService } from '../../services/storageService';
import { bookingService } from '../../services/bookingService';
import { format } from 'date-fns';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'experiences'>('experiences');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedExpId, setSelectedExpId] = useState<string>('');

  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string>('');

   
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const selectedExp = useMemo(() => experiences.find((e) => e.id === selectedExpId) ?? null, [experiences, selectedExpId]);

  useEffect(() => {
    void refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshData = async () => {
    const exps = await Promise.resolve(storageService.getExperiences());
    setExperiences(exps);

    setSelectedExpId((prev) => {
      if (prev) {
        const stillExists = exps.some((e) => e.id === prev);
        if (stillExists) return prev;
      }
      return exps[0]?.id ?? '';
    });
  };

  const loadSlotsForSelected = async () => {
    if (activeTab !== 'schedule') return;

    if (!selectedExpId) {
      setSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSlotsError('');

    try {
      const freshExps = await storageService.getExperiences();
      const freshExp = freshExps.find((e) => e.id === selectedExpId);

      if (!freshExp) {
        setSlots([]);
        return;
      }

      // This fetches slots (including isBlocked status)
      const result = await bookingService.generateSlotsForDateAsync(freshExp, selectedDate);
      setSlots(result as any[]);
    } catch (e: any) {
      setSlots([]);
      setSlotsError(e?.message ?? 'Failed to load slots');
    } finally {
      setLoadingSlots(false);
    }
  };

  // --- NEW: Toggle Block Status ---
  const handleToggleBlock = async (slotId: string, currentStatus: boolean) => {
    try {
      // Optimistic UI update (optional, but makes it snappy)
      setSlots((prev) => 
        prev.map(s => s.id === slotId ? { ...s, isBlocked: !currentStatus } : s)
      );

      // Call DB
      await storageService.toggleSlotBlock(slotId, !currentStatus);
      
      // Reload to ensure sync
      await loadSlotsForSelected();
    } catch (e: any) {
      alert("Error updating slot: " + e.message);
      void loadSlotsForSelected(); // Revert on error
    }
  };

  const handleSystemReset = async () => {
    setIsResetting(true);
    try {
        await storageService.resetSystem();
        // Clear local state immediately
        setExperiences([]);
        setSlots([]);
        setSelectedExpId('');
        setShowResetModal(false);
        alert("System has been successfully reset.");
        await refreshData(); // Will likely return empty
    } catch (e: any) {
        alert("Reset Failed: " + e.message);
    } finally {
        setIsResetting(false);
    }
  };
  
  useEffect(() => {
    void loadSlotsForSelected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedExpId, selectedDate]);

  const handleInitDefaults = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextYear = format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd');

    const ex1: Experience = {
      id: '', 
      name: ' Immersive Experience',
      description: 'COLLABORATIVE EXPERIENCE',
      timezone: 'Europe/Rome',
      maxCapacity: 4,
      durationMinutes: 30,
      offsetMinutes: 15,
      color: 'bg-blue-600',
      isActive: true,
      startDate: today,
      endDate: nextYear,
      timeIntervals: [{ startTime: '09:00', endTime: '15:30' }],
    };

    const ex2: Experience = {
      id: '', 
      name: 'VR Experience',
      description: 'SINGLE USER EXPERIENCE',
      timezone: 'Europe/Rome',
      maxCapacity: 12,
      durationMinutes: 20,
      offsetMinutes: 10,
      color: 'bg-emerald-600',
      isActive: true,
      startDate: today,
      endDate: nextYear,
      timeIntervals: [{ startTime: '09:30', endTime: '15:30' }],
    };

    try {
        await storageService.updateExperience(ex1);
        await storageService.updateExperience(ex2);
        await refreshData();
        alert("Defaults loaded!");
    } catch(e: any) {
        alert("Error: " + e.message);
    }
  };

  const handleAddExperience = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextYear = format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd');

    const newExp: Experience = {
      id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 11),
      name: 'New Experience',
      description: 'Description',
      timezone: 'UTC',
      maxCapacity: 5,
      durationMinutes: 30,
      offsetMinutes: 15,
      color: 'bg-black',
      isActive: true,
      startDate: today,
      endDate: nextYear,
      timeIntervals: [{ startTime: '09:00', endTime: '17:00' }],
    };

    await Promise.resolve(storageService.updateExperience(newExp));
    await refreshData();
  };

  const handleDeleteExperience = async (id: string) => {
    if (!confirm('Delete this experience?')) return;
    await Promise.resolve(storageService.deleteExperience(id));
    await refreshData();
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans bg-black text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b-4 border-white pb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-maxwell font-bold uppercase tracking-tighter mb-2 text-yellow-400">
            Control Tower
          </h1>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button
            onClick={() => setActiveTab('experiences')}
            className={`px-6 py-2 text-sm font-bold uppercase tracking-widest border-2 border-white transition-all ${
              activeTab === 'experiences' ? 'bg-white text-black' : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            Experiences
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-2 text-sm font-bold uppercase tracking-widest border-2 border-white transition-all ${
              activeTab === 'schedule' ? 'bg-white text-black' : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            Calendar
          </button>

          {/* --- NEW: RESET BUTTON ADDED HERE --- */}
          <button
            onClick={() => setShowResetModal(true)}
            className="px-6 py-2 text-sm font-bold uppercase tracking-widest border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 ml-4"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
        </div>
      </div>

      {activeTab === 'experiences' && (
        <div className="space-y-6">
          {experiences.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-neutral-700 text-center">
              <button
                onClick={() => void handleInitDefaults()}
                className="bg-red-600 text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                Load Defaults
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {experiences.map((exp) => (
                <ExperienceCard
                  key={exp.id}
                  experience={exp}
                  onDelete={() => void handleDeleteExperience(exp.id)}
                  onUpdate={() => void refreshData()}
                />
              ))}
              <button
                onClick={() => void handleAddExperience()}
                className="w-full py-4 border-2 border-dashed border-neutral-700 text-neutral-500 font-bold uppercase tracking-widest hover:border-white hover:text-white transition-colors"
              >
                + Create New Experience
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="bg-neutral-900 border-2 border-white shadow-[8px_8px_0px_0px_#333]">
          <div className="p-4 border-b-2 border-white bg-black flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2">
              {experiences.map((exp) => (
                <button
                  key={exp.id}
                  onClick={() => setSelectedExpId(exp.id)}
                  className={`px-4 py-1 text-xs font-bold uppercase tracking-widest border-2 transition-all ${
                    selectedExpId === exp.id
                      ? 'bg-yellow-400 text-black border-yellow-400'
                      : 'bg-black text-white border-white hover:bg-neutral-800'
                  }`}
                >
                  {exp.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-black text-white border-2 border-white px-3 py-1 font-mono text-sm uppercase outline-none"
              />
              <button
                onClick={() => void loadSlotsForSelected()}
                className="px-4 py-2 border-2 border-white bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-yellow-400"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {!selectedExp ? (
              <div className="p-12 text-center text-neutral-500 font-mono uppercase">Select an experience</div>
            ) : loadingSlots ? (
              <div className="p-12 text-center text-neutral-500 font-mono uppercase">Loading…</div>
            ) : slotsError ? (
              <div className="p-12 text-center text-red-400 font-mono uppercase">{slotsError}</div>
            ) : slots.length === 0 ? (
              <div className="p-12 text-center text-neutral-500 font-mono uppercase">No slots available for this date</div>
            ) : (
              <table className="w-full text-left border-collapse text-white">
                <thead className="bg-white text-black text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Load</th>
                    <th className="p-3">Capacity</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {slots.map((slot: any) => {
                    // Visual state for blocked slots
                    const rowClass = slot.isBlocked 
                        ? 'bg-[repeating-linear-gradient(45deg,#262626,#262626_10px,#171717_10px,#171717_20px)] text-neutral-500' 
                        : 'hover:bg-neutral-800';

                    return (
                        <tr key={slot.id} className={`${rowClass} font-mono text-sm transition-colors`}>
                        <td className="p-3 font-bold">
                            {slot.formattedTime}
                        </td>
                        <td className="p-3 uppercase text-xs">
                            {slot.isBlocked ? (
                                <span className="text-red-500 font-bold flex items-center gap-1">
                                    <AlertOctagon className="w-3 h-3" /> BLOCKED
                                </span>
                            ) : (
                                slot.status
                            )}
                        </td>
                        <td className="p-3 text-center">
                            {slot.currentBookings}/{slot.maxCapacity}
                        </td>
                        <td className="p-3">
                            <div className="w-full bg-neutral-800 h-2">
                            <div
                                className={`h-full ${slot.status === 'FULL' || slot.isBlocked ? 'bg-red-600' : 'bg-yellow-400'}`}
                                style={{ width: `${slot.isBlocked ? 100 : (slot.currentBookings / slot.maxCapacity) * 100}%` }}
                            />
                            </div>
                        </td>
                        <td className="p-3 text-right">
                            <button
                                onClick={() => handleToggleBlock(slot.id, slot.isBlocked)}
                                title={slot.isBlocked ? "Unblock Slot" : "Block Slot"}
                                className={`p-2 border transition-all ${
                                    slot.isBlocked 
                                    ? 'border-green-600 text-green-500 hover:bg-green-600 hover:text-white' 
                                    : 'border-neutral-600 text-neutral-400 hover:border-red-500 hover:text-red-500'
                                }`}
                            >
                                {slot.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            </button>
                        </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {/* --- NEW: RESET CONFIRMATION MODAL --- */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-neutral-900 border-4 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.4)] relative">
                <button 
                    onClick={() => setShowResetModal(false)}
                    className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="p-4 bg-red-600/20 rounded-full border-2 border-red-600">
                            <AlertTriangle className="w-12 h-12 text-red-600" />
                        </div>
                    </div>
                    
                    <h3 className="text-3xl font-maxwell font-bold uppercase text-white mb-4">Factory Reset</h3>
                    
                    <p className="text-neutral-300 text-sm mb-2 font-bold">
                        DANGER: THIS ACTION IS IRREVERSIBLE.
                    </p>
                    <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
                        You are about to delete <strong className="text-white">ALL</strong> Experiences, Bookings, Guest Lists, and Schedules. 
                        The system will be completely wiped clean for a new exhibition.
                    </p>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleSystemReset}
                            disabled={isResetting}
                            className="w-full bg-red-600 text-white font-bold uppercase py-4 tracking-widest hover:bg-red-700 disabled:opacity-50 transition-colors shadow-[4px_4px_0px_0px_#fff] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        >
                            {isResetting ? 'Wiping Data...' : 'Confirm System Wipe'}
                        </button>
                        
                        <button 
                            onClick={() => setShowResetModal(false)}
                            className="w-full border-2 border-white text-white font-bold uppercase py-3 hover:bg-white hover:text-black transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};


const ExperienceCard: React.FC<{ experience: Experience; onDelete: () => void; onUpdate: () => void }> = ({
  experience,
  onDelete,
  onUpdate,
}) => {
  const [data, setData] = useState<Experience>(experience);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setData(experience);
  }, [experience]);

const save = async () => {
  try {
    await storageService.updateExperience(data);
    setIsEditing(false);
    onUpdate();
  } catch (e: any) {
    alert(e?.message ?? 'Failed to save experience');
  }
};


  const toggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newData = { ...data, isActive: !data.isActive };
    setData(newData);
    await Promise.resolve(storageService.updateExperience(newData));
    onUpdate();
  };

  const addInterval = () => {
    const intervals = data.timeIntervals ? [...data.timeIntervals] : [];
    intervals.push({ startTime: '09:00', endTime: '12:00' });
    setData({ ...data, timeIntervals: intervals });
  };

  const removeInterval = (index: number) => {
    const intervals = [...(data.timeIntervals || [])];
    intervals.splice(index, 1);
    setData({ ...data, timeIntervals: intervals });
  };

  const updateInterval = (index: number, field: keyof TimeInterval, value: string) => {
    const intervals = [...(data.timeIntervals || [])];
    intervals[index] = { ...intervals[index], [field]: value };
    setData({ ...data, timeIntervals: intervals });
  };

    // List of common timezones
const COMMON_TIMEZONES = [
  'Europe/Rome',
  'Europe/Athens',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'Asia/Tokyo',
  'Asia/Dubai',
  'UTC'
];

  return (
    <div
      className={`bg-neutral-900 border-2 border-white transition-all duration-300 ${
        data.isActive ? 'shadow-[4px_4px_0px_0px_#fff]' : 'opacity-60 border-dashed'
      }`}
    >
      <div className="p-4 flex items-center justify-between bg-black border-b-2 border-white">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => void toggleActive(e)}
            className={`w-4 h-4 border border-white ${data.isActive ? 'bg-yellow-400' : 'bg-black'}`}
          />
          <span className="font-maxwell font-bold uppercase tracking-wide text-white">{data.name}</span>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs font-bold uppercase underline hover:text-red-600 text-neutral-400"
        >
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className="p-4 text-white">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="text-[10px] font-bold uppercase text-neutral-400">Name</label>
              <input
                className="w-full border-b border-white font-mono font-bold uppercase py-1 bg-transparent outline-none text-white"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">Duration (m)</label>
                <input
                  type="number"
                  className="w-full bg-black border border-neutral-700 p-1 font-mono text-white"
                  value={data.durationMinutes}
                  onChange={(e) => setData({ ...data, durationMinutes: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">Gap/Offset (m)</label>
                <input
                  type="number"
                  className="w-full bg-black border border-neutral-700 p-1 font-mono text-white"
                  value={data.offsetMinutes}
                  onChange={(e) => setData({ ...data, offsetMinutes: Number(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">Capacity</label>
                <input
                  type="number"
                  className="w-full bg-black border border-neutral-700 p-1 font-mono text-white"
                  value={data.maxCapacity}
                  onChange={(e) => setData({ ...data, maxCapacity: Number(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">Start Date</label>
                <input
                  type="date"
                  className="w-full bg-black border border-neutral-700 p-1 font-mono text-white"
                  value={data.startDate}
                  onChange={(e) => setData({ ...data, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">End Date</label>
                <input
                  type="date"
                  className="w-full bg-black border border-neutral-700 p-1 font-mono text-white"
                  value={data.endDate}
                  onChange={(e) => setData({ ...data, endDate: e.target.value })}
                />
              </div>
                            <div>
                <label className="text-[10px] font-bold uppercase text-neutral-400">Time Zone</label>
                <select
                  className="w-full bg-black border border-neutral-700 p-1 font-mono text-white text-sm"
                  value={data.timezone}
                  onChange={(e) => setData({ ...data, timezone: e.target.value })}
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-neutral-700 p-2">
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-neutral-400">Schedule Blocks</span>
                <button onClick={addInterval} className="text-[10px] bg-white text-black px-2 hover:bg-yellow-400">
                  +
                </button>
              </div>

              {data.timeIntervals?.map((t, i) => (
                <div key={i} className="flex gap-2 mb-1 items-center">
                  <input
                    type="time"
                    value={t.startTime}
                    onChange={(e) => updateInterval(i, 'startTime', e.target.value)}
                    className="border border-neutral-600 bg-black p-1 text-xs text-white"
                  />
                  <span className="text-neutral-400">-</span>
                  <input
                    type="time"
                    value={t.endTime}
                    onChange={(e) => updateInterval(i, 'endTime', e.target.value)}
                    className="border border-neutral-600 bg-black p-1 text-xs text-white"
                  />
                  <button onClick={() => removeInterval(i)} className="text-red-500 px-2">
                    x
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => void save()}
                className="flex-1 bg-white text-black py-2 font-bold uppercase tracking-widest hover:bg-yellow-400"
              >
                Save
              </button>
              <button onClick={onDelete} className="p-2 border border-white hover:bg-red-600 hover:text-white">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center text-sm font-mono">
            <span className="uppercase text-neutral-400">
              {data.durationMinutes} MIN (+{data.offsetMinutes} GAP) / MAX {data.maxCapacity} PAX
            </span>
            <div className="flex gap-1">
              {data.timeIntervals?.map((t, i) => (
                <span key={i} className="bg-neutral-800 border border-neutral-700 px-1 text-xs text-neutral-300">
                  {t.startTime}-{t.endTime}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};