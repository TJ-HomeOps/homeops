import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

const statuses = ['Active', 'Planning', 'On Hold', 'Completed', 'Archived'];
const colors = ['#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

export default function ProjectForm({ project, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'Active',
    color: project?.color || '#0EA5E9',
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
        <Label className="text-xs text-muted-foreground">Name *</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          required className="h-8 text-xs bg-navy-900 border-border mt-1" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="text-xs bg-navy-900 border-border mt-1 min-h-[60px]" />
      </div>
      <div className="grid grid-cols-2 gap-3">
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
          <Label className="text-xs text-muted-foreground">Color</Label>
          <div className="flex gap-1.5 mt-2">
            {colors.map(c => (
              <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                className={`w-5 h-5 rounded-full border-2 transition-all ${form.color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" size="sm" className="h-8 text-xs border-border">Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || !form.name} className="h-8 text-xs bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90">
          {saving ? 'Saving...' : project ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}