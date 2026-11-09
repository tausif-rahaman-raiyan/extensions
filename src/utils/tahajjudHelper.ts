import { PrayerTimes, NextPrayerInfo, WaqtWindow, WaqtStatus } from '../types/prayer';

/**
 * Format 24h time "HH:mm" to 12h time with AM/PM
 */
export function format12HourTime(hhmm: string): string {
  if (!hhmm) return '--:--';
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Formats a Date to local YYYY-MM-DD string without UTC conversion offset bugs
 */
export function formatLocalYYYYMMDD(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format remaining seconds into "Xh Ym Zs"
 */
export function formatRemainingTime(totalSec: number): string {
  if (totalSec <= 0) return 'Time elapsed';
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || hours > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Short digital countdown "HH:MM:SS"
 */
export function formatCountdownDigital(totalSec: number): string {
  if (totalSec <= 0) return '00:00:00';
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(mins).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

export interface TahajjudStatus {
  isActive: boolean;
  statusText: string;
  subText: string;
  targetTimeFormatted: string;
  secondsRemaining: number;
  phase: 'active_last_third' | 'night_permissible' | 'daytime_upcoming';
  startTimeFormatted: string;
  endTimeFormatted: string;
  midnightFormatted: string;
  firstThirdFormatted: string;
}

/**
 * Helper to safely extract hours and minutes from HH:mm string (protecting against NaN)
 */
function parseHHMMString(hhmm?: string): { hours: number; mins: number; decimal: number } {
  if (!hhmm) return { hours: 0, mins: 0, decimal: 0 };
  const cleaned = hhmm.trim().split(' ')[0];
  const parts = cleaned.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return { hours: h, mins: m, decimal: h + m / 60 };
}

/**
 * Determine exact Tahajjud state and countdown with robust overnight transition handling
 */
export function getTahajjudStatus(times: PrayerTimes, now: Date = new Date()): TahajjudStatus {
  const currentHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  const maghribVal = parseHHMMString(times.maghrib).decimal;
  const fajrVal = parseHHMMString(times.fajr).decimal;
  const tahajjudStartVal = parseHHMMString(times.tahajjudStart).decimal;

  const nowMs = now.getTime();

  const getDateWithHours = (baseDate: Date, hoursDecimal: number, addDays: number = 0): Date => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + addDays);
    const h = Math.floor(hoursDecimal) % 24;
    const m = Math.floor((hoursDecimal - Math.floor(hoursDecimal)) * 60) % 60;
    d.setHours(h, m, 0, 0);
    return d;
  };

  // 1. ACTIVE: Currently in the Last Third of the Night (between tahajjudStart and Fajr)
  if (currentHours >= tahajjudStartVal && currentHours < fajrVal) {
    const targetDate = getDateWithHours(now, fajrVal, 0);
    const remainingSec = Math.max(0, Math.floor((targetDate.getTime() - nowMs) / 1000));

    return {
      isActive: true,
      statusText: 'Tahajjud Prime Time is Active (Last Third of the Night)',
      subText: `Remaining until Fajr: ${formatRemainingTime(remainingSec)}`,
      targetTimeFormatted: format12HourTime(times.fajr),
      secondsRemaining: remainingSec,
      phase: 'active_last_third',
      startTimeFormatted: format12HourTime(times.tahajjudStart),
      endTimeFormatted: format12HourTime(times.tahajjudEnd),
      midnightFormatted: format12HourTime(times.midnight),
      firstThirdFormatted: format12HourTime(times.firstThird)
    };
  }

  // 2. NIGHT AFTER MIDNIGHT (e.g. 00:00 to Tahajjud start): Tahajjud permissible, waiting for Last Third
  if (currentHours < tahajjudStartVal) {
    const targetDate = getDateWithHours(now, tahajjudStartVal, 0);
    const remainingSec = Math.max(0, Math.floor((targetDate.getTime() - nowMs) / 1000));

    return {
      isActive: false,
      statusText: 'Tahajjud is permissible; prime Last Third begins soon',
      subText: `Time until Last Third: ${formatRemainingTime(remainingSec)}`,
      targetTimeFormatted: format12HourTime(times.tahajjudStart),
      secondsRemaining: remainingSec,
      phase: 'night_permissible',
      startTimeFormatted: format12HourTime(times.tahajjudStart),
      endTimeFormatted: format12HourTime(times.tahajjudEnd),
      midnightFormatted: format12HourTime(times.midnight),
      firstThirdFormatted: format12HourTime(times.firstThird)
    };
  }

  // 3. NIGHT BEFORE MIDNIGHT (e.g. 18:00 to 23:59): Night started after Maghrib
  if (currentHours >= maghribVal) {
    // Targets tomorrow morning's Tahajjud start (add 1 day)
    const targetDate = getDateWithHours(now, tahajjudStartVal, 1);
    const remainingSec = Math.max(0, Math.floor((targetDate.getTime() - nowMs) / 1000));

    return {
      isActive: false,
      statusText: 'Night prayer period active after Isha',
      subText: `Time until Last Third begins: ${formatRemainingTime(remainingSec)}`,
      targetTimeFormatted: format12HourTime(times.tahajjudStart),
      secondsRemaining: remainingSec,
      phase: 'night_permissible',
      startTimeFormatted: format12HourTime(times.tahajjudStart),
      endTimeFormatted: format12HourTime(times.tahajjudEnd),
      midnightFormatted: format12HourTime(times.midnight),
      firstThirdFormatted: format12HourTime(times.firstThird)
    };
  }

  // 4. DAYTIME (Between Fajr and Maghrib): Countdown to tonight's Tahajjud window
  const targetDate = getDateWithHours(now, tahajjudStartVal, 1);
  const remainingSec = Math.max(0, Math.floor((targetDate.getTime() - nowMs) / 1000));

  return {
    isActive: false,
    statusText: 'Daytime — Tonight’s Tahajjud window starts late night',
    subText: `Countdown to Last Third: ${formatRemainingTime(remainingSec)}`,
    targetTimeFormatted: format12HourTime(times.tahajjudStart),
    secondsRemaining: remainingSec,
    phase: 'daytime_upcoming',
    startTimeFormatted: format12HourTime(times.tahajjudStart),
    endTimeFormatted: format12HourTime(times.tahajjudEnd),
    midnightFormatted: format12HourTime(times.midnight),
    firstThirdFormatted: format12HourTime(times.firstThird)
  };
}

/**
 * Get next upcoming prayer with precise remaining seconds and progress
 */
export function getNextPrayer(times: PrayerTimes, now: Date = new Date()): NextPrayerInfo {
  const currentHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  const prayers = [
    { name: 'Fajr', nameEn: 'Fajr', parsed: parseHHMMString(times.fajr), hhmm: times.fajr || '04:45' },
    { name: 'Sunrise', nameEn: 'Sunrise', parsed: parseHHMMString(times.sunrise), hhmm: times.sunrise || '06:01' },
    { name: 'Dhuhr', nameEn: 'Dhuhr', parsed: parseHHMMString(times.dhuhr), hhmm: times.dhuhr || '11:37' },
    { name: 'Asr', nameEn: 'Asr', parsed: parseHHMMString(times.asr), hhmm: times.asr || '15:36' },
    { name: 'Maghrib', nameEn: 'Maghrib', parsed: parseHHMMString(times.maghrib), hhmm: times.maghrib || '17:12' },
    { name: 'Isha', nameEn: 'Isha', parsed: parseHHMMString(times.isha), hhmm: times.isha || '18:28' }
  ];

  let currentWaqtNameEn = 'Isha / Night';
  if (currentHours < prayers[0].parsed.decimal) {
    currentWaqtNameEn = 'Pre-Dawn / Tahajjud';
  } else if (currentHours < prayers[1].parsed.decimal) {
    currentWaqtNameEn = 'Fajr Period';
  } else if (currentHours < prayers[2].parsed.decimal) {
    currentWaqtNameEn = 'Ishraq & Duha';
  } else if (currentHours < prayers[3].parsed.decimal) {
    currentWaqtNameEn = 'Dhuhr Period';
  } else if (currentHours < prayers[4].parsed.decimal) {
    currentWaqtNameEn = 'Asr Period';
  } else if (currentHours < prayers[5].parsed.decimal) {
    currentWaqtNameEn = 'Maghrib Period';
  }

  // Find next event today
  for (let i = 0; i < prayers.length; i++) {
    const p = prayers[i];
    if (currentHours < p.parsed.decimal) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      targetDate.setHours(p.parsed.hours, p.parsed.mins, 0, 0);

      const prevTimeVal = i === 0 ? parseHHMMString(times.isha).decimal : prayers[i - 1].parsed.decimal;
      const totalSpanHours = i === 0 ? (p.parsed.decimal + 24 - prevTimeVal) : (p.parsed.decimal - prevTimeVal);
      const elapsedHours = i === 0 ? (currentHours + 24 - prevTimeVal) : (currentHours - prevTimeVal);
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedHours / (totalSpanHours || 1)) * 100)));
      const secondsRemaining = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

      return {
        name: p.name,
        nameEn: p.nameEn,
        timeStr: p.hhmm,
        targetDate,
        secondsRemaining: isNaN(secondsRemaining) ? 0 : secondsRemaining,
        isTahajjud: false,
        currentWaqtNameEn,
        progressPercent: isNaN(progressPercent) ? 0 : progressPercent
      };
    }
  }

  // If past Isha, next prayer is Fajr tomorrow morning
  const fajrParsed = parseHHMMString(times.fajr);
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  targetDate.setHours(fajrParsed.hours, fajrParsed.mins, 0, 0);

  const ishaVal = parseHHMMString(times.isha).decimal;
  const fajrVal = fajrParsed.decimal;
  const totalSpanHours = (fajrVal + 24) - ishaVal;
  const elapsedHours = (currentHours - ishaVal);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedHours / (totalSpanHours || 1)) * 100)));
  const secondsRemaining = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

  return {
    name: 'Fajr',
    nameEn: 'Fajr',
    timeStr: times.fajr || '04:45',
    targetDate,
    secondsRemaining: isNaN(secondsRemaining) ? 0 : secondsRemaining,
    isTahajjud: false,
    currentWaqtNameEn: 'Isha / Night',
    progressPercent: isNaN(progressPercent) ? 0 : progressPercent
  };
}

