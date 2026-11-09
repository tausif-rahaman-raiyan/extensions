import { LocationInfo } from '../types/prayer';

export const POPULAR_LOCATIONS: LocationInfo[] = [
  // Bangladesh Hubs
  {
    nameEn: 'Chattogram (Chittagong)',
    nameBn: 'চট্টগ্রাম',
    country: 'Bangladesh',
    lat: 22.3569,
    lng: 91.7832,
    timezone: 'Asia/Dhaka'
  },
  {
    nameEn: 'Dhaka',
    nameBn: 'ঢাকা',
    country: 'Bangladesh',
    lat: 23.8103,
    lng: 90.4125,
    timezone: 'Asia/Dhaka'
  },
  {
    nameEn: 'Sylhet',
    nameBn: 'সিলেট',
    country: 'Bangladesh',
    lat: 24.8949,
    lng: 91.8687,
    timezone: 'Asia/Dhaka'
  },
  {
    nameEn: 'Cox\'s Bazar',
    nameBn: 'কক্সবাজার',
    country: 'Bangladesh',
    lat: 21.4272,
    lng: 92.0058,
    timezone: 'Asia/Dhaka'
  },
  {
    nameEn: 'Cumilla',
    nameBn: 'কুমিল্লা',
    country: 'Bangladesh',
    lat: 23.4607,
    lng: 91.1809,
    timezone: 'Asia/Dhaka'
  },
  {
    nameEn: 'Rajshahi',
    nameBn: 'রাজশাহী',
    country: 'Bangladesh',
    lat: 24.3636,
    lng: 88.6241,
    timezone: 'Asia/Dhaka'
  },
  {
    nameEn: 'Khulna',
    nameBn: 'খুলনা',
    country: 'Bangladesh',
    lat: 22.8456,
    lng: 89.5403,
    timezone: 'Asia/Dhaka'
  },
  {
    nameEn: 'Barishal',
    nameBn: 'বরিশাল',
    country: 'Bangladesh',
    lat: 22.7010,
    lng: 90.3535,
    timezone: 'Asia/Dhaka'
  },
  {
    nameEn: 'Rangpur',
    nameBn: 'রংপুর',
    country: 'Bangladesh',
    lat: 25.7439,
    lng: 89.2752,
    timezone: 'Asia/Dhaka'
  },
  {
    nameEn: 'Mymensingh',
    nameBn: 'ময়মনসিংহ',
    country: 'Bangladesh',
    lat: 24.7471,
    lng: 90.4203,
    timezone: 'Asia/Dhaka'
  },

  // International Islamic & Global Metropolises
  {
    nameEn: 'Makkah',
    nameBn: 'মক্কা মুকাররমা',
    country: 'Saudi Arabia',
    lat: 21.4225,
    lng: 39.8262,
    timezone: 'Asia/Riyadh'
  },
  {
    nameEn: 'Madinah',
    nameBn: 'মদীনা মুনাওয়ারা',
    country: 'Saudi Arabia',
    lat: 24.5247,
    lng: 39.5692,
    timezone: 'Asia/Riyadh'
  },
  {
    nameEn: 'Dubai',
    nameBn: 'দুবাই',
    country: 'United Arab Emirates',
    lat: 25.2048,
    lng: 55.2708,
    timezone: 'Asia/Dubai'
  },
  {
    nameEn: 'London',
    nameBn: 'লন্ডন',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    timezone: 'Europe/London'
  },
  {
    nameEn: 'New York',
    nameBn: 'নিউইয়র্ক',
    country: 'United States',
    lat: 40.7128,
    lng: -74.0060,
    timezone: 'America/New_York'
  },
  {
    nameEn: 'Kuala Lumpur',
    nameBn: 'কুয়ালালামপুর',
    country: 'Malaysia',
    lat: 3.1390,
    lng: 101.6869,
    timezone: 'Asia/Kuala_Lumpur'
  },
  {
    nameEn: 'Istanbul',
    nameBn: 'ইস্তাম্বুল',
    country: 'Turkey',
    lat: 41.0082,
    lng: 28.9784,
    timezone: 'Europe/Istanbul'
  },
  {
    nameEn: 'Tokyo',
    nameBn: 'টোকিও',
    country: 'Japan',
    lat: 35.6762,
    lng: 139.6503,
    timezone: 'Asia/Tokyo'
  },
  {
    nameEn: 'Toronto',
    nameBn: 'টরন্টো',
    country: 'Canada',
    lat: 43.6532,
    lng: -79.3832,
    timezone: 'America/Toronto'
  },
  {
    nameEn: 'Sydney',
    nameBn: 'সিডনি',
    country: 'Australia',
    lat: -33.8688,
    lng: 151.2093,
    timezone: 'Australia/Sydney'
  }
];

export const DEFAULT_LOCATION: LocationInfo = POPULAR_LOCATIONS[0]; // Chattogram 22.3569, 91.7832
