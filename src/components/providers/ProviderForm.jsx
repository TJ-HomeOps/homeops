import React, { useState } from 'react';
import { Plug, CheckCircle, XCircle, Loader2, Save, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { testProxmoxConnection } from '@/lib/proxmoxApi';

const PROVIDER_TYPES = [
  { value: 'Proxmox VE', label: 'Proxmox VE', operational: true },
  { value: 'Proxmox Backup Server', label: 'Proxmox Backup Server', operational: false },
  { value: 'Docker', label: 'Docker', operational: false },
  { value: 'Authentik', label: 'Authentik', operational: false },
  { value: 'Nginx Proxy Manager', label: 'Nginx Proxy Manager', operational: false },
  { value: 'Pi-hole', label: 'Pi-hole', operational: false },
  { value: 'pfSense', label: 'pfSense', operational: false },
];

export default function ProviderForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    provider_type: 'Proxmox VE',
    api_url: '',
    api_token_id: '',
    api_secret: '',
    ignore_ssl: false,
    is_default: false,
    sync_mode: 'Disabled',
    notes: '',
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedType = PROVIDER_TYPES.find(t => t.value === formData.provider_type);
  const isOperational = selectedType?.operational;

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testProxmoxConnection(formData);
    setTestResult(result);
    setTesting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOperational) return;
    setSaving(true);
    await onSubmit({
      ...formData,
      status: testResult?.success ? 'Connected' : 'Disconnected',
      health: testResult?.success ? 'Healthy' : 'Unknown',
      cluster_name: testResult?.cluster || '',
      proxmox_version: testResult?.version || '',
      node_count: testResult?.nodes || 0,
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Provider Type */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Provider Type</Label>
        <Select value={formData.provider_type} onValueChange={(v) => handleChange('provider_type', v)}>
          <SelectTrigger className="h-8 text-xs bg-navy-900 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            {PROVIDER_TYPES.map(t => (
              <SelectItem key={t.value} value={t.value} className="text-xs" disabled={!t.operational}>
                <span className="flex items-center gap-2">
                  {t.label}
                  {!t.operational && <span className="text-[10px] text-muted-foreground/60">(Coming Soon)</span>}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Friendly Name */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Friendly Name</Label>
        <Input
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. Home Lab Cluster"
          className="h-8 text-xs bg-navy-900 border-border"
          required
        />
      </div>

      {/* API URL */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">API URL</Label>
        <Input
          value={formData.api_url}
          onChange={(e) => handleChange('api_url', e.target.value)}
          placeholder="https://192.168.1.10:8006"
          className="h-8 text-xs bg-navy-900 border-border font-mono"
          required
        />
      </div>

      {/* API Token ID */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">API Token ID</Label>
        <Input
          value={formData.api_token_id}
          onChange={(e) => handleChange('api_token_id', e.target.value)}
          placeholder="user@pam!tokenname"
          className="h-8 text-xs bg-navy-900 border-border font-mono"
          required
        />
      </div>

      {/* API Secret */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">API Secret</Label>
        <Input
          type="password"
          value={formData.api_secret}
          onChange={(e) => handleChange('api_secret', e.target.value)}
          placeholder="••••••••••••••••"
          className="h-8 text-xs bg-navy-900 border-border font-mono"
          required
        />
      </div>

      {/* Synchronization Mode */}
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground flex items-center gap-1">
          <RefreshCw className="w-3 h-3" /> Synchronization Mode
        </Label>
        <Select value={formData.sync_mode} onValueChange={(v) => handleChange('sync_mode', v)}>
          <SelectTrigger className="h-8 text-xs bg-navy-900 border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-navy-800 border-border">
            <SelectItem value="Disabled" className="text-xs">Disabled</SelectItem>
            <SelectItem value="Every 5 Minutes" className="text-xs">Every 5 Minutes</SelectItem>
            <SelectItem value="Every 15 Minutes" className="text-xs">Every 15 Minutes</SelectItem>
            <SelectItem value="Every Hour" className="text-xs">Every Hour</SelectItem>
            <SelectItem value="Daily" className="text-xs">Daily</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-4 pt-1">
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch
            checked={formData.ignore_ssl}
            onCheckedChange={(v) => handleChange('ignore_ssl', v)}
          />
          <span className="text-xs text-muted-foreground">Ignore SSL Certificate</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <Switch
            checked={formData.is_default}
            onCheckedChange={(v) => handleChange('is_default', v)}
          />
          <span className="text-xs text-muted-foreground">Default Provider</span>
        </label>
      </div>

      {/* Test Connection Result */}
      {testResult && (
        <div className={`rounded-md border p-2.5 text-xs ${testResult.success ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-red-500/5 border-red-500/30'}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            {testResult.success ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-red-400" />
            )}
            <span className={`font-medium ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
              {testResult.success ? 'Connection Successful' : 'Connection Failed'}
            </span>
          </div>
          {testResult.success ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              <div><span className="text-muted-foreground">Cluster:</span> <span className="text-foreground font-mono">{testResult.cluster}</span></div>
              <div><span className="text-muted-foreground">Version:</span> <span className="text-foreground font-mono">{testResult.version}</span></div>
              <div><span className="text-muted-foreground">Nodes:</span> <span className="text-foreground font-mono">{testResult.nodes}</span></div>
              <div><span className="text-muted-foreground">Latency:</span> <span className="text-foreground font-mono">{testResult.latency}ms</span></div>
            </div>
          ) : (
            <div className="text-muted-foreground">{testResult.error}</div>
          )}
        </div>
      )}

      {/* Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={testing || !isOperational || !formData.api_url || !formData.api_token_id || !formData.api_secret}
          className="h-8 text-xs border-border"
        >
          {testing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plug className="w-3.5 h-3.5 mr-1.5" />}
          Test Connection
        </Button>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-8 text-xs border-border">
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={saving || !isOperational}
            className="h-8 text-xs bg-ops-cyan text-navy-900 hover:bg-ops-cyan/90"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Save Provider
          </Button>
        </div>
      </div>

      {!isOperational && (
        <div className="text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/20 rounded-md px-2.5 py-1.5">
          This provider type is not yet operational. Configuration will be saved but cannot be tested or synchronized.
        </div>
      )}
    </form>
  );
}