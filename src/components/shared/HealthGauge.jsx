import React from 'react';
import { healthColor, healthLabel } from '@/lib/healthCalculator';

export default function HealthGauge({ health, size = 'md' }) {
  const dims = size === 'lg' ? { r: 36, s: 88, stroke: 7, font: 'text-2xl', sub: 'text-[10px]' }
    : { r: 28, s: 70, stroke: 6, font: 'text-xl', sub: 'text-[9px]' };
  const circumference = 2 * Math.PI * dims.r;
  const offset = circumference - (health / 100) * circumference;
  const color = healthColor(health);

  return (
    <div className="relative shrink-0" style={{ width: dims.s, height: dims.s }}>
      <svg width={dims.s} height={dims.s} className="-rotate-90">
        <circle cx={dims.s / 2} cy={dims.s / 2} r={dims.r} fill="none" stroke="hsl(var(--border))" strokeWidth={dims.stroke} />
        <circle cx={dims.s / 2} cy={dims.s / 2} r={dims.r} fill="none" stroke={color} strokeWidth={dims.stroke}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold ${dims.font}`} style={{ color }}>{health}%</span>
        <span className={`${dims.sub} text-muted-foreground`}>{healthLabel(health)}</span>
      </div>
    </div>
  );
}