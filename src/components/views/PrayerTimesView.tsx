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
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);

  const handleRefreshClick = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      setToast({
        message: `✓ Timings refreshed successfully from ${providerStatus[currentProvider]?.name || 'AlAdhan API'}`,
        isError: false
      });
    } catch (err: any) {
      setToast({
        message: `✕ Failed to refresh timings: ${err?.message || 'Sync failed'}`,
        isError: true
      });
    } finally {
      setTimeout(() => setRefreshing(false), 500);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const waqtWindows = getDailyWaqtWindows(times, completedPrayers, new Date());

  return (
    <div className="space-y-6 relative">
      {/* Toast Feedback Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 transition-all animate-bounce ${
            toast.isError
              ? 'bg-rose-950 border-rose-500/60 text-rose-200'
              : 'bg-emerald-950 border-emerald-500/60 text-emerald-200'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}

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

      {/* Box-Style Cards Grid with Explicit Time Limits */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-100">Daily Prayer Schedule Cards</h2>
          <span className="text-xs text-slate-400">Juristic: {juristic === 'hanafi' ? 'Hanafi (2x)' : "Shafi'i (1x)"}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {waqtWindows.filter(w => w.key !== 'tahajjud').map((w) => {
            const isDone = w.isCompleted;
            const isClickable = w.isPrayer;

            return (
              <div
                key={w.key}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  w.status === 'active'
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30'
                    : w.status === 'finished'
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : w.status === 'missed'
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-100">{w.nameEn}</span>
                    <span className="font-arabic text-xs text-slate-400">{w.arabic}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-bengali">({w.nameBn})</div>

                  <div className="text-xl font-bold font-mono-numbers text-emerald-400 mt-2">
                    {format12HourTime(w.startTime)}
                  </div>
                  <div className="text-[11px] font-mono-numbers text-slate-400 mt-0.5">
                    Limit: <strong className="text-slate-300">{format12HourTime(w.endTime)}</strong>
                  </div>

                  <div className="mt-2">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-semibold border ${
                        w.status === 'finished'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : w.status === 'missed'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : w.status === 'active'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {w.statusLabel}
                    </span>
                  </div>
                </div>

                {isClickable && (
                  <button
                    onClick={() => onTogglePrayer(w.key)}
                    className={`mt-3 w-full py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isDone
                        ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                        : w.status === 'missed'
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/50'
                        : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isDone ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Finished</span>
                      </>
                    ) : w.status === 'missed' ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Mark (Qada)</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-slate-500" />
                        <span>Mark</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
