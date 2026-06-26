import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const assetTypes = ['LXC', 'VM', 'Docker Container', 'Physical Server', 'NAS', 'Network Device', 'Switch', 'Firewall', 'Router', 'UPS', 'Other'];
const assetStatuses = ['Online', 'Offline', 'Maintenance', 'Unknown'];
const healthLevels = ['Healthy', 'Warning', 'Critical'];
const assetRoles = ['Infrastructure', 'Network', 'Security', 'Media', 'Storage', 'Development', 'Automation', 'Monitoring', 'Other'];

export default function AssetForm({ asset, projects, allAssets, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: asset?.name || '',
    type: asset?.type || 'VM',
    hostname: asset?.hostname || '',
    ip_address: asset?.ip_address || '',
    status: asset?.status || 'Online',
    health: asset?.health || 'Healthy',
    role: asset?.role || 'Other',
    project: asset?.project || '',
    description: asset?.description || '',
    tags: asset?.tags || [],
    related_assets: asset?.related_assets || [],
    notes: asset?.notes || '',
  });
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const cleanForm = { ...form };
    if (cleanForm.project === 'none') cleanForm.project = '';
    await onSubmit(cleanForm);
    setSaving(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const toggleRelatedAsset = (assetId) => {
    const current = form.related_assets || [];
    if (current.includes(assetId)) {
      setForm({ ...form, related_assets: current.filter(id => id !== assetId) });
    } else {
      setForm({ ...form, related_assets: [...current, assetId] });
    }
  };

  const availableAssets = (allAssets || []).filter(a => a.id !== asset?.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Name *</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            required className="h-8 text-xs bg-navy-900 border-border mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Type *</Label>
          <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
            <SelectTrigger className="h-8 text-xs bg-navy-900 border-border mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              {assetTypes.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Hostname</Label>
          <Input value={form.hostname} onChange={(e) => setForm({ ...form, hostname: e.target.value })}
            className="h-8 text-xs bg-navy-900 border-border mt-1 font-mono" placeholder="srv-01" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">IP Address</Label>
          <Input value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
            className="h-8 text-xs bg-navy-900 border-border mt-1 font-mono" placeholder="10.0.0.1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="h-8 text-xs bg-navy-900 border-border mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              {assetStatuses.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Health</Label>
          <Select value={form.health} onValueChange={(v) => setForm({ ...form, health: v })}>
            <SelectTrigger className="h-8 text-xs bg-navy-900 border-border mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              {healthLevels.map(h => <SelectItem key={h} value={h} className="text-xs">{h}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Role</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger className="h-8 text-xs bg-navy-900 border-border mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              {assetRoles.map(r => <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Project</Label>
          <Select value={form.project || 'none'} onValueChange={(v) => setForm({ ...form, project: v })}>
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
        <Label className="text-xs text-muted-foreground">Description</Label>
        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="text-xs bg-navy-900 border-border mt-1 min-h-[60px]" />
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Tags</Label>
        <div className="flex gap-2 mt-1">
          <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            className="h-8 text-xs bg-navy-900 border-border flex-1" placeholder="Add tag..." />
          <Button type="button" onClick={addTag} size="sm" variant="outline" className="h-8 text-xs border-border">Add</Button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {form.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-accent text-[11px] text-foreground border border-border">
                {tag}
                <button type="button" onClick={() => setForm({ ...form, tags: form.tags.filter(t => t !== tag) })} className="text-muted-foreground hover:text-foreground">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      {availableAssets.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground">Related Assets</Label>
          <div className="mt-1 max-h-32 overflow-y-auto rounded-md border border-border bg-navy-900 p-2 space-y-1">
            {availableAssets.map(a => (
              <label key={a.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.related_assets.includes(a.id)}
                  onChange={() => toggleRelatedAsset(a.id)}
                  className="w-3.5 h-3.5 rounded border-border accent-ops-cyan"
                />
                <span className="text-xs text-foreground">{a.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">{a.type}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      <div>
        <Label className="text-xs text-muted-foreground">Notes</Label>
        <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="text-xs bg-navy-900 border-border mt-1 min-h-[60px]" placeholder="Internal notes for this asset..." />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" size="sm" className="h-8 text-xs border-border">Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || !form.name} className="h-8 text-xs bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90">
          {saving ? 'Saving...' : asset ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}