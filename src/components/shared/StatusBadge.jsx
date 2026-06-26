import React from 'react';

const statusStyles = {
  Online: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Offline: 'bg-red-500/15 text-red-400 border-red-500/30',
  Maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Provisioning: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  Decommissioned: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Planning: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'On Hold': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Completed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Archived: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Open: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  'In Progress': 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Waiting: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  Closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
};

export default function StatusBadge({ status }) {
  const style = statusStyles[status] || 'bg-slate-500/15 text-slate-400 border-slate-500/30';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium border ${style}`}>
      {status}
    </span>
  );
}