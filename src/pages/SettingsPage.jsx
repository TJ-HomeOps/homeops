import React, { useState } from 'react';
import { Settings, Info, Cloud, HardDrive, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';

export default function SettingsPage() {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
          <p className="text-xs text-muted-foreground">Platform configuration and integrations</p>
        </div>
        <Button onClick={() => setAboutOpen(true)} variant="outline" size="sm" className="h-8 text-xs border-border">
          <Info className="w-3.5 h-3.5 mr-1.5" /> About
        </Button>
      </div>

      {/* Infrastructure Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded bg-ops-cyan/15 flex items-center justify-center">
              <Cloud className="w-3.5 h-3.5 text-ops-cyan" />
            </div>
            <h3 className="text-xs font-semibold text-foreground">Providers</h3>
          </div>
          <p className="text-[11px] text-muted-foreground">Manage infrastructure provider connections. Proxmox VE is operational.</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded bg-emerald-500/15 flex items-center justify-center">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <h3 className="text-xs font-semibold text-foreground">Node Discovery</h3>
          </div>
          <p className="text-[11px] text-muted-foreground">Automatically discover and monitor cluster nodes after synchronization.</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded bg-sky-500/15 flex items-center justify-center">
              <Server className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <h3 className="text-xs font-semibold text-foreground">Infrastructure Discovery</h3>
          </div>
          <p className="text-[11px] text-muted-foreground">Discover VMs and LXC containers. Assets are created or updated without duplicates.</p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center text-center">
        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </div>
        <h2 className="text-sm font-semibold text-foreground mb-1">Full Settings Coming Soon</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          Detailed platform configuration, user management, and integration settings will be available in a future Voyage.
        </p>
      </div>

      {/* About Dialog */}
      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-ops-cyan flex items-center justify-center">
                <Server className="w-4 h-4 text-navy-900" />
              </div>
              HomeOps
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Version</span>
              <span className="text-foreground font-medium">Voyage 3</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Codename</span>
              <span className="text-foreground font-medium">Harbor Master</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tagline</span>
              <span className="text-foreground font-medium">Infrastructure Operations Platform</span>
            </div>
            <div className="pt-2 border-t border-border">
              <p className="text-[11px] text-muted-foreground italic">
                Built for operators who'd rather manage infrastructure than browser tabs.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}