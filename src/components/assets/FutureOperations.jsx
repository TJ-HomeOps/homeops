import React from 'react';
import {
  Box, Monitor, Play, Square, PowerOff, RotateCcw,
  Camera, Download, Copy, Terminal, Move
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const operations = [
  { label: 'Create LXC', icon: Box },
  { label: 'Create VM', icon: Monitor },
  { label: 'Start', icon: Play },
  { label: 'Stop', icon: Square },
  { label: 'Shutdown', icon: PowerOff },
  { label: 'Restart', icon: RotateCcw },
  { label: 'Snapshot', icon: Camera },
  { label: 'Restore', icon: Download },
  { label: 'Clone', icon: Copy },
  { label: 'Console', icon: Terminal },
  { label: 'Migrate', icon: Move },
];

export default function FutureOperations() {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex flex-wrap gap-1.5">
        {operations.map(({ label, icon: Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button
                disabled
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium border border-border bg-accent/20 text-muted-foreground/50 cursor-not-allowed"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">
              Available in a future Voyage.
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}