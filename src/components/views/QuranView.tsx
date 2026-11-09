import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Award
} from 'lucide-react';
import { QuranSession } from '../../types/prayer';

export const QuranView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(20);
  const [surahNote, setSurahNote] = useState('');

  const [sessions, setSessions] = useState<QuranSession[]>(() => {
    try {
      const saved = localStorage.getItem('prayer_focus_quran_sessions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: '1',
        timestamp: Date.now() - 86400000,
        dateStr: new Date(Date.now() - 86400000).toLocaleDateString(),
        durationSeconds: 1200,
        surahNote: 'Surah Al-Mulk & Surah Yasin'
      }
    ];
  });

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    try {
      localStorage.setItem('prayer_focus_quran_sessions', JSON.stringify(sessions));
    } catch (e) {}
  }, [sessions]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
  };

  const handleSaveSession = () => {
    if (elapsedSeconds < 10) return;
    const newSession: QuranSession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      dateStr: new Date().toLocaleDateString(),
      durationSeconds: elapsedSeconds,
      surahNote: surahNote.trim() || 'Daily Recitation'
    };
    setSessions([newSession, ...sessions]);
    setElapsedSeconds(0);
    setIsRunning(false);
    setSurahNote('');
  };

  const handleDeleteSession = (id: string) => {
    setSessions(sessions.filter((s) => s.id !== id));
  };

  const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Today's total reading time
  const todayStr = new Date().toLocaleDateString();
  const todayTotalSeconds = sessions
    .filter((s) => s.dateStr === todayStr)
    .reduce((acc, curr) => acc + curr.durationSeconds, 0);

  const todayMinutes = Math.round(todayTotalSeconds / 60);
  const goalProgress = Math.min(100, Math.round((todayMinutes / dailyGoalMinutes) * 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-400" />
          <span>Quran Reading Stopwatch & Session Log</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Time your daily Quran recitation, monitor reading consistency, and record completed Surahs
        </p>
      </div>

      {/* Stopwatch Hero Card */}
      <section className="relative rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/30 p-6 sm:p-8 overflow-hidden shadow-xl text-center space-y-4">
        <div className="inline-block text-xs font-semibold text-emerald-400 uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          {isRunning ? 'Reading Session Active' : 'Stopwatch Ready'}
        </div>

        <div className="text-5xl sm:text-7xl font-extrabold font-mono-numbers text-slate-100 tracking-tight">
          {formatTimer(elapsedSeconds)}
        </div>

        {/* Input note */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            placeholder="Add Surah, Ayah or Page note (e.g. Surah Al-Kahf 1-50)..."
            value={surahNote}
            onChange={(e) => setSurahNote(e.target.value)}
            className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 text-center"
          />
        </div>

        {/* Stopwatch Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={handleStartPause}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{elapsedSeconds > 0 ? 'Resume' : 'Start Reading'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={elapsedSeconds === 0}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSaveSession}
            disabled={elapsedSeconds < 10}
            className="px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Log Session</span>
          </button>
        </div>
      </section>

      {/* Daily Target & Streak Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Goal Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Today's Reading Goal</span>
            <span className="text-emerald-400 font-bold font-mono-numbers">{todayMinutes} / {dailyGoalMinutes} min</span>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${goalProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Progress: {goalProgress}%</span>
            <div className="flex items-center gap-1.5">
              <span>Goal:</span>
              <select
                value={dailyGoalMinutes}
                onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-0.5 text-xs text-slate-200"
              >
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
          </div>
        </div>

        {/* Motivational Ayah Card */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold text-emerald-400">Quranic Wisdom</div>
            <p className="font-arabic text-sm text-emerald-300/90 leading-relaxed dir-rtl mt-1 text-right" dir="rtl">
              وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا
            </p>
            <p className="font-bengali text-xs text-slate-300 italic leading-relaxed mt-1">
              "আর কুরআন তিলাওয়াত করুন ধীরে ধীরে ও সুস্পষ্টভাবে।" — সূরা আল-মুযযাম্মিল : ৪
            </p>
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Daily recitation purifies the heart and brings barakah into your day.
          </div>
        </div>
      </div>

      {/* Recitation Session History */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-200">Recent Recitation History</h2>
        {sessions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
            No recitation sessions recorded yet. Start the stopwatch above and click "Log Session" when finished!
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{s.surahNote}</div>
                    <div className="text-[11px] text-slate-500 font-mono-numbers">
                      {s.dateStr} · {Math.round(s.durationSeconds / 60)} minutes ({formatTimer(s.durationSeconds)})
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteSession(s.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete log"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
