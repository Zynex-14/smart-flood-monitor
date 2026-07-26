import React from 'react';
import { STATUS_CONFIG } from '../utils/statusUtils';

export default function StatusBadge({ status, showIcon = true, size = 'md' }) {
  const config = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.unknown;
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-semibold gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm font-semibold gap-2'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all duration-150 ${config.badgeClass} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {showIcon && <IconComponent size={iconSizes[size] || 14} className="shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
