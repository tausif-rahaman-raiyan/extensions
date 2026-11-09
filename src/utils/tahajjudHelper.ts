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
 * Determine exact Tahajjud state and countdown with robust overnight transition handling
 */
export function getTahajjudStatus(times: PrayerTimes, now: Date = new Date()): TahajjudStatus {
  const currentHours = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;

  const parseHHMM = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return h + m / 60;
  };

  const maghribVal = parseHHMM(times.maghrib);
  const fajrVal = parseHHMM(times.fajr);
  const tahajjudStartVal = parseHHMM(times.tahajjudStart);

  const nowMs = now.getTime();

  const getDateWithHours = (baseDate: Date, hoursDecimal: number, addDays: number = 0): Date => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + addDays);
    const h = Math.floor(hoursDecimal);
    const m = Math.floor((hoursDecimal - h) * 60);
    const s = Math.round(((hoursDecimal - h) * 60 - m) * 60);
    d.setHours(h, m, s, 0);
    return d;
  };

  // 1. ACTIVE: Currently in the Last Third of the Night (between tahajjudStart and Fajr, e.g. 02:40 AM to 04:55 AM)
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

  // 2. NIGHT AFTER MIDNIGHT (e.g. 00:00 to 02:40 AM): Tahajjud permissible, waiting for Last Third
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

  const parseHHMM = (hhmm: string): number => {
    const [h, m] = hhmm.split(':').map(Number);
    return h + m / 60;
  };

  const prayers = [
    { name: 'Fajr', nameEn: 'Fajr', val: parseHHMM(times.fajr), hhmm: times.fajr },
    { name: 'Sunrise', nameEn: 'Sunrise', val: parseHHMM(times.sunrise), hhmm: times.sunrise },
    { name: 'Dhuhr', nameEn: 'Dhuhr', val: parseHHMM(times.dhuhr), hhmm: times.dhuhr },
    { name: 'Asr', nameEn: 'Asr', val: parseHHMM(times.asr), hhmm: times.asr },
    { name: 'Maghrib', nameEn: 'Maghrib', val: parseHHMM(times.maghrib), hhmm: times.maghrib },
    { name: 'Isha', nameEn: 'Isha', val: parseHHMM(times.isha), hhmm: times.isha }
  ];

  let currentWaqtNameEn = 'Isha / Night';
  if (currentHours < prayers[0].val) {
    currentWaqtNameEn = 'Pre-Dawn / Tahajjud';
  } else if (currentHours < prayers[1].val) {
    currentWaqtNameEn = 'Fajr Period';
  } else if (currentHours < prayers[2].val) {
    currentWaqtNameEn = 'Ishraq & Duha';
  } else if (currentHours < prayers[3].val) {
    currentWaqtNameEn = 'Dhuhr Period';
  } else if (currentHours < prayers[4].val) {
    currentWaqtNameEn = 'Asr Period';
  } else if (currentHours < prayers[5].val) {
    currentWaqtNameEn = 'Maghrib Period';
  }

  // Find next event today
  for (let i = 0; i < prayers.length; i++) {
    if (currentHours < prayers[i].val) {
      const p = prayers[i];
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const [h, m] = p.hhmm.split(':').map(Number);
      targetDate.setHours(h, m, 0, 0);

      const prevTimeVal = i === 0 ? parseHHMM(times.isha) : prayers[i - 1].val;
      const totalSpanHours = i === 0 ? (p.val + 24 - prevTimeVal) : (p.val - prevTimeVal);
      const elapsedHours = i === 0 ? (currentHours + 24 - prevTimeVal) : (currentHours - prevTimeVal);
      const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedHours / totalSpanHours) * 100)));
      const secondsRemaining = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

      return {
        name: p.name,
        nameEn: p.nameEn,
        timeStr: p.hhmm,
        targetDate,
        secondsRemaining,
        isTahajjud: false,
        currentWaqtNameEn,
        progressPercent
      };
    }
  }

  // If past Isha, next prayer is Fajr tomorrow morning
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const [fH, fM] = times.fajr.split(':').map(Number);
  targetDate.setHours(fH, fM, 0, 0);

  const ishaVal = parseHHMM(times.isha);
  const fajrVal = parseHHMM(times.fajr);
  const totalSpanHours = (fajrVal + 24) - ishaVal;
  const elapsedHours = (currentHours - ishaVal);
  const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedHours / totalSpanHours) * 100)));
  const secondsRemaining = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

  return {
    name: 'Fajr',
    nameEn: 'Fajr',
    timeStr: times.fajr,
    targetDate,
    secondsRemaining,
    isTahajjud: false,
    currentWaqtNameEn: 'Isha / Night',
    progressPercent
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
    key: string,
    crossesMidnight: boolean = false
  ): { status: WaqtStatus; label: string } => {
    const isDone = !!completedPrayers[key];
    if (isDone) {
      return { status: 'finished', label: 'Finished' };
    }

    let isActive = false;
    let isPassed = false;

    if (!crossesMidnight) {
      if (currentHours >= startVal && currentHours < endVal) {
        isActive = true;
      } else if (currentHours >= endVal) {
        isPassed = true;
      }
    } else {
      // Overnight (e.g. Isha: starts at ishaVal ~18:34, ends at fajrVal ~04:56 next morning)
      if (currentHours >= startVal || currentHours < endVal) {
        isActive = true;
      } else if (currentHours >= endVal && currentHours < startVal) {
        isPassed = true;
      }
    }

    if (isActive) {
      return { status: 'active', label: 'Active Now' };
    }
    if (isPassed) {
      return { status: 'missed', label: 'Unfinished' };
    }
    return { status: 'upcoming', label: 'Upcoming' };
  };

  const fajrStat = determineStatus(fajrVal, sunriseVal, 'fajr');
  const sunriseStat = determineStatus(sunriseVal, dhuhrVal, 'sunrise');
  const dhuhrStat = determineStatus(dhuhrVal, asrVal, 'dhuhr');
  const asrStat = determineStatus(asrVal, maghribVal, 'asr');
  const maghribStat = determineStatus(maghribVal, ishaVal, 'maghrib');
  const ishaStat = determineStatus(ishaVal, fajrVal, 'isha', true);
  const tahajjudStat = determineStatus(tahajjudVal, fajrVal, 'tahajjud', false);

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
