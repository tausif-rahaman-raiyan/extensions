import {
  PrayerTimes,
  ProviderId,
  ProviderHealth,
  LocationInfo,
  JuristicMethod,
  CalculationMethod
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

  // Cooldown tracker for providers (e.g., 5-10 minutes on 502 Bad Gateway)
  private static cooldowns: Partial<Record<ProviderId, number>> = {};

  // Last logged error message per provider to avoid console spam
  private static lastLoggedErrors: Partial<Record<ProviderId, string>> = {};

  private static providerHealthMap: Record<ProviderId, ProviderHealth> = {
    'aladhan': {
      id: 'aladhan',
      name: 'AlAdhan Global API',
      url: 'https://api.aladhan.com/v1/timings',
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
    },
    'sitp': {
      id: 'sitp',
      name: 'SITP Prayer Times API',
      url: 'https://api.sitp.app/api/v1/prayer-times',
      status: 'testing'
    },
    'astronomical': {
      id: 'astronomical',
      name: 'Local Solar Engine (100% Offline)',
      url: 'local://solar-astronomical-engine',
      status: 'operational'
    }
  };

  /**
   * Safe fetch with AbortController timeout
   */
  private static async fetchWithTimeout(url: string, timeoutMs: number = 3200): Promise<Response> {
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
   * Clean HH:mm string from API responses
   */
  public static sanitizeTime(timeStr?: string): string {
    if (!timeStr) return '00:00';
    const cleaned = timeStr.trim().split(' ')[0];
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
   * Compute Tahajjud and Islamic night phases given Maghrib and Fajr
   */
  public static computeNightTimes(maghribHHMM: string, fajrHHMM: string) {
    const [mH, mM] = maghribHHMM.split(':').map(Number);
    const [fH, fM] = fajrHHMM.split(':').map(Number);

    const maghribMins = mH * 60 + mM;
    // Fajr is in next morning, so add 24 hours (1440 minutes)
    const fajrNextMorningMins = (fH + 24) * 60 + fM;
    const nightDurationMins = fajrNextMorningMins - maghribMins;

    const midnightMins = (maghribMins + Math.round(nightDurationMins / 2)) % 1440;
    const firstThirdMins = (maghribMins + Math.round(nightDurationMins / 3)) % 1440;
    const lastThirdMins = (maghribMins + Math.round((2 * nightDurationMins) / 3)) % 1440;

    const toHHMM = (totalMins: number) => {
      const h = Math.floor(totalMins / 60) % 24;
      const m = totalMins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    return {
      midnight: toHHMM(midnightMins),
      firstThird: toHHMM(firstThirdMins),
      tahajjudStart: toHHMM(lastThirdMins),
      tahajjudEnd: fajrHHMM
    };
  }

  /**
   * Check if provider is currently in cooldown (e.g. after HTTP 502)
   */
  private static isProviderInCooldown(provider: ProviderId): boolean {
    const until = this.cooldowns[provider];
    if (!until) return false;
    if (Date.now() > until) {
      delete this.cooldowns[provider];
      return false;
    }
    return true;
  }

  /**
   * Set provider cooldown (default 5 minutes = 300,000ms)
   */
  private static setProviderCooldown(provider: ProviderId, durationMs: number = 300000) {
    const cooldownUntil = Date.now() + durationMs;
    this.cooldowns[provider] = cooldownUntil;
    if (this.providerHealthMap[provider]) {
      this.providerHealthMap[provider].cooldownUntil = cooldownUntil;
      this.providerHealthMap[provider].status = 'cooldown';
    }
  }

  /**
   * Provider 1: AlAdhan Coordinates API
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
    const data = await res.json();
    if (!data?.data?.timings) throw new Error('AlAdhan: Invalid timings structure');

    const t = data.data.timings;
    const fajr = this.sanitizeTime(t.Fajr);
    const sunrise = this.sanitizeTime(t.Sunrise);
    const dhuhr = this.sanitizeTime(t.Dhuhr);
    const asr = this.sanitizeTime(t.Asr);
    const maghrib = this.sanitizeTime(t.Maghrib);
    const isha = this.sanitizeTime(t.Isha);

    const night = this.computeNightTimes(maghrib, fajr);
    const hijri = data.data.date?.hijri;

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
      hijriDate: hijri ? {
        day: String(hijri.day || ''),
        monthEn: hijri.month?.en || '',
        year: String(hijri.year || '')
      } : undefined
    };
  }

  /**
   * Provider 2: IslamicFinder API
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
   * Provider 3: WaktuSolat / AlAdhan City Alternative
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
   * Provider 4: SITP API with strict 502/503/504 detection and 5-min cooldown
   */
  private static async fetchSitp(
    date: Date,
    location: LocationInfo
  ): Promise<PrayerTimes> {
    const tz = encodeURIComponent(location.timezone || 'Asia/Dhaka');
    const url = `https://api.sitp.app/api/v1/prayer-times/?latitude=${location.lat}&longitude=${location.lng}&timezone_str=${tz}&method=karachi`;

    const startTime = performance.now();
    try {
      const res = await this.fetchWithTimeout(url, 3000);
      const latency = Math.round(performance.now() - startTime);

      if (res.status === 502 || res.status === 503 || res.status === 504) {
        // Apply 5-minute cooldown
        this.setProviderCooldown('sitp', 300000);
        this.providerHealthMap['sitp'] = {
          id: 'sitp',
          name: 'SITP Prayer Times API',
          url,
          status: 'offline_502',
          latencyMs: latency,
          lastChecked: new Date().toLocaleTimeString(),
          errorMessage: `HTTP ${res.status} Bad Gateway (Server Host Offline). Cooldown applied.`,
          cooldownUntil: this.cooldowns['sitp']
        };
        throw new Error(`SITP: HTTP ${res.status} (Host Offline)`);
      }

      if (!res.ok) {
        throw new Error(`SITP: HTTP ${res.status}`);
      }

      const data = await res.json();
      const t = data?.data?.timings || data?.timings || data;
      if (!t || !t.fajr) {
        throw new Error('SITP: Missing timings in JSON');
      }

      const fajr = this.sanitizeTime(t.fajr || t.Fajr);
      const sunrise = this.sanitizeTime(t.sunrise || t.Sunrise);
      const dhuhr = this.sanitizeTime(t.dhuhr || t.Dhuhr);
      const asr = this.sanitizeTime(t.asr || t.Asr);
      const maghrib = this.sanitizeTime(t.maghrib || t.Maghrib);
      const isha = this.sanitizeTime(t.isha || t.Isha);

      const night = this.computeNightTimes(maghrib, fajr);

      // Clear cooldown on success
      delete this.cooldowns['sitp'];

      this.providerHealthMap['sitp'] = {
        id: 'sitp',
        name: 'SITP Prayer Times API',
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
    } catch (err: any) {
      const is5xx = err?.message?.includes('502') || err?.message?.includes('503') || err?.message?.includes('504');
      if (is5xx) {
        this.setProviderCooldown('sitp', 300000);
      }
      this.providerHealthMap['sitp'] = {
        id: 'sitp',
        name: 'SITP Prayer Times API',
        url,
        status: is5xx ? 'offline_502' : 'error',
        lastChecked: new Date().toLocaleTimeString(),
        errorMessage: err?.message || 'Server connection failed',
        cooldownUntil: this.cooldowns['sitp']
      };
      throw err;
    }
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
    calcMethod: CalculationMethod = 'karachi'
  ): Promise<FetchPrayerResult> {
    const dateStr = date.toISOString().split('T')[0];
    const dedupeKey = `${dateStr}_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}_${preferredProvider}_${juristic}_${calcMethod}`;

    // 1. Check in-flight duplicate request
    if (this.inFlightRequests.has(dedupeKey)) {
      return this.inFlightRequests.get(dedupeKey)!;
    }

    // 2. Wrap execution in promise for deduplication
    const fetchPromise = this.executeFetchWithFallback(date, location, preferredProvider, juristic, calcMethod, dateStr);
    this.inFlightRequests.set(dedupeKey, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
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
    // Build cascading priority list
    const candidateOrder: ProviderId[] = [
      preferredProvider,
      'aladhan',
      'islamicfinder',
      'waktusolat',
      'sitp',
      'astronomical'
    ];

    // Filter unique
    const uniqueOrder = Array.from(new Set(candidateOrder));
    let fallbackOccurred = false;

    for (let i = 0; i < uniqueOrder.length; i++) {
      const provider = uniqueOrder[i];

      // If provider is in cooldown (e.g. SITP 502), skip without pinging
      if (this.isProviderInCooldown(provider)) {
        if (this.lastLoggedErrors[provider] !== 'in_cooldown') {
          console.info(`[Prayer Focus] Provider ${provider} is in cooldown (HTTP 502). Automatically skipping to fallback.`);
          this.lastLoggedErrors[provider] = 'in_cooldown';
        }
        fallbackOccurred = true;
        continue;
      }

      try {
        let times: PrayerTimes;
        if (provider === 'aladhan') {
          times = await this.fetchAladhan(date, location, juristic, calcMethod);
        } else if (provider === 'islamicfinder') {
          times = await this.fetchIslamicFinder(date, location, juristic, calcMethod);
        } else if (provider === 'waktusolat') {
          times = await this.fetchWaktuSolat(date, location, juristic, calcMethod);
        } else if (provider === 'sitp') {
          times = await this.fetchSitp(date, location);
        } else {
          times = this.calculateAstronomical(date, location, juristic);
        }

        // Validate schedule
        if (this.validateTimings(times)) {
          // Save to smart same-day cache
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

    // 3. If all network providers failed, check smart same-day cache first
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
    // Test each
    try {
      await this.fetchAladhan(now, location, juristic, calcMethod);
    } catch (e: any) {
      this.providerHealthMap['aladhan'].status = 'error';
      this.providerHealthMap['aladhan'].errorMessage = e?.message;
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

    try {
      await this.fetchSitp(now, location);
    } catch (e: any) {
      // 502 caught internally
    }

    this.calculateAstronomical(now, location, juristic);

    return { ...this.providerHealthMap };
  }

  public static getProviderHealth(): Record<ProviderId, ProviderHealth> {
    return { ...this.providerHealthMap };
  }
}
