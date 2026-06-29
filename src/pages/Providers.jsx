import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { Cloud, Plus, RefreshCw, Search as SearchIcon, MoreVertical, Trash2, Edit3, Server, Loader2, Plug, Settings } from 'lucide-react';
import ProviderHealthBadge from '@/components/providers/ProviderHealthBadge';
import ProviderForm from '@/components/providers/ProviderForm';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/shared/StatusBadge';
import { logActivity } from '@/lib/activityLogger';
import { testProxmoxConnection } from '@/lib/proxmoxApi';
import { syncProvider } from '@/lib/syncEngine';
import ProviderSyncSettings from '@/components/providers/ProviderSyncSettings';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const PROVIDER_TYPES = ['Proxmox VE', 'Proxmox Backup Server', 'Docker', 'Authentik', 'Nginx Proxy Manager', 'Pi-hole', 'pfSense'];

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [actionProvider, setActionProvider] = useState(null);
  const [syncingProvider, setSyncingProvider] = useState(null);
  const [settingsProvider, setSettingsProvider] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setFormOpen(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const loadData = async () => {
    const [p, a] = await Promise.all([
      base44.entities.InfrastructureProvider.list('-created_date'),
      base44.entities.Asset.list()
    ]);
    setProviders(p);
    setAssets(a);
    setLoading(false);
  };

  const handleCreate = async (data) => {
    const provider = await base44.entities.InfrastructureProvider.create(data);
    await logActivity('Created Provider', 'Asset', provider.id, data.name, '', '');
    setFormOpen(false);
    loadData();
  };

  const handleDelete = async (provider) => {
    await logActivity('Deleted Provider', 'Asset', provider.id, provider.name, '', '');
    await base44.entities.InfrastructureProvider.delete(provider.id);
    setActionProvider(null);
    loadData();
  };

  const handleSync = async (provider) => {
    setBusy(true);
    setSyncingProvider(provider);
    setSyncResult(null);
    const result = await syncProvider(provider);
    setSyncResult(result);
    await logActivity('Synchronized Provider', 'Asset', provider.id, provider.name,
      result.success ? `Imported ${result.importedAssets}, Updated ${result.updatedAssets}, Archived ${result.archivedAssets}, ${result.changesDetected} changes` : `Failed: ${result.error}`, '');
    setBusy(false);
    loadData();
  };

  const handleSaveSyncSettings = async (data) => {
    await base44.entities.InfrastructureProvider.update(settingsProvider.id, data);
    setSettingsProvider(null);
    loadData();
  };

  const assetCount = (providerId) => assets.filter(a => a.provider === providerId).length;

  const filtered = providers.filter(p => typeFilter === 'all' || p.provider_type === typeFilter);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Infrastructure Providers</h1>
          <p className="text-xs text-muted-foreground">{providers.length} providers · {providers.filter(p => p.status === 'Connected').length} connected</p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm" className="bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Provider
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-48 text-xs bg-card border-border">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="all" className="text-xs">All Types</SelectItem>
            {PROVIDER_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Cloud}
          title="No providers configured"
          description="Connect your first infrastructure provider to enable discovery and synchronization."
          action={
            <Button onClick={() => setFormOpen(true)} size="sm" variant="outline" className="text-xs h-8 border-border">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Provider
            </Button>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Health</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Sync Mode</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Connected</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Assets</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Last Sync</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="text-foreground font-medium">{p.name}</span>
                      {p.is_default && (
                        <span className="px-1 py-0.5 rounded text-[10px] bg-ops-cyan/15 text-ops-cyan border border-ops-cyan/30">Default</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.provider_type}</td>
                  <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                  <td className="px-3 py-2"><ProviderHealthBadge health={p.health} /></td>
                  <td className="px-3 py-2">
                    <span className={`text-[11px] ${p.sync_mode === 'Disabled' ? 'text-muted-foreground' : 'text-ops-cyan'}`}>
                      {p.sync_mode || 'Disabled'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.last_sync ? moment(p.last_sync).fromNow() : 'Never'}
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/assets`} className="text-ops-cyan hover:underline">{assetCount(p.id)}</Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">
                    {p.last_sync ? moment(p.last_sync).format('MMM D, HH:mm') : '—'}
                    {p.last_sync_duration != null && <span className="text-muted-foreground/60"> · {(p.last_sync_duration / 1000).toFixed(1)}s</span>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {p.provider_type === 'Proxmox VE' && p.status !== 'Connected' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleSync(p)}
                          disabled={busy}
                          title="Test Connection & Sync Nodes"
                        >
                          {syncingProvider?.id === p.id && busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plug className="w-3 h-3" />}
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded hover:bg-accent transition-colors">
                            <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-navy-800 border-border">
                          {p.provider_type === 'Proxmox VE' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => handleSync(p)}
                                disabled={busy}
                                className="text-xs text-foreground hover:bg-accent cursor-pointer"
                              >
                                <RefreshCw className="w-3 h-3 mr-2" /> Synchronize Now
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setSettingsProvider(p)}
                                className="text-xs text-foreground hover:bg-accent cursor-pointer"
                              >
                                <Settings className="w-3 h-3 mr-2" /> Sync Settings
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-border" />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => setActionProvider(p)}
                            className="text-xs text-red-400 hover:bg-accent cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sync Result Dialog */}
      {syncResult && (
        <Dialog open={true} onOpenChange={() => { setSyncResult(null); setSyncingProvider(null); }}>
          <DialogContent className="bg-navy-800 border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-ops-cyan" />
                Synchronization Result — {syncingProvider?.name}
              </DialogTitle>
            </DialogHeader>
            {syncResult.success ? (
              <div className="space-y-2 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="bg-card border border-border rounded-md p-2 text-center">
                    <div className="text-lg font-semibold text-emerald-400">{syncResult.importedAssets}</div>
                    <div className="text-[10px] text-muted-foreground">Imported</div>
                  </div>
                  <div className="bg-card border border-border rounded-md p-2 text-center">
                    <div className="text-lg font-semibold text-sky-400">{syncResult.updatedAssets}</div>
                    <div className="text-[10px] text-muted-foreground">Updated</div>
                  </div>
                  <div className="bg-card border border-border rounded-md p-2 text-center">
                    <div className="text-lg font-semibold text-amber-400">{syncResult.archivedAssets}</div>
                    <div className="text-[10px] text-muted-foreground">Archived</div>
                  </div>
                  <div className="bg-card border border-border rounded-md p-2 text-center">
                    <div className="text-lg font-semibold text-foreground">{syncResult.changesDetected}</div>
                    <div className="text-[10px] text-muted-foreground">Changes</div>
                  </div>
                </div>
                {syncResult.errors?.length > 0 && (
                  <div className="text-xs text-amber-400 bg-amber-500/5 border border-amber-500/30 rounded-md p-2">
                    <div className="font-medium mb-1">{syncResult.errors.length} error(s):</div>
                    <ul className="space-y-0.5">
                      {syncResult.errors.slice(0, 5).map((e, i) => <li key={i} className="text-[11px] text-muted-foreground">• {e}</li>)}
                    </ul>
                  </div>
                )}
                <Button onClick={() => { setSyncResult(null); setSyncingProvider(null); }} className="w-full h-8 text-xs bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90">
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="space-y-1 text-xs text-red-400 bg-red-500/5 border border-red-500/30 rounded-md p-2.5">
                  <div>{syncResult.error}</div>
                  {syncResult.raw_body && (
                    <div className="text-[11px] text-red-400/70 font-mono break-all">{syncResult.raw_body}</div>
                  )}
                </div>
                <Button onClick={() => { setSyncResult(null); setSyncingProvider(null); }} variant="outline" className="w-full h-8 text-xs border-border">
                  Close
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Sync Settings Dialog */}
      {settingsProvider && (
        <Dialog open={true} onOpenChange={() => setSettingsProvider(null)}>
          <DialogContent className="bg-navy-800 border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-ops-cyan" />
                Sync Settings — {settingsProvider.name}
              </DialogTitle>
            </DialogHeader>
            <ProviderSyncSettings provider={settingsProvider} onSave={handleSaveSyncSettings} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      {actionProvider && (
        <Dialog open={true} onOpenChange={() => setActionProvider(null)}>
          <DialogContent className="bg-navy-800 border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-semibold">Delete Provider</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground">
              This will permanently delete <span className="text-foreground font-medium">{actionProvider.name}</span> and its node records. Discovered assets will remain but will be unlinked from this provider.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setActionProvider(null)} className="h-8 text-xs border-border">Cancel</Button>
              <Button size="sm" onClick={() => handleDelete(actionProvider)} className="h-8 text-xs bg-red-500 hover:bg-red-600">Delete</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add Provider Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Cloud className="w-4 h-4 text-ops-cyan" /> Add Infrastructure Provider
            </DialogTitle>
          </DialogHeader>
          <ProviderForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}