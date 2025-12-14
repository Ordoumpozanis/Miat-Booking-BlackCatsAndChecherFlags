'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, Plus, Edit2, Clock } from 'lucide-react';
import { Experience, TimeInterval } from '../types';
import { storageService } from '../services/storageService';
import { bookingService } from '../services/bookingService';
import { format } from 'date-fns';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'experiences'>('experiences');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedExpId, setSelectedExpId] = useState<string>('');

  useEffect(() => { refreshData(); }, []);

  const refreshData = () => {
    const exps = storageService.getExperiences();
    setExperiences(exps);
    if (!selectedExpId && exps.length > 0) setSelectedExpId(exps[0].id);
  };

  const handleInitDefaults = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextYear = format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd');
    const ex1: Experience = {
      id: 'ex1', name: 'The Pit Lane', description: 'Interactive Multiplayer', maxCapacity: 4, durationMinutes: 45, offsetMinutes: 15, color: 'bg-blue-600', isActive: true, startDate: today, endDate: nextYear, timeIntervals: [{ startTime: '09:00', endTime: '18:00' }]
    };
    const ex2: Experience = {
      id: 'ex2', name: 'The Prophecy', description: 'Cinematic VR', maxCapacity: 12, durationMinutes: 15, offsetMinutes: 10, color: 'bg-emerald-600', isActive: true, startDate: today, endDate: nextYear, timeIntervals: [{ startTime: '10:00', endTime: '20:00' }]
    };
    storageService.updateExperience(ex1);
    storageService.updateExperience(ex2);
    refreshData();
  };

  const handleAddExperience = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextYear = format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd');
    const newExp: Experience = {
      id: Math.random().toString(36).substr(2, 9), name: 'New Experience', description: 'Description', maxCapacity: 5, durationMinutes: 30, offsetMinutes: 15, color: 'bg-black', isActive: true, startDate: today, endDate: nextYear, timeIntervals: [{ startTime: '09:00', endTime: '17:00' }]
    };
    storageService.updateExperience(newExp);
    refreshData();
  };

  const handleDeleteExperience = (id: string) => {
    if (confirm('Delete this experience?')) { storageService.deleteExperience(id); refreshData(); }
  };

  const getSlotsForView = () => {
    if (!selectedExpId) return [];
    const exp = experiences.find(e => e.id === selectedExpId);
    if (!exp) return [];
    return bookingService.generateSlotsForDate(exp, selectedDate);
  };

  const slots = getSlotsForView();
  const selectedExp = experiences.find(e => e.id === selectedExpId);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 font-sans bg-black text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-b-4 border-white pb-4">
        <div>
           <h1 className="text-4xl md:text-5xl font-maxwell font-bold uppercase tracking-tighter mb-2 text-yellow-400">Control Tower</h1>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <button onClick={() => setActiveTab('experiences')} className={`px-6 py-2 text-sm font-bold uppercase tracking-widest border-2 border-white transition-all ${activeTab === 'experiences' ? 'bg-white text-black' : 'bg-black text-white hover:bg-neutral-800'}`}>Experiences</button>
          <button onClick={() => setActiveTab('schedule')} className={`px-6 py-2 text-sm font-bold uppercase tracking-widest border-2 border-white transition-all ${activeTab === 'schedule' ? 'bg-white text-black' : 'bg-black text-white hover:bg-neutral-800'}`}>Calendar</button>
        </div>
      </div>

      {activeTab === 'experiences' && (
        <div className="space-y-6">
          {experiences.length === 0 ? (
            <div className="p-12 border-2 border-dashed border-neutral-700 text-center">
              <button onClick={handleInitDefaults} className="bg-red-600 text-white px-8 py-3 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors">Load Defaults</button>
            </div>
          ) : (
            <div className="grid gap-6">
              {experiences.map(exp => (
                <ExperienceCard key={exp.id} experience={exp} onDelete={() => handleDeleteExperience(exp.id)} onUpdate={() => refreshData()} />
              ))}
              <button onClick={handleAddExperience} className="w-full py-4 border-2 border-dashed border-neutral-700 text-neutral-500 font-bold uppercase tracking-widest hover:border-white hover:text-white transition-colors">
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
                {experiences.map(exp => (
                  <button key={exp.id} onClick={() => setSelectedExpId(exp.id)} className={`px-4 py-1 text-xs font-bold uppercase tracking-widest border-2 transition-all ${selectedExpId === exp.id ? 'bg-yellow-400 text-black border-yellow-400' : 'bg-black text-white border-white hover:bg-neutral-800'}`}>
                    {exp.name}
                  </button>
                ))}
             </div>
             <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="bg-black text-white border-2 border-white px-3 py-1 font-mono text-sm uppercase outline-none" />
          </div>

          <div className="overflow-x-auto">
             {!selectedExp || slots.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 font-mono uppercase">No slots available</div>
             ) : (
                <table className="w-full text-left border-collapse text-white">
                  <thead className="bg-white text-black text-[10px] font-bold uppercase tracking-widest">
                    <tr><th className="p-3">Time</th><th className="p-3">Status</th><th className="p-3 text-center">Load</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {slots.map(slot => (
                      <tr key={slot.id} className="hover:bg-neutral-800 font-mono text-sm">
                        <td className="p-3 font-bold">{(slot.startTime as Date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                        <td className="p-3 uppercase text-xs">{slot.status}</td>
                        <td className="p-3 text-center">{slot.currentBookings}/{slot.maxCapacity}</td>
                        <td className="p-3">
                           <div className="w-full bg-neutral-800 h-2">
                              <div className={`h-full ${slot.status === 'FULL' ? 'bg-red-600' : 'bg-yellow-400'}`} style={{ width: `${(slot.currentBookings / slot.maxCapacity) * 100}%` }}></div>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

const ExperienceCard: React.FC<{ experience: Experience, onDelete: () => void, onUpdate: () => void }> = ({ experience, onDelete, onUpdate }) => {
  const [data, setData] = useState<Experience>(experience);
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => { setData(experience); }, [experience]);

  const save = () => { storageService.updateExperience(data); setIsEditing(false); onUpdate(); };
  const toggleActive = (e: React.MouseEvent) => { e.stopPropagation(); const newData = { ...data, isActive: !data.isActive }; setData(newData); storageService.updateExperience(newData); onUpdate(); };
  
  // Helpers for intervals
  const addInterval = () => { const intervals = data.timeIntervals ? [...data.timeIntervals] : []; intervals.push({ startTime: '09:00', endTime: '12:00' }); setData({ ...data, timeIntervals: intervals }); };
  const removeInterval = (index: number) => { const intervals = [...(data.timeIntervals || [])]; intervals.splice(index, 1); setData({ ...data, timeIntervals: intervals }); };
  const updateInterval = (index: number, field: keyof TimeInterval, value: string) => { const intervals = [...(data.timeIntervals || [])]; intervals[index] = { ...intervals[index], [field]: value }; setData({ ...data, timeIntervals: intervals }); };

  return (
    <div className={`bg-neutral-900 border-2 border-white transition-all duration-300 ${data.isActive ? 'shadow-[4px_4px_0px_0px_#fff]' : 'opacity-60 border-dashed'}`}>
      <div className="p-4 flex items-center justify-between bg-black border-b-2 border-white">
        <div className="flex items-center gap-3">
          <button onClick={toggleActive} className={`w-4 h-4 border border-white ${data.isActive ? 'bg-yellow-400' : 'bg-black'}`}></button>
          <span className="font-maxwell font-bold uppercase tracking-wide text-white">{data.name}</span>
        </div>
        <button onClick={() => setIsEditing(!isEditing)} className="text-xs font-bold uppercase underline hover:text-red-600 text-neutral-400">{isEditing ? 'Cancel' : 'Edit'}</button>
      </div>

      <div className="p-4 text-white">
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in">
            <div>
               <label className="text-[10px] font-bold uppercase text-neutral-400">Name</label>
               <input className="w-full border-b border-white font-mono font-bold uppercase py-1 bg-transparent outline-none text-white" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
            </div>
            
            {/* UPDATED: Grid with 3 columns to include Offset/Gap */}
            <div className="grid grid-cols-3 gap-4">
               <div>
                   <label className="text-[10px] font-bold uppercase text-neutral-400">Duration (m)</label>
                   <input type="number" className="w-full bg-black border border-neutral-700 p-1 font-mono text-white" value={data.durationMinutes} onChange={e => setData({...data, durationMinutes: parseInt(e.target.value)})} />
               </div>
               <div>
                   <label className="text-[10px] font-bold uppercase text-neutral-400">Gap/Offset (m)</label>
                   <input type="number" className="w-full bg-black border border-neutral-700 p-1 font-mono text-white" value={data.offsetMinutes} onChange={e => setData({...data, offsetMinutes: parseInt(e.target.value)})} />
               </div>
                <div>
                   <label className="text-[10px] font-bold uppercase text-neutral-400">Capacity</label>
                   <input type="number" className="w-full bg-black border border-neutral-700 p-1 font-mono text-white" value={data.maxCapacity} onChange={e => setData({...data, maxCapacity: parseInt(e.target.value)})} />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                   <label className="text-[10px] font-bold uppercase text-neutral-400">Start Date</label>
                   <input type="date" className="w-full bg-black border border-neutral-700 p-1 font-mono text-white" value={data.startDate} onChange={e => setData({...data, startDate: e.target.value})} />
               </div>
               <div>
                   <label className="text-[10px] font-bold uppercase text-neutral-400">End Date</label>
                   <input type="date" className="w-full bg-black border border-neutral-700 p-1 font-mono text-white" value={data.endDate} onChange={e => setData({...data, endDate: e.target.value})} />
               </div>
            </div>
            
            <div className="border border-neutral-700 p-2">
               <div className="flex justify-between mb-2"><span className="text-[10px] font-bold uppercase text-neutral-400">Schedule Blocks</span> <button onClick={addInterval} className="text-[10px] bg-white text-black px-2 hover:bg-yellow-400">+</button></div>
               {data.timeIntervals?.map((t, i) => (
                   <div key={i} className="flex gap-2 mb-1"><input type="time" value={t.startTime} onChange={e => updateInterval(i, 'startTime', e.target.value)} className="border border-neutral-600 bg-black p-1 text-xs text-white"/>-<input type="time" value={t.endTime} onChange={e => updateInterval(i, 'endTime', e.target.value)} className="border border-neutral-600 bg-black p-1 text-xs text-white"/><button onClick={() => removeInterval(i)} className="text-red-500">x</button></div>
               ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-white text-black py-2 font-bold uppercase tracking-widest hover:bg-yellow-400">Save</button>
              <button onClick={onDelete} className="p-2 border border-white hover:bg-red-600 hover:text-white"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center text-sm font-mono">
             <span className="uppercase text-neutral-400">{data.durationMinutes} MIN (+{data.offsetMinutes} GAP) / MAX {data.maxCapacity} PAX</span>
             <div className="flex gap-1">
                {data.timeIntervals?.map((t, i) => <span key={i} className="bg-neutral-800 border border-neutral-700 px-1 text-xs text-neutral-300">{t.startTime}-{t.endTime}</span>)}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
