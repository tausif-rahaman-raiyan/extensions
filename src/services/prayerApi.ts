import {
  PrayerTimes,
  ProviderId,
  ProviderHealth,
  LocationInfo,
  JuristicMethod,
  CalculationMethod,
  ManualPrayerOverrides,
  PrayerMinuteOffsets
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
      name: 'AlAdhan City API (Chattogram)',
      url: 'https://api.aladhan.com/v1/timingsByCity',
      status: 'operational'
    },
    'habibur': {
      id: 'habibur',
      name: 'Habibur Salat API (Bangladesh)',
      url: 'https://salat.habibur.com/api',
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
    'prayzone': {
      id: 'prayzone',
      name: 'PrayZone Global API',
      url: 'https://api.pray.zone/v2/times/today.json',
      status: 'operational'
    },
    'muslimsalat': {
      id: 'muslimsalat',
      name: 'MuslimSalat Global API',
      url: 'https://muslimsalat.com',
      status: 'offline_502'
    },
    'islamicfinder': {
      id: 'islamicfinder',
      name: 'IslamicFinder Global API',
      url: 'https://www.islamicfinder.us/index.php/api/prayer_times',
      status: 'offline_502'
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
   * Shifts a 24h time string (HH:mm) by deltaMinutes (+/-), wrapping within 24h
   */
  public static shiftTimeMinutes(timeStr: string, deltaMinutes: number): string {
    if (!deltaMinutes || deltaMinutes === 0) return this.sanitizeTime(timeStr);
    const sanitized = this.sanitizeTime(timeStr);
    const [h, m] = sanitized.split(':').map(Number);
    const totalMins = (h * 60 + m + deltaMinutes) % (24 * 60);
    const wrapped = totalMins < 0 ? totalMins + 24 * 60 : totalMins;
    const newH = Math.floor(wrapped / 60) % 24;
    const newM = Math.floor(wrapped % 60);
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  }

  /**
   * Applies user-configured +/- minute offsets to scanned API times
   */
  public static applyMinuteOffsets(
    times: PrayerTimes,
    offsets?: PrayerMinuteOffsets | null
  ): PrayerTimes {
    if (!offsets) return times;
    const hasAny = Object.values(offsets).some((v) => v !== 0);
    if (!hasAny) return times;

    const fajr = offsets.fajr ? this.shiftTimeMinutes(times.fajr, offsets.fajr) : times.fajr;
    const sunrise = offsets.sunrise ? this.shiftTimeMinutes(times.sunrise, offsets.sunrise) : times.sunrise;
    const dhuhr = offsets.dhuhr ? this.shiftTimeMinutes(times.dhuhr, offsets.dhuhr) : times.dhuhr;
    const asr = offsets.asr ? this.shiftTimeMinutes(times.asr, offsets.asr) : times.asr;
    const maghrib = offsets.maghrib ? this.shiftTimeMinutes(times.maghrib, offsets.maghrib) : times.maghrib;
    const isha = offsets.isha ? this.shiftTimeMinutes(times.isha, offsets.isha) : times.isha;

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
      tahajjudStart: offsets.tahajjud ? this.shiftTimeMinutes(night.tahajjudStart, offsets.tahajjud) : night.tahajjudStart,
      tahajjudEnd: night.tahajjudEnd,
      firstThird: night.firstThird
    };
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
   * Provider 2: AlAdhan City API (WaktuSolat / Chattogram)
   */
  private static async fetchAladhanCity(
    date: Date,
    location: LocationInfo,
    juristic: JuristicMethod,
    calcMethod: CalculationMethod
  ): Promise<PrayerTimes> {
    const city = encodeURIComponent(location.nameEn.split(' ')[0] || 'Chattogram');
    const country = encodeURIComponent(location.country || 'Bangladesh');
    const methodNum = METHOD_MAP[calcMethod] || 1;
    const schoolNum = juristic === 'hanafi' ? 1 : 0;
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${methodNum}&school=${schoolNum}`;

    const startTime = performance.now();
    const res = await this.fetchWithTimeout(url, 3500);
    const latency = Math.round(performance.now() - startTime);

    if (!res.ok) throw new Error(`AlAdhan City HTTP ${res.status}`);
    const json = await res.json();
    const timings = json?.data?.timings;
    if (!timings) throw new Error('AlAdhan City: Invalid structure');

    const fajr = this.sanitizeTime(timings.Fajr);
    const sunrise = this.sanitizeTime(timings.Sunrise);
    const dhuhr = this.sanitizeTime(timings.Dhuhr);
    const asr = this.sanitizeTime(timings.Asr);
    const maghrib = this.sanitizeTime(timings.Maghrib);
    const isha = this.sanitizeTime(timings.Isha);

    const night = this.computeNightTimes(maghrib, fajr);

    this.providerHealthMap['aladhancity'] = {
      id: 'aladhancity',
      name: 'AlAdhan City API (Chattogram)',
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
   * Provider 3: Habibur Salat API (Dedicated Bangladesh Islamic Timetable)
   */
  private static async fetchHabibur(
    date: Date,
    location: LocationInfo,
    juristic: JuristicMethod
  ): Promise<PrayerTimes> {
    const lat = location.lat.toFixed(4);
    const lon = location.lng.toFixed(4);
    const tzname = encodeURIComponent(location.timezone || 'Asia/Dhaka');
    const url = `https://salat.habibur.com/api/?lat=${lat}&lon=${lon}&tzname=${tzname}`;

    const startTime = performance.now();
    const res = await this.fetchWithTimeout(url, 3500);
    const latency = Math.round(performance.now() - startTime);

    if (!res.ok) throw new Error(`Habibur Salat API HTTP ${res.status}`);
    const json = await res.json();
    const d = json?.data;
    if (!d || !d.fajar18) throw new Error('Habibur Salat API: Invalid payload');

    const fajr = this.sanitizeTime(d.fajar18.short);
    const sunrise = this.sanitizeTime(d.rise.short);
    const dhuhr = this.sanitizeTime(d.noon.short);
    const asr = this.sanitizeTime(juristic === 'hanafi' && d.asar2 ? d.asar2.short : d.asar1?.short);
    const maghrib = this.sanitizeTime(d.set?.short || d.magrib12?.short);
    const isha = this.sanitizeTime(d.esha?.short);

    const night = this.computeNightTimes(maghrib, fajr);

    this.providerHealthMap['habibur'] = {
      id: 'habibur',
      name: 'Habibur Salat API (Bangladesh)',
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
   * Provider 4: Islamic Network API (Address & Region Engine)
   */
  private static async fetchIslamicNetwork(
    date: Date,
    location: LocationInfo,
    juristic: JuristicMethod,
    calcMethod: CalculationMethod
  ): Promise<PrayerTimes> {
    const address = encodeURIComponent(`${location.nameEn}, ${location.country}`);
    const methodNum = METHOD_MAP[calcMethod] || 1;
    const schoolNum = juristic === 'hanafi' ? 1 : 0;
    const url = `https://api.aladhan.com/v1/timingsByAddress?address=${address}&method=${methodNum}&school=${schoolNum}`;

    const startTime = performance.now();
    const res = await this.fetchWithTimeout(url, 3500);
    const latency = Math.round(performance.now() - startTime);

    if (!res.ok) throw new Error(`Islamic Network HTTP ${res.status}`);
    const json = await res.json();
    const timings = json?.data?.timings;
    if (!timings) throw new Error('Islamic Network: Invalid timings');

    const fajr = this.sanitizeTime(timings.Fajr);
    const sunrise = this.sanitizeTime(timings.Sunrise);
    const dhuhr = this.sanitizeTime(timings.Dhuhr);
    const asr = this.sanitizeTime(timings.Asr);
    const maghrib = this.sanitizeTime(timings.Maghrib);
    const isha = this.sanitizeTime(timings.Isha);

    const night = this.computeNightTimes(maghrib, fajr);

    this.providerHealthMap['islamicnetwork'] = {
      id: 'islamicnetwork',
      name: 'Islamic Network API',
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
   * Provider 5: PrayZone Global API
   */
  private static async fetchPrayZone(
    date: Date,
    location: LocationInfo
  ): Promise<PrayerTimes> {
    const city = encodeURIComponent(location.nameEn.split(' ')[0] || 'Chattogram');
    const url = `https://api.pray.zone/v2/times/today.json?city=${city}`;

    const startTime = performance.now();
    try {
      const res = await this.fetchWithTimeout(url, 3000);
      const latency = Math.round(performance.now() - startTime);

      if (!res.ok) throw new Error(`PrayZone HTTP ${res.status}`);
      const json = await res.json();
      const t = json?.results?.datetime?.[0]?.times;
      if (!t || !t.Fajr) throw new Error('PrayZone: Invalid times payload');

      const fajr = this.sanitizeTime(t.Fajr);
      const sunrise = this.sanitizeTime(t.Sunrise);
      const dhuhr = this.sanitizeTime(t.Dhuhr);
      const asr = this.sanitizeTime(t.Asr);
      const maghrib = this.sanitizeTime(t.Maghrib);
      const isha = this.sanitizeTime(t.Isha);

      const night = this.computeNightTimes(maghrib, fajr);

      this.providerHealthMap['prayzone'] = {
        id: 'prayzone',
        name: 'PrayZone Global API',
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
      this.providerHealthMap['prayzone'] = {
        id: 'prayzone',
        name: 'PrayZone Global API',
        url,
        status: 'error',
        lastChecked: new Date().toLocaleTimeString(),
        errorMessage: err?.message || 'Host connection timeout'
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
   * Main entry point with request deduplication and cascading provider fallback
   */
  public static async getPrayerTimes(
    date: Date,
    location: LocationInfo,
    preferredProvider: ProviderId = 'aladhan',
    juristic: JuristicMethod = 'hanafi',
    calcMethod: CalculationMethod = 'karachi',
    manualOverrides?: ManualPrayerOverrides | null,
    minuteOffsets?: PrayerMinuteOffsets | null
  ): Promise<FetchPrayerResult> {
    const dateStr = date.toISOString().split('T')[0];
    const dedupeKey = `${dateStr}_${location.lat.toFixed(2)}_${location.lng.toFixed(2)}_${preferredProvider}_${juristic}_${calcMethod}`;

    // 1. Check in-flight duplicate request
    if (this.inFlightRequests.has(dedupeKey)) {
      const existing = await this.inFlightRequests.get(dedupeKey)!;
      let times = this.applyMinuteOffsets(existing.times, minuteOffsets);
      times = this.applyManualOverrides(times, manualOverrides);
      return {
        ...existing,
        times
      };
    }

    // 2. Wrap execution in promise for deduplication
    const fetchPromise = this.executeFetchWithFallback(date, location, preferredProvider, juristic, calcMethod, dateStr);
    this.inFlightRequests.set(dedupeKey, fetchPromise);

    try {
      const result = await fetchPromise;
      let times = this.applyMinuteOffsets(result.times, minuteOffsets);
      times = this.applyManualOverrides(times, manualOverrides);
      return {
        ...result,
        times
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
    // Cascading candidate order prioritizing selected provider and verified Bangladesh endpoints
    const candidateOrder: ProviderId[] = [
      preferredProvider,
      'aladhan',
      'aladhancity',
      'habibur',
      'islamicnetwork',
      'prayzone',
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
        } else if (provider === 'aladhancity') {
          times = await this.fetchAladhanCity(date, location, juristic, calcMethod);
        } else if (provider === 'habibur') {
          times = await this.fetchHabibur(date, location, juristic);
        } else if (provider === 'islamicnetwork') {
          times = await this.fetchIslamicNetwork(date, location, juristic, calcMethod);
        } else if (provider === 'prayzone') {
          times = await this.fetchPrayZone(date, location);
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
      await this.fetchAladhanCity(now, location, juristic, calcMethod);
    } catch (e: any) {
      this.providerHealthMap['aladhancity'].status = 'error';
      this.providerHealthMap['aladhancity'].errorMessage = e?.message;
    }

    try {
      await this.fetchHabibur(now, location, juristic);
    } catch (e: any) {
      this.providerHealthMap['habibur'].status = 'error';
      this.providerHealthMap['habibur'].errorMessage = e?.message;
    }

    try {
      await this.fetchIslamicNetwork(now, location, juristic, calcMethod);
    } catch (e: any) {
      this.providerHealthMap['islamicnetwork'].status = 'error';
      this.providerHealthMap['islamicnetwork'].errorMessage = e?.message;
    }

    try {
      await this.fetchPrayZone(now, location);
    } catch (e: any) {
      this.providerHealthMap['prayzone'].status = 'error';
      this.providerHealthMap['prayzone'].errorMessage = e?.message;
    }

    this.calculateAstronomical(now, location, juristic);

    return { ...this.providerHealthMap };
  }

  public static getProviderHealth(): Record<ProviderId, ProviderHealth> {
    return { ...this.providerHealthMap };
  }
}
