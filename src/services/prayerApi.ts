import {
  PrayerTimes,
  ProviderId,
  ProviderHealth,
  LocationInfo,
  JuristicMethod,
  CalculationMethod,
  ManualPrayerOverrides
} from '../types/prayer';
import { calculateAstronomicalTimes } from './astronomicalCalculator';

const METHOD_MAP: Record<CalculationMethod, number> = {
  karachi: 1, // University of Islamic Sciences, Karachi
  isna: 2,    // Islamic Society of North America
  mwl: 3,     // Muslim World League
  makkah: 4,  // Umm Al-Qura University, Makkah
  egypt: 5    // Egyptian General Authority of Survey
};

export interface FetchPrayerResult {
  times: PrayerTimes;
  usedProvider: ProviderId;
  fallbackOccurred: boolean;
  providerStatus: Record<ProviderId, ProviderHealth>;
  fetchTimestamp: number;
}

export class PrayerService {
  // In-flight deduplication promise map
  private static inFlightRequests = new Map<string, Promise<FetchPrayerResult>>();

  // Cooldown tracker for providers
  private static cooldowns: Partial<Record<ProviderId, number>> = {};

  // Last logged error message per provider to avoid console spam
  private static lastLoggedErrors: Partial<Record<ProviderId, string>> = {};

  private static providerHealthMap: Record<ProviderId, ProviderHealth> = {
    'aladhan': {
      id: 'aladhan',
      name: 'AlAdhan Global Coordinates API',
      url: 'https://api.aladhan.com/v1/timings',
      status: 'operational'
    },
    'aladhancity': {
      id: 'aladhancity',
      name: 'AlAdhan City API (WaktuSolat)',
      url: 'https://api.aladhan.com/v1/timingsByCity',
      status: 'operational'
    },
    'prayzone': {
      id: 'prayzone',
      name: 'PrayZone Global API',
      url: 'https://api.pray.zone/v2/times/today.json',
      status: 'operational'
    },
    'islamicnetwork': {
      id: 'islamicnetwork',
      name: 'Islamic Network API',
      url: 'https://api.aladhan.com/v1/timingsByAddress',
      status: 'operational'
    },
    'astronomical': {
      id: 'astronomical',
      name: 'Local Astronomical Solar Engine',
      url: 'local://solar-astronomical-engine',
      status: 'operational'
    },
    'muslimsalat': {
      id: 'muslimsalat',
      name: 'MuslimSalat Global API',
      url: 'https://muslimsalat.com',
      status: 'operational'
    },
    'islamicfinder': {
      id: 'islamicfinder',
      name: 'IslamicFinder Global API',
      url: 'https://www.islamicfinder.us/index.php/api/prayer_times',
      status: 'operational'
    },
    'waktusolat': {
      id: 'waktusolat',
      name: 'WaktuSolat API',
      url: 'https://api.aladhan.com/v1/timingsByCity',
      status: 'operational'
    }
  };

