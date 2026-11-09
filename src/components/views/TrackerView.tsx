import React from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Calendar,
  Award,
  RotateCcw,
  AlertCircle,
  Clock,
  Sparkles,
  BellRing
} from 'lucide-react';
import { PrayerTimes, LocationInfo, JuristicMethod } from '../../types/prayer';
import { format12HourTime, getDailyWaqtWindows } from '../../utils/tahajjudHelper';

interface TrackerViewProps {
  times: PrayerTimes;
  location: LocationInfo;
  completedPrayers: Record<string, boolean>;
  onTogglePrayer: (prayerKey: string) => void;
  onResetToday: () => void;
  juristic: JuristicMethod;
  onOpenCalendarModal: () => void;
  onTestReminder?: (waqtName: string, start: string, end: string) => void;
}

export const TrackerView: React.FC<TrackerViewProps> = ({
  times,
  location,
  completedPrayers,
  onTogglePrayer,
  onResetToday,
  juristic,
  onOpenCalendarModal,
  onTestReminder
}) => {
  const waqtWindows = getDailyWaqtWindows(times, completedPrayers, new Date());
  const obligatoryPrayers = waqtWindows.filter((w) => w.isPrayer);
  const completedCount = obligatoryPrayers.filter((w) => w.isCompleted).length;
  const missedCount = obligatoryPrayers.filter((w) => w.status === 'missed').length;
  const percentage = Math.round((completedCount / obligatoryPrayers.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            <span>Daily Prayer Tracker & Waqt Windows</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracks start-to-end prayer windows. Marks prayers as <strong className="text-emerald-400">Finished</strong> or automatically flags expired windows as <strong className="text-rose-400">Unfinished (Missed)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onTestReminder && (
            <button
              onClick={() => {
                const currentOrNext = waqtWindows.find((w) => w.status === 'active') || waqtWindows[0];
                onTestReminder(currentOrNext.nameEn, currentOrNext.startTime, currentOrNext.endTime);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Preview the interactive namaz arrival popup with Bengali quote"
            >
              <BellRing className="w-3.5 h-3.5 text-emerald-400" />
              <span>Test Reminder Popup</span>
            </button>
          )}

          <button
            onClick={onOpenCalendarModal}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Monthly Calendar</span>
          </button>

          <button
            onClick={onResetToday}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Today</span>
          </button>
        </div>
      </div>

      {/* Progress Metric Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Today's Performance
            </span>
            {missedCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium">
                {missedCount} Unfinished (Missed)
              </span>
            )}
          </div>
          <div className="text-4xl font-extrabold text-slate-100 font-mono-numbers">
            {completedCount} <span className="text-xl text-slate-400 font-normal">/ {obligatoryPrayers.length} Completed</span>
          </div>
          <p className="text-xs text-slate-300">
            {percentage === 100
              ? 'MashaAllah! All prayers completed today. May Allah accept your worship.'
              : missedCount > 0
              ? `${missedCount} prayer time(s) passed without being recorded. You can still make up (Qada) if needed.`
              : `${obligatoryPrayers.length - completedCount} prayers remaining for today.`}
          </p>
        </div>

        {/* Circular Progress Gauge */}
        <div className="flex items-center gap-4 self-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-500 transition-all duration-700 ease-out"
                strokeDasharray={`${percentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xl font-bold font-mono-numbers text-slate-100">
              {percentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Start-to-End Prayer Windows Checklist */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
          Prayer Windows (Start to End Time)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {waqtWindows.map((w) => {
            const isClickable = w.isPrayer;

            return (
              <div
                key={w.key}
                onClick={() => {
                  if (isClickable) onTogglePrayer(w.key);
                }}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  isClickable ? 'cursor-pointer' : 'cursor-default opacity-80'
                } ${
                  w.status === 'finished'
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                    : w.status === 'missed'
                    ? 'bg-rose-950/15 border-rose-500/30 text-rose-200'
                    : w.status === 'active'
                    ? 'bg-amber-950/20 border-amber-500/50 text-amber-200 shadow-md ring-1 ring-amber-500/20'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isClickable ? (
                      w.isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : w.status === 'missed' ? (
                        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                      )
                    ) : (
                      <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{w.nameEn}</span>
                        <span className="text-xs text-slate-400 font-bengali">({w.nameBn})</span>
                      </div>
                      <div className="font-arabic text-xs text-emerald-400/80" dir="rtl">
                        {w.arabic}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
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

                {/* Start to End Time display */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                  <span className="text-slate-400 flex items-center gap-1 font-mono-numbers">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>Waqt Window:</span>
                  </span>
                  <span className="font-mono-numbers font-bold text-slate-200">
                    {format12HourTime(w.startTime)} – {format12HourTime(w.endTime)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
