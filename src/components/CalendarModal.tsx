import React from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { LocationInfo, JuristicMethod } from '../types/prayer';
import { calculateAstronomicalTimes } from '../services/astronomicalCalculator';
import { format12HourTime } from '../utils/tahajjudHelper';

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
  if (!isOpen) return null;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    const times = calculateAstronomicalTimes(d, location.lat, location.lng, 6, juristic);
    return {
      day: i + 1,
      isToday: i + 1 === now.getDate(),
      times
    };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Monthly Prayer Schedule · {monthNames[month]} {year}
              </h2>
              <p className="text-xs text-slate-400">
                {location.nameEn} ({location.country}) · {juristic === 'hanafi' ? 'Hanafi' : 'Shafi'} Juristic Method
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto p-4 flex-1">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/40">
                <th className="py-2.5 px-3 font-semibold">Date</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-400">Tahajjud (Prime)</th>
                <th className="py-2.5 px-3 font-semibold">Fajr</th>
                <th className="py-2.5 px-3 font-semibold text-slate-400">Sunrise</th>
                <th className="py-2.5 px-3 font-semibold">Dhuhr</th>
                <th className="py-2.5 px-3 font-semibold">Asr</th>
                <th className="py-2.5 px-3 font-semibold text-amber-400">Maghrib</th>
                <th className="py-2.5 px-3 font-semibold">Isha</th>
                <th className="py-2.5 px-3 font-semibold text-slate-400">Midnight</th>
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
                  <td className="py-2 px-3 text-emerald-400 font-medium">
                    {format12HourTime(times.tahajjudStart)}
                  </td>
                  <td className="py-2 px-3">{format12HourTime(times.fajr)}</td>
                  <td className="py-2 px-3 text-slate-400">{format12HourTime(times.sunrise)}</td>
                  <td className="py-2 px-3">{format12HourTime(times.dhuhr)}</td>
                  <td className="py-2 px-3">{format12HourTime(times.asr)}</td>
                  <td className="py-2 px-3 text-amber-300 font-medium">
                    {format12HourTime(times.maghrib)}
                  </td>
                  <td className="py-2 px-3">{format12HourTime(times.isha)}</td>
                  <td className="py-2 px-3 text-slate-400">{format12HourTime(times.midnight)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
