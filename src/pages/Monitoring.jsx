import React from 'react';
import { Activity } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

export default function Monitoring() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-lg font-semibold text-foreground mb-1">Monitoring</h1>
      <p className="text-xs text-muted-foreground mb-8">Infrastructure monitoring and alerting</p>
      <EmptyState
        icon={Activity}
        title="Monitoring coming soon"
        description="This module will integrate with Proxmox, Docker, and other monitoring systems in a future sprint."
      />
    </div>
  );
}