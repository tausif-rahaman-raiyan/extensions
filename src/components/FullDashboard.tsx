import React, { useState } from 'react';
import {
  Menu,
  Volume2,
  Minimize2,
  Calendar as CalendarIcon,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  BellRing
} from 'lucide-react';
import {
  PrayerTimes,
  LocationInfo,
  ProviderId,
  ProviderHealth,
  IslamicQuote,
  JuristicMethod,
  CalculationMethod,
  ThemeMode,
  NotificationSettings,
  NavSection,
  ManualPrayerOverrides,
  PrayerMinuteOffsets
} from '../types/prayer';
import { Sidebar } from './Sidebar';
import { TopQuoteBanner } from './TopQuoteBanner';
import { OverviewView } from './views/OverviewView';
import { PrayerTimesView } from './views/PrayerTimesView';
import { TahajjudView } from './views/TahajjudView';
import { TrackerView } from './views/TrackerView';
import { QuotesView } from './views/QuotesView';
import { QuranView } from './views/QuranView';
import { LocationView } from './views/LocationView';
import { ProviderHealthView } from './views/ProviderHealthView';
import { SettingsView } from './views/SettingsView';
import { AboutView } from './views/AboutView';
import { PrayerReminderModal } from './PrayerReminderModal';
import { FocusModeModal } from './FocusModeModal';
import { playIslamicChime } from '../utils/soundHelper';

export interface FullDashboardProps {
  times: PrayerTimes;
  location: LocationInfo;
  currentProvider: ProviderId;
  providerStatus: Record<ProviderId, ProviderHealth>;
  completedPrayers: Record<string, boolean>;
  onTogglePrayer: (prayerKey: string) => void;
  onResetToday: () => void;
  hourlyQuote: IslamicQuote;
  onNextQuote: () => void;
  bookmarkedQuotes: string[];
  onToggleBookmark: (quoteId: string) => void;
  onOpenMiniWidget: () => void;
  onOpenLocationModal: () => void;
  onOpenProviderModal: () => void;
  onOpenCalendarModal: () => void;
  onOpenQuoteCard: (quote: IslamicQuote) => void;
  currentTime: Date;
  juristic: JuristicMethod;
  calcMethod: CalculationMethod;
  onChangeJuristic: (method: JuristicMethod) => void;
  onChangeCalcMethod: (method: CalculationMethod) => void;
  onChangeProvider: (provider: ProviderId) => void;
  onRefreshTimes: () => Promise<void>;
  onSelectLocation: (loc: LocationInfo) => void;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  notifications: NotificationSettings;
  onChangeNotifications: (settings: NotificationSettings) => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  manualOverrides: ManualPrayerOverrides;
  onSaveManualOverrides: (overrides: ManualPrayerOverrides) => void;
  minuteOffsets: PrayerMinuteOffsets;
  onSaveMinuteOffsets: (offsets: PrayerMinuteOffsets) => void;
}

