import React from 'react';
import { Bell, Send, Zap, Webhook, Workflow } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const FEATURES = [
  { label: 'Alerts', icon: Bell },
  { label: 'Notifications', icon: Send },
  { label: 'Automation Rules', icon: Zap },
  { label: 'Webhooks', icon: Webhook },
  { label: 'Event Actions', icon: Workflow },
];

export default function FutureFeatures() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {FEATURES.map(({ label, icon: Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-md border border-border bg-accent/20 opacity-50 cursor-not-allowed">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{label}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Available in a future Voyage.</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}