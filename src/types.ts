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
  id: string; // UUID
  name: string;             // DB: title
  description: string;
  maxCapacity: number;      // DB: max_people
  durationMinutes: number;  // DB: duration_minutes
  offsetMinutes: number;    // DB: setup_minutes
  color: string;            // UI Only
  isActive: boolean;        // Inferred
  startDate: string;        // DB: valid_from
  endDate: string;          // DB: valid_until
  timeIntervals: TimeInterval[]; // DB: experience_schedules
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
  guestIds?: string[]; // Added for Staff Check-in Logic
}

export interface Slot {
  id: string; // UUID
  experienceId: string;
  startTime: Date;
  endTime: Date;
  maxCapacity: number;
  currentBookings: number;
  remainingCapacity: number;
  status: 'OPEN' | 'PARTIAL' | 'FULL' | 'PASSED';
  isBlocked: boolean; // Added for Admin
}

export interface SlotOption {
  type: 'TOGETHER' | 'SPLIT';
  description: string;
  slots: {
    slot: Slot;
    paxToAssign: number;
  }[];
}