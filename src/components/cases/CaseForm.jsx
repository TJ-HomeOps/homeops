import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const priorities = ['Low', 'Normal', 'High', 'Critical'];
const statuses = ['Open', 'In Progress', 'Waiting', 'Closed'];

export default function CaseForm({ caseData, assets, projects, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: caseData?.title || '',
    priority: caseData?.priority || 'Normal',
    status: caseData?.status || 'Open',
    assigned_to: caseData?.assigned_to || '',
    asset: caseData?.asset || '',
    project: caseData?.project || '',
    notes: caseData?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label className="text-xs text-muted-foreground">Title *</Label>
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          required className="h-8 text-xs bg-navy-900 border-border mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger className="h-8 text-xs bg-navy-900 border-border mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              {priorities.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="h-8 text-xs bg-navy-900 border-border mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              {statuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Asset</Label>
          <Select value={form.asset} onValueChange={(v) => setForm({ ...form, asset: v })}>
            <SelectTrigger className="h-8 text-xs bg-navy-900 border-border mt-1">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              <SelectItem value="none" className="text-xs">None</SelectItem>
              {assets.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Project</Label>
          <Select value={form.project} onValueChange={(v) => setForm({ ...form, project: v })}>
            <SelectTrigger className="h-8 text-xs bg-navy-900 border-border mt-1">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              <SelectItem value="none" className="text-xs">None</SelectItem>
              {projects.map(p => <SelectItem key={p.id} value={p.id} className="text-xs">{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Assigned To</Label>
        <Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}
          className="h-8 text-xs bg-navy-900 border-border mt-1" placeholder="Name or email" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="text-xs bg-navy-900 border-border mt-1 min-h-[60px]" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" size="sm" className="h-8 text-xs border-border">Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || !form.title} className="h-8 text-xs bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90">
          {saving ? 'Saving...' : caseData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}