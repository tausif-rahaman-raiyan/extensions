import React, { useState } from 'react';
import {
  Clock,
  RefreshCw,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle
} from 'lucide-react';
import {
  PrayerTimes,
  LocationInfo,
  ProviderId,
  ProviderHealth,
  JuristicMethod
} from '../../types/prayer';
import { format12HourTime, getDailyWaqtWindows } from '../../utils/tahajjudHelper';

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

  const waqtWindows = getDailyWaqtWindows(times, completedPrayers, new Date());

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Daily Prayer Timetable</h1>
          <p className="text-xs text-slate-400">
            {location.nameEn} · {location.country} · {location.timezone} · Juristic: {juristic === 'hanafi' ? 'Hanafi' : "Shafi'i / Standard"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCalendarModal}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>30-Day Calendar</span>
          </button>

          <button
            onClick={handleRefreshClick}
            disabled={refreshing}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
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

      {/* Full Vertical Schedule Table with Start to End Windows */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden divide-y divide-slate-800/80">
        {waqtWindows.map((item) => {
          const isDone = item.isCompleted;

          return (
            <div
              key={item.key}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors ${
                item.status === 'active' ? 'bg-emerald-950/20' : ''
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-bold text-slate-100">{item.nameEn}</span>
                  <span className="text-xs text-slate-400 font-bengali">({item.nameBn})</span>
                  <span className="font-arabic text-sm text-emerald-400/90">{item.arabic}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ml-1 ${
                      item.status === 'finished'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : item.status === 'missed'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : item.status === 'active'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {item.statusLabel}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono-numbers">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Window:</span>
                  <strong className="text-slate-200">
                    {format12HourTime(item.startTime)} – {format12HourTime(item.endTime)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-center">
                <div className="text-2xl font-bold font-mono-numbers text-emerald-400">
                  {format12HourTime(item.startTime)}
                </div>

                {item.isPrayer && (
                  <button
                    onClick={() => onTogglePrayer(item.key)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : item.status === 'missed'
                        ? 'bg-rose-950/30 border-rose-500/40 text-rose-300 hover:bg-rose-900/40'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Finished</span>
                      </>
                    ) : item.status === 'missed' ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Mark (Qada)</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5" />
                        <span>Mark Done</span>
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
