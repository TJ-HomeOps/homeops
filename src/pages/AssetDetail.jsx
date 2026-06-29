import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Server, ArrowLeft, Edit, Trash2, Save, Link2, Activity, FileText, BookOpen, AlertTriangle, Cpu, Cloud, Power, MemoryStick, HardDrive, Zap } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import HealthBadge from '@/components/shared/HealthBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import ProviderHealthBadge from '@/components/providers/ProviderHealthBadge';
import AssetForm from '@/components/assets/AssetForm';
import AssetTimeline from '@/components/assets/AssetTimeline';
import RelatedAssets from '@/components/assets/RelatedAssets';
import FutureIntegrations from '@/components/assets/FutureIntegrations';
import FutureOperations from '@/components/assets/FutureOperations';
import { logActivity } from '@/lib/activityLogger';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import moment from 'moment';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

function SectionCard({ title, icon: Icon, count, children, action }) {
  return (
    <div className="bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
          <h3 className="text-xs font-semibold text-foreground">{title}</h3>
          {count !== undefined && <span className="text-[10px] text-muted-foreground">({count})</span>}
        </div>
        {action}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [allAssets, setAllAssets] = useState([]);
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [provider, setProvider] = useState(null);
  const [cases, setCases] = useState([]);
  const [docs, setDocs] = useState([]);
  const [runbooks, setRunbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [notesDirty, setNotesDirty] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    const [a, allProj, allAssets, allProviders] = await Promise.all([
      base44.entities.Asset.get(id),
      base44.entities.Project.list(),
      base44.entities.Asset.list(),
      base44.entities.InfrastructureProvider.list()
    ]);
    setAsset(a);
    setProjects(allProj);
    setAllAssets(allAssets);
    setNotesText(a.notes || '');
    setNotesDirty(false);
    if (a.project) {
      setProject(allProj.find(p => p.id === a.project) || null);
    } else {
      setProject(null);
    }
    setProvider(allProviders.find(p => p.id === a.provider) || null);
    const [c, d, r] = await Promise.all([
      base44.entities.Case.filter({ asset: id }),
      base44.entities.Documentation.filter({ related_asset: id }),
      base44.entities.Runbook.filter({ asset: id })
    ]);
    setCases(c);
    setDocs(d);
    setRunbooks(r);
    setLoading(false);
  };

  const handleUpdate = async (data) => {
    const oldHealth = asset.health;
    const oldProject = asset.project;
    await base44.entities.Asset.update(id, data);
    await logActivity('Updated Asset', 'Asset', id, data.name, '', id);
    if (data.health && data.health !== oldHealth) {
      await logActivity(`Health Changed: ${oldHealth} → ${data.health}`, 'Asset', id, data.name, '', id);
    }
    if (data.project && data.project !== oldProject) {
      const newProj = projects.find(p => p.id === data.project);
      await logActivity(`Project Changed`, 'Asset', id, data.name, `Now in ${newProj?.name || 'Unknown'}`, id);
    }
    setEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await logActivity('Deleted Asset', 'Asset', id, asset.name);
    await base44.entities.Asset.delete(id);
    navigate('/assets');
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await base44.entities.Asset.update(id, { notes: notesText });
    await logActivity('Updated Notes', 'Asset', id, asset.name, '', id);
    setSavingNotes(false);
    setNotesDirty(false);
  };

  const handleLinkAsset = async (assetId) => {
    const updated = [...(asset.related_assets || []), assetId];
    await base44.entities.Asset.update(id, { related_assets: updated });
    const linkedAsset = allAssets.find(a => a.id === assetId);
    await logActivity(`Linked Asset: ${linkedAsset?.name || ''}`, 'Asset', id, asset.name, '', id);
    loadData();
  };

  const handleUnlinkAsset = async (assetId) => {
    const updated = (asset.related_assets || []).filter(aid => aid !== assetId);
    await base44.entities.Asset.update(id, { related_assets: updated });
    const unlinkedAsset = allAssets.find(a => a.id === assetId);
    await logActivity(`Unlinked Asset: ${unlinkedAsset?.name || ''}`, 'Asset', id, asset.name, '', id);
    loadData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!asset) {
    return <div className="text-sm text-muted-foreground text-center py-16">Asset not found</div>;
  }

  const healthDescription = asset.health === 'Critical'
    ? 'Asset is in a critical state and requires immediate attention.'
    : asset.health === 'Warning'
    ? 'Asset is operational but has warnings that should be addressed.'
    : 'Asset is operating normally with no active warnings.';

  return (
    <div className="space-y-3 max-w-5xl">
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
              {asset.role && <span className="text-[11px] text-muted-foreground">· {asset.role}</span>}
              <StatusBadge status={asset.status} />
              <HealthBadge health={asset.health} />
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

      {/* General Section */}
      <SectionCard title="General" icon={Server}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <div className="text-[11px] text-muted-foreground">Hostname</div>
            <div className="text-xs text-foreground font-mono">{asset.hostname || '—'}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">IP Address</div>
            <div className="text-xs text-foreground font-mono">{asset.ip_address || '—'}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Role</div>
            <div className="text-xs text-foreground">{asset.role || 'Other'}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Project</div>
            {project ? (
              <Link to={`/projects/${project.id}`} className="text-xs text-primary hover:underline">{project.name}</Link>
            ) : (
              <div className="text-xs text-foreground">—</div>
            )}
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Created</div>
            <div className="text-xs text-foreground">{moment(asset.created_date).format('MMM D, YYYY')}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Last Updated</div>
            <div className="text-xs text-foreground">{moment(asset.updated_date || asset.created_date).fromNow()}</div>
          </div>
        </div>
        {asset.description && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="text-[11px] text-muted-foreground mb-0.5">Description</div>
            <div className="text-xs text-foreground">{asset.description}</div>
          </div>
        )}
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {asset.tags.map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded bg-accent text-[11px] text-foreground border border-border">{tag}</span>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Infrastructure Section */}
      <SectionCard title="Infrastructure" icon={Cloud}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div>
            <div className="text-[11px] text-muted-foreground">Provider</div>
            {provider ? (
              <Link to="/providers" className="text-xs text-ops-cyan hover:underline flex items-center gap-1">
                <Cloud className="w-3 h-3" /> {provider.name}
              </Link>
            ) : <div className="text-xs text-foreground">—</div>}
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Node</div>
            <div className="text-xs text-foreground font-mono">{asset.node || '—'}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">VMID</div>
            <div className="text-xs text-foreground font-mono">{asset.vmid || '—'}</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Power State</div>
            {asset.power_state ? (
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${
                asset.power_state === 'Running' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                asset.power_state === 'Stopped' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                'bg-gray-500/10 text-gray-400 border-gray-500/30'
              }`}>
                <Zap className="w-2.5 h-2.5" /> {asset.power_state}
              </span>
            ) : <div className="text-xs text-foreground">—</div>}
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">CPU Allocation</div>
            <div className="text-xs text-foreground flex items-center gap-1">
              <Cpu className="w-3 h-3 text-muted-foreground" />
              {asset.cpu_allocation ? `${asset.cpu_allocation} vCPU` : '—'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Memory Allocation</div>
            <div className="text-xs text-foreground flex items-center gap-1">
              <MemoryStick className="w-3 h-3 text-muted-foreground" />
              {asset.ram_allocation ? `${asset.ram_allocation} GB` : '—'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Disk Allocation</div>
            <div className="text-xs text-foreground flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-muted-foreground" />
              {asset.disk_allocation ? `${asset.disk_allocation} GB` : '—'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground">Provider Health</div>
            {provider ? <ProviderHealthBadge health={provider.health} /> : <div className="text-xs text-foreground">—</div>}
          </div>
        </div>
      </SectionCard>

      {/* Health Section */}
      <SectionCard title="Health" icon={Activity}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Status</div>
              <StatusBadge status={asset.status} />
            </div>
            <div>
              <div className="text-[11px] text-muted-foreground mb-0.5">Health</div>
              <HealthBadge health={asset.health} />
            </div>
          </div>
          <div className="flex-1 text-xs text-muted-foreground border-l border-border pl-3">
            {healthDescription}
          </div>
        </div>
      </SectionCard>

      {/* Future Integrations */}
      <SectionCard title="Future Integrations" icon={Cpu}>
        <FutureIntegrations />
      </SectionCard>

      {/* Future Operations */}
      <SectionCard title="Future Operations" icon={Power}>
        <div className="text-[11px] text-muted-foreground mb-2">Infrastructure actions will be available in a future Voyage.</div>
        <FutureOperations />
      </SectionCard>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Cases, Docs, Runbooks, Timeline */}
        <div className="lg:col-span-2 space-y-3">
          {/* Cases */}
          <SectionCard title="Cases" icon={AlertTriangle} count={cases.length}>
            {cases.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">No cases for this asset</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 font-medium text-muted-foreground">Priority</th>
                      <th className="text-left py-1.5 font-medium text-muted-foreground">Case #</th>
                      <th className="text-left py-1.5 font-medium text-muted-foreground">Title</th>
                      <th className="text-left py-1.5 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {cases.map(c => (
                      <tr key={c.id} className="hover:bg-accent/30">
                        <td className="py-1.5"><PriorityBadge priority={c.priority} /></td>
                        <td className="py-1.5 font-mono text-muted-foreground">{c.case_number}</td>
                        <td className="py-1.5"><Link to={`/cases/${c.id}`} className="text-foreground hover:text-primary">{c.title}</Link></td>
                        <td className="py-1.5"><StatusBadge status={c.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Documentation */}
          <SectionCard title="Documentation" icon={FileText} count={docs.length}>
            {docs.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">No documentation for this asset</div>
            ) : (
              <div className="space-y-1">
                {docs.map(d => (
                  <Link key={d.id} to={`/documentation/${d.id}`} className="block px-2 py-1.5 rounded-md bg-accent/20 border border-border hover:border-primary/30 transition-colors">
                    <div className="text-xs text-foreground font-medium">{d.title}</div>
                    <div className="text-[10px] text-muted-foreground">{moment(d.updated_date || d.created_date).format('MMM D, YYYY')}</div>
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Runbooks */}
          <SectionCard title="Runbooks" icon={BookOpen} count={runbooks.length}>
            {runbooks.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">No runbooks for this asset</div>
            ) : (
              <div className="space-y-1">
                {runbooks.map(r => (
                  <Link key={r.id} to={`/runbooks/${r.id}`} className="block px-2 py-1.5 rounded-md bg-accent/20 border border-border hover:border-primary/30 transition-colors">
                    <div className="text-xs text-foreground font-medium">{r.name}</div>
                    {r.description && <div className="text-[10px] text-muted-foreground">{r.description}</div>}
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Activity Timeline */}
          <SectionCard title="Activity Timeline" icon={Activity}>
            <AssetTimeline assetId={id} />
          </SectionCard>

          {/* Notes */}
          <SectionCard title="Notes" icon={FileText}
            action={notesDirty && (
              <Button onClick={handleSaveNotes} size="sm" disabled={savingNotes}
                className="h-6 text-[11px] bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90 px-2">
                <Save className="w-3 h-3 mr-1" /> {savingNotes ? 'Saving...' : 'Save'}
              </Button>
            )}
          >
            <Textarea
              value={notesText}
              onChange={(e) => { setNotesText(e.target.value); setNotesDirty(true); }}
              placeholder="Add internal notes for this asset..."
              className="text-xs bg-navy-900 border-border min-h-[80px] resize-y"
            />
          </SectionCard>
        </div>

        {/* Right: Related Assets */}
        <div className="space-y-3">
          <SectionCard title="Related Assets" icon={Link2} count={(asset.related_assets || []).length}>
            <RelatedAssets
              asset={asset}
              allAssets={allAssets}
              onLink={handleLinkAsset}
              onUnlink={handleUnlinkAsset}
            />
          </SectionCard>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Asset</DialogTitle>
          </DialogHeader>
          <AssetForm asset={asset} projects={projects} allAssets={allAssets} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}