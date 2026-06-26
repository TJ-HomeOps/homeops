import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Edit, Trash2, Clock, Calendar, Wrench } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import CaseForm from '@/components/cases/CaseForm';
import { logActivity } from '@/lib/activityLogger';
import moment from 'moment';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [asset, setAsset] = useState(null);
  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const [c, allAssets, allProjects] = await Promise.all([
      base44.entities.Case.get(id),
      base44.entities.Asset.list(),
      base44.entities.Project.list()
    ]);
    setCaseData(c);
    setAssets(allAssets);
    setProjects(allProjects);
    if (c.asset) setAsset(allAssets.find(a => a.id === c.asset) || null);
    if (c.project) setProject(allProjects.find(p => p.id === c.project) || null);
    setLoading(false);
  };

  const handleUpdate = async (data) => {
    await base44.entities.Case.update(id, data);
    await logActivity('Updated Case', 'Case', id, `${caseData.case_number}: ${data.title}`, '', data.asset || caseData.asset || '');
    setEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await logActivity('Deleted Case', 'Case', id, caseData.case_number);
    await base44.entities.Case.delete(id);
    navigate('/cases');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!caseData) {
    return <div className="text-sm text-muted-foreground text-center py-16">Case not found</div>;
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link to="/cases" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Cases
        </Link>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs text-foreground">{caseData.case_number}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{caseData.case_number}</span>
            <PriorityBadge priority={caseData.priority} />
            <StatusBadge status={caseData.status} />
            {caseData.maintenance_window && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border bg-purple-500/15 text-purple-400 border-purple-500/30">
                <Wrench className="w-2.5 h-2.5" /> {caseData.maintenance_window}
              </span>
            )}
          </div>
          <h1 className="text-lg font-semibold text-foreground">{caseData.title}</h1>
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
                <AlertDialogTitle className="text-sm">Delete Case</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">This will permanently delete this case.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs h-8 border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="text-xs h-8 bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <div className="text-[11px] text-muted-foreground mb-0.5">Asset</div>
          {asset ? (
            <Link to={`/assets/${asset.id}`} className="text-xs text-primary hover:underline">{asset.name}</Link>
          ) : (
            <div className="text-xs text-foreground">—</div>
          )}
        </div>
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <div className="text-[11px] text-muted-foreground mb-0.5">Project</div>
          {project ? (
            <Link to={`/projects/${project.id}`} className="text-xs text-primary hover:underline">{project.name}</Link>
          ) : (
            <div className="text-xs text-foreground">—</div>
          )}
        </div>
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <div className="text-[11px] text-muted-foreground mb-0.5">Assigned To</div>
          <div className="text-xs text-foreground">{caseData.assigned_to || '—'}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <div className="text-[11px] text-muted-foreground mb-0.5 flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" /> Est. Completion
          </div>
          <div className="text-xs text-foreground">
            {caseData.estimated_completion ? moment(caseData.estimated_completion).format('MMM D, YYYY') : '—'}
          </div>
        </div>
      </div>

      {caseData.notes && (
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <div className="text-[11px] text-muted-foreground mb-1">Notes</div>
          <div className="text-xs text-foreground whitespace-pre-wrap">{caseData.notes}</div>
        </div>
      )}

      {caseData.resolution_notes && (
        <div className="bg-card border border-emerald-500/20 rounded-lg px-3 py-2">
          <div className="text-[11px] text-emerald-400 mb-1 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Resolution Notes
          </div>
          <div className="text-xs text-foreground whitespace-pre-wrap">{caseData.resolution_notes}</div>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Case</DialogTitle>
          </DialogHeader>
          <CaseForm caseData={caseData} assets={assets} projects={projects} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}