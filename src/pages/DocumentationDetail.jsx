import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import DocumentationForm from '@/components/documentation/DocumentationForm';
import { logActivity } from '@/lib/activityLogger';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';

export default function DocumentationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [asset, setAsset] = useState(null);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    const [d, allAssets] = await Promise.all([
      base44.entities.Documentation.get(id),
      base44.entities.Asset.list()
    ]);
    setDoc(d);
    setAssets(allAssets);
    if (d.related_asset) setAsset(allAssets.find(a => a.id === d.related_asset) || null);
    setLoading(false);
  };

  const handleUpdate = async (data) => {
    await base44.entities.Documentation.update(id, data);
    await logActivity('Updated Documentation', 'Documentation', id, data.title);
    setEditOpen(false);
    loadData();
  };

  const handleDelete = async () => {
    await logActivity('Deleted Documentation', 'Documentation', id, doc.title);
    await base44.entities.Documentation.delete(id);
    navigate('/documentation');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!doc) return <div className="text-sm text-muted-foreground text-center py-16">Document not found</div>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link to="/documentation" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Documentation
        </Link>
        <span className="text-xs text-muted-foreground">/</span>
        <span className="text-xs text-foreground">{doc.title}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{doc.title}</h1>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            {asset && (
              <>
                <Link to={`/assets/${asset.id}`} className="text-primary hover:underline">{asset.name}</Link>
                <span>·</span>
              </>
            )}
            <span>Updated {moment(doc.updated_date || doc.created_date).format('MMM D, YYYY')}</span>
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
                <AlertDialogTitle className="text-sm">Delete Document</AlertDialogTitle>
                <AlertDialogDescription className="text-xs">This will permanently delete this document.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="text-xs h-8 border-border">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="text-xs h-8 bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg px-4 py-3">
        {doc.content ? (
          <ReactMarkdown className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed
            prose-headings:text-foreground prose-headings:font-semibold prose-headings:mb-2 prose-headings:mt-4
            prose-p:text-muted-foreground prose-p:mb-2
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:text-ops-cyan prose-code:bg-navy-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-navy-900 prose-pre:border prose-pre:border-border prose-pre:rounded-lg
            prose-ul:text-muted-foreground prose-ol:text-muted-foreground
            prose-strong:text-foreground"
          >
            {doc.content}
          </ReactMarkdown>
        ) : (
          <div className="text-xs text-muted-foreground text-center py-8">No content yet</div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-navy-800 border-border sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">Edit Document</DialogTitle>
          </DialogHeader>
          <DocumentationForm doc={doc} assets={assets} onSubmit={handleUpdate} onCancel={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}