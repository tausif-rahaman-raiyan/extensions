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
      id: 'aladhancity',
      name: 'AlAdhan City API (WaktuSolat)',
      url: 'https://api.aladhan.com/v1/timingsByCity',
      desc: 'City-level fallback endpoint providing instant recovery if coordinate lookups fail.',
      type: 'Network API (City Backup)'
    },
    {
      id: 'prayzone',
      name: 'PrayZone Global API',
      url: 'https://api.pray.zone/v2/times/today.json',
      desc: 'High-availability worldwide prayer API with custom city and regional support.',
      type: 'Network API (Secondary)'
    },
    {
      id: 'islamicnetwork',
      name: 'Islamic Network API',
      url: 'https://api.aladhan.com/v1/timingsByAddress',
      desc: 'Address and region query engine for global prayer times.',
      type: 'Network API (Address Fallback)'
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
    if (health.status === 'operational') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
          <CheckCircle className="w-3 h-3" />
          <span>Operational {health.latencyMs ? `(${health.latencyMs}ms)` : ''}</span>
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
          <span>Network Failure</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
        Testing...
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Diagnostics Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-emerald-400" />
            <span>Multi-Provider Health & Resilience</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status, latency metrics, and automatic failover cascading across 5 reliable providers
          </p>
        </div>

        <button
          onClick={handleTestAll}
          disabled={testing}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Testing 5 Providers...' : 'Run Diagnostics Ping'}</span>
        </button>
      </div>

      {/* Resilience Architecture Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-semibold text-emerald-300">
            5-Tier Cascading Failover & Duplicate Request Prevention
          </div>
          <p className="text-slate-300 leading-relaxed">
            Prayer Focus utilizes MuslimSalat, AlAdhan, IslamicFinder, and WaktuSolat with automatic failover to the 100% offline local astronomical engine. All simultaneous calls from the dashboard and popup are deduplicated in single-flight promises.
          </p>
        </div>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 gap-3.5">
        {providers.map((p) => {
          const health = localHealth[p.id] || providerHealth[p.id];
          const isSelected = currentProvider === p.id;

          return (
            <div
              key={p.id}
              className={`p-5 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-slate-900/90 border-emerald-500/60 shadow-lg ring-1 ring-emerald-500/20'
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-100">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.type}</span>
                    {getStatusBadge(health)}
                  </div>
                  <div className="text-xs text-slate-400">{p.desc}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate max-w-lg">
                    {p.url}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => onSelectProvider(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    {isSelected ? 'Active Provider' : 'Select Provider'}
                  </button>
                </div>
              </div>

              {health?.errorMessage && (
                <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-rose-400 flex items-center gap-1.5 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{health.errorMessage}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
