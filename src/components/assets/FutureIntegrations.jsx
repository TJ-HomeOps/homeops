import React from 'react';
import { Cpu, MemoryStick, HardDrive, Camera, Database, Server, Monitor, Lock } from 'lucide-react';

const placeholders = [
  { label: 'CPU Usage', icon: Cpu, unit: '%' },
  { label: 'Memory', icon: MemoryStick, unit: 'GB' },
  { label: 'Storage', icon: HardDrive, unit: 'GB' },
  { label: 'Snapshots', icon: Camera, unit: '' },
  { label: 'Backups', icon: Database, unit: '' },
  { label: 'Node', icon: Server, unit: '' },
  { label: 'Console', icon: Monitor, unit: '' },
];

export default function FutureIntegrations() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {placeholders.map(({ label, icon: Icon, unit }) => (
        <div key={label} className="bg-accent/20 border border-dashed border-border rounded-lg px-2.5 py-2">
          <div className="flex items-center justify-between mb-1">
            <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider flex items-center gap-0.5">
              <Lock className="w-2 h-2" /> Proxmox
            </span>
          </div>
          <div className="text-xs font-medium text-muted-foreground/50">—</div>
          <div className="text-[10px] text-muted-foreground">{label}{unit ? ` (${unit})` : ''}</div>
        </div>
      ))}
    </div>
  );
}