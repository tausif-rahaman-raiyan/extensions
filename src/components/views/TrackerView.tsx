import React from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Calendar,
  Award,
  RotateCcw
} from 'lucide-react';
import { PrayerTimes, LocationInfo, JuristicMethod } from '../../types/prayer';
import { format12HourTime } from '../../utils/tahajjudHelper';

interface TrackerViewProps {
  times: PrayerTimes;
  location: LocationInfo;
  completedPrayers: Record<string, boolean>;
  onTogglePrayer: (prayerKey: string) => void;
  onResetToday: () => void;
  juristic: JuristicMethod;
  onOpenCalendarModal: () => void;
}

export const TrackerView: React.FC<TrackerViewProps> = ({
  times,
  location,
  completedPrayers,
  onTogglePrayer,
  onResetToday,
  juristic,
  onOpenCalendarModal
}) => {
  const prayerList = [
    { key: 'fajr', name: 'Fajr', time: times.fajr, type: 'Obligatory (Fard)' },
    { key: 'dhuhr', name: 'Dhuhr', time: times.dhuhr, type: 'Obligatory (Fard)' },
    { key: 'asr', name: 'Asr', time: times.asr, type: 'Obligatory (Fard)' },
    { key: 'maghrib', name: 'Maghrib', time: times.maghrib, type: 'Obligatory (Fard)' },
    { key: 'isha', name: 'Isha', time: times.isha, type: 'Obligatory (Fard)' },
    { key: 'tahajjud', name: 'Tahajjud', time: times.tahajjudStart, type: 'Voluntary (Sunnah Muakkadah / Nafl)' }
  ];

  const completedCount = prayerList.filter((p) => completedPrayers[p.key]).length;
  const percentage = Math.round((completedCount / prayerList.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-emerald-400" />
            <span>Daily Prayer Tracker & Log</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track daily prayers, build consistency, and review your monthly worship calendar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCalendarModal}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span>Monthly Calendar</span>
          </button>

          <button
            onClick={onResetToday}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Today</span>
          </button>
        </div>
      </div>

      {/* Progress Metric Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-lg">
        <div className="space-y-2">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Today's Adherence
          </div>
          <div className="text-4xl font-extrabold text-slate-100 font-mono-numbers">
            {completedCount} <span className="text-xl text-slate-400 font-normal">/ {prayerList.length} Prayers Completed</span>
          </div>
          <p className="text-xs text-slate-300">
            {percentage === 100
              ? 'All prayers completed today! May Allah accept your worship.'
              : `${prayerList.length - completedCount} prayers remaining today.`}
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

      {/* Prayer Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {prayerList.map((p) => {
          const isDone = !!completedPrayers[p.key];
          return (
            <div
              key={p.key}
              onClick={() => onTogglePrayer(p.key)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                isDone
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/40 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {isDone ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-6 h-6 text-slate-500 shrink-0" />
                )}
                <div>
                  <div className="text-sm font-bold">{p.name}</div>
                  <div className="text-[11px] text-slate-400">{p.type}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm font-bold font-mono-numbers text-emerald-400">
                  {format12HourTime(p.time)}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isDone ? 'Completed' : 'Click to mark'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
