import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export default function RunbookForm({ runbook, assets, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: runbook?.name || '',
    description: runbook?.description || '',
    asset: runbook?.asset || '',
    checklist: runbook?.checklist || [],
  });
  const [stepInput, setStepInput] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(form);
    setSaving(false);
  };

  const addStep = () => {
    if (stepInput.trim()) {
      setForm({ ...form, checklist: [...form.checklist, { step: stepInput.trim(), completed: false }] });
      setStepInput('');
    }
  };

  const removeStep = (idx) => {
    setForm({ ...form, checklist: form.checklist.filter((_, i) => i !== idx) });
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
      <div>
        <Label className="text-xs text-muted-foreground">Related Asset</Label>
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
        <Label className="text-xs text-muted-foreground">Checklist Steps</Label>
        <div className="flex gap-2 mt-1">
          <Input value={stepInput} onChange={(e) => setStepInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
            className="h-8 text-xs bg-navy-900 border-border flex-1" placeholder="Add a step..." />
          <Button type="button" onClick={addStep} size="sm" variant="outline" className="h-8 text-xs border-border">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {form.checklist.length > 0 && (
          <div className="space-y-1 mt-2">
            {form.checklist.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 px-2 py-1.5 bg-navy-900 rounded border border-border">
                <span className="text-[11px] text-muted-foreground font-mono w-5">{idx + 1}.</span>
                <span className="text-xs text-foreground flex-1">{item.step}</span>
                <button type="button" onClick={() => removeStep(idx)} className="text-muted-foreground hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" onClick={onCancel} variant="outline" size="sm" className="h-8 text-xs border-border">Cancel</Button>
        <Button type="submit" size="sm" disabled={saving || !form.name} className="h-8 text-xs bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90">
          {saving ? 'Saving...' : runbook ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}