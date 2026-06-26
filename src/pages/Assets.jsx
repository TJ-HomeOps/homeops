import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { Server, Plus, Search, Filter } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import AssetForm from '@/components/assets/AssetForm';
import { logActivity } from '@/lib/activityLogger';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const assetTypes = ['LXC', 'VM', 'Docker Container', 'Physical Server', 'NAS', 'Network Device', 'Switch', 'Firewall', 'Router', 'UPS', 'Other'];
const assetStatuses = ['Online', 'Offline', 'Maintenance', 'Provisioning', 'Decommissioned'];

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setFormOpen(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const loadData = async () => {
    const [a, p] = await Promise.all([
      base44.entities.Asset.list('-created_date'),
      base44.entities.Project.list()
    ]);
    setAssets(a);
    setProjects(p);
    setLoading(false);
  };

  const handleCreate = async (data) => {
    const asset = await base44.entities.Asset.create(data);
    await logActivity('Created Asset', 'Asset', asset.id, data.name);
    setFormOpen(false);
    loadData();
  };

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

  const filtered = assets.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) &&
        !(a.hostname || '').toLowerCase().includes(search.toLowerCase()) &&
        !(a.ip_address || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && a.type !== typeFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Assets</h1>
          <p className="text-xs text-muted-foreground">{assets.length} total assets</p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm" className="bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Asset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets..."
            className="pl-8 h-8 text-xs bg-card border-border"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-40 text-xs bg-card border-border">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="all" className="text-xs">All Types</SelectItem>
            {assetTypes.map(t => (
              <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-xs bg-card border-border">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="all" className="text-xs">All Status</SelectItem>
            {assetStatuses.map(s => (
              <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No assets found"
          description="Add your first infrastructure asset to get started."
          action={
            <Button onClick={() => setFormOpen(true)} size="sm" variant="outline" className="text-xs h-8 border-border">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Asset
            </Button>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Hostname</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">IP Address</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Project</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2">
                    <Link to={`/assets/${asset.id}`} className="text-foreground hover:text-primary font-medium">
                      {asset.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground font-mono text-[11px]">{asset.type}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{asset.hostname || '—'}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{asset.ip_address || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {asset.project && projectMap[asset.project]
                      ? <Link to={`/projects/${asset.project}`} className="text-primary hover:underline">{projectMap[asset.project].name}</Link>
                      : '—'}
                  </td>
                  <td className="px-3 py-2"><StatusBadge status={asset.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">New Asset</DialogTitle>
          </DialogHeader>
          <AssetForm projects={projects} onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}