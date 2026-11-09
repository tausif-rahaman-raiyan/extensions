import React, { useState } from 'react';
import {
  Clock,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Circle
} from 'lucide-react';
import {
  PrayerTimes,
  LocationInfo,
  ProviderId,
  ProviderHealth,
  JuristicMethod
} from '../../types/prayer';
import { format12HourTime } from '../../utils/tahajjudHelper';

interface PrayerTimesViewProps {
  times: PrayerTimes;
  location: LocationInfo;
  currentProvider: ProviderId;
  providerStatus: Record<ProviderId, ProviderHealth>;
  completedPrayers: Record<string, boolean>;
  onTogglePrayer: (prayerKey: string) => void;
  onRefresh: () => Promise<void>;
  juristic: JuristicMethod;
  onOpenCalendarModal: () => void;
}

export const PrayerTimesView: React.FC<PrayerTimesViewProps> = ({
  times,
  location,
  currentProvider,
  providerStatus,
  completedPrayers,
  onTogglePrayer,
  onRefresh,
  juristic,
  onOpenCalendarModal
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const schedule = [
    { key: 'fajr', name: 'Fajr', arabic: 'الفجر', time: times.fajr, desc: 'Dawn prayer until sunrise (Suhur ends)' },
    { key: 'sunrise', name: 'Sunrise (Ishraq)', arabic: 'الشروق', time: times.sunrise, desc: 'Solar disc emergence, marks end of Fajr' },
    { key: 'dhuhr', name: 'Dhuhr', arabic: 'الظهر', time: times.dhuhr, desc: 'Post-meridian prayer after sun crosses zenith' },
    { key: 'asr', name: 'Asr', arabic: 'العصر', time: times.asr, desc: `Afternoon prayer · ${juristic === 'hanafi' ? 'Hanafi (2x shadow)' : 'Shafi (1x shadow)'}` },
    { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب', time: times.maghrib, desc: 'Sunset prayer & Iftar commencement' },
    { key: 'isha', name: 'Isha', arabic: 'العشاء', time: times.isha, desc: 'Night prayer after twilight disappears' }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Daily Prayer Timetable</h1>
          <p className="text-xs text-slate-400">
            {location.nameEn} · {location.country} · {location.timezone}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCalendarModal}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>30-Day Calendar</span>
          </button>

          <button
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh Timings'}</span>
          </button>
        </div>
      </div>

      {/* Freshness Badge Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-300 font-medium">
            Active Provider: <strong className="text-emerald-400">{providerStatus[currentProvider]?.name || 'AlAdhan API'}</strong>
          </span>
          {times.isCached && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-semibold">
              Cached (Same-day)
            </span>
          )}
        </div>
        <div className="text-slate-400 font-mono-numbers text-[11px]">
          Schedule Date: {times.rawDate}
        </div>
      </div>

      {/* Full Vertical Schedule Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
        {schedule.map((item) => {
          const isDone = !!completedPrayers[item.key];
          return (
            <div
              key={item.key}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-slate-100">{item.name}</span>
                  <span className="font-arabic text-sm text-emerald-400/90">{item.arabic}</span>
                </div>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-center">
                <div className="text-2xl font-bold font-mono-numbers text-emerald-400">
                  {format12HourTime(item.time)}
                </div>

                {item.key !== 'sunrise' && (
                  <button
                    onClick={() => onTogglePrayer(item.key)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isDone
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5" />
                        <span>Mark</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
