import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Server, ArrowLeft, Edit, Trash2, Plus, Clock } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import AssetForm from '@/components/assets/AssetForm';
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

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [project, setProject] = useState(null);
  const [cases, setCases] = useState([]);
  const [docs, setDocs] = useState([]);
  const [runbooks, setRunbooks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    const [a, allProjects] = await Promise.all([
      base44.entities.Asset.get(id),
      base44.entities.Project.list()
    ]);
    setAsset(a);
    setProjects(allProjects);
    if (a.project) {
      const proj = allProjects.find(p => p.id === a.project);
      setProject(proj || null);
    }
    const [c, d, r, act] = await Promise.all([
      base44.entities.Case.filter({ asset: id }),
      base44.entities.Documentation.filter({ related_asset: id }),
      base44.entities.Runbook.filter({ asset: id }),
      base44.entities.ActivityLog.filter({ entity_type: 'Asset', entity_id: id }, '-created_date', 10)
    ]);
    setCases(c);
    setDocs(d);
    setRunbooks(r);
    setActivities(act);
    setLoading(false);
  };

  const handleUpdate = async (data) => {
    await base44.entities.Asset.update(id, data);
    await logActivity('Updated Asset', 'Asset', id, data.name);
    setEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await logActivity('Deleted Asset', 'Asset', id, asset.name);
    await base44.entities.Asset.delete(id);
    navigate('/assets');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!asset) {
    return <div className="text-sm text-muted-foreground text-center py-16">Asset not found</div>;
  }

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link to="/assets" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Assets
        </Link>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs text-foreground">{asset.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-ops-cyan/15 flex items-center justify-center">
            <Server className="w-5 h-5 text-ops-cyan" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">{asset.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-mono text-muted-foreground">{asset.type}</span>
              <StatusBadge status={asset.status} />
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
                <AlertDialogTitle className="text-sm">Delete Asset</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">
                  This will permanently delete {asset.name}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs h-8 border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="text-xs h-8 bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Hostname', value: asset.hostname || '—', mono: true },
          { label: 'IP Address', value: asset.ip_address || '—', mono: true },
          { label: 'Project', value: project ? project.name : '—', link: project ? `/projects/${project.id}` : null },
          { label: 'Created', value: moment(asset.created_date).format('MMM D, YYYY') },
        ].map((item) => (
          <div key={item.label} className="bg-card border border-border rounded-lg px-3 py-2">
            <div className="text-[11px] text-muted-foreground mb-0.5">{item.label}</div>
            {item.link ? (
              <Link to={item.link} className="text-xs text-primary hover:underline">{item.value}</Link>
            ) : (
              <div className={`text-xs text-foreground ${item.mono ? 'font-mono' : ''}`}>{item.value}</div>
            )}
          </div>
        ))}
      </div>

      {asset.description && (
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <div className="text-[11px] text-muted-foreground mb-1">Description</div>
          <div className="text-xs text-foreground">{asset.description}</div>
        </div>
      )}

      {asset.tags && asset.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {asset.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 rounded bg-accent text-[11px] text-foreground border border-border">{tag}</span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="cases" className="mt-2">
        <TabsList className="bg-card border border-border h-8">
          <TabsTrigger value="cases" className="text-xs h-6 data-[state=active]:bg-accent">Cases ({cases.length})</TabsTrigger>
          <TabsTrigger value="docs" className="text-xs h-6 data-[state=active]:bg-accent">Docs ({docs.length})</TabsTrigger>
          <TabsTrigger value="runbooks" className="text-xs h-6 data-[state=active]:bg-accent">Runbooks ({runbooks.length})</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs h-6 data-[state=active]:bg-accent">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="cases">
          {cases.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No cases for this asset</div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-accent/30">
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Priority</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Case #</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
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
            <div className="text-xs text-muted-foreground text-center py-8">No documentation for this asset</div>
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

        <TabsContent value="runbooks">
          {runbooks.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No runbooks for this asset</div>
          ) : (
            <div className="space-y-2">
              {runbooks.map(r => (
                <Link key={r.id} to={`/runbooks/${r.id}`} className="block bg-card border border-border rounded-lg px-3 py-2 hover:border-primary/30 transition-colors">
                  <div className="text-xs text-foreground font-medium">{r.name}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{r.description}</div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity">
          {activities.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No activity recorded</div>
          ) : (
            <div className="space-y-0">
              {activities.map(a => (
                <div key={a.id} className="flex items-center gap-3 px-3 py-2 border-l-2 border-border ml-2">
                  <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-xs text-foreground">{a.action}</div>
                    <div className="text-[10px] text-muted-foreground">{moment(a.created_date).fromNow()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Asset</DialogTitle>
          </DialogHeader>
          <AssetForm asset={asset} projects={projects} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}