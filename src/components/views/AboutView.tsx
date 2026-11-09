import React from 'react';
import { Download, ShieldCheck, Zap, Globe, Sparkles, Moon, ExternalLink, Heart, CheckCircle2 } from 'lucide-react';
import { downloadExtensionZip } from '../../utils/extensionBundler';

interface AboutViewProps {
  onNotify?: (msg: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNotify }) => {
  const [downloading, setDownloading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadExtensionZip();
      onNotify?.('Chrome Extension package (ZIP) downloaded successfully!');
    } catch (err) {
      console.error(err);
      onNotify?.('Failed to generate ZIP package. You can also download the pre-packaged ZIP.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Hero Badge & Identity */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-[#13251e] via-[#101A17] to-[#0a120f] border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row items-center gap-6">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-emerald-900/40 p-1 ring-2 ring-emerald-500/30 shadow-xl flex items-center justify-center">
              <img
                src="/icons/icon128.png"
                alt="Prayer Focus Icon"
                className="w-20 h-20 object-contain drop-shadow-[0_0_12px_rgba(72,184,137,0.5)]"
                onError={(e) => {
                  // Fallback to inline SVG representation if image not loaded yet
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <Moon className="w-12 h-12 text-emerald-400 hidden group-has-[img[style*='display: none']]:block" />
            </div>
            <div className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold text-slate-950 uppercase tracking-widest shadow">
              v2.2.23
            </div>
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                Prayer Focus
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30">
                Manifest V3
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] max-w-xl leading-relaxed">
              Precision Islamic prayer timetable, start-to-limit waqt windows, manual clock overrides, in-page 5-min Focus Mode with digital Tasbih, and 65+ verified Bengali wisdom quotes.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Preparing ZIP...' : 'Download Extension (.zip)'}
            </button>
            <a
              href="/Prayer-Focus-v2.2.23-Fixed.zip"
              download="Prayer-Focus-v2.2.23-Fixed.zip"
              className="px-4 py-2.5 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Direct ZIP Link (v2.2.23)
            </a>
          </div>
        </div>
      </div>

      {/* Installation Guide */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-surface)] p-6">
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          How to Install in Google Chrome / Brave / Edge
        </h3>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <li className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--color-border)]">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-2">1</span>
            <strong className="block text-sm font-semibold text-[var(--color-text)] mb-1">Download & Unzip</strong>
            <p className="text-[var(--color-text-muted)]">Click the download button above to save <code className="text-emerald-400 font-mono text-[11px]">Prayer-Focus-v2.2.21-Fixed.zip</code>, then extract it to a local folder.</p>
          </li>
          <li className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--color-border)]">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-2">2</span>
            <strong className="block text-sm font-semibold text-[var(--color-text)] mb-1">Enable Developer Mode</strong>
            <p className="text-[var(--color-text-muted)]">Open <code className="text-emerald-400 font-mono text-[11px]">chrome://extensions</code> in your browser and toggle on <span className="text-[var(--color-text)] font-semibold">"Developer mode"</span> in the top-right corner.</p>
          </li>
          <li className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--color-border)]">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold mb-2">3</span>
            <strong className="block text-sm font-semibold text-[var(--color-text)] mb-1">Load Unpacked</strong>
            <p className="text-[var(--color-text-muted)]">Click <span className="text-[var(--color-text)] font-semibold">"Load unpacked"</span> and select the extracted folder. Pin the emerald crescent icon to your Chrome toolbar!</p>
          </li>
        </ol>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-surface)] flex gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 h-fit">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-text)] mb-1">5-Tier Resilient Provider Engine</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              SITP 502/504 Bad Gateway errors are caught instantly with automatic 5-minute cooldown. Fallback cascades to AlAdhan, IslamicFinder, WaktuSolat, and offline astronomical solar engine.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-surface)] flex gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 h-fit">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-text)] mb-1">Single-Flight Request Deduping</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Concurrent calls between popup, dashboard, and background workers are multiplexed onto one promise, stopping console spam and duplicate network requests.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-surface)] flex gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 h-fit">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-text)] mb-1">Hourly Rotating Bengali Wisdom</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Authentic Hadiths from Bukhari, Muslim, Tirmidhi, and Quranic verses in verified Bengali translations, rotating automatically every hour with live countdown.
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-surface)] flex gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 h-fit">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--color-text)] mb-1">Tahajjud & Midnight Calculator</h4>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Precise Islamic night division into three parts with live countdown to the last third of the night, regardless of day-crossing boundaries.
            </p>
          </div>
        </div>
      </div>

      {/* CI/CD & Build info */}
      <div className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--bg-surface)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)]">GitHub Actions Automated Release</h4>
            <p className="text-xs text-[var(--color-text-muted)]">Workflow configured at <code className="font-mono text-emerald-400 text-[11px]">.github/workflows/build-extension.yml</code></p>
          </div>
        </div>
        <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5">
          <span>Crafted with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>for the Ummah</span>
        </div>
      </div>
    </div>
  );
};