export const FullDashboard: React.FC<FullDashboardProps> = ({
  times,
  location,
  currentProvider,
  providerStatus,
  completedPrayers,
  onTogglePrayer,
  onResetToday,
  hourlyQuote,
  onNextQuote,
  bookmarkedQuotes,
  onToggleBookmark,
  onOpenMiniWidget,
  onOpenLocationModal,
  onOpenProviderModal,
  onOpenCalendarModal,
  onOpenQuoteCard,
  currentTime,
  juristic,
  calcMethod,
  onChangeJuristic,
  onChangeCalcMethod,
  onChangeProvider,
  onRefreshTimes,
  onSelectLocation,
  theme,
  onChangeTheme,
  notifications,
  onChangeNotifications,
  activeSection,
  onSelectSection,
  manualOverrides,
  onSaveManualOverrides,
  minuteOffsets,
  onSaveMinuteOffsets
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Prayer Arrival Reminder & 5-min Focus Mode Modal States
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [activeAlertWaqt, setActiveAlertWaqt] = useState({
    name: 'Dhuhr',
    nameBn: 'যোহর',
    key: 'dhuhr',
    start: times.dhuhr,
    end: times.asr
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handlePlaySound = () => {
    playIslamicChime();
    setSoundPlayed(true);
    showToast('Islamic Adhan chime tested successfully');
    setTimeout(() => setSoundPlayed(false), 2000);
  };

  const handleOpenReminderTest = (waqtName: string, start: string, end: string) => {
    const key = waqtName.toLowerCase();
    setActiveAlertWaqt({
      name: waqtName,
      nameBn: key === 'fajr' ? 'ফজর' : key === 'dhuhr' ? 'যোহর' : key === 'asr' ? 'আসর' : key === 'maghrib' ? 'মাগরিব' : 'এশা',
      key,
      start,
      end
    });
    setReminderModalOpen(true);
    playIslamicChime();
  };

  const handlePrayedAction = () => {
    onTogglePrayer(activeAlertWaqt.key);
    setReminderModalOpen(false);
    showToast(`Alhamdulillah! Marked ${activeAlertWaqt.name} prayer as completed.`);
  };

  const handleRemindLaterAction = () => {
    setReminderModalOpen(false);
    showToast(`Reminder snoozed for 10 minutes for ${activeAlertWaqt.name} Namaz.`);
  };

  const handleOpenFocusModeAction = () => {
    setReminderModalOpen(false);
    setFocusModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--color-text)] flex transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 10-Section Navigation Sidebar (Desktop sticky + Mobile slide-over) */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={onSelectSection}
        theme={theme}
        onChangeTheme={onChangeTheme}
        location={location}
        onOpenMiniWidget={onOpenMiniWidget}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Pinned Prominent Bengali Quote Banner at the very top */}
        <TopQuoteBanner
          quote={hourlyQuote}
          currentTime={currentTime}
          onNextQuote={onNextQuote}
          isBookmarked={bookmarkedQuotes.includes(hourlyQuote.id)}
          onToggleBookmark={onToggleBookmark}
        />

        {/* Global Action Header */}
        <header className="px-4 sm:px-8 py-3.5 border-b border-[var(--color-border)] bg-[var(--bg-surface)]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-400/90 hidden sm:inline">
                Prayer Focus
              </span>
              <span className="text-slate-500 hidden sm:inline">/</span>
              <h1 className="text-sm font-semibold capitalize text-[var(--color-text)]">
                {activeSection === 'times' ? 'Prayer Times' : activeSection}
              </h1>
            </div>
          </div>

          {/* Quick controls: Test Alert, Location, Sound, Mini Widget */}
          <div className="flex items-center gap-2 text-xs">
            {/* Prayer Arrival Alert Test Button */}
            <button
              onClick={() => handleOpenReminderTest('Dhuhr', times.dhuhr, times.asr)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium transition-colors cursor-pointer"
              title="Preview the interactive namaz arrival popup with Bengali wisdom and 5-min Focus Mode"
            >
              <BellRing className="w-3.5 h-3.5 text-emerald-400" />
              <span>Namaz Alert Preview</span>
            </button>

            {/* Quick Location badge */}
            <button
              onClick={onOpenLocationModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--bg-canvas)] hover:border-emerald-500/40 text-[var(--color-text-muted)] hover:text-emerald-400 transition-colors cursor-pointer"
              title="Change location"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-medium max-w-[120px] truncate">{location.nameEn}</span>
            </button>

            {/* Sound chime test */}
            <button
              onClick={handlePlaySound}
              className={`p-2 rounded-xl border border-[var(--color-border)] bg-[var(--bg-canvas)] hover:border-emerald-500/40 text-[var(--color-text-muted)] hover:text-emerald-400 transition-colors cursor-pointer ${
                soundPlayed ? 'text-emerald-400 border-emerald-500/50 scale-95' : ''
              }`}
              title="Test Islamic prayer reminder chime"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Mini Popup toggle */}
            <button
              onClick={onOpenMiniWidget}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium transition-colors cursor-pointer"
              title="Switch to Chrome extension mini popup preview"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Mini Popup</span>
            </button>
          </div>
        </header>

        {/* Dynamic Section Views */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {activeSection === 'overview' && (
            <OverviewView
              times={times}
              location={location}
              currentProvider={currentProvider}
              providerStatus={providerStatus}
              completedPrayers={completedPrayers}
              onTogglePrayer={onTogglePrayer}
              hourlyQuote={hourlyQuote}
              currentTime={currentTime}
              juristic={juristic}
              onNavigate={(s) => onSelectSection(s)}
              onPlaySound={handlePlaySound}
              soundPlayed={soundPlayed}
            />
          )}

          {activeSection === 'times' && (
            <PrayerTimesView
              times={times}
              location={location}
              currentProvider={currentProvider}
              providerStatus={providerStatus}
              completedPrayers={completedPrayers}
              onTogglePrayer={onTogglePrayer}
              onRefresh={onRefreshTimes}
              juristic={juristic}
              onOpenCalendarModal={onOpenCalendarModal}
            />
          )}

          {activeSection === 'tahajjud' && (
            <TahajjudView times={times} currentTime={currentTime} />
          )}

          {activeSection === 'tracker' && (
            <TrackerView
              times={times}
              location={location}
              completedPrayers={completedPrayers}
              onTogglePrayer={onTogglePrayer}
              onResetToday={onResetToday}
              juristic={juristic}
              onOpenCalendarModal={onOpenCalendarModal}
              onTestReminder={handleOpenReminderTest}
            />
          )}

          {activeSection === 'quotes' && (
            <QuotesView
              hourlyQuote={hourlyQuote}
              bookmarkedQuotes={bookmarkedQuotes}
              onToggleBookmark={onToggleBookmark}
              onOpenQuoteCard={onOpenQuoteCard}
              currentTime={currentTime}
            />
          )}

          {activeSection === 'quran' && <QuranView />}

          {activeSection === 'location' && (
            <LocationView
              currentLocation={location}
              onSelectLocation={(loc) => {
                onSelectLocation(loc);
                showToast(`Location updated to ${loc.nameEn}`);
              }}
            />
          )}

          {activeSection === 'providers' && (
            <ProviderHealthView
              currentProvider={currentProvider}
              onSelectProvider={(p) => {
                onChangeProvider(p);
                showToast(`Provider switched to ${p.toUpperCase()}`);
              }}
              providerHealth={providerStatus}
              onRefreshHealth={() => {
                onRefreshTimes();
                showToast('Diagnostic health check triggered for all 5 providers');
              }}
              location={location}
              juristic={juristic}
              calcMethod={calcMethod}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              theme={theme}
              onChangeTheme={onChangeTheme}
              juristic={juristic}
              onChangeJuristic={onChangeJuristic}
              calcMethod={calcMethod}
              onChangeCalcMethod={onChangeCalcMethod}
              currentProvider={currentProvider}
              onChangeProvider={onChangeProvider}
              location={location}
              onOpenLocationModal={onOpenLocationModal}
              notifications={notifications}
              onChangeNotifications={(n) => {
                onChangeNotifications(n);
                showToast('Notification settings saved');
              }}
              manualOverrides={manualOverrides}
              onSaveManualOverrides={(o) => {
                onSaveManualOverrides(o);
                showToast(o.enabled ? 'Manual prayer overrides applied' : 'Manual overrides disabled (using calculation)');
              }}
              minuteOffsets={minuteOffsets}
              onSaveMinuteOffsets={(offsets) => {
                onSaveMinuteOffsets(offsets);
                showToast('Minute steppers adjusted successfully');
              }}
              currentTimes={times}
            />
          )}

          {activeSection === 'about' && (
            <AboutView onNotify={showToast} />
          )}
        </main>
      </div>

      {/* Prayer Time Arrival Reminder Modal */}
      <PrayerReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        prayerName={activeAlertWaqt.name}
        prayerNameBn={activeAlertWaqt.nameBn}
        startTime={activeAlertWaqt.start}
        endTime={activeAlertWaqt.end}
        quote={hourlyQuote}
        onPrayed={handlePrayedAction}
        onRemindLater={handleRemindLaterAction}
      />

      {/* 5-Minute Fullscreen Focus Mode Modal */}
      <FocusModeModal
        isOpen={focusModalOpen}
        onClose={() => setFocusModalOpen(false)}
        prayerName={activeAlertWaqt.name}
        onMarkPrayed={() => {
          onTogglePrayer(activeAlertWaqt.key);
          showToast(`Alhamdulillah! Marked ${activeAlertWaqt.name} as prayed.`);
        }}
      />
    </div>
  );
};
