/**
 * Al-Rahma Medical Center - Smart Appointment Booking & Conflict Prevention Engine
 * محرك الحجز الذكي، منع تضارب المواعيد، واقتراح أقرب وقت متاح
 */

import { Appointment, Doctor, Shift, Patient } from '../types';

export interface SmartSlotSuggestion {
  date: string;
  time: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  reason: string;
  isToday: boolean;
  score: number; // Higher is better
}

export interface CollisionCheckResult {
  hasConflict: boolean;
  type?: 'doctor_busy' | 'patient_busy' | 'outside_shift' | 'past_time';
  message?: string;
  conflictingAppointment?: Appointment;
}

// Convert "HH:MM" to minutes from midnight
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

// Convert minutes to "HH:MM"
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

// Standard clinic appointment time slots (every 30 mins from 08:30 to 19:30)
export const STANDARD_CLINIC_SLOTS = [
  '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
  '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
];

/**
 * Check if doctor is on shift for given date & time
 */
export function isDoctorOnShift(
  doctor: Doctor,
  timeStr: string
): boolean {
  const timeMin = timeToMinutes(timeStr);
  const shift = doctor.shift || 'صباحي';

  if (shift === 'صباحي') {
    // 08:00 to 16:00
    return timeMin >= 8 * 60 && timeMin <= 16 * 60;
  } else if (shift === 'مسائي') {
    // 16:00 to 00:00 (24:00)
    return timeMin >= 16 * 60 && timeMin <= 24 * 60;
  } else if (shift === 'ليلي') {
    // 00:00 to 08:00
    return timeMin >= 0 && timeMin <= 8 * 60;
  }
  return true;
}

/**
 * Comprehensive Collision Check
 */
