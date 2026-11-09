import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Grid, List } from 'lucide-react';
import { LocationInfo, JuristicMethod } from '../types/prayer';
import { calculateAstronomicalTimes } from '../services/astronomicalCalculator';
import { format12HourTime, getDailyWaqtWindows } from '../utils/tahajjudHelper';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: LocationInfo;
  juristic: JuristicMethod;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isOpen,
  onClose,
  location,
  juristic
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedDayDetail, setSelectedDayDetail] = useState<number | null>(null);

  if (!isOpen) return null;

  const now = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayDetail(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayDetail(null);
  };

  const handleCurrentMonth = () => {
    setCurrentDate(new Date());
    setSelectedDayDetail(null);
  };

  const fardKeys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

  // Generate padded days array
  const paddingCells = Array.from({ length: firstDayIndex });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const d = new Date(year, month, dayNum);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = dayNum === now.getDate() && month === now.getMonth() && year === now.getFullYear();
    const isPast = d < new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const isFuture = d > new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const times = calculateAstronomicalTimes(d, location.lat, location.lng, 6, juristic);

    // Retrieve saved completed history from localStorage
    let dayCompleted: Record<string, boolean> = {};
    try {
      const saved = localStorage.getItem(`prayer_focus_completed_${dateStr}`);
      if (saved) dayCompleted = JSON.parse(saved);
    } catch (e) {}

    // Evaluate status for 5 Fard prayers
    const waqtWindows = getDailyWaqtWindows(times, dayCompleted, isToday ? now : d);
    const fardStatuses = fardKeys.map((k) => {
      const item = waqtWindows.find((w) => w.key === k);
      const isDone = !!dayCompleted[k];

      if (isDone) return { key: k, status: 'done', color: 'bg-emerald-400' };
      if (isPast) return { key: k, status: 'missed', color: 'bg-rose-500' };
      if (isFuture) return { key: k, status: 'future', color: 'bg-slate-700' };

      // Is Today
      if (item?.status === 'missed') return { key: k, status: 'missed', color: 'bg-rose-500' };
      if (item?.status === 'active') return { key: k, status: 'active', color: 'bg-amber-400 animate-pulse' };
      return { key: k, status: 'upcoming', color: 'bg-slate-600' };
    });

    return {
      day: dayNum,
      dateStr,
      isToday,
      isPast,
      isFuture,
      times,
      fardStatuses,
      waqtWindows
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-[#081510] border border-[#163a2d] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Controls (Matching Image 9cfd33bd.png) */}
        <div className="px-5 py-4 bg-[#0a1c15] border-b border-[#163a2d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-emerald-400" />
              <span>Monthly Prayer Calendar & History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Actual recorded prayer history in {location.timezone || 'Asia/Dhaka'} time · 5 Dots = Fajr, Dhuhr, Asr, Maghrib, Isha
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {/* View Switcher */}
            <div className="flex items-center bg-[#07130e] p-1 rounded-xl border border-[#163a2d]">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Grid View (Image Style)"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewMode === 'table' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Detailed Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Prev / Month / Next Switcher */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="px-3 py-1.5 bg-[#0e271d] hover:bg-[#163a2d] border border-[#1a4435] text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prev Month</span>
              </button>

              <button
                onClick={handleCurrentMonth}
                className="px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl hover:bg-emerald-900/60 transition-colors"
              >
                {monthNames[month]} {year}
              </button>

              <button
                onClick={handleNextMonth}
                className="px-3 py-1.5 bg-[#0e271d] hover:bg-[#163a2d] border border-[#1a4435] text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Next Month</span>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {viewMode === 'grid' ? (
            <div className="space-y-3">
              {/* Day Name Headers (Sun to Sat) */}
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-emerald-400/90 pb-1">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              {/* 7-Column Grid Cards */}
              <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                {/* Empty padding cells */}
                {paddingCells.map((_, idx) => (
                  <div key={`pad-${idx}`} className="h-16 sm:h-20 rounded-2xl bg-slate-950/30 border border-slate-900/40 opacity-30" />
                ))}

                {/* Days of Month Cards */}
                {monthDays.map((item) => {
                  const isSelected = selectedDayDetail === item.day;

                  return (
                    <div
                      key={item.day}
                      onClick={() => setSelectedDayDetail(isSelected ? null : item.day)}
                      className={`relative h-16 sm:h-20 rounded-2xl p-2 sm:p-2.5 flex flex-col justify-between transition-all cursor-pointer ${
                        item.isToday
                          ? 'bg-[#0d271e] border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/40'
                          : isSelected
                          ? 'bg-[#103025] border-2 border-teal-400'
                          : 'bg-[#0b1c15] border border-[#15382b] hover:border-emerald-500/50 hover:bg-[#0e241c]'
                      }`}
                    >
                      {/* Day Number */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${item.isToday ? 'text-emerald-300 font-extrabold text-sm' : 'text-slate-200'}`}>
                          {item.day}
                        </span>
                        {item.isToday && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping hidden sm:block" />
                        )}
                      </div>

                      {/* 5 Status Dots (Fajr, Dhuhr, Asr, Maghrib, Isha) */}
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5 pt-1">
                        {item.fardStatuses.map((f) => (
                          <span
                            key={f.key}
                            title={`${f.key.toUpperCase()}: ${f.status}`}
                            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-transform ${f.color}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend & Instructions Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 border-t border-[#143327]">
                <div className="flex items-center gap-4 text-[11px]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-slate-300">Green = Prayed</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                    <span className="text-slate-300">Red = Missed</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                    <span className="text-slate-400">Gray = Upcoming</span>
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400/90 italic">
                  Click any date card to view detailed waqt timings
                </span>
              </div>

              {/* Selected Day Timings Detail Box */}
              {selectedDayDetail !== null && (
                <div className="p-4 rounded-2xl bg-[#0e271d] border border-emerald-500/40 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs border-b border-emerald-500/20 pb-2">
                    <span className="font-bold text-emerald-300">
                      Detailed Schedule for {monthNames[month]} {selectedDayDetail}, {year}
                    </span>
                    <button
                      onClick={() => setSelectedDayDetail(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono-numbers">
                    {monthDays.find((d) => d.day === selectedDayDetail)?.waqtWindows.filter((w) => w.isPrayer && w.key !== 'tahajjud').map((w) => (
                      <div key={w.key} className="p-2 rounded-xl bg-[#081711] border border-[#163a2d]">
                        <div className="font-bold text-slate-200">{w.nameEn}</div>
                        <div className="text-emerald-400">{format12HourTime(w.startTime)}</div>
                        <div className="text-[10px] text-slate-400">Limit: {format12HourTime(w.endTime)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold text-emerald-400">Fajr</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-400">Sunrise</th>
                    <th className="py-2.5 px-3 font-semibold text-emerald-400">Dhuhr</th>
                    <th className="py-2.5 px-3 font-semibold text-emerald-400">Asr</th>
                    <th className="py-2.5 px-3 font-semibold text-amber-400">Maghrib</th>
                    <th className="py-2.5 px-3 font-semibold text-emerald-400">Isha</th>
                    <th className="py-2.5 px-3 font-semibold text-slate-400">Tahajjud Start</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-numbers">
                  {monthDays.map(({ day, isToday, times }) => (
                    <tr
                      key={day}
                      className={`transition-colors ${
                        isToday
                          ? 'bg-emerald-950/40 text-emerald-300 font-semibold'
                          : 'hover:bg-slate-800/30 text-slate-300'
                      }`}
                    >
                      <td className="py-2 px-3 whitespace-nowrap">
                        {monthNames[month].slice(0, 3)} {day}
                        {isToday && (
                          <span className="ml-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded font-sans">
                            Today
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-emerald-400">{format12HourTime(times.fajr)}</td>
                      <td className="py-2 px-3 text-slate-400">{format12HourTime(times.sunrise)}</td>
                      <td className="py-2 px-3">{format12HourTime(times.dhuhr)}</td>
                      <td className="py-2 px-3">{format12HourTime(times.asr)}</td>
                      <td className="py-2 px-3 text-amber-300 font-medium">
                        {format12HourTime(times.maghrib)}
                      </td>
                      <td className="py-2 px-3">{format12HourTime(times.isha)}</td>
                      <td className="py-2 px-3 text-slate-400">{format12HourTime(times.tahajjudStart)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
