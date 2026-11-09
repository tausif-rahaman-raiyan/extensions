import React, { useState, useEffect } from 'react';
import {
  Moon,
  Sparkles,
  Clock,
  CheckCircle2,
  X,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize2
} from 'lucide-react';
import { playIslamicChime } from '../utils/soundHelper';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerName: string;
  onMarkPrayed?: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  onClose,
  prayerName,
  onMarkPrayed
}) => {
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 minutes = 300 seconds
  const [isRunning, setIsRunning] = useState(true);
  const [tasbihCount, setTasbihCount] = useState(0);
  const [activeDhikrIndex, setActiveDhikrIndex] = useState(0);

  const dhikrs = [
    { arabic: 'سُبْحَانَ اللَّهِ', translit: 'SubhanAllah', bn: 'আল্লাহ অতি পবিত্র' },
    { arabic: 'الْحَمْدُ لِلَّهِ', translit: 'Alhamdulillah', bn: 'সকল প্রশংসা আল্লাহর জন্য' },
    { arabic: 'اللَّهُ أَكْبَرُ', translit: 'Allahu Akbar', bn: 'আল্লাহ সর্বশ্রেষ্ঠ' },
    { arabic: 'أَسْتَغْفِرُ اللَّهَ', translit: 'Astaghfirullah', bn: 'আমি আল্লাহর কাছে ক্ষমা চাই' }
  ];

  useEffect(() => {
    if (!isOpen) return;
    setSecondsLeft(300);
    setIsRunning(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playIslamicChime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progressPercent = ((300 - secondsLeft) / 300) * 100;
  const currentDhikr = dhikrs[activeDhikrIndex];

  const handleTasbihTap = () => {
    setTasbihCount((c) => c + 1);
  };

  const handleComplete = () => {
    if (onMarkPrayed) onMarkPrayed();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#070D0B] text-slate-100 flex flex-col justify-between p-6 sm:p-10 overflow-y-auto animate-in fade-in duration-300">
      {/* Background Islamic Ambient Rings */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
        <div className="w-[600px] h-[600px] rounded-full border border-emerald-400 animate-pulse" />
        <div className="w-[850px] h-[850px] rounded-full border border-emerald-500/50 absolute" />
        <div className="w-[1100px] h-[1100px] rounded-full border border-emerald-500/20 absolute" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#152820] to-[#08100C] border border-emerald-500/40 p-1 flex items-center justify-center shadow-lg overflow-hidden">
            <img
              src="/icons/app-logo.png"
              alt="Prayer Focus"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Prayer Focus Mode</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                5 Minutes
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Entering {prayerName} Namaz · Disconnect from worldly noise & connect with Allah
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Exit Focus Mode"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center: 5-Minute Timer & Tasbih */}
      <div className="relative z-10 max-w-md w-full mx-auto my-auto flex flex-col items-center text-center space-y-6">
        {/* Circular Timer Gauge */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="96"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="112"
              cy="112"
              r="96"
              stroke="#10B981"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 96}
              strokeDashoffset={2 * Math.PI * 96 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          <div className="absolute flex flex-col items-center justify-center">
            <div className="text-5xl font-mono-numbers font-bold text-slate-100 tracking-tight">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <span className="text-xs text-emerald-400 font-medium mt-1">
              {secondsLeft === 0 ? 'Focus Completed' : 'Mindful Prayer Window'}
            </span>
          </div>
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 flex items-center gap-2 transition-colors"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'Pause' : 'Resume'}</span>
          </button>
          <button
            onClick={() => {
              setSecondsLeft(300);
              setIsRunning(true);
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Reset to 5:00"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Digital Interactive Tasbih Card */}
        <div className="w-full bg-[#111e19] border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Dhikr Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl">
            {dhikrs.map((d, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveDhikrIndex(idx);
                  setTasbihCount(0);
                }}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-medium transition-colors ${
                  activeDhikrIndex === idx
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.translit}
              </button>
            ))}
          </div>

          <div className="space-y-1">
            <div className="font-arabic text-2xl text-emerald-300 font-bold" dir="rtl">
              {currentDhikr.arabic}
            </div>
            <div className="text-xs font-bengali text-slate-300">
              {currentDhikr.bn}
            </div>
          </div>

          {/* Interactive Tap Button */}
          <button
            onClick={handleTasbihTap}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-lg shadow-lg shadow-emerald-900/40 active:scale-98 transition-transform flex items-center justify-center gap-3 cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-emerald-200" />
            <span>Tap Tasbih: {tasbihCount}</span>
            <span className="text-xs font-normal opacity-80">(Target: 33)</span>
          </button>
        </div>

        {/* Tranquility Quranic Dua */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center space-y-1 max-w-md">
          <p className="font-arabic text-sm text-emerald-300" dir="rtl">
            رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِن ذُرِّيَّتِي ۚ رَبَّنَا وَتَقَبَّلْ دُعَاءِ
          </p>
          <p className="font-bengali text-xs text-slate-300 italic">
            "হে আমার রব! আমাকে সালাত কায়েমকারী করুন এবং আমার সন্তানদের মধ্য থেকেও। হে আমাদের রব! আমার দোয়া কবুল করুন।"
          </p>
          <span className="text-[10px] text-emerald-400 font-semibold block pt-1">
            — সূরা ইব্রাহিম : ৪০
          </span>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md w-full mx-auto pt-4">
        <button
          onClick={handleComplete}
          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Mark {prayerName} as Prayed & Exit</span>
        </button>
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
        >
          Exit Focus Mode
        </button>
      </div>
    </div>
  );
};
