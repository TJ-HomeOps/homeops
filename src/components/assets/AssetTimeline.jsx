import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Clock, Plus, Edit, Trash2, AlertTriangle, FileText, Wrench, Activity, FolderKanban, GitBranch } from 'lucide-react';
import moment from 'moment';

function iconForAction(action) {
  const a = (action || '').toLowerCase();
  if (a.includes('created')) return { icon: Plus, color: 'text-emerald-400' };
  if (a.includes('updated')) return { icon: Edit, color: 'text-sky-400' };
  if (a.includes('deleted')) return { icon: Trash2, color: 'text-red-400' };
  if (a.includes('case')) return { icon: AlertTriangle, color: 'text-amber-400' };
  if (a.includes('doc')) return { icon: FileText, color: 'text-sky-400' };
  if (a.includes('maintenance')) return { icon: Wrench, color: 'text-purple-400' };
  if (a.includes('health')) return { icon: Activity, color: 'text-amber-400' };
  if (a.includes('project')) return { icon: FolderKanban, color: 'text-cyan-400' };
  if (a.includes('link') || a.includes('relat')) return { icon: GitBranch, color: 'text-cyan-400' };
  return { icon: Clock, color: 'text-muted-foreground' };
}

export default function AssetTimeline({ assetId }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const [direct, related] = await Promise.all([
          base44.entities.ActivityLog.filter({ entity_type: 'Asset', entity_id: assetId }, '-created_date', 20),
          base44.entities.ActivityLog.filter({ asset_id: assetId }, '-created_date', 20)
        ]);
        const merged = [...direct, ...related];
        const seen = new Set();
        const deduped = merged.filter(a => {
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
        deduped.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
        setActivities(deduped.slice(0, 25));
      } catch { /* noop */ }
      setLoading(false);
    };
    fetchTimeline();
  }, [assetId]);

  if (loading) {
    return <div className="text-xs text-muted-foreground text-center py-6">Loading timeline...</div>;
  }

  if (activities.length === 0) {
    return <div className="text-xs text-muted-foreground text-center py-6">No activity recorded</div>;
  }

  return (
    <div className="relative pl-4">
      <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      <div className="space-y-0">
        {activities.map((a) => {
          const { icon: Icon, color } = iconForAction(a.action);
          return (
            <div key={a.id} className="relative pb-3 last:pb-0">
              <div className={`absolute -left-4 w-2 h-2 rounded-full ${color.replace('text-', 'bg-')} ring-2 ring-card`} />
              <div className="ml-2">
                <div className="flex items-center gap-1.5">
                  <Icon className={`w-3 h-3 ${color}`} />
                  <span className="text-xs text-foreground">{a.action}</span>
                </div>
                {a.entity_name && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{a.entity_name}</div>
                )}
                <div className="text-[10px] text-muted-foreground">{moment(a.created_date).format('MMM D, HH:mm')} · {moment(a.created_date).fromNow()}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}