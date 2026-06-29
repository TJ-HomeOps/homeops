import React from 'react';
import { Camera, Database, Activity, Monitor, BarChart3, Lock } from 'lucide-react';

const placeholders = [
  { label: 'Snapshots', icon: Camera },
  { label: 'Backups', icon: Database },
  { label: 'Performance', icon: Activity },
  { label: 'Console', icon: Monitor },
  { label: 'Graphs', icon: BarChart3 },
];

export default function FutureIntegrations() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {placeholders.map(({ label, icon: Icon }) => (
        <div key={label} className="bg-accent/20 border border-dashed border-border rounded-lg px-2.5 py-2">
          <div className="flex items-center justify-between mb-1">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider flex items-center gap-0.5">
              <Lock className="w-2 h-2" /> Soon
            </span>
          </div>
          <div className="text-xs font-medium text-muted-foreground/50">—</div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}