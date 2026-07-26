import React from 'react';
import { STATUS_CONFIG, evaluateWaterLevel } from '../utils/statusUtils';

export default function FilterPanel({ statusFilter, setStatusFilter, readings = [] }) {

  // Calculate live count per status category
  const counts = {
    all: readings.length,
    safe: 0,
    warning: 0,
    danger: 0
  };

  readings.forEach((r) => {
    const evalRes = evaluateWaterLevel(r.water_level_m);
    const effectiveStatus = (r.status === 'unknown' || evalRes.isImplausible || evalRes.isMissing) 
      ? evalRes.statusKey 
      : r.status;

    if (counts[effectiveStatus] !== undefined) {
      counts[effectiveStatus]++;
    }
  });

  const filterOptions = [
    { key: 'all', label: 'All Records', color: 'cyan', count: counts.all },
    { key: 'safe', label: STATUS_CONFIG.safe.label, color: 'emerald', count: counts.safe },
    { key: 'warning', label: STATUS_CONFIG.warning.label, color: 'amber', count: counts.warning },
    { key: 'danger', label: STATUS_CONFIG.danger.label, color: 'red', count: counts.danger },
  ];

  const activeStyles = {
    all: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.25)]',
    safe: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(34,197,94,0.25)]',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    danger: 'bg-red-500/20 text-red-300 border-red-400 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.25)]',
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filterOptions.map((opt) => {
        const isSelected = statusFilter === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => setStatusFilter(opt.key)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
              isSelected
                ? activeStyles[opt.key]
                : 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            <span>{opt.label}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isSelected
                  ? 'bg-slate-950/60 text-slate-100'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {opt.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
