'use client';

import { supabase } from '../lib/supabase';
import { Experience, Booking, DaySchedule } from '../types';

export const storageService = {
  // --- EXPERIENCES (Admin) ---
 
  toggleSlotBlock: async (slotId: string, shouldBlock: boolean) => {
    const { error } = await supabase.rpc('admin_toggle_slot_block', {
      p_slot_id: slotId,
      p_should_block: shouldBlock
    });

    if (error) throw new Error(error.message);
  },
  
  getExperiences: async (): Promise<Experience[]> => {
    // 1. Fetch Experiences
    const { data: exps, error } = await supabase
      .from('experiences')
      .select('*')
      .order('created_at');

    if (error || !exps) {
        console.error("Error loading experiences", error);
        return [];
    }

    const { data: scheds } = await supabase.from('experience_schedules').select('*');

    return exps.map((e: any) => {
      const myScheds = (scheds || [])
        .filter((s: any) => s.experience_id === e.id)
        .map((s: any) => ({
          startTime: String(s.start_time).slice(0, 5),
          endTime: String(s.end_time).slice(0, 5),
        }));

      return {
        id: e.id,
        name: e.title,
        description: e.description || '',
        timezone: e.timezone || 'UTC', // <--- Load from DB
        maxCapacity: e.max_people,
        durationMinutes: e.duration_minutes,
        offsetMinutes: e.setup_minutes,
        color: 'bg-neutral-800', // Simplified color logic
        isActive: true, 
        startDate: e.valid_from,
        endDate: e.valid_until,
        timeIntervals: myScheds,
      };
    });
  },

  updateExperience: async (exp: Experience) => {
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const idToUse = isUUID(exp.id) ? exp.id : undefined;

    const { data: savedExp, error: expError } = await supabase
      .from('experiences')
      .upsert({
        id: idToUse,
        title: exp.name,
        description: exp.description,
        timezone: exp.timezone, // <--- SAVE THE CHOSEN TIMEZONE
        max_people: exp.maxCapacity,
        duration_minutes: exp.durationMinutes,
        setup_minutes: exp.offsetMinutes,
        valid_from: exp.startDate,
        valid_until: exp.endDate,
      })
      .select()
      .single();

    if (expError) throw new Error(expError.message);

    if (savedExp) {
      // (Schedule saving logic remains the same...)
      await supabase.from('experience_schedules').delete().eq('experience_id', savedExp.id);      
      
     // 2. Prepare new payload
      const schedPayload = exp.timeIntervals.map((t) => ({
        experience_id: savedExp.id,
        start_time: t.startTime,
        end_time: t.endTime,
      }));

      // 3. Insert NEW schedules
      if (schedPayload.length > 0) {
        const { error: schedError } = await supabase.from('experience_schedules').insert(schedPayload);
        if (schedError) throw new Error("Schedule Insert Error: " + schedError.message);
      }
      
      // 4. TRIGGER GENERATOR (This now uses the new SQL logic)
      const { error: rpcError } = await supabase.rpc('generate_slots_for_experience', { target_experience_id: savedExp.id });
      if (rpcError) console.error("Slot Generation Error:", rpcError);
    }
  },

  deleteExperience: async (id: string) => {
    await supabase.from('experiences').delete().eq('id', id);
  },

   
  // --- BOOKINGS (Admin/Staff) ---
  getBookings: async (): Promise<Booking[]> => {
    // DEBUG: Log that we are starting the fetch
    console.log("Fetching bookings...");

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_guests ( id, full_name, check_in_status, created_at ),
        slots ( experience_id )
      `)
      .order('created_at', { ascending: false });

    // DEBUG: Log the result
    if (error) {
        console.error("CRITICAL SUPABASE ERROR:", error);
        return []; // This causes "Ticket not found"
    }

    console.log("Bookings found:", data?.length);

    return data.map((b: any) => {
        const sortedGuests = (b.booking_guests || []).sort((x: any, y: any) => 
            new Date(x.created_at).getTime() - new Date(y.created_at).getTime()
        );
        
        return {
            id: b.id,
            slotId: b.slot_id,
            experienceId: b.slots?.experience_id || '',
            date: b.target_date,
            time: String(b.target_time).slice(0, 5),
            pax: b.party_size,
            originalPax: b.party_size,
            visitorName: b.customer_name,
            visitorEmail: b.customer_email,
            attendeeNames: sortedGuests.map((g: any) => g.full_name),
            guestIds: sortedGuests.map((g: any) => g.id),
            referenceCode: b.booking_reference,
            checkedIn: sortedGuests.some((g: any) => g.check_in_status === 'ARRIVED'),
            status: b.status,
        };
    });
  },

  // NEW: Validate without checking in
  validateTicket: async (bookingId: string) => {
    const { data, error } = await supabase.rpc('staff_validate_ticket', {
        p_booking_id: bookingId
    });
    
    // If the DB throws "Too Early" or "Expired", it comes back as an error here
    if (error) throw new Error(error.message);
    
    return data;
  },
  
  // --- STAFF ACTIONS ---
  processCheckIn: async (bookingId: string, arrivedGuestIds: string[]) => {
    const { data, error } = await supabase.rpc('staff_process_checkin', {
        p_booking_id: bookingId,
        p_arrived_guest_ids: arrivedGuestIds
    });

    if (error) throw new Error(error.message);
    return data; // { success: true, new_party_size: N }
  },
  // --- DANGER ZONE ---
  resetSystem: async () => {
    const { error } = await supabase.rpc('admin_reset_system');
    if (error) throw new Error(error.message);
  },

  // Legacy Stub
  updateBooking: async () => {},
  getBookingsForExperienceDate: async () => [],
  getSchedules: async () => [],
  saveSchedule: async () => {},
};