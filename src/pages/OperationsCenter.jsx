import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Server, AlertTriangle, Activity, Wrench, RefreshCw,
  Plus, ArrowRight, Clock, CheckCircle, AlertOctagon, FolderKanban,
  Cloud, HardDrive, Monitor, Box, Cpu, Zap
} from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import HealthGauge from '@/components/shared/HealthGauge';
import SyncDashboard from '@/components/operations/SyncDashboard';
import { calculateInfrastructureHealth } from '@/lib/healthCalculator';
import moment from 'moment';

function StatTile({ icon: Icon, label, value, color, link }) {
  return (
    <Link to={link} className="bg-card border border-border rounded-lg p-2.5 hover:border-primary/30 transition-colors group flex items-center gap-2.5">
      <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold text-foreground leading-none">{value}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{label}</div>
      </div>
      <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
    </Link>
  );
}

export default function OperationsCenter() {
  const [assets, setAssets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [cases, setCases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [providers, setProviders] = useState([]);
  const [nodes, setNodes] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Asset.list(),
      base44.entities.Project.list(),
      base44.entities.Case.list(),
      base44.entities.ActivityLog.list('-created_date', 20),
      base44.auth.me(),
      base44.entities.InfrastructureProvider.list(),
      base44.entities.InfrastructureNode.list(),
      base44.entities.InfrastructureEvent.list('-timestamp', 50)
    ]).then(([a, p, c, act, u, prov, n, evt]) => {
      setAssets(a);
      setProjects(p);
      setCases(c);
      setActivities(act);
      setUser(u);
      setProviders(prov);
      setNodes(n);
      setEvents(evt);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const openCases = cases.filter(c => c.status !== 'Closed');
  const criticalCases = cases.filter(c => c.priority === 'Critical' && c.status !== 'Closed');
  const activeProjects = projects.filter(p => p.status === 'Active');
  const onlineAssets = assets.filter(a => a.status === 'Online');
  const warningAssets = assets.filter(a => a.health === 'Warning');
  const criticalAssets = assets.filter(a => a.health === 'Critical');
  const maintenanceAssets = assets.filter(a => a.status === 'Maintenance');
  const infraHealth = calculateInfrastructureHealth(assets, cases);

  const connectedProviders = providers.filter(p => p.status === 'Connected');
  const healthyProviders = providers.filter(p => p.health === 'Healthy');
  const errorProviders = providers.filter(p => p.health === 'Error');
  const onlineNodes = nodes.filter(n => n.status === 'Online');
  const runningVMs = nodes.reduce((sum, n) => sum + (n.running_vms || 0), 0);
  const runningLXCs = nodes.reduce((sum, n) => sum + (n.running_lxcs || 0), 0);
  const lastProviderSync = providers
    .filter(p => p.last_sync)
    .sort((a, b) => new Date(b.last_sync) - new Date(a.last_sync))[0]?.last_sync;
  const syncErrors = providers.flatMap(p => p.sync_errors || []);

  const lastSync = activities[0]?.created_date;
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-3 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Operations Center</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {greeting()}, {user?.full_name || 'Admin'}. {criticalCases.length > 0
            ? `${criticalCases.length} critical case${criticalCases.length > 1 ? 's' : ''} requiring attention.`
            : `${openCases.length} open case${openCases.length !== 1 ? 's' : ''} · ${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}.`
          }
        </p>
      </div>

      {/* Infrastructure Health Overview */}
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <HealthGauge health={infraHealth} size="lg" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Infra Health</span>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <StatTile icon={CheckCircle} label="Online Assets" value={onlineAssets.length}
              color="bg-emerald-500/15 text-emerald-400" link="/assets" />
            <StatTile icon={AlertTriangle} label="Warning Assets" value={warningAssets.length}
              color="bg-amber-500/15 text-amber-400" link="/assets" />
            <StatTile icon={AlertOctagon} label="Critical Assets" value={criticalAssets.length}
              color="bg-red-500/15 text-red-400" link="/assets" />
            <StatTile icon={Activity} label="Open Cases" value={openCases.length}
              color="bg-sky-500/15 text-sky-400" link="/cases" />
            <StatTile icon={Wrench} label="Maintenance Today" value={maintenanceAssets.length}
              color="bg-purple-500/15 text-purple-400" link="/assets" />
          </div>
        </div>
      </div>

      {/* Cluster Status */}
      <div className="bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-ops-cyan" />
            <h2 className="text-xs font-semibold text-foreground">Cluster Status</h2>
          </div>
          <Link to="/providers" className="text-[11px] text-primary hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-border">
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Providers</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-foreground">{connectedProviders.length}</span>
              <span className="text-[11px] text-muted-foreground">/ {providers.length}</span>
            </div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Health</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-emerald-400">{healthyProviders.length}</span>
              {errorProviders.length > 0 && <span className="text-[11px] text-red-400">{errorProviders.length} err</span>}
            </div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Nodes Online</div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-ops-cyan">{onlineNodes.length}</span>
              <span className="text-[11px] text-muted-foreground">/ {nodes.length}</span>
            </div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Running VMs</div>
            <div className="flex items-baseline gap-1.5">
              <Monitor className="w-3 h-3 text-muted-foreground self-center" />
              <span className="text-lg font-semibold text-foreground">{runningVMs}</span>
            </div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Running LXC</div>
            <div className="flex items-baseline gap-1.5">
              <Box className="w-3 h-3 text-muted-foreground self-center" />
              <span className="text-lg font-semibold text-foreground">{runningLXCs}</span>
            </div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Sync</div>
            <div className="text-xs text-foreground font-medium">{lastProviderSync ? moment(lastProviderSync).fromNow() : 'Never'}</div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Sync Errors</div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-lg font-semibold ${syncErrors.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{syncErrors.length}</span>
            </div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Cluster</div>
            <div className="text-xs text-foreground font-medium truncate">{connectedProviders[0]?.cluster_name || '—'}</div>
          </div>
        </div>
      </div>

      {/* Synchronization Dashboard */}
      <SyncDashboard providers={providers} events={events} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Open Cases */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
            <h2 className="text-xs font-semibold text-foreground">Open Cases</h2>
            <Link to="/cases" className="text-[11px] text-primary hover:underline">View All</Link>
          </div>
          {openCases.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-8">No open cases</div>
          ) : (
            <div className="divide-y divide-border">
              {openCases.slice(0, 7).map((c) => (
                <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 transition-colors">
                  <PriorityBadge priority={c.priority} />
                  <span className="text-[11px] font-mono text-muted-foreground w-16">{c.case_number}</span>
                  <span className="text-xs text-foreground flex-1 truncate">{c.title}</span>
                  {c.maintenance_window && c.maintenance_window !== 'Immediate' && (
                    <span className="text-[10px] text-purple-400 hidden sm:inline">{c.maintenance_window}</span>
                  )}
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Last Sync + Recent Activity */}
        <div className="space-y-3">
          {/* Last Sync */}
          <div className="bg-card border border-border rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-ops-cyan" />
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Synchronization</div>
                <div className="text-xs text-foreground">{lastSync ? moment(lastSync).fromNow() : 'Never'}</div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-lg">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
              <h2 className="text-xs font-semibold text-foreground">Recent Activity</h2>
            </div>
            {activities.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-8">No recent activity</div>
            ) : (
              <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
                {activities.slice(0, 10).map((a) => (
                  <div key={a.id} className="px-3 py-2">
                    <div className="text-xs text-foreground">{a.action}</div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[11px] text-primary">{a.entity_name || a.entity_type}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{moment(a.created_date).fromNow()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="text-xs font-semibold text-foreground">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-3">
          {[
            { label: 'New Asset', path: '/assets?action=new', icon: Server },
            { label: 'New Case', path: '/cases?action=new', icon: AlertTriangle },
            { label: 'New Project', path: '/projects?action=new', icon: FolderKanban },
            { label: 'New Provider', path: '/providers?action=new', icon: Cloud },
            { label: 'New Doc', path: '/documentation?action=new', icon: null },
            { label: 'New Runbook', path: '/runbooks?action=new', icon: null },
          ].map((a) => {
            const Icon = a.icon || Plus;
            return (
              <Link
                key={a.path}
                to={a.path}
                className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-accent/30 hover:bg-accent hover:border-primary/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs text-foreground">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}