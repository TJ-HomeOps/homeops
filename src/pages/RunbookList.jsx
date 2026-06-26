import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Plus, Search } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import RunbookForm from '@/components/runbooks/RunbookForm';
import { logActivity } from '@/lib/activityLogger';
import moment from 'moment';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RunbookList() {
  const [runbooks, setRunbooks] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setFormOpen(true);
      setSearchParams({});
    }
  }, [searchParams]);

  const loadData = async () => {
    const [r, a] = await Promise.all([
      base44.entities.Runbook.list('-created_date'),
      base44.entities.Asset.list()
    ]);
    setRunbooks(r);
    setAssets(a);
    setLoading(false);
  };

  const handleCreate = async (data) => {
    const rb = await base44.entities.Runbook.create(data);
    await logActivity('Created Runbook', 'Runbook', rb.id, data.name);
    setFormOpen(false);
    loadData();
  };

  const assetMap = Object.fromEntries(assets.map(a => [a.id, a]));

  const filtered = runbooks.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Runbooks</h1>
          <p className="text-xs text-muted-foreground">{runbooks.length} runbooks</p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm" className="bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Runbook
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search runbooks..." className="pl-8 h-8 text-xs bg-card border-border" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No runbooks"
          description="Create runbooks to standardize operational procedures."
          action={
            <Button onClick={() => setFormOpen(true)} size="sm" variant="outline" className="text-xs h-8 border-border">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Runbook
            </Button>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Asset</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Steps</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2">
                    <Link to={`/runbooks/${r.id}`} className="text-foreground hover:text-primary font-medium">{r.name}</Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{r.description || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {r.asset && assetMap[r.asset]
                      ? <Link to={`/assets/${r.asset}`} className="text-primary hover:underline">{assetMap[r.asset].name}</Link>
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{r.checklist?.length || 0}</td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">{moment(r.created_date).format('MMM D, YYYY')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">New Runbook</DialogTitle>
          </DialogHeader>
          <RunbookForm assets={assets} onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}