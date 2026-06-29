import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Server, X, Link2, ArrowRight } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { base44 } from '@/api/base44Client';

const RELATIONSHIP_TYPES = [
  'Depends On', 'Provides Service To', 'Hosted On',
  'Backed Up By', 'Protected By', 'Reverse Proxied By', 'Authenticated By'
];

export default function RelatedAssets({ asset, allAssets }) {
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedType, setSelectedType] = useState('Hosted On');

  const loadRels = async () => {
    try {
      const [outgoing, incoming] = await Promise.all([
        base44.entities.AssetRelationship.filter({ source_asset: asset.id }),
        base44.entities.AssetRelationship.filter({ target_asset: asset.id })
      ]);
      const all = [...outgoing, ...incoming];
      const seen = new Set();
      const deduped = all.filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      setRelationships(deduped);
    } catch { /* noop */ }
    setLoading(false);
  };

  useEffect(() => { loadRels(); }, [asset.id]);

  const handleLink = async () => {
    if (!selectedTarget || !selectedType) return;
    await base44.entities.AssetRelationship.create({
      source_asset: asset.id,
      target_asset: selectedTarget,
      relationship_type: selectedType,
    });
    setSelectedTarget('');
    loadRels();
  };

  const handleUnlink = async (relId) => {
    await base44.entities.AssetRelationship.delete(relId);
    loadRels();
  };

  const available = allAssets.filter(a => a.id !== asset.id);

  if (loading) return <div className="text-xs text-muted-foreground text-center py-3">Loading relationships...</div>;

  return (
    <div className="space-y-2">
      {relationships.length === 0 ? (
        <div className="text-xs text-muted-foreground text-center py-3">No relationships defined</div>
      ) : (
        <div className="space-y-1">
          {relationships.map(r => {
            const isSource = r.source_asset === asset.id;
            const otherId = isSource ? r.target_asset : r.source_asset;
            const otherAsset = allAssets.find(a => a.id === otherId);
            if (!otherAsset) return null;
            return (
              <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-accent/30 border border-border hover:border-primary/30 transition-colors">
                <Server className="w-3 h-3 text-muted-foreground shrink-0" />
                {isSource ? (
                  <>
                    <span className="text-[10px] text-ops-cyan font-medium px-1">{r.relationship_type}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                    <Link to={`/assets/${otherAsset.id}`} className="text-xs text-foreground hover:text-primary font-medium flex-1 truncate">{otherAsset.name}</Link>
                  </>
                ) : (
                  <>
                    <Link to={`/assets/${otherAsset.id}`} className="text-xs text-foreground hover:text-primary font-medium truncate">{otherAsset.name}</Link>
                    <span className="text-[10px] text-muted-foreground px-1">{r.relationship_type}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-muted-foreground" />
                    <span className="text-[10px] text-primary font-medium">us</span>
                  </>
                )}
                <StatusBadge status={otherAsset.status} />
                <button onClick={() => handleUnlink(r.id)} className="text-muted-foreground hover:text-red-400 transition-colors p-0.5" title="Remove">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {available.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="h-7 text-xs bg-navy-900 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-navy-800 border-border">
              {RELATIONSHIP_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Select value={selectedTarget} onValueChange={setSelectedTarget}>
              <SelectTrigger className="h-7 text-xs bg-navy-900 border-border flex-1">
                <SelectValue placeholder="Select asset..." />
              </SelectTrigger>
              <SelectContent className="bg-navy-800 border-border">
                {available.map(a => <SelectItem key={a.id} value={a.id} className="text-xs">{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <button onClick={handleLink} disabled={!selectedTarget}
              className="flex items-center gap-1 px-2.5 h-7 rounded-md bg-ops-cyan/15 text-ops-cyan text-xs font-medium hover:bg-ops-cyan/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              <Link2 className="w-3 h-3" /> Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}