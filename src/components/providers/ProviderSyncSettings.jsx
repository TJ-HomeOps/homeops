import React, { useState } from 'react';
import { RefreshCw, Clock, CheckCircle, Timer, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import moment from 'moment';
import { getNextSyncTime } from '@/lib/syncEngine';

const SYNC_MODES = ['Disabled', 'Every 5 Minutes', 'Every 15 Minutes', 'Every Hour', 'Daily'];

export default function ProviderSyncSettings({ provider, onSave }) {
  const [syncMode, setSyncMode] = useState(provider.sync_mode || 'Disabled');
  const [saving, setSaving] = useState(false);

  const nextSync = getNextSyncTime({ ...provider, sync_mode: syncMode });

  const handleSave = async () => {
    setSaving(true);
    await onSave({ sync_mode: syncMode });
    setSaving(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Synchronization Mode</Label>
        <Select value={syncMode} onValueChange={setSyncMode}>
          <SelectTrigger className="h-8 text-xs bg-navy-900 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            {SYNC_MODES.map(m => <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-card border border-border rounded-md p-2">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Last Sync</div>
          <div className="text-xs text-foreground">{provider.last_sync ? moment(provider.last_sync).fromNow() : 'Never'}</div>
        </div>
        <div className="bg-card border border-border rounded-md p-2">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" /> Last Successful</div>
          <div className="text-xs text-foreground">{provider.last_successful_sync ? moment(provider.last_successful_sync).fromNow() : 'Never'}</div>
        </div>
        <div className="bg-card border border-border rounded-md p-2">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1"><Timer className="w-2.5 h-2.5" /> Duration</div>
          <div className="text-xs text-foreground">{provider.last_sync_duration ? `${(provider.last_sync_duration / 1000).toFixed(1)}s` : '—'}</div>
        </div>
        <div className="bg-card border border-border rounded-md p-2">
          <div className="text-[10px] text-muted-foreground flex items-center gap-1"><RefreshCw className="w-2.5 h-2.5" /> Next Sync</div>
          <div className="text-xs text-foreground">{nextSync ? moment(nextSync).fromNow() : '—'}</div>
        </div>
      </div>

      <div className="flex justify-end pt-1 border-t border-border">
        <Button onClick={handleSave} size="sm" disabled={saving} className="h-8 text-xs bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90">
          {saving ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}