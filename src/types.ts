// src/types.ts

export enum UserRole {
  VISITOR = 'VISITOR',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export interface TimeInterval {
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface Experience {
  id: string; 
  name: string;
  description: string;
  timezone: string; // <--- NEW: CRITICAL FIELD (e.g., 'Europe/Athens')
  maxCapacity: number;
  durationMinutes: number;
  offsetMinutes: number;
  color: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  timeIntervals: TimeInterval[];
}

export interface DaySchedule {
  date: string;
  isOpen: boolean;
}

export interface Booking {
  id: string;
  slotId: string;
  experienceId: string;
  date: string;
  time: string;
  pax: number;
  originalPax: number;
  visitorName: string;
  visitorEmail: string;
  attendeeNames: string[];
  referenceCode: string;
  checkedIn: boolean;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  guestIds?: string[];
}

export interface Slot {
  id: string;
  experienceId: string;
  startTime: Date; // JavaScript Date object (Browser Local Time)
  endTime: Date;   // JavaScript Date object (Browser Local Time)
  
  // New helper to display the time correctly in the UI
  formattedTime: string; 
  
  maxCapacity: number;
  currentBookings: number;
  remainingCapacity: number;
  status: 'OPEN' | 'PARTIAL' | 'FULL' | 'PASSED';
  isBlocked: boolean;
}