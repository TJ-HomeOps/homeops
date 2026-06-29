import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity } from 'lucide-react';
import moment from 'moment';
import StatusBadge from '@/components/shared/StatusBadge';

const SEVERITY_STYLES = {
  Info: 'text-sky-400',
  Warning: 'text-amber-400',
  Error: 'text-red-400',
  Critical: 'text-red-400',
};

export default function AssetHistory({ assetId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.InfrastructureEvent.filter({ asset: assetId }, '-timestamp', 50)
      .then(setEvents).catch(() => {})
      .finally(() => setLoading(false));
  }, [assetId]);

  if (loading) return <div className="text-xs text-muted-foreground text-center py-6">Loading history...</div>;
  if (events.length === 0) return <div className="text-xs text-muted-foreground text-center py-6">No history recorded</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[700px]">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-1.5 font-medium text-muted-foreground">Timestamp</th>
            <th className="text-left py-1.5 font-medium text-muted-foreground">Change</th>
            <th className="text-left py-1.5 font-medium text-muted-foreground">Old Value</th>
            <th className="text-left py-1.5 font-medium text-muted-foreground">New Value</th>
            <th className="text-left py-1.5 font-medium text-muted-foreground">Provider</th>
            <th className="text-left py-1.5 font-medium text-muted-foreground">Severity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {events.map((e) => (
            <tr key={e.id} className="hover:bg-accent/30">
              <td className="py-1.5 text-muted-foreground whitespace-nowrap">{moment(e.timestamp).format('MMM D, HH:mm:ss')}</td>
              <td className="py-1.5 text-foreground">{e.change_type || e.event_type}</td>
              <td className="py-1.5 text-muted-foreground font-mono">{e.old_value || '—'}</td>
              <td className="py-1.5 text-foreground font-mono">{e.new_value || '—'}</td>
              <td className="py-1.5 text-muted-foreground">{e.provider_name || '—'}</td>
              <td className={`py-1.5 font-medium ${SEVERITY_STYLES[e.severity] || 'text-muted-foreground'}`}>{e.severity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}