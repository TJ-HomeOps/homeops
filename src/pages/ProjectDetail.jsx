import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FolderKanban, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import ProjectForm from '@/components/projects/ProjectForm';
import { logActivity } from '@/lib/activityLogger';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [cases, setCases] = useState([]);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const p = await base44.entities.Project.get(id);
    setProject(p);
    const [a, c, allDocs] = await Promise.all([
      base44.entities.Asset.filter({ project: id }),
      base44.entities.Case.filter({ project: id }),
      base44.entities.Documentation.list()
    ]);
    setAssets(a);
    setCases(c);
    // filter docs to those linked to this project's assets
    const assetIds = new Set(a.map(asset => asset.id));
    setDocs(allDocs.filter(d => d.related_asset && assetIds.has(d.related_asset)));
    setLoading(false);
  };

  const handleUpdate = async (data) => {
    await base44.entities.Project.update(id, data);
    await logActivity('Updated Project', 'Project', id, data.name);
    setEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await logActivity('Deleted Project', 'Project', id, project.name);
    await base44.entities.Project.delete(id);
    navigate('/projects');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!project) return <div className="text-sm text-muted-foreground text-center py-16">Project not found</div>;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-2">
        <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Projects
        </Link>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs text-foreground">{project.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color || '#0EA5E9' }} />
          <div>
            <h1 className="text-lg font-semibold text-foreground">{project.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <StatusBadge status={project.status} />
              {project.description && <span className="text-xs text-muted-foreground">{project.description}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button onClick={() => setEditOpen(true)} size="sm" variant="outline" className="h-7 text-xs border-border">
            <Edit className="w-3 h-3 mr-1" /> Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs border-border text-red-400 hover:text-red-300">
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-navy-800 border-border">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-sm">Delete Project</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">This will permanently delete this project. Assets and cases won't be deleted.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs h-8 border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="text-xs h-8 bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="assets">
        <TabsList className="bg-card border border-border h-8">
          <TabsTrigger value="assets" className="text-xs h-6 data-[state=active]:bg-accent">Assets ({assets.length})</TabsTrigger>
          <TabsTrigger value="cases" className="text-xs h-6 data-[state=active]:bg-accent">Cases ({cases.length})</TabsTrigger>
          <TabsTrigger value="docs" className="text-xs h-6 data-[state=active]:bg-accent">Documentation ({docs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="assets">
          {assets.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No assets in this project</div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Hostname</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">IP</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {assets.map(a => (
                    <tr key={a.id} className="hover:bg-accent/30">
                      <td className="px-3 py-2"><Link to={`/assets/${a.id}`} className="text-foreground hover:text-primary font-medium">{a.name}</Link></td>
                      <td className="px-3 py-2 text-muted-foreground font-mono text-[11px]">{a.type}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{a.hostname || '—'}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{a.ip_address || '—'}</td>
                      <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="cases">
          {cases.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No cases for this project</div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border bg-accent/30">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Priority</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Case #</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Title</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {cases.map(c => (
                    <tr key={c.id} className="hover:bg-accent/30">
                      <td className="px-3 py-2"><PriorityBadge priority={c.priority} /></td>
                      <td className="px-3 py-2 font-mono text-muted-foreground">{c.case_number}</td>
                      <td className="px-3 py-2"><Link to={`/cases/${c.id}`} className="text-foreground hover:text-primary">{c.title}</Link></td>
                      <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="docs">
          {docs.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No documentation in this project</div>
          ) : (
            <div className="space-y-2">
              {docs.map(d => (
                <Link key={d.id} to={`/documentation/${d.id}`} className="block bg-card border border-border rounded-lg px-3 py-2 hover:border-primary/30 transition-colors">
                  <div className="text-xs text-foreground font-medium">{d.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{moment(d.updated_date || d.created_date).format('MMM D, YYYY')}</div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Project</DialogTitle>
          </DialogHeader>
          <ProjectForm project={project} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}