/**
 * Returns full start-to-end windows for each waqt, with automatic status:
 * - 'finished': user checked as prayed
 * - 'missed': waqt end time has passed without being prayed
 * - 'active': currently inside this waqt
 * - 'upcoming': waqt is in the future
 */
export function getDailyWaqtWindows(
  times: PrayerTimes,
  completedPrayers: Record<string, boolean> = {},
  now: Date = new Date()
): WaqtWindow[] {
  const currentHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  const parseHHMM = (hhmm: string): number => {
    if (!hhmm) return 0;
    const [h, m] = hhmm.split(':').map(Number);
    return (h || 0) + (m || 0) / 60;
  };

  const fajrVal = parseHHMM(times.fajr);
  const sunriseVal = parseHHMM(times.sunrise);
  const dhuhrVal = parseHHMM(times.dhuhr);
  const asrVal = parseHHMM(times.asr);
  const maghribVal = parseHHMM(times.maghrib);
  const ishaVal = parseHHMM(times.isha);
  const tahajjudVal = parseHHMM(times.tahajjudStart);

  const determineStatus = (
    startVal: number,
    endVal: number,
    key: string
  ): { status: WaqtStatus; label: string } => {
    const isDone = !!completedPrayers[key];
    if (isDone) {
      return { status: 'finished', label: 'Finished' };
    }

    // Special handling for Isha (runs across midnight from evening to Fajr dawn)
    if (key === 'isha') {
      // During daytime (between sunrise and Isha start), tonight's Isha is upcoming
      if (currentHours >= sunriseVal && currentHours < ishaVal) {
        return { status: 'upcoming', label: 'Upcoming' };
      }
      // Nighttime active window: from Isha evening (e.g. 18:28) until Fajr dawn (e.g. 04:45)
      if (currentHours >= ishaVal || currentHours < fajrVal) {
        return { status: 'active', label: 'Active Now' };
      }
      // After Fajr dawn until sunrise: last night's window has elapsed
      return { status: 'missed', label: 'Unfinished' };
    }

    // Special handling for Tahajjud (prime window: tahajjudStart ~01:00 AM to Fajr ~04:45 AM)
    if (key === 'tahajjud') {
      // Inside prime window
      if (currentHours >= tahajjudVal && currentHours < fajrVal) {
        return { status: 'active', label: 'Active Now' };
      }
      // During daytime and evening before Tahajjud start, tonight's Tahajjud is upcoming
      if (currentHours >= sunriseVal || currentHours < tahajjudVal) {
        return { status: 'upcoming', label: 'Upcoming' };
      }
      // After Fajr dawn until sunrise
      return { status: 'missed', label: 'Unfinished' };
    }

    // Standard daytime waqts: Fajr, Sunrise, Dhuhr, Asr, Maghrib
    if (currentHours < startVal) {
      return { status: 'upcoming', label: 'Upcoming' };
    }
    if (currentHours >= startVal && currentHours < endVal) {
      return { status: 'active', label: 'Active Now' };
    }
    return { status: 'missed', label: 'Unfinished' };
  };

  const fajrStat = determineStatus(fajrVal, sunriseVal, 'fajr');
  const sunriseStat = determineStatus(sunriseVal, dhuhrVal, 'sunrise');
  const dhuhrStat = determineStatus(dhuhrVal, asrVal, 'dhuhr');
  const asrStat = determineStatus(asrVal, maghribVal, 'asr');
  const maghribStat = determineStatus(maghribVal, ishaVal, 'maghrib');
  const ishaStat = determineStatus(ishaVal, fajrVal, 'isha');
  const tahajjudStat = determineStatus(tahajjudVal, fajrVal, 'tahajjud');

  return [
    {
      key: 'fajr',
      nameEn: 'Fajr',
      nameBn: 'ফজর',
      arabic: 'الفجر',
      startTime: times.fajr,
      endTime: times.sunrise,
      isCompleted: !!completedPrayers['fajr'],
      status: fajrStat.status,
      statusLabel: fajrStat.label,
      isPrayer: true
    },
    {
      key: 'sunrise',
      nameEn: 'Sunrise (Ishraq)',
      nameBn: 'সূর্যোদয় (ইশরাক)',
      arabic: 'الشروق',
      startTime: times.sunrise,
      endTime: times.dhuhr,
      isCompleted: !!completedPrayers['sunrise'],
      status: sunriseStat.status,
      statusLabel: sunriseStat.label,
      isPrayer: false
    },
    {
      key: 'dhuhr',
      nameEn: 'Dhuhr',
      nameBn: 'যোহর',
      arabic: 'الظهر',
      startTime: times.dhuhr,
      endTime: times.asr,
      isCompleted: !!completedPrayers['dhuhr'],
      status: dhuhrStat.status,
      statusLabel: dhuhrStat.label,
      isPrayer: true
    },
    {
      key: 'asr',
      nameEn: 'Asr',
      nameBn: 'আসর',
      arabic: 'العصر',
      startTime: times.asr,
      endTime: times.maghrib,
      isCompleted: !!completedPrayers['asr'],
      status: asrStat.status,
      statusLabel: asrStat.label,
      isPrayer: true
    },
    {
      key: 'maghrib',
      nameEn: 'Maghrib',
      nameBn: 'মাগরিব',
      arabic: 'المغرب',
      startTime: times.maghrib,
      endTime: times.isha,
      isCompleted: !!completedPrayers['maghrib'],
      status: maghribStat.status,
      statusLabel: maghribStat.label,
      isPrayer: true
    },
    {
      key: 'isha',
      nameEn: 'Isha',
      nameBn: 'এশা',
      arabic: 'العشاء',
      startTime: times.isha,
      endTime: times.fajr,
      isCompleted: !!completedPrayers['isha'],
      status: ishaStat.status,
      statusLabel: ishaStat.label,
      isPrayer: true
    },
    {
      key: 'tahajjud',
      nameEn: 'Tahajjud (Qiyam)',
      nameBn: 'তাহাজ্জুদ',
      arabic: 'التهجد',
      startTime: times.tahajjudStart,
      endTime: times.fajr,
      isCompleted: !!completedPrayers['tahajjud'],
      status: tahajjudStat.status,
      statusLabel: tahajjudStat.label,
      isPrayer: true
    }
  ];
}
