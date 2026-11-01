/**
 * Arabic Linguistic & Formatting Utility for Healthcare Systems
 * Handles:
 * 1. Standard Arabic Grammatical Pluralization (المفرد، المثنى، جمع القلة، تمييز العدد المنصوب).
 * 2. Unified Numeral System (Western/Latin digits 0-9) matching technical tables & modern portals.
 * 3. Unified Syrian/Levant Date Formatting (تشرين الأول، تشرين الثاني، إلخ) with consistent Western numerals.
 */

const LEVANT_MONTHS = [
  'كانون الثاني', // 1
  'شباط',        // 2
  'آذار',        // 3
  'نيسان',       // 4
  'أيار',        // 5
  'حزيران',      // 6
  'تموز',        // 7
  'آب',          // 8
  'أيلول',       // 9
  'تشرين الأول', // 10
  'تشرين الثاني',// 11
  'كانون الأول'  // 12
];

const ARABIC_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

/**
 * Parses YYYY-MM-DD or ISO date string and formats to unified Arabic date with Latin numerals.
 * Example: '2026-10-30' -> '30 تشرين الأول 2026' or 'الجمعة، 30 تشرين الأول 2026'
 */
export function formatArabicDate(
  dateInput: string | Date | undefined | null,
  options?: { includeDayName?: boolean; compact?: boolean }
): string {
  if (!dateInput) return '—';

  let year: number;
  let month: number; // 1-12
  let day: number;
  let dayIndex: number = -1;

  if (typeof dateInput === 'string') {
    // If format is YYYY-MM-DD
    const match = dateInput.trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      year = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
      day = parseInt(match[3], 10);
      const d = new Date(year, month - 1, day);
      dayIndex = d.getDay();
    } else {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return dateInput;
      year = d.getFullYear();
      month = d.getMonth() + 1;
      day = d.getDate();
      dayIndex = d.getDay();
    }
  } else {
    year = dateInput.getFullYear();
    month = dateInput.getMonth() + 1;
    day = dateInput.getDate();
    dayIndex = dateInput.getDay();
  }

  const monthName = LEVANT_MONTHS[month - 1] || `${month}`;

  if (options?.includeDayName && dayIndex >= 0) {
    const dayName = ARABIC_DAYS[dayIndex] || '';
    return `${dayName}، ${day} ${monthName} ${year}`;
  }

  return `${day} ${monthName} ${year}`;
}

/**
 * Formats time string (HH:MM or Date) to Arabic 12-hour format with Latin numerals.
 * Example: '10:30' -> '10:30 ص', '16:45' -> '04:45 م'
 */
