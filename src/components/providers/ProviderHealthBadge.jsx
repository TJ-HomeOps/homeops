import React from 'react';

const healthConfig = {
  Healthy: { dot: 'bg-emerald-400', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Healthy' },
  Warning: { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Warning' },
  Error: { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Error' },
  Unknown: { dot: 'bg-gray-400', text: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Unknown' },
};

export default function ProviderHealthBadge({ health }) {
  const cfg = healthConfig[health] || healthConfig.Unknown;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}