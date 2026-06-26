import React from 'react';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="w-10 h-10 text-muted-foreground/20 mb-3" />}
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground/70 mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}