import React from 'react';
import { Database, TrendingUp, AlertOctagon, AlertTriangle } from 'lucide-react';
import { evaluateWaterLevel } from '../utils/statusUtils';

export default function SummaryCards({ readings = [] }) {

  // Calculate statistics accurately handling null and implausible data
  const totalRecords = readings.length;

  let highestReading = null;
  let dangerCount = 0;
  let warningCount = 0;

  readings.forEach((item) => {
    const evalResult = evaluateWaterLevel(item.water_level_m);

    // Track highest valid water level
    if (!evalResult.isMissing && !evalResult.isImplausible) {
      if (!highestReading || evalResult.value > highestReading.water_level_m) {
        highestReading = item;
      }
    }

    // Count danger and warning statuses
    if (item.status === 'danger' || evalResult.statusKey === 'danger') {
      dangerCount++;
    } else if (item.status === 'warning' || evalResult.statusKey === 'warning') {
      warningCount++;
    }
  });

  const cards = [
    {
      id: 'total',
      label: 'Total Telemetry Records',
      value: totalRecords,
      subtext: 'Ingested sensor payloads',
      icon: Database,
      borderClass: 'border-l-cyan-500',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      valueColor: 'text-cyan-400',
    },
    {
      id: 'highest',
      label: 'Highest Water Level',
      value: highestReading ? `${highestReading.water_level_m.toFixed(2)} m` : 'N/A',
      subtext: highestReading ? `${highestReading.location} (${highestReading.device_id})` : 'No valid readings',
      icon: TrendingUp,
      borderClass: 'border-l-blue-500',
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      valueColor: 'text-blue-400',
    },
    {
      id: 'danger',
      label: 'Danger Alerts',
      value: dangerCount,
      subtext: 'Critical flood risk zones (≥ 2.5m)',
      icon: AlertOctagon,
      borderClass: 'border-l-red-500',
      iconBg: 'bg-red-500/10 text-red-400 border-red-500/30',
      valueColor: 'text-red-400',
    },
    {
      id: 'warning',
      label: 'Warning Alerts',
      value: warningCount,
      subtext: 'Elevated water levels (≥ 1.5m)',
      icon: AlertTriangle,
      borderClass: 'border-l-amber-500',
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      valueColor: 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className={`glass-panel glass-panel-hover rounded-xl p-5 border-l-4 ${card.borderClass} flex flex-col justify-between space-y-4`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.label}
                </p>
                <div className={`text-3xl font-extrabold font-mono mt-1 ${card.valueColor}`}>
                  {card.value}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${card.iconBg}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
            <div className="border-t border-slate-800/80 pt-3">
              <p className="text-xs text-slate-400 truncate" title={card.subtext}>
                {card.subtext}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
