'use client';

import { supabase } from '../lib/supabase';
import { Experience, Slot, Booking, SlotOption } from '../types';
import { format, parseISO, isBefore } from 'date-fns';

export const bookingService = {
  
  // 1. GET SLOTS via RPC
  generateSlotsForDateAsync: async (experience: Experience, dateStr: string): Promise<Slot[]> => {
    // Calls the V12.3 Patch RPC we added to the DB
    const { data: slots, error } = await supabase.rpc('get_public_availability', {
      p_experience_id: experience.id,
      p_date: dateStr
    });

    if (error) {
      console.error("Slot Error", error);
      return [];
    }
    if (!slots) return [];

    const now = new Date();

    return slots.map((s: any) => {
      const startT = parseISO(`${dateStr}T${s.start_time}`);
      const endT = parseISO(`${dateStr}T${s.end_time}`);
      
      const filled = Number(s.current_load);
      const remaining = s.max_capacity - filled;
      
      let status: Slot['status'] = 'OPEN';
      if (s.is_blocked) status = 'FULL'; 
      else if (isBefore(startT, now)) status = 'PASSED';
      else if (remaining <= 0) status = 'FULL';
      else if (filled > 0) status = 'PARTIAL';

      return {
        id: s.slot_id,
        experienceId: experience.id,
        startTime: startT,
        endTime: endT,
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

  // Stubs
  calculateSlots: () => [],
  findBookingOptions: () => [],
};