export function checkAppointmentCollision(params: {
  doctorId?: string;
  doctorName?: string;
  patientId?: string;
  patientName?: string;
  date: string;
  time: string;
  existingAppointments: Appointment[];
  doctors: Doctor[];
  excludeAppointmentId?: string;
}): CollisionCheckResult {
  const {
    doctorId,
    doctorName,
    patientId,
    patientName,
    date,
    time,
    existingAppointments,
    doctors,
    excludeAppointmentId,
  } = params;

  if (!date || !time) {
    return { hasConflict: false };
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Past date/time check
  if (date < todayStr) {
    return {
      hasConflict: true,
      type: 'past_time',
      message: 'لا يمكن حجز موعد في تاريخ ماضٍ منتهي.',
    };
  }

  // Find target doctor
  const targetDoctor = doctors.find(
    (d) => (doctorId && d.id === doctorId) || (doctorName && d.name === doctorName)
  );

  // Check doctor shift
  if (targetDoctor && !isDoctorOnShift(targetDoctor, time)) {
    return {
      hasConflict: true,
      type: 'outside_shift',
      message: `تنبيه: التوقيت (${time}) خارج دوام وردية الطبيب (${targetDoctor.name}) وهي (${targetDoctor.shift || 'صباحي'}).`,
    };
  }

  const newTimeMin = timeToMinutes(time);

  // Active appointments on this date
  const dateAppointments = existingAppointments.filter(
    (a) =>
      a.date === date &&
      a.id !== excludeAppointmentId &&
      a.status !== 'ملغى' &&
      a.status !== 'منتهي'
  );

  // 1. Doctor Collision (Overlap within 20 mins)
  const docApt = dateAppointments.find((a) => {
    const isSameDoc =
      (doctorId && a.doctorId === doctorId) ||
      (doctorName && a.doctorName.trim().toLowerCase() === doctorName.trim().toLowerCase());
    if (!isSameDoc) return false;

    const aptTimeMin = timeToMinutes(a.time);
    return Math.abs(aptTimeMin - newTimeMin) < 20; // 20-minute slot buffer
  });

  if (docApt) {
    return {
      hasConflict: true,
      type: 'doctor_busy',
      conflictingAppointment: docApt,
      message: `تعارض حجز: الطبيب (${docApt.doctorName}) لديه موعد محجوز مسبقاً في نفس الوقت (${docApt.time}) مع المريض (${docApt.patientName}).`,
    };
  }

  // 2. Patient Collision (Same patient booked with another doctor at overlapping time)
  if (patientId || patientName) {
    const patApt = dateAppointments.find((a) => {
      const isSamePat =
        (patientId && a.patientId === patientId) ||
        (patientName && a.patientName.trim().toLowerCase() === patientName.trim().toLowerCase());
      if (!isSamePat) return false;

      const aptTimeMin = timeToMinutes(a.time);
      return Math.abs(aptTimeMin - newTimeMin) < 30;
    });

    if (patApt) {
      return {
        hasConflict: true,
        type: 'patient_busy',
        conflictingAppointment: patApt,
        message: `تعارض للمريض: المريض لديه موعد آخر مسجل في نفس الوقت تقريباً (${patApt.time}) مع (${patApt.doctorName}).`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Smart Slot Suggestion Engine:
 * Scans upcoming calendar days and hours to find next available slots
 * with zero collisions, valid shifts, and optimal scheduling.
 */
export function suggestSmartAvailableSlots(params: {
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  startDate?: string;
  patientId?: string;
  patientName?: string;
  appointments: Appointment[];
  doctors: Doctor[];
  maxSuggestions?: number;
}): SmartSlotSuggestion[] {
  const {
    doctorId,
    doctorName,
    specialty,
    startDate,
    patientId,
    patientName,
    appointments,
    doctors,
    maxSuggestions = 4,
  } = params;

  const suggestions: SmartSlotSuggestion[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const initialDateStr = startDate && startDate >= todayStr ? startDate : todayStr;

  // Filter eligible doctors
  let eligibleDoctors = doctors.filter((d) => d.status === 'active');
  if (doctorId) {
    eligibleDoctors = eligibleDoctors.filter((d) => d.id === doctorId);
  } else if (doctorName) {
    eligibleDoctors = eligibleDoctors.filter((d) => d.name === doctorName);
  } else if (specialty && specialty !== 'all') {
    eligibleDoctors = eligibleDoctors.filter(
      (d) => d.specialty.toLowerCase() === specialty.toLowerCase()
    );
  }

  if (eligibleDoctors.length === 0) {
    eligibleDoctors = doctors.slice(0, 3);
  }

  // Scan up to 7 consecutive days starting from initialDateStr
  const baseDate = new Date(initialDateStr);

  for (let dayOffset = 0; dayOffset < 7 && suggestions.length < maxSuggestions; dayOffset++) {
    const scanDate = new Date(baseDate);
    scanDate.setDate(baseDate.getDate() + dayOffset);
    const dateStr = scanDate.toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    // Standard Arabic day names
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = dayNames[scanDate.getDay()];

    // Current hour/minute if today
    const currentMinToday = isToday ? today.getHours() * 60 + today.getMinutes() + 15 : 0;

    for (const doc of eligibleDoctors) {
      if (suggestions.length >= maxSuggestions) break;

      for (const slot of STANDARD_CLINIC_SLOTS) {
        if (suggestions.length >= maxSuggestions) break;

        const slotMin = timeToMinutes(slot);
        if (isToday && slotMin <= currentMinToday) {
          continue; // Past slot today
        }

        // Check shift
        if (!isDoctorOnShift(doc, slot)) {
          continue;
        }

        // Check collision
        const collision = checkAppointmentCollision({
          doctorId: doc.id,
          doctorName: doc.name,
          patientId,
          patientName,
          date: dateStr,
          time: slot,
          existingAppointments: appointments,
          doctors,
        });

        if (!collision.hasConflict) {
          // Calculate score: earlier days and morning slots get higher preference
          const score = 100 - dayOffset * 10 - Math.abs(slotMin - 10 * 60) / 10;
          const reasonLabel = isToday
            ? `اليوم ${dayName} (${slot}) - عيادة شاغرة فوراً`
            : dayOffset === 1
            ? `غداً ${dayName} (${slot}) - موعد مثالي شاغر`
            : `يوم ${dayName} ${dateStr} (${slot}) - وقت متاح ومؤكد`;

          // Ensure no duplicate (same date + time + doctor)
          const duplicate = suggestions.some(
            (s) => s.date === dateStr && s.time === slot && s.doctorId === doc.id
          );

          if (!duplicate) {
            suggestions.push({
              date: dateStr,
              time: slot,
              doctorId: doc.id,
              doctorName: doc.name,
              specialty: doc.specialty,
              reason: reasonLabel,
              isToday,
              score,
            });
          }
        }
      }
    }
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, maxSuggestions);
}