export function formatArabicTime(timeInput: string | Date | undefined | null): string {
  if (!timeInput) return '—';

  if (typeof timeInput === 'string') {
    const match = timeInput.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return timeInput;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = hours >= 12 ? 'م' : 'ص';
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${formattedHours}:${minutes} ${period}`;
  }

  let hours = timeInput.getHours();
  const minutes = timeInput.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${formattedHours}:${minutes} ${period}`;
}

/**
 * Realtime clock formatter using unified Latin numerals (0-9) with Arabic text.
 */
export function formatArabicClock(date: Date = new Date()): { dateText: string; timeText: string } {
  const dayName = ARABIC_DAYS[date.getDay()];
  const day = date.getDate();
  const monthName = LEVANT_MONTHS[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;

  return {
    dateText: `${dayName}، ${day} ${monthName} ${year}`,
    timeText: `${formattedHours}:${minutes}:${seconds} ${period}`
  };
}

/**
 * Generic Arabic Grammatical Pluralization
 * Rules:
 * 0: zero form (e.g. لا توجد مواعيد)
 * 1: singular (e.g. موعد واحد)
 * 2: dual (e.g. موعدان)
 * 3-10: few plural (e.g. 3 مواعيد)
 * 11+: singular accusative (e.g. 11 موعداً)
 */
export interface PluralRule {
  zero: string;
  one: string;
  two: string;
  few: string;  // For 3-10
  many: string; // For 11+
}

export function formatArabicPlural(count: number, rule: PluralRule): string {
  if (count <= 0) return rule.zero;
  if (count === 1) return rule.one;
  if (count === 2) return rule.two;
  if (count >= 3 && count <= 10) return `${count} ${rule.few}`;
  return `${count} ${rule.many}`;
}

// 1. Appointments
export function formatAppointmentsCount(count: number, activeOnly: boolean = false): string {
  if (activeOnly) {
    return formatArabicPlural(count, {
      zero: 'لا توجد مواعيد نشطة',
      one: 'موعد واحد نشط',
      two: 'موعدان نشطان',
      few: 'مواعيد نشطة',
      many: 'موعداً نشطاً'
    });
  }
  return formatArabicPlural(count, {
    zero: 'لا توجد مواعيد',
    one: 'موعد واحد',
    two: 'موعدان',
    few: 'مواعيد',
    many: 'موعداً'
  });
}

// 2. Invoices (Fixes «0 فواتير»)
export function formatInvoicesCount(count: number): string {
  return formatArabicPlural(count, {
    zero: 'لا توجد فواتير مستحقة',
    one: 'فاتورة واحدة مستحقة',
    two: 'فاتورتان مستحقتان',
    few: 'فواتير مستحقة',
    many: 'فاتورة مستحقة'
  });
}

// 3. Patients
export function formatPatientsCount(count: number): string {
  return formatArabicPlural(count, {
    zero: 'لا يوجد مرضى مسجلون',
    one: 'مريض واحد مسجل',
    two: 'مريضان مسجلان',
    few: 'مرضى مسجلين',
    many: 'مريضاً مسجلاً'
  });
}

// 4. Doctors available
export function formatAvailableDoctorsCount(count: number): string {
  return formatArabicPlural(count, {
    zero: 'لا يوجد أطباء متاحون',
    one: 'طبيب واحد متاح',
    two: 'طبيبان متاحان',
    few: 'أطباء متاحين',
    many: 'طبيباً متاحاً'
  });
}

// 5. Visitors today (مراجعين)
export function formatVisitorsCount(count: number): string {
  return formatArabicPlural(count, {
    zero: 'لا يوجد مراجعون اليوم',
    one: 'مراجع واحد اليوم',
    two: 'مراجِعان اليوم',
    few: 'مراجعين اليوم',
    many: 'مراجعاً اليوم'
  });
}

// 6. Lab Results (تحاليل مخبرية)
export function formatLabResultsCount(count: number): string {
  return formatArabicPlural(count, {
    zero: 'لا توجد نتائج تحاليل',
    one: 'نتيجة فحص واحدة',
    two: 'نتيجتا فحص',
    few: 'نتائج تحاليل',
    many: 'نتيجة فحص'
  });
}

// 7. Prescriptions (وصفات طبية)
export function formatPrescriptionsCount(count: number): string {
  return formatArabicPlural(count, {
    zero: 'لا توجد وصفات صادرة',
    one: 'وصفة واحدة صادرة',
    two: 'وصفتان صادرتان',
    few: 'وصفات صادرة',
    many: 'وصفة صادرة'
  });
}

// 8. Beds (أسِرّة)
export function formatBedsCount(count: number): string {
  return formatArabicPlural(count, {
    zero: 'لا توجد أسرّة شاغرة',
    one: 'سرير شاغر واحد',
    two: 'سريران شاغران',
    few: 'أسرّة شاغرة',
    many: 'سريراً شاغراً'
  });
}

// 9. Critical alerts (تنبيهات حرجة)
export function formatCriticalAlertsCount(count: number): string {
  return formatArabicPlural(count, {
    zero: 'لا توجد تنبيهات حرجة',
    one: 'تنبيه حرج واحد',
    two: 'تنبيهان حرِجان',
    few: 'تنبيهات حرجة',
    many: 'تنبيهاً حرجاً'
  });
}
