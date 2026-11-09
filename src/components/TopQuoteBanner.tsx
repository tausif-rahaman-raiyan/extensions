import React, { useState } from 'react';
import { Sparkles, Copy, Check, Clock, RefreshCw, Bookmark, BookmarkCheck } from 'lucide-react';
import { IslamicQuote } from '../types/prayer';

interface TopQuoteBannerProps {
  quote: IslamicQuote;
  onNextQuote: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  currentTime: Date;
}

export const TopQuoteBanner: React.FC<TopQuoteBannerProps> = ({
  quote,
  onNextQuote,
  isBookmarked,
  onToggleBookmark,
  currentTime
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `${quote.arabic ? `${quote.arabic}\n\n` : ''}${quote.bengali}\n\n— ${quote.reference}${quote.narratorBn ? ` (${quote.narratorBn})` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Minutes remaining until next hourly quote change
  const minutesUntilNextHour = 60 - currentTime.getMinutes();

  return (
    <aside aria-label="Daily Islamic Wisdom" className="w-full bg-gradient-to-r from-emerald-950/70 via-slate-900 to-emerald-950/70 border-b border-emerald-500/30 px-4 sm:px-8 py-3.5 shadow-lg relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-islamic-pattern opacity-25 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 relative z-10">
        {/* Left: Badge & Hourly indicator */}
        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Islamic Wisdom</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono-numbers">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Rotates hourly ({minutesUntilNextHour}m left)</span>
          </div>
        </div>

        {/* Center: Arabic & Pure Bengali Hadith Text */}
        <div className="flex-1 text-center md:px-6 space-y-1">
          {quote.arabic && (
            <p className="font-arabic text-base sm:text-lg text-emerald-300/90 leading-tight dir-rtl" dir="rtl">
              {quote.arabic}
            </p>
          )}
          <p className="font-bengali text-sm sm:text-base text-slate-100 font-medium leading-snug">
            "{quote.bengali}"
          </p>
          <div className="font-bengali text-xs text-emerald-400/90 font-semibold">
            — {quote.reference} {quote.narratorBn ? `· ${quote.narratorBn}` : ''}
          </div>
        </div>

        {/* Right: Actions (Copy, Bookmark, Next) */}
        <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
          <button
            onClick={() => onToggleBookmark(quote.id)}
            title={isBookmarked ? 'Bookmarked' : 'Bookmark this quote'}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <button
            onClick={handleCopy}
            title="Copy quote"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={onNextQuote}
            title="Next wisdom quote"
            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
