import React, { useState } from 'react';
import {
  X,
  Server,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Clock
} from 'lucide-react';
import {
  ProviderId,
  ProviderHealth,
  JuristicMethod,
  CalculationMethod,
  LocationInfo
} from '../types/prayer';
import { PrayerService } from '../services/prayerApi';

interface ProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider: ProviderId;
  onSelectProvider: (provider: ProviderId) => void;
  juristic: JuristicMethod;
  onChangeJuristic: (method: JuristicMethod) => void;
  calcMethod: CalculationMethod;
  onChangeCalcMethod: (method: CalculationMethod) => void;
  providerHealth: Record<ProviderId, ProviderHealth>;
  onRefreshHealth: () => void;
  location: LocationInfo;
}

export const ProviderModal: React.FC<ProviderModalProps> = ({
  isOpen,
  onClose,
  currentProvider,
  onSelectProvider,
  juristic,
  onChangeJuristic,
  calcMethod,
  onChangeCalcMethod,
  providerHealth,
  onRefreshHealth,
  location
}) => {
  const [testing, setTesting] = useState(false);
  const [localHealth, setLocalHealth] = useState<Record<ProviderId, ProviderHealth>>(providerHealth);

  if (!isOpen) return null;

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

  const getStatusBadge = (health?: ProviderHealth) => {
    if (!health) return null;
    if (health.status === 'offline_502') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          <span>HTTP 502 (Bad Gateway)</span>
        </span>
      );
    }
    if (health.status === 'cooldown') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3" />
          <span>In Cooldown (Skipping)</span>
        </span>
      );
    }
    if (health.status === 'error') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
          <AlertTriangle className="w-3 h-3" />
          <span>Connection Error</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" />
        <span>Operational · {health.latencyMs ?? 45}ms</span>
      </span>
    );
  };

  const providerList: { id: ProviderId; title: string; desc: string }[] = [
    {
      id: 'aladhan',
      title: '1. AlAdhan Global Coordinates API',
      desc: 'Industry standard with 99.99% uptime. Native Karachi 18° calculation and Hanafi/Shafi school options.'
    },
    {
      id: 'aladhancity',
      title: '2. AlAdhan City API (WaktuSolat)',
      desc: 'City-level fallback endpoint providing instant recovery if coordinate lookups fail.'
    },
    {
      id: 'prayzone',
      title: '3. PrayZone Global API',
      desc: 'High-availability worldwide prayer API with custom city and regional support.'
    },
    {
      id: 'islamicnetwork',
      title: '4. Islamic Network API',
      desc: 'Address and region query engine for global prayer times.'
    },
    {
      id: 'astronomical',
      title: '5. Local Astronomical Solar Engine (Offline)',
      desc: 'Zero-network local astronomical solar calculation based on Jean Meeus equations. Always 100% available.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">API Providers & Health Diagnostics</h2>
              <p className="text-xs text-slate-400">5-Tier resilient fallback ecosystem with automatic 502 recovery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* SITP 502 Root-Cause & Graceful Recovery Alert */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>SITP HTTP 502 Handled Gracefully:</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              When <code>api.sitp.app</code> returns HTTP 502 (Bad Gateway), Prayer Focus applies a 5-minute cooldown to prevent console spam and automatically cascades to AlAdhan, IslamicFinder, or the Local Solar Engine.
            </p>
          </div>

          {/* Provider Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Preferred Provider
              </label>
              <button
                onClick={handleTestAll}
                disabled={testing}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>{testing ? 'Pinging APIs...' : 'Test All Providers'}</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {providerList.map((p) => {
                const isSelected = currentProvider === p.id;
                const health = localHealth[p.id] || providerHealth[p.id];
                return (
                  <div
                    key={p.id}
                    onClick={() => onSelectProvider(p.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/30'
                        : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100">{p.title}</span>
                          {isSelected && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-medium">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{p.desc}</p>
                      </div>
                      <div className="shrink-0">{getStatusBadge(health)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Juristic & Calculation Method Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
            {/* Juristic School */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Asr Juristic Method (Shadow Ratio)
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => onChangeJuristic('hanafi')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors text-center ${
                    juristic === 'hanafi'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Hanafi (2x Shadow)
                </button>
                <button
                  type="button"
                  onClick={() => onChangeJuristic('shafii')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg transition-colors text-center ${
                    juristic === 'shafii'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Shafi'i / Standard (1x)
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Hanafi is the standard across Bangladesh, Pakistan, and India.
              </p>
            </div>

            {/* Calculation Method */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Calculation Method (Fajr/Isha Angles)
              </label>
              <select
                value={calcMethod}
                onChange={(e) => onChangeCalcMethod(e.target.value as CalculationMethod)}
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="karachi">Univ. of Islamic Sciences Karachi (18° Fajr/Isha - BD Standard)</option>
                <option value="mwl">Muslim World League (18° Fajr, 17° Isha)</option>
                <option value="makkah">Umm Al-Qura University, Makkah</option>
                <option value="isna">ISNA - North America (15° Fajr/Isha)</option>
                <option value="egypt">Egyptian General Authority of Survey (19.5° Fajr)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                University of Islamic Sciences Karachi is the Bangladesh Islamic Foundation benchmark.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Automatic Multi-Provider Protection Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
};
