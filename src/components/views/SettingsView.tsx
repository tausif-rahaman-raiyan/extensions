import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Palette,
  MapPin,
  Compass,
  Server,
  Bell,
  Sliders,
  Check,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import {
  ThemeMode,
  JuristicMethod,
  CalculationMethod,
  ProviderId,
  LocationInfo,
  NotificationSettings
} from '../../types/prayer';

interface SettingsViewProps {
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  juristic: JuristicMethod;
  onChangeJuristic: (method: JuristicMethod) => void;
  calcMethod: CalculationMethod;
  onChangeCalcMethod: (method: CalculationMethod) => void;
  currentProvider: ProviderId;
  onChangeProvider: (provider: ProviderId) => void;
  location: LocationInfo;
  onOpenLocationModal: () => void;
  notifications: NotificationSettings;
  onChangeNotifications: (settings: NotificationSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onChangeTheme,
  juristic,
  onChangeJuristic,
  calcMethod,
  onChangeCalcMethod,
  currentProvider,
  onChangeProvider,
  location,
  onOpenLocationModal,
  notifications,
  onChangeNotifications
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('appearance');
  const [savedFeedback, setSavedFeedback] = useState(false);

  const showSaveNotice = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const categories = [
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
    { id: 'calculation', label: 'Prayer Calculation', icon: Compass },
    { id: 'providers', label: 'API Providers', icon: Server },
    { id: 'notifications', label: 'Notifications & Audio', icon: Bell },
    { id: 'location', label: 'Location & Timezone', icon: MapPin },
    { id: 'advanced', label: 'Advanced & Cache', icon: Sliders }
  ];

  const handleClearCache = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('pf_') || k.startsWith('prayer_focus_'));
    keys.forEach(k => localStorage.removeItem(k));
    showSaveNotice();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-emerald-400" />
            <span>Preferences & Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Customize appearance, calculation parameters, and audio reminders
          </p>
        </div>

        {savedFeedback && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full animate-fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Preferences Saved</span>
          </span>
        )}
      </div>

      {/* Categorized Layout: Left Sub-navigation + Right Content */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Category Tabs */}
        <div className="md:col-span-4 space-y-1">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-left transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Category Panel Content */}
        <div className="md:col-span-8 p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
          {/* 1. Appearance */}
          {activeCategory === 'appearance' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-100">Appearance & Theme Mode</h2>
              <p className="text-xs text-slate-400">
                Choose between Dark Midnight, Warm Light, or automatic System matching.
              </p>

              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => { onChangeTheme('dark'); showSaveNotice(); }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'dark'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Moon className="w-5 h-5 mx-auto mb-2 text-emerald-400" />
                  <div className="text-xs font-bold">Dark Midnight</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Navy & emerald</div>
                </button>

                <button
                  onClick={() => { onChangeTheme('light'); showSaveNotice(); }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'light'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Sun className="w-5 h-5 mx-auto mb-2 text-amber-400" />
                  <div className="text-xs font-bold">Warm Light</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Sage & soft cream</div>
                </button>

                <button
                  onClick={() => { onChangeTheme('system'); showSaveNotice(); }}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    theme === 'system'
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Laptop className="w-5 h-5 mx-auto mb-2 text-blue-400" />
                  <div className="text-xs font-bold">System Auto</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Match device OS</div>
                </button>
              </div>
            </div>
          )}

          {/* 2. Calculation */}
          {activeCategory === 'calculation' && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-slate-100">Prayer Calculation Methods</h2>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Asr Shadow Juristic Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { onChangeJuristic('hanafi'); showSaveNotice(); }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      juristic === 'hanafi'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    Hanafi (2x Shadow · Subcontinent)
                  </button>
                  <button
                    onClick={() => { onChangeJuristic('shafii'); showSaveNotice(); }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-colors ${
                      juristic === 'shafii'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    Shafi'i / Standard (1x Shadow)
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-slate-300">
                  Fajr & Isha Angle Benchmark
                </label>
                <select
                  value={calcMethod}
                  onChange={(e) => { onChangeCalcMethod(e.target.value as CalculationMethod); showSaveNotice(); }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="karachi">Univ. of Islamic Sciences Karachi (18° Fajr/Isha - BD Standard)</option>
                  <option value="mwl">Muslim World League (18° Fajr, 17° Isha)</option>
                  <option value="makkah">Umm Al-Qura University, Makkah</option>
                  <option value="isna">ISNA (15° Fajr/Isha)</option>
                  <option value="egypt">Egyptian General Authority of Survey (19.5° Fajr)</option>
                </select>
              </div>
            </div>
          )}

          {/* 3. Providers */}
          {activeCategory === 'providers' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-100">Preferred Prayer API</h2>
              <p className="text-xs text-slate-400">
                Choose your primary provider. If it ever fails (like an HTTP 502), Prayer Focus automatically cascades down the list.
              </p>

              {(['aladhan', 'islamicfinder', 'waktusolat', 'sitp', 'astronomical'] as ProviderId[]).map((pid) => (
                <div
                  key={pid}
                  onClick={() => { onChangeProvider(pid); showSaveNotice(); }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    currentProvider === pid
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div>
                    <span className="font-bold uppercase tracking-wider">{pid}</span>
                    <span className="text-slate-500 ml-2">
                      {pid === 'aladhan' && 'AlAdhan Global API (Primary)'}
                      {pid === 'islamicfinder' && 'IslamicFinder Global API'}
                      {pid === 'waktusolat' && 'WaktuSolat City Backup'}
                      {pid === 'sitp' && 'SITP Prayer Times API (502 Protected)'}
                      {pid === 'astronomical' && 'Local Solar Engine (100% Offline)'}
                    </span>
                  </div>
                  {currentProvider === pid && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              ))}
            </div>
          )}

          {/* 4. Notifications */}
          {activeCategory === 'notifications' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-100">Notifications & Audio Alerts</h2>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-200">Enable Adhan Chime Sound</span>
                  <input
                    type="checkbox"
                    checked={notifications.soundEnabled}
                    onChange={(e) => {
                      onChangeNotifications({ ...notifications, soundEnabled: e.target.checked });
                      showSaveNotice();
                    }}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-200">Show Desktop Notifications</span>
                  <input
                    type="checkbox"
                    checked={notifications.enabled}
                    onChange={(e) => {
                      onChangeNotifications({ ...notifications, enabled: e.target.checked });
                      showSaveNotice();
                    }}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </label>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">Reminder Ahead of Prayer</span>
                  <select
                    value={notifications.reminderMinutesBefore}
                    onChange={(e) => {
                      onChangeNotifications({ ...notifications, reminderMinutesBefore: Number(e.target.value) });
                      showSaveNotice();
                    }}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200"
                  >
                    <option value={0}>At adhan time (0m)</option>
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* 5. Location */}
          {activeCategory === 'location' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-100">Location Settings</h2>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div>Active: <strong>{location.nameEn}</strong> ({location.country})</div>
                <div className="text-slate-400 font-mono">Coordinates: {location.lat}°N, {location.lng}°E</div>
                <div className="text-slate-400">Timezone: {location.timezone}</div>
              </div>
              <button
                onClick={onOpenLocationModal}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
              >
                Change Location / Use GPS
              </button>
            </div>
          )}

          {/* 6. Advanced */}
          {activeCategory === 'advanced' && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-slate-100">Advanced & Cache Controls</h2>
              <p className="text-xs text-slate-400">
                Clear stored prayer schedule cache or reset local preferences.
              </p>
              <button
                onClick={handleClearCache}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-rose-300 font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
              >
                Clear Cached Prayer Data
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
