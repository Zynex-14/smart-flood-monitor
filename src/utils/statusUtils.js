import { ShieldCheck, AlertTriangle, AlertOctagon, HelpCircle, Activity } from 'lucide-react';

/**
 * Flood Monitoring System Thresholds (in meters)
 */
export const THRESHOLDS = {
  WARNING: 1.5,
  DANGER: 2.5,
  MIN_PLAUSIBLE: 0.0,
  MAX_PLAUSIBLE: 10.0,
};

/**
 * Shared Status Configuration Matrix
 */
export const STATUS_CONFIG = {
  safe: {
    key: 'safe',
    label: 'Safe',
    color: '#22c55e',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]',
    borderClass: 'border-l-emerald-500',
    cardBg: 'hover:border-emerald-500/40',
    icon: ShieldCheck,
    description: 'Water level is within safe operating parameters (< 1.50m).'
  },
  warning: {
    key: 'warning',
    label: 'Warning',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
    borderClass: 'border-l-amber-500',
    cardBg: 'hover:border-amber-500/40',
    icon: AlertTriangle,
    description: 'Elevated water level approaching alert threshold (≥ 1.50m).'
  },
  danger: {
    key: 'danger',
    label: 'Danger',
    color: '#ef4444',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    dotClass: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.7)] animate-pulse',
    borderClass: 'border-l-red-500',
    cardBg: 'hover:border-red-500/40',
    icon: AlertOctagon,
    description: 'Critical flood risk level detected (≥ 2.50m). Immediate action advised!'
  },
  no_data: {
    key: 'no_data',
    label: 'No Data',
    color: '#64748b',
    badgeClass: 'bg-slate-700/40 text-slate-400 border-slate-600/50',
    dotClass: 'bg-slate-500',
    borderClass: 'border-l-slate-500',
    cardBg: 'hover:border-slate-600',
    icon: HelpCircle,
    description: 'Telemetry reading missing or unreadable.'
  },
  anomaly: {
    key: 'anomaly',
    label: 'Anomaly',
    color: '#f59e0b',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-mono',
    dotClass: 'bg-amber-400 animate-pulse',
    borderClass: 'border-l-amber-400',
    cardBg: 'hover:border-amber-400',
    icon: Activity,
    description: 'Implausible reading detected (negative level or extreme spike).'
  },
  unknown: {
    key: 'unknown',
    label: 'No Data / Anomaly',
    color: '#64748b',
    badgeClass: 'bg-slate-700/40 text-slate-400 border-slate-600/50',
    dotClass: 'bg-slate-500',
    borderClass: 'border-l-slate-500',
    cardBg: 'hover:border-slate-600',
    icon: HelpCircle,
    description: 'Telemetry missing or reading outside plausible sensor range.'
  }
};

/**
 * Evaluates raw telemetry values for missing or implausible data
 * @param {number|null} val - water level in meters
 * @returns {object} formatted evaluation object
 */
export function evaluateWaterLevel(val) {
  if (val === null || val === undefined) {
    return {
      formatted: 'No Data',
      isMissing: true,
      isImplausible: false,
      value: null,
      statusKey: 'no_data',
      reason: 'Sensor reading not available'
    };
  }

  const num = Number(val);

  if (isNaN(num)) {
    return {
      formatted: 'No Data',
      isMissing: true,
      isImplausible: false,
      value: null,
      statusKey: 'no_data',
      reason: 'Invalid data format'
    };
  }

  // Check for implausible sensor values (negative or extremely high)
  if (num < THRESHOLDS.MIN_PLAUSIBLE) {
    return {
      formatted: `${num.toFixed(2)} m`,
      isMissing: false,
      isImplausible: true,
      value: num,
      statusKey: 'anomaly',
      reason: `Negative water level (${num.toFixed(2)}m) - Sensor transducer fault`
    };
  }

  if (num > THRESHOLDS.MAX_PLAUSIBLE) {
    return {
      formatted: `${num.toFixed(2)} m`,
      isMissing: false,
      isImplausible: true,
      value: num,
      statusKey: 'anomaly',
      reason: `Out-of-range water level (${num.toFixed(2)}m > 10m limit) - Telemetry spike`
    };
  }

  // Derive status key from water level if valid
  let derivedStatus = 'safe';
  if (num >= THRESHOLDS.DANGER) {
    derivedStatus = 'danger';
  } else if (num >= THRESHOLDS.WARNING) {
    derivedStatus = 'warning';
  }

  return {
    formatted: `${num.toFixed(2)} m`,
    isMissing: false,
    isImplausible: false,
    value: num,
    statusKey: derivedStatus,
    reason: null
  };
}

/**
 * Format ISO datetime strings for display
 */
export function formatDate(isoString) {
  if (!isoString) return 'N/A';
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return isoString;
  }
}
