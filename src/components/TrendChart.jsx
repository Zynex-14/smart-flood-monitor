import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend
} from 'recharts';
import { Activity, Filter } from 'lucide-react';
import { THRESHOLDS, evaluateWaterLevel } from '../utils/statusUtils';
import StatusBadge from './StatusBadge';

export default function TrendChart({ readings = [] }) {
  const [selectedDevice, setSelectedDevice] = useState('ALL');

  // Extract unique device IDs
  const deviceList = Array.from(new Set(readings.map((r) => r.device_id))).sort();

  // Prepare chart data chronologically
  const chartData = readings
    .filter((r) => selectedDevice === 'ALL' || r.device_id === selectedDevice)
    .map((r) => {
      const evalRes = evaluateWaterLevel(r.water_level_m);
      const dateObj = new Date(r.recorded_at);
      return {
        id: r.reading_id,
        device_id: r.device_id,
        location: r.location,
        recorded_at: r.recorded_at,
        timeLabel: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateLabel: dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        waterLevel: evalRes.isMissing || evalRes.isImplausible ? null : evalRes.value,
        rawStatus: r.status,
        statusKey: evalRes.statusKey,
        isImplausible: evalRes.isImplausible,
        isMissing: evalRes.isMissing
      };
    })
    .sort((a, b) => new Date(a.recorded_at) - new Date(b.recorded_at));

  // Custom Control Room Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700/90 rounded-xl p-3.5 shadow-2xl space-y-2 text-xs backdrop-blur-md">
          <div className="flex items-center justify-between space-x-3 border-b border-slate-800 pb-2">
            <span className="font-mono font-bold text-cyan-400">{data.id}</span>
            <StatusBadge status={data.statusKey} size="sm" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-slate-200">{data.location}</p>
            <p className="font-mono text-[11px] text-slate-400">Node: {data.device_id}</p>
          </div>
          <div className="flex items-baseline justify-between pt-1 font-mono">
            <span className="text-slate-400">Water Level:</span>
            <span className="text-base font-bold text-slate-100">
              {data.waterLevel !== null ? `${data.waterLevel.toFixed(2)} m` : 'No Data'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono pt-1">
            {data.dateLabel} at {data.timeLabel}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-xl p-5 space-y-4">
      
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Water Level Telemetry Hydrograph
            </h3>
            <p className="text-xs text-slate-400">
              Real-time water level trends vs Warning (1.50m) and Danger (2.50m) alert thresholds
            </p>
          </div>
        </div>

        {/* Device Filter Dropdown */}
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="ALL">All Sensor Nodes ({deviceList.length})</option>
            {deviceList.map((dev) => (
              <option key={dev} value={dev}>
                Sensor {dev}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="timeLabel"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              domain={[0, 4]}
              unit="m"
            />

            <Tooltip content={<CustomTooltip />} />

            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => <span className="text-slate-300 font-medium">{value}</span>}
            />

            {/* Threshold Reference Lines */}
            <ReferenceLine
              y={THRESHOLDS.WARNING}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Warning Threshold (1.50m)',
                fill: '#f59e0b',
                fontSize: 10,
                position: 'top',
                fontFamily: 'monospace'
              }}
            />

            <ReferenceLine
              y={THRESHOLDS.DANGER}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: 'Danger Threshold (2.50m)',
                fill: '#ef4444',
                fontSize: 10,
                position: 'top',
                fontFamily: 'monospace'
              }}
            />

            <Area
              type="monotone"
              dataKey="waterLevel"
              name="Water Level (m)"
              stroke="#06b6d4"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorWater)"
              dot={{ fill: '#06b6d4', r: 3, strokeWidth: 1, stroke: '#0891b2' }}
              activeDot={{ r: 6, fill: '#38bdf8', stroke: '#0284c7', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
