import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import {
  Server, FolderKanban, AlertTriangle, Activity,
  Plus, ArrowRight, Clock
} from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import PriorityBadge from '@/components/shared/PriorityBadge';
import moment from 'moment';

function StatCard({ icon: Icon, label, value, color, link }) {
  return (
    <Link to={link} className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors group">
      <div className="flex items-center justify-between mb-2">
        <div className={`w-7 h-7 rounded flex items-center justify-center ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-2xl font-semibold text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
    </Link>
  );
}

export default function OperationsCenter() {
  const [assets, setAssets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [cases, setCases] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    Promise.all([
      base44.entities.Asset.list(),
      base44.entities.Project.list(),
      base44.entities.Case.list(),
      base44.entities.ActivityLog.list('-created_date', 15),
      base44.auth.me()
    ]).then(([a, p, c, act, u]) => {
      setAssets(a);
      setProjects(p);
      setCases(c);
      setActivities(act);
      setUser(u);
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

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Operations Center</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {greeting()}, {user?.full_name || 'Admin'}. {criticalCases.length > 0
            ? `${criticalCases.length} critical case${criticalCases.length > 1 ? 's' : ''} requiring attention.`
            : `${openCases.length} open case${openCases.length !== 1 ? 's' : ''} and ${activeProjects.length} active project${activeProjects.length !== 1 ? 's' : ''}.`
          }
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Server}
          label="Total Assets"
          value={assets.length}
          color="bg-ops-cyan/15 text-ops-cyan"
          link="/assets"
        />
        <StatCard
          icon={FolderKanban}
          label="Active Projects"
          value={activeProjects.length}
          color="bg-ops-green/15 text-ops-green"
          link="/projects"
        />
        <StatCard
          icon={AlertTriangle}
          label="Open Cases"
          value={openCases.length}
          color="bg-ops-amber/15 text-ops-amber"
          link="/cases"
        />
        <StatCard
          icon={Activity}
          label="Online Assets"
          value={onlineAssets.length}
          color="bg-emerald-500/15 text-emerald-400"
          link="/assets"
        />
      </div>

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
              {openCases.slice(0, 6).map((c) => (
                <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 transition-colors">
                  <PriorityBadge priority={c.priority} />
                  <span className="text-[11px] font-mono text-muted-foreground w-16">{c.case_number}</span>
                  <span className="text-xs text-foreground flex-1 truncate">{c.title}</span>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          )}
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
              {activities.map((a) => (
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

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg">
        <div className="px-3 py-2.5 border-b border-border">
          <h2 className="text-xs font-semibold text-foreground">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3">
          {[
            { label: 'New Asset', path: '/assets?action=new', icon: Server },
            { label: 'New Case', path: '/cases?action=new', icon: AlertTriangle },
            { label: 'New Project', path: '/projects?action=new', icon: FolderKanban },
            { label: 'New Doc', path: '/documentation?action=new', icon: null },
            { label: 'New Runbook', path: '/runbooks?action=new', icon: null },
          ].map((a) => (
            <Link
              key={a.path}
              to={a.path}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-accent/30 hover:bg-accent hover:border-primary/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-foreground">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}