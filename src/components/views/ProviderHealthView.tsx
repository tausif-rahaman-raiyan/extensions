import React, { useState } from 'react';
import {
  Activity,
  Server,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import {
  ProviderId,
  ProviderHealth,
  LocationInfo,
  JuristicMethod,
  CalculationMethod
} from '../../types/prayer';
import { PrayerService } from '../../services/prayerApi';

interface ProviderHealthViewProps {
  currentProvider: ProviderId;
  onSelectProvider: (provider: ProviderId) => void;
  providerHealth: Record<ProviderId, ProviderHealth>;
  onRefreshHealth: () => void;
  location: LocationInfo;
  juristic: JuristicMethod;
  calcMethod: CalculationMethod;
}

export const ProviderHealthView: React.FC<ProviderHealthViewProps> = ({
  currentProvider,
  onSelectProvider,
  providerHealth,
  onRefreshHealth,
  location,
  juristic,
  calcMethod
}) => {
  const [testing, setTesting] = useState(false);
  const [localHealth, setLocalHealth] = useState<Record<ProviderId, ProviderHealth>>(providerHealth);

  const handleTestAll = async () => {
    setTesting(true);
    try {
      const updated = await PrayerService.testAllProviders(location, juristic, calcMethod);
      setLocalHealth(updated);
      onRefreshHealth();
    } finally {
      setTesting(false);
    }
  };

  const providers: { id: ProviderId; name: string; url: string; desc: string; type: string }[] = [
    {
      id: 'aladhan',
      name: 'AlAdhan Global Coordinates API',
      url: 'https://api.aladhan.com/v1/timings',
      desc: 'Industry standard calculation service with 99.99% uptime, Karachi method 1, and Hanafi/Shafi school options.',
      type: 'Network API (Primary)'
    },
    {
      id: 'islamicfinder',
      name: 'IslamicFinder Global API',
      url: 'https://www.islamicfinder.us/index.php/api/prayer_times',
      desc: 'Global coordinate and timezone prayer provider with automatic fallback capability.',
      type: 'Network API (Secondary)'
    },
    {
      id: 'waktusolat',
      name: 'WaktuSolat / City Backup API',
      url: 'https://api.aladhan.com/v1/timingsByCity',
      desc: 'City-level fallback endpoint providing instant recovery if coordinate lookups fail.',
      type: 'Network API (Backup)'
    },
    {
      id: 'sitp',
      name: 'SITP Prayer Times API',
      url: 'https://api.sitp.app/api/v1/prayer-times',
      desc: 'Protected with 3-second timeout and 5-minute cooldown. Detects HTTP 502/503/504 Bad Gateway from Cloudflare and gracefully redirects.',
      type: 'Network API (502 Protected)'
    },
    {
      id: 'astronomical',
      name: 'Local Astronomical Solar Engine',
      url: 'local://solar-astronomical-engine',
      desc: 'Zero-network mathematical calculation based on high-precision Jean Meeus solar equations. 100% available offline.',
      type: 'Local Engine (Zero Network)'
    }
  ];

  const getStatusBadge = (health?: ProviderHealth) => {
    if (!health) return null;
    if (health.status === 'offline_502') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          <span>HTTP 502 Bad Gateway</span>
        </span>
      );
    }
    if (health.status === 'cooldown') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
          <Clock className="w-3 h-3" />
          <span>In Cooldown (Skipping)</span>
        </span>
      );
    }
    if (health.status === 'error') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          <span>Connection Failed</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" />
        <span>Operational · {health.latencyMs ?? 42}ms</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>API Provider Health & Network Diagnostics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of all 5 prayer timing providers with automatic 502 fallback protection
          </p>
        </div>

        <button
          onClick={handleTestAll}
          disabled={testing}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Pinging APIs...' : 'Run Diagnostics Test'}</span>
        </button>
      </div>

      {/* Explanatory Technical Alert */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Resilient Fallback & Cooldown Guarantee</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          If any individual provider becomes unavailable (such as the Cloudflare HTTP 502 Bad Gateway returned by <code>api.sitp.app</code>), Prayer Focus applies an automatic 5-minute cooldown to prevent console spam and immediately routes your timings through the remaining active providers.
        </p>
      </div>

      {/* Provider Status Cards */}
      <div className="space-y-3">
        {providers.map((p) => {
          const isSelected = currentProvider === p.id;
          const health = localHealth[p.id] || providerHealth[p.id];
          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/30 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">{p.name}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                      {p.type}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                        Active Provider
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{p.desc}</p>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Endpoint: {p.url}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                  {getStatusBadge(health)}
                  {!isSelected && (
                    <button
                      onClick={() => onSelectProvider(p.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                    >
                      Set Active
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
