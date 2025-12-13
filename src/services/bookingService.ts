'use client';

import { Experience, Slot, Booking, SlotOption } from '../types';
import { storageService } from './storageService';
import { addMinutes, format, parse, isBefore, isAfter, startOfDay } from 'date-fns';

export const bookingService = {
  // Generate all possible slots for a specific day based on settings
  generateSlotsForDate: (experience: Experience, dateStr: string): Slot[] => {
    // 1. Check Global Active Toggle
    if (!experience.isActive) return [];

    // 2. Check Date Range Validity (Experience specific)
    if (experience.startDate && dateStr < experience.startDate) return [];
    if (experience.endDate && dateStr > experience.endDate) return [];

    // Safety check for invalid duration to prevent infinite loops
    if (experience.durationMinutes <= 0) return [];

    const schedules = storageService.getSchedules();
    const bookings = storageService.getBookings();
    
    // 3. Check Global "Holiday" Closures
    const schedule = schedules.find(s => s.date === dateStr);
    if (schedule && schedule.isOpen === false) return [];

    const slots: Slot[] = [];
    
    // Ensure dateBase is set to midnight of the target date
    const dateBase = startOfDay(parse(dateStr, 'yyyy-MM-dd', new Date()));
    const now = new Date();

    // 4. Determine Intervals
    let intervals = experience.timeIntervals;
    if (!intervals || intervals.length === 0) {
      intervals = [{ startTime: '09:00', endTime: '18:00' }];
    }

    // 5. Generate Slots for each interval
    for (const interval of intervals) {
      let currentTime = parse(interval.startTime, 'HH:mm', dateBase);
      const intervalEnd = parse(interval.endTime, 'HH:mm', dateBase);

      // Loop while the current start time is before the closing time
      while (isBefore(currentTime, intervalEnd)) {
        const slotEnd = addMinutes(currentTime, experience.durationMinutes);
        
        // STRICT CHECK: The slot must fit totally into the interval.
        // If the calculated end time is after the interval's end time, do not create this slot.
        if (isAfter(slotEnd, intervalEnd)) {
          break; 
        }

        const slotId = `${experience.id}-${format(currentTime, 'yyyyMMdd-HHmm')}`;
        
        // Calculate capacity
        const slotBookings = bookings.filter(b => b.slotId === slotId);
        const bookedCount = slotBookings.reduce((sum, b) => sum + b.pax, 0);
        const remaining = experience.maxCapacity - bookedCount;

        let status: Slot['status'] = 'OPEN';
        
        if (isBefore(currentTime, now)) {
          status = 'PASSED';
        } else if (remaining <= 0) {
          status = 'FULL';
        } else if (bookedCount > 0) {
          status = 'PARTIAL';
        }

        slots.push({
          id: slotId,
          experienceId: experience.id,
          startTime: currentTime,
          endTime: slotEnd,
          maxCapacity: experience.maxCapacity,
          currentBookings: bookedCount,
          remainingCapacity: Math.max(0, remaining),
          status
        });

        // CALCULATION UPDATE:
        // Next Start = Current Start + Duration + Offset (Gap)
        // This creates a sequential flow: Start -> End -> Gap -> Next Start
        currentTime = addMinutes(currentTime, experience.durationMinutes + experience.offsetMinutes);
      }
    }

    // Sort slots by time
    return slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  },

  // The Magic Algo: Find options for visitor
  findBookingOptions: (experience: Experience, pax: number): SlotOption[] => {
    if (!experience.isActive) return [];

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addMinutes(new Date(), 24 * 60), 'yyyy-MM-dd'); // Simple next day lookahead
    
    // Get slots for today and tomorrow to ensure we find something
    const allSlots = [
      ...bookingService.generateSlotsForDate(experience, todayStr),
      ...bookingService.generateSlotsForDate(experience, tomorrowStr)
    ];

    // Filter out passed slots
    const futureSlots = allSlots.filter(s => s.status !== 'PASSED' && s.status !== 'FULL');

    const options: SlotOption[] = [];

    // OPTION 1: Next Available (Together)
    // Find the first slot that can fit everyone
    const togetherSlot = futureSlots.find(s => s.remainingCapacity >= pax);
    
    if (togetherSlot) {
      options.push({
        type: 'TOGETHER',
        description: `Next available slot for ${pax} people together`,
        slots: [{ slot: togetherSlot, paxToAssign: pax }]
      });
    }

    // OPTION 2: Split Group (Immediate)
    if (futureSlots.length > 0) {
      const splitPlan: { slot: Slot, paxToAssign: number }[] = [];
      let remainingPax = pax;
      let slotIndex = 0;

      // Logic: Iterate slots, fill them up until everyone is assigned
      while (remainingPax > 0 && slotIndex < futureSlots.length) {
        const slot = futureSlots[slotIndex];
        const canTake = Math.min(slot.remainingCapacity, remainingPax);
        
        if (canTake > 0) {
          splitPlan.push({ slot, paxToAssign: canTake });
          remainingPax -= canTake;
        }
        slotIndex++;
      }

      // Only offer split if we successfully assigned everyone
      if (remainingPax === 0) {
        // If the plan is just 1 slot, it's the same as "Together" so ignore it to avoid duplicate
        if (splitPlan.length > 1) {
           options.push({
            type: 'SPLIT',
            description: `Earliest start (Split into ${splitPlan.length} groups)`,
            slots: splitPlan
          });
        } else if (splitPlan.length === 1 && !options.find(o => o.type === 'TOGETHER')) {
           options.push({
             type: 'TOGETHER',
             description: `Next available slot`,
             slots: splitPlan
           });
        }
      }
    }

    return options;
  },

  createBooking: (
    slot: Slot,
    pax: number,
    visitorName: string,
    visitorEmail: string,
    attendeeNames: string[]
  ): Booking => {
    const booking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      slotId: slot.id,
      experienceId: slot.experienceId,
      date: format(slot.startTime, 'yyyy-MM-dd'),
      time: format(slot.startTime, 'HH:mm'),
      pax,
      originalPax: pax, // Set initial pax count
      visitorName,
      visitorEmail,
      attendeeNames,
      referenceCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      checkedIn: false
    };

    storageService.addBooking(booking);
    return booking;
  }
};
