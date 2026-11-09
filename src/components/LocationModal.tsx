import React, { useState } from 'react';
import { X, Search, MapPin, Navigation, Check, Globe } from 'lucide-react';
import { LocationInfo } from '../types/prayer';
import { POPULAR_LOCATIONS } from '../data/locations';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: LocationInfo;
  onSelectLocation: (loc: LocationInfo) => void;
}

const REGION_TABS = [
  'All',
  'Bangladesh',
  'International'
];

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  onSelectLocation
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  if (!isOpen) return null;

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
        onClose();
      },
      (err) => {
        setDetectingGps(false);
        setGpsError('GPS detection unavailable. Please select your city from the list.');
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
    if (selectedRegion === 'All') return true;
    if (selectedRegion === 'Bangladesh') return loc.country === 'Bangladesh';
    if (selectedRegion === 'International') return loc.country !== 'Bangladesh';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Select City & Location</h2>
              <p className="text-xs text-slate-400">Accurate prayer and Tahajjud schedules worldwide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & GPS Bar */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-950/40">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search city, district, or country (e.g. Chattogram, Dhaka, London)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleDetectGps}
              disabled={detectingGps}
              className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors disabled:opacity-50"
            >
              <Navigation className={`w-3.5 h-3.5 ${detectingGps ? 'animate-spin' : ''}`} />
              <span>{detectingGps ? 'Locating...' : 'Auto GPS'}</span>
            </button>
          </div>

          {gpsError && (
            <p className="text-xs text-amber-400">{gpsError}</p>
          )}

          {/* Region Tabs */}
          <div className="flex items-center gap-1.5">
            {REGION_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedRegion(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  selectedRegion === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Location List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredLocations.map((loc) => {
              const isSelected = currentLocation.lat === loc.lat && currentLocation.lng === loc.lng;
              return (
                <div
                  key={`${loc.lat}-${loc.lng}-${loc.nameEn}`}
                  onClick={() => {
                    onSelectLocation(loc);
                    onClose();
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-800/30 border-slate-800/80 text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold">{loc.nameEn}</span>
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
      </div>
    </div>
  );
};
