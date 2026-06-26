import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import EmptyState from '@/components/shared/EmptyState';
import ProjectForm from '@/components/projects/ProjectForm';
import { logActivity } from '@/lib/activityLogger';
import moment from 'moment';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
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
      base44.entities.Project.list('-created_date'),
      base44.entities.Asset.list()
    ]);
    setProjects(p);
    setAssets(a);
    setLoading(false);
  };

  const handleCreate = async (data) => {
    const project = await base44.entities.Project.create(data);
    await logActivity('Created Project', 'Project', project.id, data.name);
    setFormOpen(false);
    loadData();
  };

  const assetCounts = {};
  assets.forEach(a => {
    if (a.project) assetCounts[a.project] = (assetCounts[a.project] || 0) + 1;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Projects</h1>
          <p className="text-xs text-muted-foreground">{projects.length} total projects</p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm" className="bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90 h-8 text-xs">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create a project to organize your infrastructure."
          action={
            <Button onClick={() => setFormOpen(true)} size="sm" variant="outline" className="text-xs h-8 border-border">
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Project
            </Button>
          }
        />
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-4"></th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Assets</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map(p => (
                <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || '#0EA5E9' }} />
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/projects/${p.id}`} className="text-foreground hover:text-primary font-medium">{p.name}</Link>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px]">{p.description || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{assetCounts[p.id] || 0}</td>
                  <td className="px-3 py-2"><StatusBadge status={p.status} /></td>
                  <td className="px-3 py-2 text-muted-foreground text-[11px]">{moment(p.created_date).format('MMM D, YYYY')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">New Project</DialogTitle>
          </DialogHeader>
          <ProjectForm onSubmit={handleCreate} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}