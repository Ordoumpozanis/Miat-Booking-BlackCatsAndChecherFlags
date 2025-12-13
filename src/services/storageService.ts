'use client';

import { Experience, Booking, DaySchedule } from '../types';

const KEYS = {
  EXPERIENCES: 'exhibit_experiences_v2',
  BOOKINGS: 'exhibit_bookings_v2',
  SCHEDULES: 'exhibit_schedules_v2',
};

export const storageService = {
  getExperiences: (): Experience[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.EXPERIENCES);
    return data ? JSON.parse(data) : [];
  },

  updateExperience: (exp: Experience) => {
    if (typeof window === 'undefined') return;
    const exps = storageService.getExperiences();
    const idx = exps.findIndex((e) => e.id === exp.id);
    if (idx >= 0) {
      exps[idx] = exp;
    } else {
      exps.push(exp);
    }
    localStorage.setItem(KEYS.EXPERIENCES, JSON.stringify(exps));
  },

  deleteExperience: (id: string) => {
    if (typeof window === 'undefined') return;
    const exps = storageService.getExperiences().filter(e => e.id !== id);
    localStorage.setItem(KEYS.EXPERIENCES, JSON.stringify(exps));
  },

  getBookings: (): Booking[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.BOOKINGS);
    return data ? JSON.parse(data) : [];
  },

  addBooking: (booking: Booking) => {
    if (typeof window === 'undefined') return;
    const bookings = storageService.getBookings();
    bookings.push(booking);
    localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  },

  updateBooking: (booking: Booking) => {
    if (typeof window === 'undefined') return;
    const bookings = storageService.getBookings();
    const idx = bookings.findIndex(b => b.id === booking.id);
    if (idx !== -1) {
      bookings[idx] = booking;
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
    }
  },

  getSchedules: (): DaySchedule[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(KEYS.SCHEDULES);
    return data ? JSON.parse(data) : [];
  },

  saveSchedule: (schedule: DaySchedule) => {
    if (typeof window === 'undefined') return;
    const schedules = storageService.getSchedules();
    const idx = schedules.findIndex(s => s.date === schedule.date);
    if (idx >= 0) {
      schedules[idx] = schedule;
    } else {
      schedules.push(schedule);
    }
    localStorage.setItem(KEYS.SCHEDULES, JSON.stringify(schedules));
  }
};
