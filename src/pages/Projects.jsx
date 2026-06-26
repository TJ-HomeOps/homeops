import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import HealthGauge from '@/components/shared/HealthGauge';
import EmptyState from '@/components/shared/EmptyState';
import ProjectForm from '@/components/projects/ProjectForm';
import { logActivity } from '@/lib/activityLogger';
import { calculateInfrastructureHealth } from '@/lib/healthCalculator';
import moment from 'moment';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [assets, setAssets] = useState([]);
  const [cases, setCases] = useState([]);
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
    const [p, a, c] = await Promise.all([
      base44.entities.Project.list('-created_date'),
      base44.entities.Asset.list(),
      base44.entities.Case.list()
    ]);
    setProjects(p);
    setAssets(a);
    setCases(c);
    setLoading(false);
  };

  const handleCreate = async (data) => {
    const project = await base44.entities.Project.create(data);
    await logActivity('Created Project', 'Project', project.id, data.name);
    setFormOpen(false);
    loadData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  const projectData = projects.map(p => {
    const projAssets = assets.filter(a => a.project === p.id);
    const projCases = cases.filter(c => c.project === p.id);
    const openCases = projCases.filter(c => c.status !== 'Closed').length;
    const completedCases = projCases.filter(c => c.status === 'Closed').length;
    const health = calculateInfrastructureHealth(projAssets, projCases);
    return { ...p, assetCount: projAssets.length, openCases, completedCases, health };
  });

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
        <div className="bg-card border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full text-xs min-w-[800px]">
            <thead>
              <tr className="border-b border-border bg-accent/30">
                <th className="text-left px-3 py-2 font-medium text-muted-foreground w-4"></th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Health</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Assets</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Open Cases</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Closed Cases</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projectData.map(p => (
                <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-3 py-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || '#0EA5E9' }} />
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/projects/${p.id}`} className="text-foreground hover:text-primary font-medium">{p.name}</Link>
                    {p.description && <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{p.description}</div>}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold" style={{ color: p.health >= 80 ? '#22C55E' : p.health >= 50 ? '#F59E0B' : '#EF4444' }}>{p.health}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.assetCount}</td>
                  <td className="px-3 py-2 text-amber-400">{p.openCases}</td>
                  <td className="px-3 py-2 text-emerald-400">{p.completedCases}</td>
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