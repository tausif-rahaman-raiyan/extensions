import React from 'react';
import {
  Moon,
  Clock,
  Sparkles,
  CheckCircle2,
  Circle,
  AlertCircle,
  Volume2,
  Calendar as CalendarIcon,
  ShieldCheck,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import {
  PrayerTimes,
  LocationInfo,
  ProviderId,
  ProviderHealth,
  IslamicQuote,
  JuristicMethod,
  NavSection
} from '../../types/prayer';
import {
  format12HourTime,
  formatRemainingTime,
  formatCountdownDigital,
  getTahajjudStatus,
  getNextPrayer,
  getDailyWaqtWindows
} from '../../utils/tahajjudHelper';

interface OverviewViewProps {
  times: PrayerTimes;
  location: LocationInfo;
  currentProvider: ProviderId;
  providerStatus: Record<ProviderId, ProviderHealth>;
  completedPrayers: Record<string, boolean>;
  onTogglePrayer: (prayerKey: string) => void;
  hourlyQuote: IslamicQuote;
  currentTime: Date;
  juristic: JuristicMethod;
  onNavigate: (section: NavSection) => void;
  onPlaySound: () => void;
  soundPlayed: boolean;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  times,
  location,
  currentProvider,
  providerStatus,
  completedPrayers,
  onTogglePrayer,
  hourlyQuote,
  currentTime,
  juristic,
  onNavigate,
  onPlaySound,
  soundPlayed
}) => {
  const nextPrayer = getNextPrayer(times, currentTime);
  const tahajjud = getTahajjudStatus(times, currentTime);
  const waqtWindows = getDailyWaqtWindows(times, completedPrayers, currentTime);

  const prayerCards = [
    { key: 'fajr', nameEn: 'Fajr', arabic: 'الفجر', timeStr: times.fajr, endTimeStr: times.sunrise, isCurrent: nextPrayer.currentWaqtNameEn.includes('Fajr') },
    { key: 'sunrise', nameEn: 'Sunrise', arabic: 'الشروق', timeStr: times.sunrise, endTimeStr: times.dhuhr, isCurrent: nextPrayer.currentWaqtNameEn.includes('Ishraq') },
    { key: 'dhuhr', nameEn: 'Dhuhr', arabic: 'الظهر', timeStr: times.dhuhr, endTimeStr: times.asr, isCurrent: nextPrayer.currentWaqtNameEn.includes('Dhuhr') },
    { key: 'asr', nameEn: 'Asr', arabic: 'العصر', timeStr: times.asr, endTimeStr: times.maghrib, isCurrent: nextPrayer.currentWaqtNameEn.includes('Asr') },
    { key: 'maghrib', nameEn: 'Maghrib', arabic: 'المغرب', timeStr: times.maghrib, endTimeStr: times.isha, isCurrent: nextPrayer.currentWaqtNameEn.includes('Maghrib') },
    { key: 'isha', nameEn: 'Isha', arabic: 'العشاء', timeStr: times.isha, endTimeStr: times.fajr, isCurrent: nextPrayer.currentWaqtNameEn.includes('Isha') }
  ];

  const completedCount = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].filter(
    (k) => completedPrayers[k]
  ).length;

  return (
    <div className="space-y-6">
      {/* Welcome Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
            Assalamu Alaikum
          </h1>
          <p className="text-xs text-slate-400">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {location.nameEn}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onPlaySound}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-emerald-500/40 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Volume2 className={`w-3.5 h-3.5 text-emerald-400 ${soundPlayed ? 'animate-bounce' : ''}`} />
            <span>{soundPlayed ? 'Playing...' : 'Test Adhan Chime'}</span>
          </button>
        </div>
      </div>

      {/* Hero Next Prayer Card */}
      <section className="relative rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/20 p-6 sm:p-8 overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-islamic-pattern opacity-30 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="text-xs text-slate-400">
              Current Period: <span className="text-slate-200 font-semibold">{nextPrayer.currentWaqtNameEn}</span>
            </div>
            <div className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
              Next Prayer
            </div>
            <div className="text-4xl sm:text-5xl font-extrabold text-slate-100 tracking-tight">
              {nextPrayer.nameEn} <span className="text-2xl sm:text-3xl text-emerald-400 font-mono-numbers">· {format12HourTime(nextPrayer.timeStr)}</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black font-mono-numbers text-slate-100 tracking-tight">
              {formatCountdownDigital(nextPrayer.secondsRemaining)}
            </div>
            <p className="text-xs text-emerald-400">
              Remaining: {formatRemainingTime(nextPrayer.secondsRemaining)}
            </p>

            {/* Progress bar */}
            <div className="space-y-1 max-w-md pt-1">
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${nextPrayer.progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono-numbers">
                <span>Waqt progress: {nextPrayer.progressPercent}%</span>
                <span>Approaching next adhan</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col justify-center space-y-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold">Quick Actions</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>

            <button
              onClick={() => onNavigate('times')}
              className="w-full py-2 px-3 text-xs text-left bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl transition-colors flex items-center justify-between text-slate-200 cursor-pointer"
            >
              <span>Full Daily Timetable</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            <button
              onClick={() => onNavigate('tahajjud')}
              className="w-full py-2 px-3 text-xs text-left bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl transition-colors flex items-center justify-between text-slate-200 cursor-pointer"
            >
              <span>Tahajjud & Night Calculator</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>

            <button
              onClick={() => onNavigate('quran')}
              className="w-full py-2 px-3 text-xs text-left bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-xl transition-colors flex items-center justify-between text-slate-200 cursor-pointer"
            >
              <span>Quran Reading Stopwatch</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          </div>
        </div>
      </section>

      {/* 5 Daily Prayers + Sunrise Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-200">Daily Prayer Schedule</h2>
          <span className="text-xs text-slate-400">Juristic: {juristic === 'hanafi' ? 'Hanafi (2x)' : 'Shafi (1x)'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {prayerCards.map((card) => {
            const isChecked = !!completedPrayers[card.key];
            const w = waqtWindows.find((item) => item.key === card.key);
            const isMissed = w?.status === 'missed';

            return (
              <div
                key={card.key}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  card.isCurrent
                    ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/30'
                    : isMissed
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-100">{card.nameEn}</span>
                    <span className="font-arabic text-xs text-slate-400">{card.arabic}</span>
                  </div>
                  <div className="text-xl font-bold font-mono-numbers text-emerald-400">
                    {format12HourTime(card.timeStr)}
                  </div>
                  <div className="text-[11px] font-mono-numbers text-slate-400 mt-0.5">
                    Till: {format12HourTime(card.endTimeStr)}
                  </div>
                  {w && (
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
                  )}
                </div>

                {card.key !== 'sunrise' && (
                  <button
                    onClick={() => onTogglePrayer(card.key)}
                    className={`mt-3 w-full py-1.5 px-2 rounded-lg border text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                        : isMissed
                        ? 'bg-rose-950/40 border-rose-500/50 text-rose-300 hover:bg-rose-900/50'
                        : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isChecked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Done</span>
                      </>
                    ) : isMissed ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                        <span className="text-rose-300">Mark (Qada)</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-400">Mark</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Tahajjud & Tracker Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tahajjud Preview */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <Moon className="w-4 h-4" />
              <span>Tahajjud & Night Status</span>
            </span>
            <button
              onClick={() => onNavigate('tahajjud')}
              className="text-xs text-emerald-400 hover:underline"
            >
              Details
            </button>
          </div>
          <div>
            <div className="text-xs text-slate-300 font-medium">{tahajjud.statusText}</div>
            <div className="text-2xl font-bold font-mono-numbers text-emerald-400 mt-1">
              {formatCountdownDigital(tahajjud.secondsRemaining)}
            </div>
            <div className="text-xs text-slate-400 mt-1">{tahajjud.subText}</div>
          </div>
          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
            <span>Prime Start: {format12HourTime(times.tahajjudStart)}</span>
            <span>Ends: {format12HourTime(times.fajr)}</span>
          </div>
        </div>

        {/* Daily Progress */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Today's Prayer Progress</span>
            </span>
            <button
              onClick={() => onNavigate('tracker')}
              className="text-xs text-emerald-400 hover:underline"
            >
              Full Tracker
            </button>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-100 font-mono-numbers">
              {completedCount} <span className="text-lg text-slate-400 font-normal">of 5 Completed</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {completedCount === 5 ? 'All 5 Fard prayers completed for today. Alhamdulillah!' : `${5 - completedCount} prayers remaining.`}
            </p>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round((completedCount / 5) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
