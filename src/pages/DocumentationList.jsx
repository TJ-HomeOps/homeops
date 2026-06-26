import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { FileText, Plus, Search } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import DocumentationForm from '@/components/documentation/DocumentationForm';
import { logActivity } from '@/lib/activityLogger';
import moment from 'moment';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function DocumentationList() {
  const [docs, setDocs] = useState([]);
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
    const [d, a] = await Promise.all([
      base44.entities.Documentation.list('-updated_date'),
      base44.entities.Asset.list()
    ]);
    setDocs(d);
    setAssets(a);
    setLoading(false);
  };

  const handleCreate = async (data) => {
    const doc = await base44.entities.Documentation.create(data);
    await logActivity('Created Documentation', 'Documentation', doc.id, data.title);
    setFormOpen(false);
    loadData();
  };

  const assetMap = Object.fromEntries(assets.map(a => [a.id, a]));

  const filtered = docs.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Documentation</h1>
          <p className="text-xs text-muted-foreground">{docs.length} documents</p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm" className="bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Document
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search docs..." className="pl-8 h-8 text-xs bg-card border-border" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documentation"
          description="Create documentation for your infrastructure."
          action={
            <Button onClick={() => setFormOpen(true)} size="sm" variant="outline" className="text-xs h-8 border-border">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Document
            </Button>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Related Asset</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2">
                    <Link to={`/documentation/${d.id}`} className="text-foreground hover:text-primary font-medium">{d.title}</Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {d.related_asset && assetMap[d.related_asset]
                      ? <Link to={`/assets/${d.related_asset}`} className="text-primary hover:underline">{assetMap[d.related_asset].name}</Link>
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">{moment(d.updated_date || d.created_date).format('MMM D, YYYY')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">New Document</DialogTitle>
          </DialogHeader>
          <DocumentationForm assets={assets} onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}