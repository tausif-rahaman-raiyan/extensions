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
  Laptop,
  Clock
} from 'lucide-react';
import {
  ThemeMode,
  JuristicMethod,
  CalculationMethod,
  ProviderId,
  LocationInfo,
  NotificationSettings,
  ManualPrayerOverrides,
  PrayerMinuteOffsets,
  PrayerTimes
} from '../../types/prayer';
import { PrayerService } from '../../services/prayerApi';

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
  manualOverrides: ManualPrayerOverrides;
  onSaveManualOverrides: (overrides: ManualPrayerOverrides) => void;
  minuteOffsets: PrayerMinuteOffsets;
  onSaveMinuteOffsets: (offsets: PrayerMinuteOffsets) => void;
  currentTimes?: PrayerTimes;
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
  onChangeNotifications,
  manualOverrides,
  onSaveManualOverrides,
  minuteOffsets,
  onSaveMinuteOffsets,
  currentTimes
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#manual') return 'manual';
    return 'appearance';
  });
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [formOverrides, setFormOverrides] = useState<ManualPrayerOverrides>(manualOverrides);
  const [formOffsets, setFormOffsets] = useState<PrayerMinuteOffsets>(minuteOffsets);

  const showSaveNotice = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleStepMinute = (key: keyof PrayerMinuteOffsets, delta: number) => {
    const updated = {
      ...formOffsets,
      [key]: (formOffsets[key] || 0) + delta
    };
    setFormOffsets(updated);
    onSaveMinuteOffsets(updated);
    showSaveNotice();
  };

  const handleResetOffset = (key: keyof PrayerMinuteOffsets) => {
    const updated = {
      ...formOffsets,
      [key]: 0
    };
    setFormOffsets(updated);
    onSaveMinuteOffsets(updated);
    showSaveNotice();
  };

  const handleResetAllOffsets = () => {
    const reset: PrayerMinuteOffsets = {
      fajr: 0,
      sunrise: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
      tahajjud: 0
    };
    setFormOffsets(reset);
    onSaveMinuteOffsets(reset);
    showSaveNotice();
  };

  const categories = [
    { id: 'appearance', label: 'Appearance & Theme', icon: Palette },
    { id: 'manual', label: 'Minute Adjustments & Overrides', icon: Clock },
    { id: 'calculation', label: 'Prayer Calculation', icon: Compass },
    { id: 'providers', label: 'API Providers (Bangladesh)', icon: Server },
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
            Customize minute adjustments, prayer times, calculation methods, and notifications
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

          {/* Minute Adjustments & Manual Overrides */}
          {activeCategory === 'manual' && (
            <div className="space-y-6">
              {/* Part 1: Interactive Minute Steppers (+/- min per prayer) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-400" />
                      <span>Prayer Minute Steppers (+/- min)</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Fine-tune scanned API times by adding or subtracting minutes (e.g. +2m, -1m) to match your local masjid.
                    </p>
                  </div>
                  <button
                    onClick={handleResetAllOffsets}
                    className="self-start sm:self-auto text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Reset All Offsets
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {[
                    { key: 'fajr' as keyof PrayerMinuteOffsets, label: 'Fajr', labelBn: 'ফজর', base: currentTimes?.fajr || '04:45' },
                    { key: 'sunrise' as keyof PrayerMinuteOffsets, label: 'Sunrise', labelBn: 'সূর্যোদয়', base: currentTimes?.sunrise || '06:01' },
                    { key: 'dhuhr' as keyof PrayerMinuteOffsets, label: 'Dhuhr', labelBn: 'যোহর', base: currentTimes?.dhuhr || '11:37' },
                    { key: 'asr' as keyof PrayerMinuteOffsets, label: 'Asr', labelBn: 'আসর', base: currentTimes?.asr || '15:36' },
                    { key: 'maghrib' as keyof PrayerMinuteOffsets, label: 'Maghrib', labelBn: 'মাগরিব', base: currentTimes?.maghrib || '17:12' },
                    { key: 'isha' as keyof PrayerMinuteOffsets, label: 'Isha', labelBn: 'এশা', base: currentTimes?.isha || '18:28' },
                    { key: 'tahajjud' as keyof PrayerMinuteOffsets, label: 'Tahajjud Start', labelBn: 'তাহাজ্জুদ', base: currentTimes?.tahajjudStart || '01:15' }
                  ].map((p) => {
                    const offset = formOffsets[p.key] || 0;
                    const adjusted = PrayerService.shiftTimeMinutes(p.base, offset);

                    return (
                      <div
                        key={p.key}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-24">
                            <span className="text-xs font-bold text-slate-200">{p.label}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5 font-bengali">({p.labelBn})</span>
                          </div>
                          <div className="text-xs font-mono-numbers">
                            <span className="text-slate-400">Scanned: {p.base}</span>
                            <span className="mx-1.5 text-slate-600">→</span>
                            <span className="font-bold text-emerald-400">Adjusted: {adjusted}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => handleStepMinute(p.key, -5)}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white"
                            title="Subtract 5 minutes"
                          >
                            -5m
                          </button>
                          <button
                            onClick={() => handleStepMinute(p.key, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center"
                            title="Subtract 1 minute"
                          >
                            -
                          </button>
                          <span
                            className={`w-14 text-center text-xs font-mono font-bold px-1.5 py-1 rounded-md ${
                              offset > 0
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : offset < 0
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {offset > 0 ? `+${offset}m` : offset < 0 ? `${offset}m` : '0m'}
                          </span>
                          <button
                            onClick={() => handleStepMinute(p.key, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center"
                            title="Add 1 minute"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleStepMinute(p.key, 5)}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white"
                            title="Add 5 minutes"
                          >
                            +5m
                          </button>
                          {offset !== 0 && (
                            <button
                              onClick={() => handleResetOffset(p.key)}
                              className="text-[10px] px-1.5 py-1 text-slate-400 hover:text-rose-400 ml-1"
                              title="Reset offset to 0"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Part 2: Direct Manual Fixed Time Overrides (HH:mm) */}
              <div className="space-y-4 pt-4 border-t border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>Direct Fixed Time Overrides (Clock HH:mm)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Alternatively, specify absolute fixed times (e.g. 04:45, 12:30). When enabled, these replace calculated API times.
                  </p>
                </div>

                {/* Enable / Disable Toggle */}
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-200">
                      Enable Fixed Time Overrides
                    </div>
                    <div className="text-[11px] text-slate-400">
                      When enabled, these fixed clock times supersede API calculations.
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formOverrides.enabled}
                    onChange={(e) => {
                      const updated = { ...formOverrides, enabled: e.target.checked };
                      setFormOverrides(updated);
                      onSaveManualOverrides(updated);
                      showSaveNotice();
                    }}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                  />
                </label>

                {/* Time inputs grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { key: 'fajr', label: 'Fajr (ওয়াক্ত শুরু)', calc: currentTimes?.fajr || '04:45' },
                    { key: 'sunrise', label: 'Sunrise (সূর্যোদয়)', calc: currentTimes?.sunrise || '06:01' },
                    { key: 'dhuhr', label: 'Dhuhr (যোহর)', calc: currentTimes?.dhuhr || '11:37' },
                    { key: 'asr', label: 'Asr (আসর)', calc: currentTimes?.asr || '15:36' },
                    { key: 'maghrib', label: 'Maghrib (মাগরিব)', calc: currentTimes?.maghrib || '17:12' },
                    { key: 'isha', label: 'Isha (এশা)', calc: currentTimes?.isha || '18:28' },
                    { key: 'tahajjudStart', label: 'Tahajjud Start (তাহাজ্জুদ শুরু)', calc: currentTimes?.tahajjudStart || '01:15' }
                  ].map((item) => (
                    <div key={item.key} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{item.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono-numbers">Calc: {item.calc}</span>
                      </div>
                      <input
                        type="text"
                        placeholder={item.calc}
                        value={(formOverrides as any)[item.key] || ''}
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          setFormOverrides({ ...formOverrides, [item.key]: val });
                        }}
                        className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-emerald-300 font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-600"
                      />
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={() => {
                      const toSave = { ...formOverrides, enabled: true };
                      setFormOverrides(toSave);
                      onSaveManualOverrides(toSave);
                      showSaveNotice();
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Fixed Times</span>
                  </button>

                  <button
                    onClick={() => {
                      const reset: ManualPrayerOverrides = {
                        enabled: false,
                        fajr: '',
                        sunrise: '',
                        dhuhr: '',
                        asr: '',
                        maghrib: '',
                        isha: '',
                        tahajjudStart: ''
                      };
                      setFormOverrides(reset);
                      onSaveManualOverrides(reset);
                      showSaveNotice();
                    }}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                  >
                    Reset Fixed Times
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 3. Calculation */}
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
              <h2 className="text-base font-bold text-slate-100">Preferred Prayer API Providers</h2>
              <p className="text-xs text-slate-400">
                Choose your primary provider. If it ever fails, Prayer Focus automatically cascades down the verified Bangladesh list.
              </p>

              {[
                { id: 'aladhan' as ProviderId, name: 'AlAdhan Global Coordinates API', desc: 'Primary coordinate lookup with Karachi 18° calculation and Hanafi 2x shadow across all 64 BD districts' },
                { id: 'aladhancity' as ProviderId, name: 'AlAdhan City API (Chattogram, Bangladesh)', desc: 'City-level fallback endpoint providing instant recovery if coordinate lookups fail' },
                { id: 'habibur' as ProviderId, name: 'Habibur Salat API (Dedicated Bangladesh)', desc: 'Specialized BD service returning precise localized times with GPS status and Hanafi Asr 2x' },
                { id: 'islamicnetwork' as ProviderId, name: 'Islamic Network API', desc: 'Address and region query engine delivering prayer timings for Bangladesh' },
                { id: 'prayzone' as ProviderId, name: 'PrayZone Global API', desc: 'Global city-level prayer schedule API with rapid JSON responses' },
                { id: 'astronomical' as ProviderId, name: 'Local Astronomical Solar Engine', desc: '100% offline mathematical solar calculation based on Jean Meeus equations' }
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => { onChangeProvider(p.id); showSaveNotice(); }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                    currentProvider === p.id
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold uppercase tracking-wider">{p.name}</div>
                    <div className="text-slate-400 text-[11px]">{p.desc}</div>
                  </div>
                  {currentProvider === p.id && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-3" />}
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
