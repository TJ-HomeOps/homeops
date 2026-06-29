import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { HardDrive, Cpu, MemoryStick, Activity, Monitor, Box } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import moment from 'moment';

function UsageBar({ value, color }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const barColor = color || (pct >= 90 ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-emerald-400');
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-accent rounded-full overflow-hidden min-w-[60px]">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-muted-foreground font-mono w-9 text-right">{pct}%</span>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '—';
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}

export default function Nodes() {
  const [nodes, setNodes] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState('all');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [n, p] = await Promise.all([
      base44.entities.InfrastructureNode.list('-created_date'),
      base44.entities.InfrastructureProvider.list()
    ]);
    setNodes(n);
    setProviders(p);
    setLoading(false);
  };

  const providerMap = Object.fromEntries(providers.map(p => [p.id, p]));

  const filtered = nodes.filter(n => providerFilter === 'all' || n.provider === providerFilter);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Infrastructure Nodes</h1>
          <p className="text-xs text-muted-foreground">{nodes.length} nodes · {nodes.filter(n => n.status === 'Online').length} online</p>
        </div>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="h-8 w-48 text-xs bg-card border-border">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="all" className="text-xs">All Providers</SelectItem>
            {providers.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="No nodes discovered"
          description="Synchronize a Proxmox VE provider to discover infrastructure nodes."
          action={
            <Link to="/providers" className="text-xs text-ops-cyan hover:underline">Go to Providers →</Link>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Node</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Provider</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-32">CPU</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-32">Memory</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-32">Storage</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">VMs</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">LXCs</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Last Sync</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((n) => (
                <tr key={n.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground font-medium font-mono">{n.node_name}</span>
                    </div>
                    {n.cpu_count ? <span className="text-[10px] text-muted-foreground ml-5">{n.cpu_count} CPUs · {formatBytes(n.memory_total)} RAM · {formatBytes(n.storage_total)} Storage</span> : null}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {n.provider && providerMap[n.provider]
                      ? <Link to="/providers" className="text-ops-cyan hover:underline">{providerMap[n.provider].name}</Link>
                      : '—'}
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={n.status} /></td>
                  <td className="px-3 py-2"><UsageBar value={n.cpu_usage} /></td>
                  <td className="px-3 py-2"><UsageBar value={n.memory_usage} /></td>
                  <td className="px-3 py-2"><UsageBar value={n.storage_usage} /></td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Monitor className="w-3 h-3 text-muted-foreground" />
                      {n.running_vms || 0}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="inline-flex items-center gap-1 text-foreground">
                      <Box className="w-3 h-3 text-muted-foreground" />
                      {n.running_lxcs || 0}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">
                    {n.last_sync ? moment(n.last_sync).fromNow() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}