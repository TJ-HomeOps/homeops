import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, ArrowLeft, Edit, Trash2, CheckSquare, Square } from 'lucide-react';
import RunbookForm from '@/components/runbooks/RunbookForm';
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

export default function RunbookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [runbook, setRunbook] = useState(null);
  const [asset, setAsset] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const [r, allAssets] = await Promise.all([
      base44.entities.Runbook.get(id),
      base44.entities.Asset.list()
    ]);
    setRunbook(r);
    setAssets(allAssets);
    if (r.asset) setAsset(allAssets.find(a => a.id === r.asset) || null);
    setLoading(false);
  };

  const toggleStep = async (idx) => {
    const updated = [...runbook.checklist];
    updated[idx] = { ...updated[idx], completed: !updated[idx].completed };
    await base44.entities.Runbook.update(id, { checklist: updated });
    setRunbook({ ...runbook, checklist: updated });
  };

  const handleUpdate = async (data) => {
    await base44.entities.Runbook.update(id, data);
    await logActivity('Updated Runbook', 'Runbook', id, data.name);
    setEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await logActivity('Deleted Runbook', 'Runbook', id, runbook.name);
    await base44.entities.Runbook.delete(id);
    navigate('/runbooks');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!runbook) return <div className="text-sm text-muted-foreground text-center py-16">Runbook not found</div>;

  const completed = runbook.checklist?.filter(s => s.completed).length || 0;
  const total = runbook.checklist?.length || 0;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link to="/runbooks" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Runbooks
        </Link>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs text-foreground">{runbook.name}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{runbook.name}</h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            {asset && (
              <>
                <Link to={`/assets/${asset.id}`} className="text-primary hover:underline">{asset.name}</Link>
                <span>·</span>
              </>
            )}
            <span>Created {moment(runbook.created_date).format('MMM D, YYYY')}</span>
            {total > 0 && (
              <>
                <span>·</span>
                <span>{completed}/{total} completed</span>
              </>
            )}
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
                <AlertDialogTitle className="text-sm">Delete Runbook</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">This will permanently delete this runbook.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs h-8 border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="text-xs h-8 bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {runbook.description && (
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <div className="text-[11px] text-muted-foreground mb-1">Description</div>
          <div className="text-xs text-foreground">{runbook.description}</div>
        </div>
      )}

      {/* Progress */}
      {total > 0 && (
        <div className="bg-card border border-border rounded-lg px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] text-muted-foreground">Progress</div>
            <div className="text-[11px] text-muted-foreground">{Math.round((completed / total) * 100)}%</div>
          </div>
          <div className="w-full h-1.5 bg-navy-900 rounded-full overflow-hidden">
            <div className="h-full bg-ops-green rounded-full transition-all" style={{ width: `${(completed / total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Checklist */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="text-xs font-semibold text-foreground">Checklist</h2>
        </div>
        {total === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8">No steps in this runbook</div>
        ) : (
          <div className="divide-y divide-border">
            {runbook.checklist.map((item, idx) => (
              <button key={idx} onClick={() => toggleStep(idx)}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-left hover:bg-accent/30 transition-colors">
                {item.completed ? (
                  <CheckSquare className="w-4 h-4 text-ops-green shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className={`text-xs ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {item.step}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Runbook</DialogTitle>
          </DialogHeader>
          <RunbookForm runbook={runbook} assets={assets} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}