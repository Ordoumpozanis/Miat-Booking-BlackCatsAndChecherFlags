
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
  maxCapacity: number;
  durationMinutes: number; // Duration of the experience
  offsetMinutes: number;   // How often a new slot starts
  color: string;
  isActive: boolean; // Toggle availability without deleting
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  timeIntervals: TimeInterval[]; // Multiple daily operating windows
}

export interface DaySchedule {
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm - Global fallback/constraint
  endTime: string; // HH:mm - Global fallback/constraint
  isOpen: boolean;
}

export interface Booking {
  id: string;
  slotId: string; // Generated ID based on time
  experienceId: string;
  date: string;
  time: string; // HH:mm
  pax: number;
  originalPax?: number; // Keeps track if party size was reduced at door
  visitorName: string;
  visitorEmail: string;
  attendeeNames: string[];
  referenceCode: string; // Short code for QR
  checkedIn: boolean;
}

export interface Slot {
  id: string;
  experienceId: string;
  startTime: Date;
  endTime: Date;
  maxCapacity: number;
  currentBookings: number;
  remainingCapacity: number;
  status: 'OPEN' | 'PARTIAL' | 'FULL' | 'PASSED';
}

export interface SlotOption {
  type: 'TOGETHER' | 'SPLIT';
  description: string;
  slots: {
    slot: Slot;
    paxToAssign: number;
  }[];
}
