import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export default function DocumentationForm({ doc, assets, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title: doc?.title || '',
    content: doc?.content || '',
    related_asset: doc?.related_asset || '',
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
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Title *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            required className="h-8 text-xs bg-navy-900 border-border mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Related Asset</Label>
          <Select value={form.related_asset} onValueChange={(v) => setForm({ ...form, related_asset: v })}>
            <SelectTrigger className="h-8 text-xs bg-navy-900 border-border mt-1">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              <SelectItem value="none" className="text-xs">None</SelectItem>
              {assets.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Content (Markdown)</Label>
        <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="text-xs bg-navy-900 border-border mt-1 min-h-[200px] font-mono" placeholder="# Getting Started&#10;&#10;Write your documentation here..." />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" size="sm" className="h-8 text-xs border-border">Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || !form.title} className="h-8 text-xs bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90">
          {saving ? 'Saving...' : doc ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}