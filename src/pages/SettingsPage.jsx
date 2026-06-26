import React from 'react';
import { Settings } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

export default function SettingsPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-lg font-semibold text-foreground mb-1">Settings</h1>
      <p className="text-xs text-muted-foreground mb-8">Platform configuration and integrations</p>
      <EmptyState
        icon={Settings}
        title="Settings coming soon"
        description="Configure integrations with Proxmox, Docker, Authentik, and more in a future sprint."
      />
    </div>
  );
}