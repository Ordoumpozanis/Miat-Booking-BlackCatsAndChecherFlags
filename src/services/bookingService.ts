'use client';

import { supabase } from '../lib/supabase';
import { Experience, Slot, Booking } from '../types';
import { format, parseISO, isBefore } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

export const bookingService = {
  
  // 1. GET SLOTS via RPC
 generateSlotsForDateAsync: async (experience: Experience, dateStr: string): Promise<Slot[]> => {
    const { data: slots, error } = await supabase.rpc('get_public_availability', {
      p_experience_id: experience.id,
      p_date: dateStr
    });

    if (error || !slots) return [];

    // The current time in the EXHIBITION'S timezone
    const nowOnLocation = toZonedTime(new Date(), experience.timezone);
    const timeOnLocationStr = formatTz(nowOnLocation, 'HH:mm', { timeZone: experience.timezone });

    return slots.map((s: any) => {
      // 1. Create a "Floating" Date Object (The raw time)
      // We parse the string "2025-07-12T10:00" directly.
      const rawIsoString = `${dateStr}T${s.start_time}`;
      const startT = parseISO(rawIsoString);
      const endT = parseISO(`${dateStr}T${s.end_time}`);
      
      const filled = Number(s.current_load);
      const remaining = s.max_capacity - filled;
      
      let status: Slot['status'] = 'OPEN';
      
      // 2. Logic: Compare Wall Time Strings to avoid timezone math errors
      // If today is the selected date, we compare HH:mm strings
      const isToday = dateStr === formatTz(nowOnLocation, 'yyyy-MM-dd', { timeZone: experience.timezone });
      const slotTimeStr = String(s.start_time).slice(0, 5);

      if (s.is_blocked) status = 'FULL'; 
      else if (isToday && slotTimeStr < timeOnLocationStr) status = 'PASSED'; // Simple string comparison
      else if (remaining <= 0) status = 'FULL';
      else if (filled > 0) status = 'PARTIAL';

      return {
        id: s.slot_id,
        experienceId: experience.id,
        startTime: startT, // Keep Date obj for internal logic
        endTime: endT,
        formattedTime: slotTimeStr, // NEW: Use this for display
        maxCapacity: s.max_capacity,
        currentBookings: filled,
        remainingCapacity: Math.max(0, remaining),
        status,
        isBlocked: s.is_blocked,
      };
    });
  },

  // 2. CREATE BOOKING (Hold + Confirm)
  createBooking: async (
    slot: Slot,
    pax: number,
    visitorName: string,
    visitorEmail: string,
    attendees: string[]
  ): Promise<Booking> => {
    
    // Step A: Hold
    const { data: hold, error: hErr } = await supabase.rpc('create_pending_booking', {
      p_slot_id: slot.id,
      p_party_size: pax,
    });
    if (hErr) throw new Error(hErr.message);

    // Step B: Confirm
    const { data: conf, error: cErr } = await supabase.rpc('confirm_booking', {
      p_booking_id: hold.booking_id,
      p_customer_name: visitorName,
      p_customer_email: visitorEmail,
      p_guest_names: attendees,
    });
    if (cErr) throw new Error(cErr.message);

    return {
      id: hold.booking_id,
      slotId: slot.id,
      experienceId: slot.experienceId,
      date: format(slot.startTime, 'yyyy-MM-dd'),
      time: format(slot.startTime, 'HH:mm'),
      pax,
      originalPax: pax,
      visitorName,
      visitorEmail,
      attendeeNames: attendees,
      referenceCode: conf.reference,
      checkedIn: false,
      status: 'CONFIRMED',
    };
  },
// 3. VISITOR LOOKUP (For Cancellation Flow)
  lookupBooking: async (email: string, code: string) => {
    // Uses the existing RPC from V12.2
    const { data, error } = await supabase.rpc('get_booking_details', {
      p_email: email,
      p_code: code
    });
    
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return null;
    
    // Return the first match (should be unique)
    return {
       id: data[0].booking_id,
       title: data[0].experience_title,
       date: data[0].slot_date,
       time: String(data[0].start_time).slice(0, 5),
       status: data[0].status
    };
  },

  // 4. VISITOR CANCEL
  cancelBooking: async (email: string, code: string) => {
    // Note: The RPC now expects only 2 arguments
    const { data, error } = await supabase.rpc('visitor_cancel_booking', {
        p_email: email,
        p_code: code
    });

    if (error) throw new Error(error.message);
    return data;
  },
  // Stubs
  calculateSlots: () => [],
  findBookingOptions: () => [],
};