  /**
   * Safe fetch with AbortController timeout
   */
  private static async fetchWithTimeout(url: string, timeoutMs: number = 3500): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Clean and normalize time string to HH:mm 24h format (handles "3:48 pm", "15:48", etc.)
   */
  public static sanitizeTime(timeStr?: string): string {
    if (!timeStr) return '00:00';
    const trimmed = timeStr.trim();
    const match12h = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (match12h) {
      let hours = parseInt(match12h[1], 10);
      const minutes = match12h[2];
      const modifier = match12h[3]?.toLowerCase();
      if (modifier === 'pm' && hours < 12) hours += 12;
      if (modifier === 'am' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${minutes}`;
    }
    const cleaned = trimmed.split(' ')[0];
    const parts = cleaned.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return cleaned;
  }

  /**
   * Validate that all 6 core prayer times exist and are parseable
   */
  public static validateTimings(times: Partial<PrayerTimes>): boolean {
    if (!times.fajr || !times.sunrise || !times.dhuhr || !times.asr || !times.maghrib || !times.isha) {
      return false;
    }
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return (
      timeRegex.test(times.fajr) &&
      timeRegex.test(times.sunrise) &&
      timeRegex.test(times.dhuhr) &&
      timeRegex.test(times.asr) &&
      timeRegex.test(times.maghrib) &&
      timeRegex.test(times.isha)
    );
  }

  /**
   * Compute Islamic Night Divisions (Maghrib to Fajr)
   */
  public static computeNightTimes(maghrib: string, fajr: string): {
    midnight: string;
    tahajjudStart: string;
    tahajjudEnd: string;
    firstThird: string;
  } {
    const [mH, mM] = maghrib.split(':').map(Number);
    const [fH, fM] = fajr.split(':').map(Number);

    const maghribMins = mH * 60 + mM;
    let fajrMins = fH * 60 + fM;
    if (fajrMins <= maghribMins) {
      fajrMins += 24 * 60; // Crosses midnight
    }

    const nightDuration = fajrMins - maghribMins;
    const oneThird = nightDuration / 3;
    const halfNight = nightDuration / 2;

    const firstThirdMins = (maghribMins + oneThird) % (24 * 60);
    const midnightMins = (maghribMins + halfNight) % (24 * 60);
    const tahajjudStartMins = (maghribMins + 2 * oneThird) % (24 * 60);

    const toHHMM = (totalMins: number) => {
      const h = Math.floor(totalMins / 60) % 24;
      const m = Math.floor(totalMins % 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    return {
      midnight: toHHMM(midnightMins),
      tahajjudStart: toHHMM(tahajjudStartMins),
      tahajjudEnd: fajr,
      firstThird: toHHMM(firstThirdMins)
    };
  }

  public static isProviderInCooldown(provider: ProviderId): boolean {
    const expireTime = this.cooldowns[provider];
    if (!expireTime) return false;
    if (Date.now() > expireTime) {
      delete this.cooldowns[provider];
      return false;
    }
    return true;
  }

  public static setProviderCooldown(provider: ProviderId, cooldownMs: number = 300000) {
    this.cooldowns[provider] = Date.now() + cooldownMs;
  }

  /**
   * Apply user-defined manual prayer time overrides if enabled
   */
  public static applyManualOverrides(
    times: PrayerTimes,
    overrides?: ManualPrayerOverrides | null
  ): PrayerTimes {
    if (!overrides || !overrides.enabled) return times;

    const fajr = overrides.fajr ? this.sanitizeTime(overrides.fajr) : times.fajr;
    const sunrise = overrides.sunrise ? this.sanitizeTime(overrides.sunrise) : times.sunrise;
    const dhuhr = overrides.dhuhr ? this.sanitizeTime(overrides.dhuhr) : times.dhuhr;
    const asr = overrides.asr ? this.sanitizeTime(overrides.asr) : times.asr;
    const maghrib = overrides.maghrib ? this.sanitizeTime(overrides.maghrib) : times.maghrib;
    const isha = overrides.isha ? this.sanitizeTime(overrides.isha) : times.isha;

    const night = this.computeNightTimes(maghrib, fajr);

    return {
      ...times,
      fajr,
      sunrise,
      dhuhr,
      asr,
      maghrib,
      isha,
      midnight: night.midnight,
      tahajjudStart: overrides.tahajjudStart ? this.sanitizeTime(overrides.tahajjudStart) : night.tahajjudStart,
      tahajjudEnd: night.tahajjudEnd,
      firstThird: night.firstThird,
      isManualOverride: true
    };
  }

  /**
   * Provider 1: AlAdhan Global Timings API
   */
  private static async fetchAladhan(
    date: Date,
    location: LocationInfo,
    juristic: JuristicMethod,
    calcMethod: CalculationMethod
  ): Promise<PrayerTimes> {
    const timestamp = Math.floor(date.getTime() / 1000);
    const methodNum = METHOD_MAP[calcMethod] || 1;
    const schoolNum = juristic === 'hanafi' ? 1 : 0;
    const url = `https://api.aladhan.com/v1/timings/${timestamp}?latitude=${location.lat}&longitude=${location.lng}&method=${methodNum}&school=${schoolNum}`;

    const startTime = performance.now();
    const res = await this.fetchWithTimeout(url, 3500);
    const latency = Math.round(performance.now() - startTime);

    if (!res.ok) throw new Error(`AlAdhan HTTP ${res.status}`);
    const json = await res.json();
    const timings = json?.data?.timings;
    if (!timings) throw new Error('AlAdhan: Invalid JSON response structure');

    const fajr = this.sanitizeTime(timings.Fajr);
    const sunrise = this.sanitizeTime(timings.Sunrise);
    const dhuhr = this.sanitizeTime(timings.Dhuhr);
    const asr = this.sanitizeTime(timings.Asr);
    const maghrib = this.sanitizeTime(timings.Maghrib);
    const isha = this.sanitizeTime(timings.Isha);

    const night = this.computeNightTimes(maghrib, fajr);

    const hijriData = json?.data?.date?.hijri;
    let hijriDate;
    if (hijriData) {
      hijriDate = {
        day: hijriData.day || '',
        monthEn: hijriData.month?.en || '',
        monthBn: hijriData.month?.ar || '',
        year: hijriData.year || ''
      };
    }

    this.providerHealthMap['aladhan'] = {
      id: 'aladhan',
      name: 'AlAdhan Global API',
      url,
      status: 'operational',
      latencyMs: latency,
      lastChecked: new Date().toLocaleTimeString()
    };

    return {
      fajr,
      sunrise,
      dhuhr,
      asr,
      maghrib,
      isha,
      midnight: night.midnight,
      tahajjudStart: night.tahajjudStart,
      tahajjudEnd: night.tahajjudEnd,
      firstThird: night.firstThird,
      rawDate: date.toISOString().split('T')[0],
      hijriDate
    };
  }

  /**
   * Provider 2: MuslimSalat Global API (Replaces SITP)
   */
  private static async fetchMuslimSalat(
    date: Date,
    location: LocationInfo
  ): Promise<PrayerTimes> {
    // Try coordinates first, then fallback to city query
    const url = `https://muslimsalat.com/${location.lat},${location.lng}/daily.json`;

    const startTime = performance.now();
    const res = await this.fetchWithTimeout(url, 3500);
    const latency = Math.round(performance.now() - startTime);

    if (!res.ok) throw new Error(`MuslimSalat HTTP ${res.status}`);
    const data = await res.json();

    const item = data?.items?.[0] || data?.item?.[0] || data?.items || data;
    if (!item || !item.fajr) {
      throw new Error('MuslimSalat: Invalid response items format');
    }

    const fajr = this.sanitizeTime(item.fajr);
    const sunrise = this.sanitizeTime(item.shurooq || item.sunrise);
    const dhuhr = this.sanitizeTime(item.dhuhr);
    const asr = this.sanitizeTime(item.asr);
    const maghrib = this.sanitizeTime(item.maghrib);
    const isha = this.sanitizeTime(item.isha);

    const night = this.computeNightTimes(maghrib, fajr);

    this.providerHealthMap['muslimsalat'] = {
      id: 'muslimsalat',
      name: 'MuslimSalat Global API',
      url,
      status: 'operational',
      latencyMs: latency,
      lastChecked: new Date().toLocaleTimeString()
    };

    return {
      fajr,
      sunrise,
      dhuhr,
      asr,
      maghrib,
      isha,
      midnight: night.midnight,
      tahajjudStart: night.tahajjudStart,
      tahajjudEnd: night.tahajjudEnd,
      firstThird: night.firstThird,
      rawDate: date.toISOString().split('T')[0]
    };
  }

  /**
   * Provider 3: IslamicFinder Global API
   */
  private static async fetchIslamicFinder(
    date: Date,
    location: LocationInfo,
    juristic: JuristicMethod,
    calcMethod: CalculationMethod
  ): Promise<PrayerTimes> {
    const tz = encodeURIComponent(location.timezone || 'Asia/Dhaka');
    const methodNum = METHOD_MAP[calcMethod] || 1;
    const juristicParam = juristic === 'hanafi' ? 1 : 0;
    const url = `https://www.islamicfinder.us/index.php/api/prayer_times?latitude=${location.lat}&longitude=${location.lng}&timezone=${tz}&method=${methodNum}&juristic=${juristicParam}`;

    const startTime = performance.now();
    const res = await this.fetchWithTimeout(url, 3500);
    const latency = Math.round(performance.now() - startTime);

    if (!res.ok) throw new Error(`IslamicFinder HTTP ${res.status}`);
    const data = await res.json();
    const results = data?.results || data?.data || data;

    if (!results || !results.Fajr) {
      throw new Error('IslamicFinder: Malformed response format');
    }

    const fajr = this.sanitizeTime(results.Fajr);
    const sunrise = this.sanitizeTime(results.Sunrise || results.Duha);
    const dhuhr = this.sanitizeTime(results.Dhuhr);
    const asr = this.sanitizeTime(results.Asr);
    const maghrib = this.sanitizeTime(results.Maghrib);
    const isha = this.sanitizeTime(results.Isha);

    const night = this.computeNightTimes(maghrib, fajr);

    this.providerHealthMap['islamicfinder'] = {
      id: 'islamicfinder',
      name: 'IslamicFinder Global API',
      url,
      status: 'operational',
      latencyMs: latency,
      lastChecked: new Date().toLocaleTimeString()
    };

    return {
      fajr,
      sunrise,
      dhuhr,
      asr,
      maghrib,
      isha,
      midnight: night.midnight,
      tahajjudStart: night.tahajjudStart,
      tahajjudEnd: night.tahajjudEnd,
      firstThird: night.firstThird,
      rawDate: date.toISOString().split('T')[0]
    };
  }

  /**
   * Provider 4: WaktuSolat / AlAdhan City Alternative
   */
  private static async fetchWaktuSolat(
    date: Date,
    location: LocationInfo,
    juristic: JuristicMethod,
    calcMethod: CalculationMethod
  ): Promise<PrayerTimes> {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const city = encodeURIComponent(location.nameEn.split(' ')[0] || 'Dhaka');
    const country = encodeURIComponent(location.country || 'Bangladesh');
    const methodNum = METHOD_MAP[calcMethod] || 1;
    const schoolNum = juristic === 'hanafi' ? 1 : 0;
    const url = `https://api.aladhan.com/v1/timingsByCity/${day}-${month}-${year}?city=${city}&country=${country}&method=${methodNum}&school=${schoolNum}`;

    const startTime = performance.now();
    const res = await this.fetchWithTimeout(url, 3500);
    const latency = Math.round(performance.now() - startTime);

    if (!res.ok) throw new Error(`WaktuSolat/City HTTP ${res.status}`);
    const data = await res.json();
    const t = data?.data?.timings;
    if (!t) throw new Error('WaktuSolat/City: Invalid structure');

    const fajr = this.sanitizeTime(t.Fajr);
    const sunrise = this.sanitizeTime(t.Sunrise);
    const dhuhr = this.sanitizeTime(t.Dhuhr);
    const asr = this.sanitizeTime(t.Asr);
    const maghrib = this.sanitizeTime(t.Maghrib);
    const isha = this.sanitizeTime(t.Isha);

    const night = this.computeNightTimes(maghrib, fajr);

    this.providerHealthMap['waktusolat'] = {
      id: 'waktusolat',
      name: 'WaktuSolat API',
      url,
      status: 'operational',
      latencyMs: latency,
      lastChecked: new Date().toLocaleTimeString()
    };

    return {
      fajr,
      sunrise,
      dhuhr,
      asr,
      maghrib,
      isha,
      midnight: night.midnight,
      tahajjudStart: night.tahajjudStart,
      tahajjudEnd: night.tahajjudEnd,
      firstThird: night.firstThird,
      rawDate: `${year}-${month}-${day}`
    };
  }

  /**
   * Provider 5: Local Astronomical Solar Engine (Guaranteed zero-network calculation)
   */
  private static calculateAstronomical(
    date: Date,
    location: LocationInfo,
    juristic: JuristicMethod
  ): PrayerTimes {
    const tzOffset = 6; // Standard Bangladesh UTC+6, or dynamic offset
    const times = calculateAstronomicalTimes(date, location.lat, location.lng, tzOffset, juristic);

    this.providerHealthMap['astronomical'] = {
      id: 'astronomical',
      name: 'Local Solar Engine (Offline)',
      url: 'local://solar-astronomical-engine',
      status: 'operational',
      latencyMs: 1,
      lastChecked: new Date().toLocaleTimeString()
    };

    return times;
  }

  /**
   * Main entry point with request deduplication and 5-provider fallback
   */
  public static async getPrayerTimes(
    date: Date,
    location: LocationInfo,
    preferredProvider: ProviderId = 'aladhan',
    juristic: JuristicMethod = 'hanafi',
    calcMethod: CalculationMethod = 'karachi',
    manualOverrides?: ManualPrayerOverrides | null
  ): Promise<FetchPrayerResult> {
    const dateStr = date.toISOString().split('T')[0];
    const dedupeKey = `${dateStr}_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}_${preferredProvider}_${juristic}_${calcMethod}`;

    // 1. Check in-flight duplicate request
    if (this.inFlightRequests.has(dedupeKey)) {
      const existing = await this.inFlightRequests.get(dedupeKey)!;
      return {
        ...existing,
        times: this.applyManualOverrides(existing.times, manualOverrides)
      };
    }

    // 2. Wrap execution in promise for deduplication
    const fetchPromise = this.executeFetchWithFallback(date, location, preferredProvider, juristic, calcMethod, dateStr);
    this.inFlightRequests.set(dedupeKey, fetchPromise);

    try {
      const result = await fetchPromise;
      return {
        ...result,
        times: this.applyManualOverrides(result.times, manualOverrides)
      };
    } finally {
      this.inFlightRequests.delete(dedupeKey);
    }
  }

  private static async executeFetchWithFallback(
    date: Date,
    location: LocationInfo,
    preferredProvider: ProviderId,
    juristic: JuristicMethod,
    calcMethod: CalculationMethod,
    dateStr: string
  ): Promise<FetchPrayerResult> {
    // Build cascading priority list with MuslimSalat
    const candidateOrder: ProviderId[] = [
      preferredProvider,
      'aladhan',
      'muslimsalat',
      'islamicfinder',
      'waktusolat',
      'astronomical'
    ];

    // Filter unique
    const uniqueOrder = Array.from(new Set(candidateOrder));
    let fallbackOccurred = false;

    for (let i = 0; i < uniqueOrder.length; i++) {
      const provider = uniqueOrder[i];

      if (this.isProviderInCooldown(provider)) {
        fallbackOccurred = true;
        continue;
      }

      try {
        let times: PrayerTimes;
        if (provider === 'aladhan') {
          times = await this.fetchAladhan(date, location, juristic, calcMethod);
        } else if (provider === 'muslimsalat') {
          times = await this.fetchMuslimSalat(date, location);
        } else if (provider === 'islamicfinder') {
          times = await this.fetchIslamicFinder(date, location, juristic, calcMethod);
        } else if (provider === 'waktusolat') {
          times = await this.fetchWaktuSolat(date, location, juristic, calcMethod);
        } else {
          times = this.calculateAstronomical(date, location, juristic);
        }

        // Validate schedule
        if (this.validateTimings(times)) {
          try {
            const cacheKey = `pf_cached_schedule_${dateStr}_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`;
            localStorage.setItem(cacheKey, JSON.stringify({ ...times, cachedAt: Date.now() }));
          } catch (e) {}

          return {
            times,
            usedProvider: provider,
            fallbackOccurred: i > 0 || fallbackOccurred,
            providerStatus: { ...this.providerHealthMap },
            fetchTimestamp: Date.now()
          };
        }
      } catch (err: any) {
        fallbackOccurred = true;
        const msg = err?.message || String(err);
        if (this.lastLoggedErrors[provider] !== msg) {
          console.warn(`[Prayer Focus] Provider ${provider} failed: ${msg}. Cascading to next provider...`);
          this.lastLoggedErrors[provider] = msg;
        }
      }
    }

    // 3. Fallback to smart same-day cache
    try {
      const cacheKey = `pf_cached_schedule_${dateStr}_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.rawDate === dateStr && this.validateTimings(parsed)) {
          return {
            times: { ...parsed, isCached: true },
            usedProvider: 'astronomical',
            fallbackOccurred: true,
            providerStatus: { ...this.providerHealthMap },
            fetchTimestamp: Date.now()
          };
        }
      }
    } catch (e) {}

    // 4. Absolute fail-safe: Local astronomical solar engine never fails
    const localTimes = this.calculateAstronomical(date, location, juristic);
    return {
      times: localTimes,
      usedProvider: 'astronomical',
      fallbackOccurred: true,
      providerStatus: { ...this.providerHealthMap },
      fetchTimestamp: Date.now()
    };
  }

  public static async testAllProviders(
    location: LocationInfo,
    juristic: JuristicMethod = 'hanafi',
    calcMethod: CalculationMethod = 'karachi'
  ): Promise<Record<ProviderId, ProviderHealth>> {
    const now = new Date();
    try {
      await this.fetchAladhan(now, location, juristic, calcMethod);
    } catch (e: any) {
      this.providerHealthMap['aladhan'].status = 'error';
      this.providerHealthMap['aladhan'].errorMessage = e?.message;
    }

    try {
      await this.fetchMuslimSalat(now, location);
    } catch (e: any) {
      this.providerHealthMap['muslimsalat'].status = 'error';
      this.providerHealthMap['muslimsalat'].errorMessage = e?.message;
    }

    try {
      await this.fetchIslamicFinder(now, location, juristic, calcMethod);
    } catch (e: any) {
      this.providerHealthMap['islamicfinder'].status = 'error';
      this.providerHealthMap['islamicfinder'].errorMessage = e?.message;
    }

    try {
      await this.fetchWaktuSolat(now, location, juristic, calcMethod);
    } catch (e: any) {
      this.providerHealthMap['waktusolat'].status = 'error';
      this.providerHealthMap['waktusolat'].errorMessage = e?.message;
    }

    this.calculateAstronomical(now, location, juristic);

    return { ...this.providerHealthMap };
  }

  public static getProviderHealth(): Record<ProviderId, ProviderHealth> {
    return { ...this.providerHealthMap };
  }
}
