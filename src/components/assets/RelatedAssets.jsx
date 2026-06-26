import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Server, X, Link2 } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import HealthBadge from '@/components/shared/HealthBadge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';

export default function RelatedAssets({ asset, allAssets, onLink, onUnlink }) {
  const [selected, setSelected] = useState('');

  const related = (asset.related_assets || [])
    .map(id => allAssets.find(a => a.id === id))
    .filter(Boolean);

  const available = allAssets.filter(a =>
    a.id !== asset.id && !(asset.related_assets || []).includes(a.id)
  );

  const handleLink = () => {
    if (!selected) return;
    onLink(selected);
    setSelected('');
  };

  return (
    <div className="space-y-2">
      {related.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-3">No related assets linked</div>
      ) : (
        <div className="space-y-1">
          {related.map(a => (
            <div key={a.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent/30 border border-border hover:border-primary/30 transition-colors">
              <Server className="w-3 h-3 text-muted-foreground shrink-0" />
              <Link to={`/assets/${a.id}`} className="text-xs text-foreground hover:text-primary font-medium flex-1 truncate">{a.name}</Link>
              <StatusBadge status={a.status} />
              <HealthBadge health={a.health} />
              <button
                onClick={() => onUnlink(a.id)}
                className="text-muted-foreground hover:text-red-400 transition-colors p-0.5"
                title="Unlink"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {available.length > 0 && (
        <div className="flex gap-2 pt-1">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="h-7 text-xs bg-navy-900 border-border flex-1">
              <SelectValue placeholder="Link asset..." />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              {available.map(a => (
                <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={handleLink}
            disabled={!selected}
            className="flex items-center gap-1 px-2.5 h-7 rounded-md bg-ops-cyan/15 text-ops-cyan text-xs font-medium hover:bg-ops-cyan/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Link2 className="w-3 h-3" /> Link
          </button>
        </div>
      )}
    </div>
  );
}