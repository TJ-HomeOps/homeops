import React from 'react';
import { Ship, CheckCircle, Rocket, Server, Activity, Anchor } from 'lucide-react';

const VOYAGES = [
  {
    num: 1,
    name: 'Foundation',
    status: 'Completed',
    icon: Anchor,
    description: 'Core platform built — assets, cases, projects, documentation, runbooks, and the Operations Center established.',
    highlights: ['Asset inventory', 'Case management', 'Project tracking', 'Documentation & Runbooks', 'Operations Center dashboard'],
  },
  {
    num: 2,
    name: 'Infrastructure Awareness',
    status: 'Completed',
    icon: Server,
    description: 'Deep infrastructure awareness with provider-specific metadata, health calculations, and operational metrics.',
    highlights: ['VMID & Node tracking', 'Power state monitoring', 'Health scoring', 'Cluster status overview', 'Enhanced asset details'],
  },
  {
    num: 3,
    name: 'Infrastructure Providers',
    status: 'Completed',
    icon: Activity,
    description: 'Native Proxmox VE integration with connection testing, automated resource discovery, and node synchronization.',
    highlights: ['Proxmox VE API integration', 'Provider connection wizard', 'Automated node discovery', 'Infrastructure resource discovery', 'Future operations roadmap'],
  },
  {
    num: 4,
    name: 'Living Infrastructure',
    status: 'Current',
    icon: Rocket,
    description: 'HomeOps becomes continuously aware — automatic synchronization, change detection, infrastructure events, and operational intelligence.',
    highlights: ['Automatic synchronization', 'Change detection & events', 'Operations log', 'Asset history', 'Archived assets', 'Asset relationships', 'Synchronization dashboard', 'Improved provider health'],
  },
];

export default function ShipLog() {
  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Ship className="w-5 h-5 text-ops-cyan" /> Ship Log
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Official project history — a record of every Voyage.</p>
      </div>

      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-4">
          {VOYAGES.map((v) => {
            const Icon = v.icon;
            const isCurrent = v.status === 'Current';
            return (
              <div key={v.num} className="relative">
                <div className={`absolute -left-4 w-4 h-4 rounded-full ring-2 ring-card flex items-center justify-center ${
                  isCurrent ? 'bg-ops-cyan' : 'bg-emerald-500'
                }`}>
                  {isCurrent ? <Rocket className="w-2 h-2 text-navy-900" /> : <CheckCircle className="w-2 h-2 text-navy-900" />}
                </div>
                <div className={`bg-card border rounded-lg p-4 ${isCurrent ? 'border-ops-cyan/30' : 'border-border'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${isCurrent ? 'text-ops-cyan' : 'text-muted-foreground'}`} />
                    <h2 className="text-sm font-semibold text-foreground">Voyage {v.num}: {v.name}</h2>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                      isCurrent
                        ? 'bg-ops-cyan/15 text-ops-cyan border-ops-cyan/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {v.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{v.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {v.highlights.map(h => (
                      <span key={h} className="px-1.5 py-0.5 rounded bg-accent/50 text-[10px] text-muted-foreground border border-border">{h}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}