import React, { useState } from 'react';
import { MapPin, Navigation, Search, Check, Globe } from 'lucide-react';
import { LocationInfo } from '../../types/prayer';
import { POPULAR_LOCATIONS } from '../../data/locations';

interface LocationViewProps {
  currentLocation: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
}

export const LocationView: React.FC<LocationViewProps> = ({
  currentLocation,
  onSelectLocation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'All' | 'Bangladesh' | 'International'>('All');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const customLoc: LocationInfo = {
          nameEn: 'Current GPS Location',
          nameBn: 'বর্তমান জিপিএস অবস্থান',
          country: 'Auto-Detected',
          lat: Number(latitude.toFixed(4)),
          lng: Number(longitude.toFixed(4)),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka',
          isCustom: true
        };
        onSelectLocation(customLoc);
        setDetectingGps(false);
      },
      (err) => {
        setDetectingGps(false);
        setGpsError('GPS detection unavailable. Please select your location from the list.');
      },
      { timeout: 7000 }
    );
  };

  const filteredLocations = POPULAR_LOCATIONS.filter((loc) => {
    const matchesSearch =
      loc.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (loc.nameBn && loc.nameBn.includes(searchTerm)) ||
      loc.country.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Bangladesh') return loc.country === 'Bangladesh';
    if (selectedFilter === 'International') return loc.country !== 'Bangladesh';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <MapPin className="w-6 h-6 text-emerald-400" />
          <span>Location & Timezone Configuration</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Accurate prayer coordinates for Bangladesh districts and major global cities worldwide
        </p>
      </div>

      {/* Current Location Highlight */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Active Selected Location
          </div>
          <div className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <span>{currentLocation.nameEn}</span>
            {currentLocation.nameBn && <span className="font-bengali text-base text-slate-400">({currentLocation.nameBn})</span>}
          </div>
          <div className="text-xs text-slate-400 font-mono-numbers">
            {currentLocation.country} · Coordinates: {currentLocation.lat}°N, {currentLocation.lng}°E · Timezone: {currentLocation.timezone}
          </div>
        </div>

        <button
          onClick={handleDetectGps}
          disabled={detectingGps}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-colors shrink-0 shadow-sm disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
          <span>{detectingGps ? 'Detecting...' : 'Detect GPS Location'}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          {gpsError}
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search district or city (e.g. Chattogram, Dhaka, Sylhet, London, New York)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5">
          {(['All', 'Bangladesh', 'International'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedFilter === filter
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredLocations.map((loc) => {
          const isSelected = currentLocation.lat === loc.lat && currentLocation.lng === loc.lng;
          return (
            <div
              key={`${loc.lat}-${loc.lng}-${loc.nameEn}`}
              onClick={() => onSelectLocation(loc)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 text-slate-200'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold">{loc.nameEn}</span>
                  {loc.nameBn && <span className="font-bengali text-xs text-slate-400">({loc.nameBn})</span>}
                </div>
                <div className="text-[11px] text-slate-400 font-mono-numbers">
                  {loc.country} · {loc.lat}°N, {loc.lng}°E
                </div>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
