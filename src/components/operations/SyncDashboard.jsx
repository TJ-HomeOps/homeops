import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle, XCircle, GitBranch, Clock, Loader2, Cloud } from 'lucide-react';
import moment from 'moment';
import { isSyncOverdue, getNextSyncTime } from '@/lib/syncEngine';

function SyncTile({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-card px-3 py-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Icon className="w-2.5 h-2.5" /> {label}
      </div>
      <div className={`text-lg font-semibold ${color}`}>{value}</div>
    </div>
  );
}

export default function SyncDashboard({ providers, events }) {
  const autoSyncProviders = providers.filter(p => p.sync_mode && p.sync_mode !== 'Disabled');
  const overdue = providers.filter(p => isSyncOverdue(p));
  const today = new Date().setHours(0, 0, 0, 0);
  const todaysEvents = events.filter(e => new Date(e.timestamp).getTime() >= today);
  const successToday = todaysEvents.filter(e => e.event_type === 'Sync Finished').length;
  const failedToday = todaysEvents.filter(e => e.event_type === 'Sync Failed').length;
  const changesToday = todaysEvents.filter(e => e.event_type === 'Change Detected').length;
  const newestEvent = events[0];

  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-ops-cyan" />
          <h2 className="text-xs font-semibold text-foreground">Synchronization</h2>
        </div>
        <Link to="/operations-log" className="text-[11px] text-primary hover:underline">View Log</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
        <SyncTile icon={Cloud} label="Providers" value={providers.length} color="text-foreground" />
        <SyncTile icon={Loader2} label="Auto-Sync" value={autoSyncProviders.length} color="text-ops-cyan" />
        <SyncTile icon={Clock} label="Pending" value={overdue.length} color={overdue.length > 0 ? 'text-amber-400' : 'text-foreground'} />
        <SyncTile icon={CheckCircle} label="Success Today" value={successToday} color="text-emerald-400" />
        <SyncTile icon={XCircle} label="Failed Today" value={failedToday} color={failedToday > 0 ? 'text-red-400' : 'text-foreground'} />
        <SyncTile icon={GitBranch} label="Changes Today" value={changesToday} color={changesToday > 0 ? 'text-amber-400' : 'text-foreground'} />
      </div>
      {newestEvent && (
        <div className="px-3 py-2 border-t border-border flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            newestEvent.severity === 'Error' ? 'bg-red-500/15 text-red-400' :
            newestEvent.severity === 'Warning' ? 'bg-amber-500/15 text-amber-400' :
            'bg-sky-500/15 text-sky-400'
          }`}>{newestEvent.severity}</span>
          <span className="text-xs text-foreground truncate flex-1">{newestEvent.description}</span>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap">{moment(newestEvent.timestamp).fromNow()}</span>
        </div>
      )}
    </div>
  );
}