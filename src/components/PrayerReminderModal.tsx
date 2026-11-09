import React, { useEffect, useState } from 'react';
import {
  Moon,
  Clock,
  Sparkles,
  CheckCircle2,
  BellRing,
  X,
  Hourglass,
  Maximize2
} from 'lucide-react';
import { IslamicQuote } from '../types/prayer';
import { format12HourTime } from '../utils/tahajjudHelper';
import { ISLAMIC_QUOTES } from '../data/quotes';
import { startLoopingChime } from '../utils/soundHelper';

interface PrayerReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerName: string;
  prayerNameBn?: string;
  startTime: string;
  endTime: string;
  quote?: IslamicQuote;
  onPrayed: () => void;
  onRemindLater: () => void;
}

export const PrayerReminderModal: React.FC<PrayerReminderModalProps> = ({
  isOpen,
  onClose,
  prayerName,
  prayerNameBn,
  startTime,
  endTime,
  quote: initialQuote,
  onPrayed,
  onRemindLater
}) => {
  const [randomQuote, setRandomQuote] = useState<IslamicQuote>(() => {
    return initialQuote || ISLAMIC_QUOTES[Math.floor(Math.random() * ISLAMIC_QUOTES.length)];
  });

  // Pick a fresh random quote and start audio loop on modal open
  useEffect(() => {
    if (!isOpen) return;

    // Pick random quote from 60+ quote dataset
    const freshQuote = ISLAMIC_QUOTES[Math.floor(Math.random() * ISLAMIC_QUOTES.length)];
    setRandomQuote(freshQuote);

    // Loop adhan chime audio until user clicks Prayed or Pray Later
    const stopAudio = startLoopingChime();

    return () => {
      stopAudio();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayQuote = randomQuote || initialQuote || ISLAMIC_QUOTES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e1714] border border-emerald-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="p-6 pb-4 border-b border-emerald-500/20 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-[#0d1814] rounded-[14px] flex items-center justify-center">
                <BellRing className="w-6 h-6 text-emerald-400 animate-bounce" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Adhan & Waqt Alert
                </span>
                <span className="text-xs text-slate-400 font-mono-numbers">
                  {format12HourTime(startTime)} – {format12HourTime(endTime)}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight mt-0.5">
                It's {prayerName} Namaz Time!
              </h2>
              {prayerNameBn && (
                <p className="text-xs text-emerald-400/90 font-bengali">
                  এখন {prayerNameBn} সালাতের ওয়াক্ত
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bengali Wisdom Quote Section */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/25 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Daily Islamic Wisdom</span>
              </span>
              <span className="text-[11px] text-slate-400 font-bengali">
                — {displayQuote.reference}
              </span>
            </div>

            {displayQuote.arabic && (
              <p className="font-arabic text-sm text-emerald-200 text-right dir-rtl leading-relaxed" dir="rtl">
                {displayQuote.arabic}
              </p>
            )}

            <blockquote className="font-bengali text-xs sm:text-sm text-slate-100 leading-relaxed font-medium italic border-l-2 border-emerald-500 pl-3">
              "{displayQuote.bengali}"
            </blockquote>
          </div>

          {/* Action Options */}
          <div className="space-y-2 pt-2">
            {/* Option 1: Prayed */}
            <button
              onClick={onPrayed}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Prayed (সালাত আদায় করেছি)</span>
            </button>

            {/* Option 2: Pray Later & Remind in 10 min */}
            <button
              onClick={onRemindLater}
              className="w-full py-3 px-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Hourglass className="w-4 h-4 text-amber-400" />
              <span>Pray later (Remind me in 10 minutes)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
