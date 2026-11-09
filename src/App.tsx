/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  LocationInfo,
  PrayerTimes,
  ProviderId,
  ProviderHealth,
  IslamicQuote,
  JuristicMethod,
  CalculationMethod,
  ThemeMode,
  NotificationSettings,
  NavSection,
  ManualPrayerOverrides
} from './types/prayer';
import { DEFAULT_LOCATION } from './data/locations';
import { getHourlyQuote, ISLAMIC_QUOTES } from './data/quotes';
import { PrayerService } from './services/prayerApi';
import { calculateAstronomicalTimes } from './services/astronomicalCalculator';
import { FullDashboard } from './components/FullDashboard';
import { MiniWidget } from './components/MiniWidget';
import { ProviderModal } from './components/ProviderModal';
import { LocationModal } from './components/LocationModal';
import { QuoteCardModal } from './components/QuoteCardModal';
import { CalendarModal } from './components/CalendarModal';

export default function App() {
  // 1. Clock state (single interval ticker)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // 2. Active Section Navigation
  const [activeSection, setActiveSection] = useState<NavSection>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const h = window.location.hash.replace('#', '') as NavSection;
      if (['overview', 'times', 'tahajjud', 'tracker', 'quotes', 'quran', 'location', 'providers', 'settings', 'about'].includes(h)) {
        return h;
      }
    }
    return 'overview';
  });

  // Manual Prayer Overrides state (persisted)
  const [manualOverrides, setManualOverrides] = useState<ManualPrayerOverrides>(() => {
    try {
      const saved = localStorage.getItem('prayer_focus_manual_overrides');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: false,
      fajr: '',
      sunrise: '',
      dhuhr: '',
      asr: '',
      maghrib: '',
      isha: '',
      tahajjudStart: ''
    };
  });

  // 3. Location state (persisted)
  const [location, setLocation] = useState<LocationInfo>(() => {
    try {
      const saved = localStorage.getItem('prayer_focus_location');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LOCATION; // Chattogram (22.3569, 91.7832)
  });

  // 4. Provider settings
  const [preferredProvider, setPreferredProvider] = useState<ProviderId>(() => {
    const saved = localStorage.getItem('prayer_focus_provider') as string;
    if (saved === 'sitp') return 'muslimsalat';
    if (saved && ['aladhan', 'muslimsalat', 'islamicfinder', 'waktusolat', 'astronomical'].includes(saved)) {
      return saved as ProviderId;
    }
    return 'aladhan';
  });

  const [juristic, setJuristic] = useState<JuristicMethod>(() => {
    return (localStorage.getItem('prayer_focus_juristic') as JuristicMethod) || 'hanafi';
  });

  const [calcMethod, setCalcMethod] = useState<CalculationMethod>(() => {
    return (localStorage.getItem('prayer_focus_calcmethod') as CalculationMethod) || 'karachi';
  });

  // 5. Theme State (Dark / Light / System)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('prayer_focus_theme') as ThemeMode) || 'dark';
  });

  // 6. Notification Settings
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('prayer_focus_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      fajr: true,
      dhuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      tahajjud: true,
      advanceMinutes: 10,
      soundEnabled: true
    };
  });

  // 7. View Mode: Full Dashboard vs Mini Popup Widget (100% synchronized)
  const [viewMode, setViewMode] = useState<'full' | 'mini'>(() => {
    return (localStorage.getItem('prayer_focus_viewmode') as 'full' | 'mini') || 'full';
  });

  // 8. Prayer times state with local instant fallback
  const initialTimes = calculateAstronomicalTimes(
    new Date(),
    location.lat,
    location.lng,
    6,
    juristic
  );
  const [times, setTimes] = useState<PrayerTimes>(initialTimes);
  const [usedProvider, setUsedProvider] = useState<ProviderId>(preferredProvider);
  const [providerStatus, setProviderStatus] = useState<Record<ProviderId, ProviderHealth>>(
    PrayerService.getProviderHealth()
  );

  // 9. Completed prayers tracker (persisted daily)
  const todayKey = new Date().toISOString().split('T')[0];
  const [completedPrayers, setCompletedPrayers] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`prayer_focus_completed_${todayKey}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });

  // 10. Hourly Bengali Wisdom Quote (Rotates every 1 hour)
  const [hourlyQuote, setHourlyQuote] = useState<IslamicQuote>(() => getHourlyQuote());
  const [quoteRotationOffset, setQuoteRotationOffset] = useState<number>(0);

  // 11. Bookmarks
  const [bookmarkedQuotes, setBookmarkedQuotes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('prayer_focus_bookmarks');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return ['tirmidhi-413'];
  });

  // 12. Modals
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [quoteCardModalOpen, setQuoteCardModalOpen] = useState(false);
  const [activeQuoteForCard, setActiveQuoteForCard] = useState<IslamicQuote>(hourlyQuote);

  const prevDateRef = useRef(todayKey);
  const prevHourRef = useRef(new Date().getHours());

  // Clock tick & hourly quote rotation check
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Hourly quote rotation check
      if (now.getHours() !== prevHourRef.current) {
        prevHourRef.current = now.getHours();
        setHourlyQuote(getHourlyQuote(now));
      }

      // Midnight date check
      const currentDayKey = now.toISOString().split('T')[0];
      if (currentDayKey !== prevDateRef.current) {
        prevDateRef.current = currentDayKey;
        setCompletedPrayers({});
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Theme synchronization with document element
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = true;
      if (theme === 'dark') isDark = true;
      else if (theme === 'light') isDark = false;
      else if (theme === 'system') isDark = mediaQuery.matches;

      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Fetch prayer timings with cascading 5-provider fallback and 502 recovery
  const loadPrayerTimes = useCallback(async () => {
    try {
      const result = await PrayerService.getPrayerTimes(
        new Date(),
        location,
        preferredProvider,
        juristic,
        calcMethod,
        manualOverrides
      );
      setTimes(result.times);
      setUsedProvider(result.usedProvider);
      setProviderStatus(result.providerStatus);
    } catch (err) {
      console.warn('[Prayer Focus] Fallback directly to astronomical engine:', err);
      const fallbackTimes = calculateAstronomicalTimes(
        new Date(),
        location.lat,
        location.lng,
        6,
        juristic
      );
      const finalTimes = PrayerService.applyManualOverrides(fallbackTimes, manualOverrides);
      setTimes(finalTimes);
      setUsedProvider('astronomical');
    }
  }, [location, preferredProvider, juristic, calcMethod, manualOverrides]);

  useEffect(() => {
    loadPrayerTimes();
  }, [loadPrayerTimes]);

  const handleSaveManualOverrides = (updated: ManualPrayerOverrides) => {
    setManualOverrides(updated);
    try {
      localStorage.setItem('prayer_focus_manual_overrides', JSON.stringify(updated));
    } catch (e) {}
  };

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem('prayer_focus_location', JSON.stringify(location));
    } catch (e) {}
  }, [location]);

  useEffect(() => {
    try {
      localStorage.setItem('prayer_focus_provider', preferredProvider);
      localStorage.setItem('prayer_focus_juristic', juristic);
      localStorage.setItem('prayer_focus_calcmethod', calcMethod);
      localStorage.setItem('prayer_focus_theme', theme);
      localStorage.setItem('prayer_focus_notifications', JSON.stringify(notifications));
      localStorage.setItem('prayer_focus_viewmode', viewMode);
      localStorage.setItem('prayer_focus_bookmarks', JSON.stringify(bookmarkedQuotes));
    } catch (e) {}
  }, [preferredProvider, juristic, calcMethod, theme, notifications, viewMode, bookmarkedQuotes]);

  const handleTogglePrayer = (prayerKey: string) => {
    setCompletedPrayers((prev) => {
      const updated = { ...prev, [prayerKey]: !prev[prayerKey] };
      try {
        localStorage.setItem(`prayer_focus_completed_${todayKey}`, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleResetToday = () => {
    setCompletedPrayers({});
    try {
      localStorage.setItem(`prayer_focus_completed_${todayKey}`, JSON.stringify({}));
    } catch (e) {}
  };

  const handleToggleBookmark = (quoteId: string) => {
    setBookmarkedQuotes((prev) => {
      const isAlready = prev.includes(quoteId);
      const updated = isAlready ? prev.filter((id) => id !== quoteId) : [...prev, quoteId];
      return updated;
    });
  };

  const handleNextHourlyQuote = () => {
    setQuoteRotationOffset((prev) => {
      const nextOffset = prev + 1;
      const base = getHourlyQuote();
      const currentIdx = ISLAMIC_QUOTES.findIndex((q) => q.id === base.id);
      const nextIdx = (currentIdx + nextOffset) % ISLAMIC_QUOTES.length;
      setHourlyQuote(ISLAMIC_QUOTES[nextIdx]);
      return nextOffset;
    });
  };

  const handleOpenQuoteCard = (quote: IslamicQuote) => {
    setActiveQuoteForCard(quote);
    setQuoteCardModalOpen(true);
  };

  return (
    <div className="w-full">
      {viewMode === 'full' ? (
        <FullDashboard
          times={times}
          location={location}
          currentProvider={usedProvider}
          providerStatus={providerStatus}
          completedPrayers={completedPrayers}
          onTogglePrayer={handleTogglePrayer}
          onResetToday={handleResetToday}
          hourlyQuote={hourlyQuote}
          onNextQuote={handleNextHourlyQuote}
          bookmarkedQuotes={bookmarkedQuotes}
          onToggleBookmark={handleToggleBookmark}
          onOpenMiniWidget={() => setViewMode('mini')}
          onOpenLocationModal={() => setLocationModalOpen(true)}
          onOpenProviderModal={() => setProviderModalOpen(true)}
          onOpenCalendarModal={() => setCalendarModalOpen(true)}
          onOpenQuoteCard={handleOpenQuoteCard}
          currentTime={currentTime}
          juristic={juristic}
          calcMethod={calcMethod}
          onChangeJuristic={(j) => {
            setJuristic(j);
            loadPrayerTimes();
          }}
          onChangeCalcMethod={(m) => {
            setCalcMethod(m);
            loadPrayerTimes();
          }}
          onChangeProvider={(p) => {
            setPreferredProvider(p);
            loadPrayerTimes();
          }}
          onRefreshTimes={loadPrayerTimes}
          onSelectLocation={(loc) => {
            setLocation(loc);
            loadPrayerTimes();
          }}
          theme={theme}
          onChangeTheme={setTheme}
          notifications={notifications}
          onChangeNotifications={setNotifications}
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          manualOverrides={manualOverrides}
          onSaveManualOverrides={handleSaveManualOverrides}
        />
      ) : (
        <div className="min-h-screen bg-[var(--bg-canvas)] flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm space-y-3">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] px-1">
              <span>Prayer Focus Mini Widget</span>
              <button
                onClick={() => setViewMode('full')}
                className="text-emerald-400 hover:underline font-semibold"
              >
                Expand to Full Dashboard →
              </button>
            </div>

            <MiniWidget
              times={times}
              location={location}
              currentProvider={usedProvider}
              providerStatus={providerStatus}
              completedPrayers={completedPrayers}
              onTogglePrayer={handleTogglePrayer}
              hourlyQuote={hourlyQuote}
              onNextQuote={handleNextHourlyQuote}
              isBookmarked={bookmarkedQuotes.includes(hourlyQuote.id)}
              onToggleBookmark={handleToggleBookmark}
              onOpenFullDashboard={() => setViewMode('full')}
              onOpenSettings={() => {
                setViewMode('full');
                setActiveSection('settings');
              }}
              onOpenLocationModal={() => setLocationModalOpen(true)}
              onOpenProviderModal={() => setProviderModalOpen(true)}
              currentTime={currentTime}
            />
          </div>
        </div>
      )}

      {/* Modals */}
      <ProviderModal
        isOpen={providerModalOpen}
        onClose={() => setProviderModalOpen(false)}
        currentProvider={preferredProvider}
        onSelectProvider={(p) => {
          setPreferredProvider(p);
          loadPrayerTimes();
        }}
        juristic={juristic}
        onChangeJuristic={(j) => {
          setJuristic(j);
          loadPrayerTimes();
        }}
        calcMethod={calcMethod}
        onChangeCalcMethod={(m) => {
          setCalcMethod(m);
          loadPrayerTimes();
        }}
        providerHealth={providerStatus}
        onRefreshHealth={() => setProviderStatus(PrayerService.getProviderHealth())}
        location={location}
      />

      <LocationModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        currentLocation={location}
        onSelectLocation={(loc) => {
          setLocation(loc);
          loadPrayerTimes();
        }}
      />

      <CalendarModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        location={location}
        juristic={juristic}
      />

      <QuoteCardModal
        isOpen={quoteCardModalOpen}
        onClose={() => setQuoteCardModalOpen(false)}
        quote={activeQuoteForCard}
        isBookmarked={bookmarkedQuotes.includes(activeQuoteForCard.id)}
        onToggleBookmark={handleToggleBookmark}
      />
    </div>
  );
}
