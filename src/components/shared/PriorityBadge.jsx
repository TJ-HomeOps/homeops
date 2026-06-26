import React from 'react';

const priorityStyles = {
  Low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  Normal: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  High: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const priorityDots = {
  Low: 'bg-slate-400',
  Normal: 'bg-sky-400',
  High: 'bg-amber-400',
  Critical: 'bg-red-400',
};

export default function PriorityBadge({ priority }) {
  const style = priorityStyles[priority] || priorityStyles.Normal;
  const dot = priorityDots[priority] || priorityDots.Normal;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium border ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {priority}
    </span>
  );
}