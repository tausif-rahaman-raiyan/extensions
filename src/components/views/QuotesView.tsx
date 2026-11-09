import React, { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Share2,
  Clock,
  Search,
  Filter
} from 'lucide-react';
import { IslamicQuote } from '../../types/prayer';
import { ISLAMIC_QUOTES, QUOTE_CATEGORIES } from '../../data/quotes';

interface QuotesViewProps {
  hourlyQuote: IslamicQuote;
  bookmarkedQuotes: string[];
  onToggleBookmark: (quoteId: string) => void;
  onOpenQuoteCard: (quote: IslamicQuote) => void;
  currentTime: Date;
}

export const QuotesView: React.FC<QuotesViewProps> = ({
  hourlyQuote,
  bookmarkedQuotes,
  onToggleBookmark,
  onOpenQuoteCard,
  currentTime
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (quote: IslamicQuote) => {
    const text = `${quote.arabic ? `${quote.arabic}\n\n` : ''}${quote.bengali}\n\n— ${quote.reference}${quote.narratorBn ? ` (${quote.narratorBn})` : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedId(quote.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredQuotes = ISLAMIC_QUOTES.filter((q) => {
    if (selectedCategory !== 'all' && q.category !== selectedCategory) return false;
    if (searchTerm) {
      const match =
        q.bengali.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.categoryEn.toLowerCase().includes(searchTerm.toLowerCase());
      if (!match) return false;
    }
    return true;
  });

  const minutesUntilNextHour = 60 - currentTime.getMinutes();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            <span>Islamic Wisdom & Guidance (দৈনিক হিকমাহ)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authentic Hadiths and Quranic verses in Bengali with verified sources and Arabic text
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>Next hourly quote change in {minutesUntilNextHour}m</span>
        </div>
      </div>

      {/* Hourly Active Quote Spotlight */}
      <section className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 border border-emerald-500/30 shadow-xl overflow-hidden">
        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold">
              Current Hourly Quote
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400">{hourlyQuote.categoryEn}</span>
          </div>

          {hourlyQuote.arabic && (
            <p className="font-arabic text-xl sm:text-2xl text-emerald-300/90 leading-relaxed dir-rtl" dir="rtl">
              {hourlyQuote.arabic}
            </p>
          )}

          <blockquote className="font-bengali text-lg sm:text-xl text-slate-100 leading-relaxed font-medium">
            "{hourlyQuote.bengali}"
          </blockquote>

          <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="font-bengali font-semibold text-emerald-400">
              — {hourlyQuote.reference} {hourlyQuote.narratorBn ? `· ${hourlyQuote.narratorBn}` : ''}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleBookmark(hourlyQuote.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                {bookmarkedQuotes.includes(hourlyQuote.id) ? (
                  <>
                    <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-300">Bookmarked</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Bookmark</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleCopy(hourlyQuote)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                {copiedId === hourlyQuote.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onOpenQuoteCard(hourlyQuote)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Card Preview</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Hadith by keywords or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {QUOTE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Complete Quote List */}
      <div className="space-y-3">
        {filteredQuotes.map((q) => (
          <div
            key={q.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold">{q.categoryEn}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onToggleBookmark(q.id)}
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                >
                  {bookmarkedQuotes.includes(q.id) ? (
                    <BookmarkCheck className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleCopy(q)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {copiedId === q.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => onOpenQuoteCard(q)}
                  className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold"
                >
                  Preview Card
                </button>
              </div>
            </div>

            {q.arabic && (
              <p className="font-arabic text-base text-emerald-300/80 leading-relaxed dir-rtl text-right" dir="rtl">
                {q.arabic}
              </p>
            )}

            <blockquote className="font-bengali text-sm text-slate-200 leading-relaxed">
              "{q.bengali}"
            </blockquote>

            <div className="font-bengali text-xs text-slate-400 font-medium">
              — {q.reference} {q.narratorBn ? `(${q.narratorBn})` : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
