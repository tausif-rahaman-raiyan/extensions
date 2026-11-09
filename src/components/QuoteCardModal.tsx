import React, { useState } from 'react';
import { X, Copy, Check, Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';
import { IslamicQuote } from '../types/prayer';

interface QuoteCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: IslamicQuote;
  isBookmarked: boolean;
  onToggleBookmark: (quoteId: string) => void;
}

export const QuoteCardModal: React.FC<QuoteCardModalProps> = ({
  isOpen,
  onClose,
  quote,
  isBookmarked,
  onToggleBookmark
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = `${quote.arabic ? `${quote.arabic}\n\n` : ''}${quote.bengali}\n\n— ${quote.reference}${quote.narratorBn ? ` (${quote.narratorBn})` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <h3 className="text-sm font-bold text-slate-100">Islamic Wisdom Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shareable Card Canvas Preview */}
        <div className="p-6">
          <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-xl overflow-hidden text-center">
            <div className="absolute inset-0 bg-islamic-pattern opacity-40 pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="inline-block text-[11px] font-semibold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                {quote.categoryEn}
              </div>

              {quote.arabic && (
                <p className="font-arabic text-xl sm:text-2xl text-emerald-300/90 leading-relaxed dir-rtl" dir="rtl">
                  {quote.arabic}
                </p>
              )}

              <blockquote className="font-bengali text-base sm:text-lg text-slate-100 leading-relaxed font-medium">
                "{quote.bengali}"
              </blockquote>

              <div className="pt-2 border-t border-slate-800/80 flex flex-col items-center justify-center text-xs text-slate-400 space-y-0.5">
                <span className="font-bengali font-semibold text-emerald-400">{quote.reference}</span>
                {quote.narratorBn && <span className="font-bengali">বর্ণনাকারী: {quote.narratorBn}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => onToggleBookmark(quote.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors border ${
              isBookmarked
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-300'
                : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {isBookmarked ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Bookmarked</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>Bookmark</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Quote Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
