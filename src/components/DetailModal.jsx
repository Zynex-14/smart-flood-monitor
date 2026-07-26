import React, { useEffect } from 'react';
import { X, Cpu, MapPin, Clock, Hash, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import StatusBadge from './StatusBadge';
import { evaluateWaterLevel, formatDate, STATUS_CONFIG, THRESHOLDS } from '../utils/statusUtils';

export default function DetailModal({ reading, allReadings = [], onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!reading) return null;

  const evalResult = evaluateWaterLevel(reading.water_level_m);
  const effectiveStatus = (reading.status === 'unknown' || evalResult.isImplausible || evalResult.isMissing)
    ? evalResult.statusKey
    : reading.status;
  const config = STATUS_CONFIG[effectiveStatus] || STATUS_CONFIG.unknown;

  // Filter device historical readings for mini trend chart
  const deviceHistory = allReadings
    .filter((r) => r.device_id === reading.device_id)
    .map((r) => {
      const rEval = evaluateWaterLevel(r.water_level_m);
      return {
        ...r,
        formattedTime: new Date(r.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        validLevel: rEval.isMissing || rEval.isImplausible ? null : rEval.value
      };
    })
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden glass-panel">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700 font-mono text-sm">
              <Hash className="w-4 h-4 inline mr-1" />
              {reading.reading_id}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{reading.location}</h2>
              <p className="text-xs text-slate-400 font-mono">Node ID: {reading.device_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Prominent Status & Level Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="space-y-1">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Telemetry Assessment
              </span>
              <div>
                <StatusBadge status={effectiveStatus} size="lg" />
              </div>
              <p className="text-xs text-slate-400 pt-1">{config.description}</p>
            </div>

            <div className="space-y-1 sm:border-l sm:border-slate-800 sm:pl-4">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                Water Level Measurement
              </span>
              <div className="font-mono text-3xl font-extrabold text-slate-100">
                {evalResult.isMissing ? (
                  <span className="text-slate-500 italic text-xl font-normal">No Data</span>
                ) : (
                  evalResult.formatted
                )}
              </div>
              <p className="text-xs text-slate-400">
                Warning Threshold: <strong className="text-amber-400 font-mono">1.50m</strong> | Danger: <strong className="text-red-400 font-mono">2.50m</strong>
              </p>
            </div>
          </div>

          {/* Anomaly Diagnostic Banner if implausible or missing */}
          {(evalResult.isMissing || evalResult.isImplausible) && (
            <div className="flex items-start space-x-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-semibold block text-amber-200">
                  Sensor Telemetry Diagnostic Alert
                </strong>
                <p>{evalResult.reason}</p>
                <p className="text-[11px] text-amber-400/80">
                  System administrators have logged this reading for transducer recalibration.
                </p>
              </div>
            </div>
          )}

          {/* Field Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Monitoring Location</span>
              </div>
              <p className="font-semibold text-slate-200">{reading.location}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sensor Microcontroller</span>
              </div>
              <p className="font-mono font-semibold text-slate-200">{reading.device_id}</p>
            </div>

            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1 col-span-2">
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Telemetry Timestamp</span>
              </div>
              <p className="font-mono font-semibold text-slate-200">
                {formatDate(reading.recorded_at)} <span className="text-slate-500 font-normal">({reading.recorded_at})</span>
              </p>
            </div>
          </div>

          {/* Mini Device Hydrograph Trend */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Node Telemetry History ({reading.device_id})</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">{deviceHistory.length} historical points</span>
            </div>

            <div className="h-44 w-full bg-slate-950/70 p-2 rounded-xl border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deviceHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="formattedTime" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 4]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#f8fafc'
                    }}
                    formatter={(val) => [val ? `${val} m` : 'No Data', 'Water Level']}
                  />
                  <ReferenceLine y={THRESHOLDS.WARNING} stroke="#f59e0b" strokeDasharray="3 3" />
                  <ReferenceLine y={THRESHOLDS.DANGER} stroke="#ef4444" strokeDasharray="3 3" />
                  <Line
                    type="monotone"
                    dataKey="validLevel"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    dot={{ fill: '#06b6d4', r: 3 }}
                    activeDot={{ r: 5, fill: '#38bdf8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors border border-slate-700"
          >
            Close Modal
          </button>
        </div>

      </div>
    </div>
  );
}
