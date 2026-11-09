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
  Sparkles,
  RefreshCw,
  Bookmark,
  BookmarkCheck,
  Sunrise,
  ShieldCheck,
  Database
} from 'lucide-react';
import { PrayerTimes, LocationInfo, ProviderId, ProviderHealth, IslamicQuote } from '../types/prayer';
import {
  format12HourTime,
  formatCountdownDigital,
  getTahajjudStatus,
  getNextPrayer
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
  onOpenLocationModal,
  onOpenProviderModal,
  currentTime
}) => {
  const [copied, setCopied] = useState(false);
  const nextPrayer = getNextPrayer(times, currentTime);
  const tahajjud = getTahajjudStatus(times, currentTime);

  const handleCopyQuote = () => {
    const text = `${hourlyQuote.arabic ? `${hourlyQuote.arabic}\n\n` : ''}${hourlyQuote.bengali}\n\n— ${hourlyQuote.reference}${hourlyQuote.narratorBn ? ` (${hourlyQuote.narratorBn})` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sitpHealth = providerStatus['sitp'];
  const hasSitp502 = sitpHealth?.status === 'offline_502' || sitpHealth?.status === 'cooldown';
  const activeProviderHealth = providerStatus[currentProvider];

  const getStatusBadge = () => {
    if (hasSitp502 && currentProvider !== 'sitp') {
      return {
        label: '502 Cooldown (Safe)',
        cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
      };
    }
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

  const prayerItems = [
    { key: 'fajr', labelEn: 'Fajr', timeStr: times.fajr, isPrayer: true },
    { key: 'sunrise', labelEn: 'Sunrise (Ishraq)', timeStr: times.sunrise, isPrayer: false },
    { key: 'dhuhr', labelEn: 'Dhuhr', timeStr: times.dhuhr, isPrayer: true },
    { key: 'asr', labelEn: 'Asr', timeStr: times.asr, isPrayer: true },
    { key: 'maghrib', labelEn: 'Maghrib', timeStr: times.maghrib, isPrayer: true },
    { key: 'isha', labelEn: 'Isha', timeStr: times.isha, isPrayer: true },
    { key: 'tahajjud', labelEn: 'Tahajjud', timeStr: times.tahajjudStart, isPrayer: true }
  ];

  const countablePrayers = prayerItems.filter(p => p.isPrayer);
  const completedCount = countablePrayers.filter(p => completedPrayers[p.key]).length;
  const minutesUntilNextHour = 60 - currentTime.getMinutes();

  return (
    <div className="w-full max-w-sm mx-auto bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Top Prominent Bengali Wisdom Quote Banner */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border-b border-emerald-500/30 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Islamic Wisdom</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono-numbers">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Rotates hourly ({minutesUntilNextHour}m left)</span>
          </div>
        </div>

        {hourlyQuote.arabic && (
          <p className="font-arabic text-sm text-emerald-300 text-right dir-rtl leading-tight" dir="rtl">
            {hourlyQuote.arabic}
          </p>
        )}

        <blockquote className="font-bengali text-xs text-slate-100 leading-snug font-medium italic">
          "{hourlyQuote.bengali}"
        </blockquote>

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
          <span className="font-bengali text-emerald-400 font-semibold">
            — {hourlyQuote.reference}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(hourlyQuote.id)}
              className="text-slate-400 hover:text-amber-400 transition-colors"
              title={isBookmarked ? 'Bookmarked' : 'Bookmark Hadith'}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={handleCopyQuote}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title="Copy Bengali Wisdom"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onNextQuote}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
              title="Rotate Quote Manually"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Header Bar with Emerald Crescent Moon Icon */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#152820] to-[#08100C] border border-emerald-500/40 flex items-center justify-center relative shadow-sm">
            <svg viewBox="0 0 128 128" className="w-4 h-4">
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
              className="text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 text-left"
            >
              <span className="truncate max-w-[120px]">{location.nameEn}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">Change</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenProviderModal}
            title="Provider Status & Diagnostics"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenFullDashboard}
            title="Expand to Full Dashboard"
            className="px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md transition-colors flex items-center gap-1"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Full View</span>
          </button>
        </div>
      </div>

      {/* SITP 502 Cooldown / Fallback notice */}
      {hasSitp502 && (
        <div className="px-3.5 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5 truncate">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">SITP 502 Detected → Auto Fallback Active</span>
          </div>
          <button
            onClick={onOpenProviderModal}
            className="underline hover:text-amber-100 shrink-0 ml-1"
          >
            Details
          </button>
        </div>
      )}

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

      {/* Prayer Times Quick Table (Includes Sunrise & 5 Waqts + Tahajjud) */}
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
          <span>Daily Prayer Tracker</span>
          <span className="text-[11px] text-emerald-400 font-mono-numbers">
            {completedCount} of {countablePrayers.length} Completed
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {prayerItems.map((p) => {
            const isDone = !!completedPrayers[p.key];
            const isCurrent = nextPrayer.nameEn === p.labelEn;

            if (!p.isPrayer) {
              // Sunrise row
              return (
                <div
                  key={p.key}
                  className="flex items-center justify-between p-2 rounded-lg border bg-amber-500/5 border-amber-500/20 text-amber-200/90"
                >
                  <div className="flex items-center gap-1.5">
                    <Sunrise className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-xs font-medium">Sunrise</span>
                  </div>
                  <span className="text-xs font-mono-numbers">
                    {format12HourTime(p.timeStr)}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={p.key}
                onClick={() => onTogglePrayer(p.key)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors border ${
                  isCurrent
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : isDone
                    ? 'bg-slate-800/40 border-slate-800 text-slate-400 line-through'
                    : 'bg-slate-800/20 border-slate-800/60 text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span className="text-xs font-medium">{p.labelEn}</span>
                </div>
                <span className="text-xs font-mono-numbers">
                  {format12HourTime(p.timeStr)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
