import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Search as SearchIcon, ScrollText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/shared/EmptyState';
import moment from 'moment';

const SEVERITIES = ['Info', 'Warning', 'Error', 'Critical'];
const SEVERITY_STYLES = {
  Info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  Warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Error: 'bg-red-500/15 text-red-400 border-red-500/30',
  Critical: 'bg-red-500/20 text-red-400 border-red-500/40',
};

export default function OperationsLog() {
  const [events, setEvents] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providerFilter, setProviderFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [assetFilter, setAssetFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    Promise.all([
      base44.entities.InfrastructureEvent.list('-timestamp', 500),
      base44.entities.InfrastructureProvider.list()
    ]).then(([e, p]) => {
      setEvents(e);
      setProviders(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const assetsWithEvents = [...new Set(events.map(e => e.asset).filter(Boolean))];

  const filtered = events.filter(e => {
    if (providerFilter !== 'all' && e.provider !== providerFilter) return false;
    if (severityFilter !== 'all' && e.severity !== severityFilter) return false;
    if (assetFilter !== 'all' && e.asset !== assetFilter) return false;
    if (dateFilter && !moment(e.timestamp).isSame(dateFilter, 'day')) return false;
    if (search) {
      const q = search.toLowerCase();
      const text = `${e.description} ${e.event_type} ${e.asset_name} ${e.provider_name} ${e.change_type}`.toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const clearFilters = () => {
    setProviderFilter('all'); setSeverityFilter('all');
    setAssetFilter('all'); setDateFilter(''); setSearch('');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3 max-w-6xl">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Operations Log</h1>
        <p className="text-xs text-muted-foreground">{events.length} infrastructure events recorded</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="h-8 text-xs bg-card border-border pl-7"
          />
        </div>
        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="h-8 w-40 text-xs bg-card border-border">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="all" className="text-xs">All Providers</SelectItem>
            {providers.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="h-8 w-32 text-xs bg-card border-border">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="all" className="text-xs">All Severities</SelectItem>
            {SEVERITIES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={assetFilter} onValueChange={setAssetFilter}>
          <SelectTrigger className="h-8 w-40 text-xs bg-card border-border">
            <SelectValue placeholder="Asset" />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="all" className="text-xs">All Assets</SelectItem>
            {assetsWithEvents.map(aid => {
              const evt = events.find(e => e.asset === aid);
              return <SelectItem key={aid} value={aid} className="text-xs">{evt?.asset_name || aid}</SelectItem>;
            })}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-8 w-36 text-xs bg-card border-border"
        />
        {(providerFilter !== 'all' || severityFilter !== 'all' || assetFilter !== 'all' || dateFilter || search) && (
          <Button onClick={clearFilters} variant="ghost" size="sm" className="h-8 text-xs">Clear</Button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No events found"
          description={events.length === 0 ? "Infrastructure events will appear here after synchronization." : "No events match your filters."}
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-xs min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Time</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Severity</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Provider</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Asset</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{moment(e.timestamp).format('MMM D, HH:mm:ss')}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${SEVERITY_STYLES[e.severity] || ''}`}>
                      {e.severity}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{e.provider_name || '—'}</td>
                  <td className="px-3 py-2 text-foreground">{e.asset_name || '—'}</td>
                  <td className="px-3 py-2 text-foreground">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}