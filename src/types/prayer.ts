export type ProviderId =
  | 'aladhan'
  | 'aladhancity'
  | 'prayzone'
  | 'islamicnetwork'
  | 'astronomical'
  | 'muslimsalat'
  | 'islamicfinder'
  | 'waktusolat';

export type NavSection =
  | 'overview'
  | 'times'
  | 'tahajjud'
  | 'tracker'
  | 'quotes'
  | 'quran'
  | 'location'
  | 'providers'
  | 'settings'
  | 'about';

export type ThemeMode = 'dark' | 'light' | 'system';

export type WaqtStatus = 'active' | 'upcoming' | 'finished' | 'missed';

export interface WaqtWindow {
  key: string;
  nameEn: string;
  nameBn: string;
  arabic: string;
  startTime: string;      // HH:mm 24h
  endTime: string;        // HH:mm 24h
  isCompleted: boolean;
  status: WaqtStatus;
  statusLabel: string;
  isPrayer: boolean;
}

export interface PrayerTimes {
  fajr: string;          // HH:mm 24h
  sunrise: string;       // HH:mm 24h
  dhuhr: string;         // HH:mm 24h
  asr: string;           // HH:mm 24h
  maghrib: string;       // HH:mm 24h
  isha: string;          // HH:mm 24h
  midnight: string;      // HH:mm 24h (Islamic midnight)
  tahajjudStart: string; // HH:mm 24h (Last third begins)
  tahajjudEnd: string;   // HH:mm 24h (At Fajr)
  firstThird: string;    // HH:mm 24h
  rawDate: string;       // YYYY-MM-DD
  hijriDate?: {
    day: string;
    monthBn?: string;
    monthEn: string;
    year: string;
  };
  isCached?: boolean;
  cachedAt?: number;
  isManualOverride?: boolean;
}

export interface ManualPrayerOverrides {
  enabled: boolean;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  tahajjudStart?: string;
}

export interface ProviderHealth {
  id: ProviderId;
  name: string;
  url: string;
  status: 'operational' | 'offline_502' | 'error' | 'cooldown' | 'testing';
  latencyMs?: number;
  lastChecked?: string;
  errorMessage?: string;
  cooldownUntil?: number;
}

export interface IslamicQuote {
  id: string;
  arabic?: string;
  bengali: string;
  reference: string;
  category: 'prayer' | 'tahajjud' | 'tawbah' | 'sabr' | 'shukr' | 'rizq' | 'fasting' | 'character' | 'knowledge';
  categoryEn: string;
  narratorBn?: string;
}

export interface LocationInfo {
  nameEn: string;
  nameBn?: string;
  country: string;
  lat: number;
  lng: number;
  timezone: string;
  isCustom?: boolean;
}

export type JuristicMethod = 'hanafi' | 'shafii';
export type CalculationMethod = 'karachi' | 'mwl' | 'isna' | 'makkah' | 'egypt';

export interface NextPrayerInfo {
  name: string;
  nameEn: string;
  timeStr: string;
  targetDate: Date;
  secondsRemaining: number;
  isTahajjud: boolean;
  currentWaqtNameEn: string;
  progressPercent: number;
}

export interface QuranSession {
  id: string;
  timestamp: number;
  dateStr: string;
  durationSeconds: number;
  surahNote: string;
}

export interface NotificationSettings {
  fajr?: boolean;
  dhuhr?: boolean;
  asr?: boolean;
  maghrib?: boolean;
  isha?: boolean;
  tahajjud?: boolean;
  advanceMinutes?: number;
  soundEnabled?: boolean;
  enabled?: boolean;
  reminderMinutesBefore?: number;
}
