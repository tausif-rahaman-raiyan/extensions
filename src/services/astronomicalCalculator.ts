import { PrayerTimes, JuristicMethod } from '../types/prayer';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

function sinD(d: number): number {
  return Math.sin(d * DEG_TO_RAD);
}

function cosD(d: number): number {
  return Math.cos(d * DEG_TO_RAD);
}

function tanD(d: number): number {
  return Math.tan(d * DEG_TO_RAD);
}

function asinD(x: number): number {
  return Math.asin(x) * RAD_TO_DEG;
}

function acosD(x: number): number {
  return Math.acos(x) * RAD_TO_DEG;
}

function atanD(x: number): number {
  return Math.atan(x) * RAD_TO_DEG;
}

function fixAngle(a: number): number {
  let res = a - 360 * Math.floor(a / 360);
  if (res < 0) res += 360;
  return res;
}

function fixHour(h: number): number {
  let res = h - 24 * Math.floor(h / 24);
  if (res < 0) res += 24;
  return res;
}

/**
 * High-precision solar coordinates and equation of time
 */
function getSunPosition(jd: number) {
  const D = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * sinD(g) + 0.020 * sinD(2 * g));

  const e = 23.439 - 0.00000036 * D;
  const d = asinD(sinD(e) * sinD(L)); // declination
  let RA = atanD(cosD(e) * sinD(L) / cosD(L)) / 15;
  if (cosD(L) < 0) RA += 12;
  else if (sinD(L) < 0) RA += 24;

  const EqT = q / 15 - fixHour(RA); // Equation of Time in hours
  return { declination: d, equationOfTime: EqT * 60 };
}

function getJulianDate(year: number, month: number, day: number): number {
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

function hoursToHHMM(hours: number): string {
  const hClamped = fixHour(hours);
  const totalMins = Math.round(hClamped * 60);
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function calculateAstronomicalTimes(
  date: Date,
  lat: number,
  lng: number,
  timezoneOffsetHours: number = 6, // Default Asia/Dhaka is UTC+6
  juristic: JuristicMethod = 'hanafi',
  fajrAngle: number = 18.0,
  ishaAngle: number = 18.0
): PrayerTimes {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const jd = getJulianDate(year, month, day);
  const { declination, equationOfTime } = getSunPosition(jd);

  // Solar transit (Dhuhr)
  const dhuhrHours = 12 + timezoneOffsetHours - (lng / 15) - (equationOfTime / 60);

  // Hour angle helper
  const hourAngle = (angle: number): number => {
    const val = (-sinD(angle) - sinD(lat) * sinD(declination)) / (cosD(lat) * cosD(declination));
    if (val < -1) return 180; // Sun never rises
    if (val > 1) return 0;    // Sun never sets
    return acosD(val);
  };

  // Sunrise and Sunset (sun altitude is -0.833 deg)
  const sunriseHA = hourAngle(0.833);
  const sunriseHours = dhuhrHours - sunriseHA / 15;
  const sunsetHours = dhuhrHours + sunriseHA / 15;

  // Fajr (18 degrees for Karachi method)
  const fajrHA = hourAngle(fajrAngle);
  const fajrHours = dhuhrHours - fajrHA / 15;

  // Isha (18 degrees for Karachi method)
  const ishaHA = hourAngle(ishaAngle);
  const ishaHours = dhuhrHours + ishaHA / 15;

  // Asr
  const shadowFactor = juristic === 'hanafi' ? 2 : 1;
  const asrAltitude = atanD(1 / (shadowFactor + tanD(Math.abs(lat - declination))));
  const asrHA = hourAngle(90 - asrAltitude);
  const asrHours = dhuhrHours + asrHA / 15;

  // Safe buffer adjustment (2 mins for Maghrib safety, 1 min for Dhuhr zawal buffer)
  const safeDhuhr = dhuhrHours + 0.033; // +2 mins
  const safeMaghrib = sunsetHours + 0.033; // +2 mins

  // Night calculation:
  // Night starts at Sunset (Maghrib) and ends at next morning's Fajr
  // Since Fajr is next day, Fajr in terms of current day hour timeline is (fajrHours + 24)
  const nightDurationHours = (fajrHours + 24) - safeMaghrib;
  const midnightHours = fixHour(safeMaghrib + nightDurationHours / 2);
  const firstThirdHours = fixHour(safeMaghrib + nightDurationHours / 3);
  const tahajjudStartHours = fixHour(safeMaghrib + (2 * nightDurationHours) / 3);

  const rawDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    fajr: hoursToHHMM(fajrHours),
    sunrise: hoursToHHMM(sunriseHours),
    dhuhr: hoursToHHMM(safeDhuhr),
    asr: hoursToHHMM(asrHours),
    maghrib: hoursToHHMM(safeMaghrib),
    isha: hoursToHHMM(ishaHours),
    midnight: hoursToHHMM(midnightHours),
    tahajjudStart: hoursToHHMM(tahajjudStartHours),
    tahajjudEnd: hoursToHHMM(fajrHours),
    firstThird: hoursToHHMM(firstThirdHours),
    rawDate: rawDateStr
  };
}
