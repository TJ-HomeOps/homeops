import React from 'react';
import { Network } from 'lucide-react';

export default function Topology() {
  return (
    <div className="space-y-3 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Infrastructure Topology</h1>
        <p className="text-xs text-muted-foreground">Visualize your entire infrastructure graph</p>
      </div>

      <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-12 h-12 rounded-lg bg-ops-cyan/10 flex items-center justify-center mb-3">
          <Network className="w-6 h-6 text-ops-cyan" />
        </div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Coming in a Future Voyage</h2>
        <p className="text-xs text-muted-foreground max-w-md">
          This feature will automatically visualize your entire infrastructure in a future Voyage.
          Nodes, virtual machines, containers, and network relationships will be displayed as an
          interactive topology graph.
        </p>
        <div className="mt-4 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-400">
          Placeholder — No implementation yet
        </div>
      </div>
    </div>
  );
}