import React, { useState } from 'react';
import {
  Maximize2,
  Clock,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Activity,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Sunrise,
  ShieldCheck,
  Database,
  Settings
} from 'lucide-react';
import { PrayerTimes, LocationInfo, ProviderId, ProviderHealth, IslamicQuote } from '../types/prayer';
import {
  format12HourTime,
  formatCountdownDigital,
  getTahajjudStatus,
  getNextPrayer,
  getDailyWaqtWindows
} from '../utils/tahajjudHelper';

interface MiniWidgetProps {
  times: PrayerTimes;
  location: LocationInfo;
  currentProvider: ProviderId;
  providerStatus: Record<ProviderId, ProviderHealth>;
  completedPrayers: Record<string, boolean>;
  onTogglePrayer: (prayerKey: string) => void;
  hourlyQuote: IslamicQuote;
  onNextQuote: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onOpenFullDashboard: () => void;
  onOpenSettings?: () => void;
  onOpenLocationModal: () => void;
  onOpenProviderModal: () => void;
  currentTime: Date;
}

export const MiniWidget: React.FC<MiniWidgetProps> = ({
  times,
  location,
  currentProvider,
  providerStatus,
  completedPrayers,
  onTogglePrayer,
  hourlyQuote,
  onNextQuote,
  isBookmarked,
  onToggleBookmark,
  onOpenFullDashboard,
  onOpenSettings,
  onOpenLocationModal,
  onOpenProviderModal,
  currentTime
}) => {
  const [copied, setCopied] = useState(false);
  const nextPrayer = getNextPrayer(times, currentTime);
  const tahajjud = getTahajjudStatus(times, currentTime);
  const waqtWindows = getDailyWaqtWindows(times, completedPrayers, currentTime);

  const handleCopyQuote = () => {
    const text = `${hourlyQuote.arabic ? `${hourlyQuote.arabic}\n\n` : ''}${hourlyQuote.bengali}\n\n— ${hourlyQuote.reference}${hourlyQuote.narratorBn ? ` (${hourlyQuote.narratorBn})` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeProviderHealth = providerStatus[currentProvider];

  const getStatusBadge = () => {
    if (activeProviderHealth?.status === 'operational') {
      return {
        label: 'Live Sync',
        cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      };
    }
    if (activeProviderHealth?.status === 'cooldown') {
      return {
        label: 'Cached (Cooldown)',
        cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30'
      };
    }
    return {
      label: 'Local Engine',
      cls: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
    };
  };

  const statusBadge = getStatusBadge();
  const countablePrayers = waqtWindows.filter((p) => p.isPrayer && p.key !== 'tahajjud');
  const completedCount = countablePrayers.filter((p) => p.isCompleted).length;
  const missedCount = countablePrayers.filter((p) => p.status === 'missed').length;
  const minutesUntilNextHour = 60 - currentTime.getMinutes();

  return (
    <div className="w-full max-w-sm mx-auto bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header Bar with Emerald Crescent Moon Icon */}
      <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#152820] to-[#08100C] border border-emerald-500/40 flex items-center justify-center relative shadow-sm shrink-0">
            <svg viewBox="0 0 128 128" className="w-4.5 h-4.5">
              <path
                d="M78 24 C46 24 22 48 22 80 C22 104 38 114 54 114 C36 102 34 76 52 52 C64 36 78 30 78 24 Z"
                fill="#34D399"
              />
              <polygon
                transform="translate(80, 52) scale(0.9)"
                points="0,-18 5,-6 18,-5 8,4 12,16 0,9 -12,16 -8,4 -18,-5 -5,-6"
                fill="#F59E0B"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100">Prayer Focus</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
            </div>
            <button
              onClick={onOpenLocationModal}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-left cursor-pointer"
            >
              <span className="truncate max-w-[120px] font-medium">{location.nameEn}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400 hover:underline">Change</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenProviderModal}
            title="Provider Status & Diagnostics"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenFullDashboard}
            title="Expand to Full Dashboard"
            className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Full View</span>
          </button>
        </div>
      </div>

      {/* Hero Next Prayer Counter */}
      <div className="p-4 bg-gradient-to-b from-slate-900 to-slate-950/60 border-b border-slate-800/80">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Next Prayer: <strong className="text-emerald-400 font-semibold">{nextPrayer.nameEn}</strong></span>
          <span className="font-mono-numbers">{format12HourTime(nextPrayer.timeStr)}</span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold font-mono-numbers text-slate-100 tracking-tight">
            {formatCountdownDigital(nextPrayer.secondsRemaining)}
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400">Current: {nextPrayer.currentWaqtNameEn}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${nextPrayer.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Tahajjud Live Status */}
      <div className="px-4 py-3 bg-emerald-950/20 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-emerald-300">Tahajjud (Last Third of Night)</span>
            {tahajjud.isActive && (
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 text-[10px] rounded border border-emerald-500/30">
                Active
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-300">{tahajjud.statusText}</p>
          <p className="text-[10px] text-slate-400 font-mono-numbers">
            Window: {format12HourTime(times.tahajjudStart)} – {format12HourTime(times.fajr)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold font-mono-numbers text-emerald-400">
            {formatCountdownDigital(tahajjud.secondsRemaining)}
          </div>
          <span className="text-[10px] text-slate-400">
            {tahajjud.isActive ? 'Until Fajr' : 'Time remaining'}
          </span>
        </div>
      </div>

      {/* Prayer Windows Table with Start-to-End Time & Finished/Missed Status */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <span>Daily Prayer Tracker</span>
          <div className="flex items-center gap-2 font-mono-numbers text-[11px]">
            <span className="text-emerald-400 font-semibold">{completedCount}/{countablePrayers.length} Done</span>
            {missedCount > 0 && <span className="text-rose-400 font-semibold">({missedCount} Missed)</span>}
          </div>
        </div>

        <div className="space-y-1.5">
          {waqtWindows.map((w) => {
            const isClickable = w.isPrayer;

            return (
              <div
                key={w.key}
                onClick={() => {
                  if (isClickable) onTogglePrayer(w.key);
                }}
                className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                } ${
                  w.status === 'finished'
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : w.status === 'missed'
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                    : w.status === 'active'
                    ? 'bg-amber-950/25 border-amber-500/50 text-amber-200'
                    : 'bg-slate-800/20 border-slate-800/60 text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isClickable ? (
                    w.isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : w.status === 'missed' ? (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    )
                  ) : (
                    <Sunrise className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  )}
                  <span className="text-xs font-medium truncate">{w.nameEn}</span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">({w.statusLabel})</span>
                </div>

                <div className="flex items-center gap-2 font-mono-numbers text-xs">
                  <span className="text-[11px] text-slate-400">
                    {format12HourTime(w.startTime)} – {format12HourTime(w.endTime)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions: [Open Dashboard ↗], [Settings], Location line, and Full-Width Refresh */}
      <div className="p-3 pt-1 space-y-2 border-t border-slate-800/80 bg-slate-950/40">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpenFullDashboard}
            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Open Dashboard ↗</span>
          </button>

          <button
            onClick={() => {
              if (onOpenSettings) onOpenSettings();
              else onOpenFullDashboard();
            }}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>Settings</span>
          </button>
        </div>

        {/* Location Subtitle Line */}
        <div className="flex items-center justify-center gap-1 text-[10.5px] text-slate-400 font-medium text-center py-0.5">
          <span className="text-emerald-400 text-xs">✦</span>
          <span>{location.nameEn}, {location.country} ({location.timezone})</span>
        </div>

        {/* Full-Width Refresh Button */}
        <button
          onClick={onOpenProviderModal}
          className="w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>↻ Refresh</span>
        </button>
      </div>
    </div>
  );
};
