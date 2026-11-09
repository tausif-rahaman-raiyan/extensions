export type ProviderId = 'aladhan' | 'islamicfinder' | 'waktusolat' | 'sitp' | 'astronomical';

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
  enabled: boolean;
  soundEnabled: boolean;
  reminderMinutesBefore: number;
}
