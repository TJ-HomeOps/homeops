import React from 'react';

const healthStyles = {
  Healthy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const healthDots = {
  Healthy: 'bg-emerald-400',
  Warning: 'bg-amber-400',
  Critical: 'bg-red-400',
};

export default function HealthBadge({ health }) {
  const style = healthStyles[health] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  const dot = healthDots[health] || 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {health || 'Unknown'}
    </span>
  );
}