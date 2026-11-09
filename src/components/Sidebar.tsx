import React from 'react';
import {
  LayoutDashboard,
  Clock,
  Moon,
  CheckSquare,
  Sparkles,
  BookOpen,
  MapPin,
  Activity,
  Settings,
  Info,
  Sun,
  Laptop,
  Minimize2,
  X
} from 'lucide-react';
import { NavSection, ThemeMode, LocationInfo } from '../types/prayer';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
  location: LocationInfo;
  onOpenMiniWidget: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  theme,
  onChangeTheme,
  location,
  onOpenMiniWidget,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const navItems: { id: NavSection; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'times', label: 'Prayer Times', icon: Clock },
    { id: 'tahajjud', label: 'Tahajjud', icon: Moon },
    { id: 'tracker', label: 'Prayer Tracker', icon: CheckSquare },
    { id: 'quotes', label: 'Daily Quotes', icon: Sparkles },
    { id: 'quran', label: 'Quran Reading', icon: BookOpen },
    { id: 'location', label: 'Location', icon: MapPin },
    { id: 'providers', label: 'Provider Health', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'about', label: 'About', icon: Info }
  ];

  const handleNavClick = (id: NavSection) => {
    onSelectSection(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-950/95 dark:bg-[#101A17] border-r border-slate-800 dark:border-white/10 flex flex-col justify-between transition-transform duration-200 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand Header */}
        <div>
          <div className="p-5 border-b border-slate-800 dark:border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Sujud under Crescent Moon Icon */}
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#152820] to-[#08100C] border border-emerald-500/40 p-1 flex items-center justify-center relative shadow-sm overflow-hidden">
                <img
                  src="/icons/app-logo.png"
                  alt="Prayer Focus"
                  className="w-full h-full object-contain"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-100 tracking-tight">Prayer Focus</span>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                    v2.2.23
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">Islamic Productivity</div>
              </div>
            </div>

            {/* Mobile close button */}
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-300 dark:text-emerald-400 border border-emerald-500/30 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: Theme Switcher & Mini Widget */}
        <div className="p-4 border-t border-slate-800 dark:border-white/10 space-y-3 bg-slate-950/60 dark:bg-black/20">
          {/* Active location summary */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="truncate flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{location.nameEn}</span>
            </span>
          </div>

          {/* Theme Selector (Dark / Light / System) */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 dark:bg-white/5 rounded-xl border border-slate-800 dark:border-white/10 text-[11px]">
            <button
              onClick={() => onChangeTheme('dark')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                theme === 'dark'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dark Mode"
            >
              <Moon className="w-3 h-3" />
              <span>Dark</span>
            </button>
            <button
              onClick={() => onChangeTheme('light')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                theme === 'light'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3 h-3" />
              <span>Light</span>
            </button>
            <button
              onClick={() => onChangeTheme('system')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors ${
                theme === 'system'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="System Mode"
            >
              <Laptop className="w-3 h-3" />
              <span>Auto</span>
            </button>
          </div>

          {/* Mini Widget Popout */}
          <button
            onClick={onOpenMiniWidget}
            className="w-full py-2 px-3 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Open Mini Popup</span>
          </button>
        </div>
      </aside>
    </>
  );
};
