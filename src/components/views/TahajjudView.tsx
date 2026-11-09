import React from 'react';
import { Moon, Clock, Sparkles, ShieldCheck, Star } from 'lucide-react';
import { PrayerTimes } from '../../types/prayer';
import {
  format12HourTime,
  formatRemainingTime,
  formatCountdownDigital,
  getTahajjudStatus
} from '../../utils/tahajjudHelper';

interface TahajjudViewProps {
  times: PrayerTimes;
  currentTime: Date;
}

export const TahajjudView: React.FC<TahajjudViewProps> = ({ times, currentTime }) => {
  const tahajjud = getTahajjudStatus(times, currentTime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <Moon className="w-6 h-6 text-emerald-400" />
          <span>Tahajjud & Night Prayer (Qiyam al-Layl)</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Islamic night calculation from Maghrib (Sunset) to Fajr (Dawn) with Last Third prime window
        </p>
      </div>

      {/* Hero Tahajjud Status Card */}
      <section className="relative rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-islamic-pattern opacity-30 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Tahajjud Window Status
            </span>
            {tahajjud.isActive && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                Prime Time Active Now
              </span>
            )}
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100">
              {tahajjud.statusText}
            </h2>
            <div className="text-4xl sm:text-6xl font-black font-mono-numbers text-emerald-400 tracking-tight mt-2">
              {formatCountdownDigital(tahajjud.secondsRemaining)}
            </div>
            <p className="text-xs text-slate-300 mt-1">{tahajjud.subText}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Tonight's Prime Start (Last Third):</span>
              <div className="text-lg font-bold font-mono-numbers text-slate-100 mt-0.5">
                {format12HourTime(times.tahajjudStart)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Tahajjud End (Fajr Adhan):</span>
              <div className="text-lg font-bold font-mono-numbers text-slate-100 mt-0.5">
                {format12HourTime(times.fajr)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Phase Night Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Phase 1 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400">Phase 1</div>
          <h3 className="text-base font-bold text-slate-100">First Third of the Night</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            From Maghrib to the end of the first third. Recommended for dinner, Isha prayer, and rest.
          </p>
          <div className="pt-2 text-xs font-mono-numbers text-slate-300 font-semibold">
            Ends at: {format12HourTime(times.firstThird)}
          </div>
        </div>

        {/* Phase 2 */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400">Phase 2</div>
          <h3 className="text-base font-bold text-slate-100">Islamic Midnight (Nisf al-Layl)</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The exact mathematical halfway point between Maghrib and Fajr. Isha should ideally be prayed before this time.
          </p>
          <div className="pt-2 text-xs font-mono-numbers text-slate-300 font-semibold">
            Midnight point: {format12HourTime(times.midnight)}
          </div>
        </div>

        {/* Phase 3 */}
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
          <div className="text-xs font-semibold text-emerald-400">Phase 3 · Most Virtuous</div>
          <h3 className="text-base font-bold text-emerald-300">Last Third (Tahajjud Prime)</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            The most blessed hour when Allah descends to the lowest heaven, accepting supplications and granting forgiveness.
          </p>
          <div className="pt-2 text-xs font-mono-numbers text-emerald-400 font-bold">
            Prime window: {format12HourTime(times.tahajjudStart)} – {format12HourTime(times.fajr)}
          </div>
        </div>
      </div>

      {/* Tahajjud Hadith & Virtue in Bengali */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-emerald-400">
          <Sparkles className="w-4 h-4" />
          <h3 className="text-sm font-bold text-slate-100">তাহাজ্জুদের বিশেষ ফজিলত ও বিশুদ্ধ হাদিস</h3>
        </div>

        <p className="font-arabic text-lg text-emerald-300/90 leading-relaxed dir-rtl" dir="rtl">
          يَنْزِلُ رَبُّنَا تَبَارَكَ وَتَعَالَى كُلَّ لَيْلَةٍ إِلَى السَّمَاءِ الدُّنْيَا حِينَ يَبْقَى ثُلُثُ اللَّيْلِ الآخِرُ
        </p>

        <blockquote className="font-bengali text-sm text-slate-200 italic leading-relaxed">
          "আমাদের বরকতময় ও মহান প্রতিপালক প্রতি রাতের শেষ তৃতীয়াংশে প্রথম আকাশে অবতরণ করেন এবং ঘোষণা করেন: কে আছ যে আমাকে ডাকবে, আমি তার ডাকে সাড়া দেব? কে আছ যে আমার কাছে কিছু চাইবে, আমি তাকে তা দান করব? কে আছ যে আমার কাছে ক্ষমা প্রার্থনা করবে, আমি তাকে ক্ষমা করে দেব?"
        </blockquote>

        <div className="font-bengali text-xs text-emerald-400 font-semibold">
          — সহিহ বুখারী ১১৪৫ · সহিহ মুসলিম ৭৫৮
        </div>
      </div>
    </div>
  );
};
