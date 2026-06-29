import { base44 } from '@/api/base44Client';
import { discoverProxmoxNodes, discoverProxmoxResources } from '@/lib/proxmoxApi';
import { logInfraEvent } from '@/lib/infraEventLogger';

const SYNC_INTERVALS = {
  'Every 5 Minutes': 5,
  'Every 15 Minutes': 15,
  'Every Hour': 60,
  'Daily': 1440,
};

export function getNextSyncTime(provider) {
  if (!provider.sync_mode || provider.sync_mode === 'Disabled') return null;
  const interval = SYNC_INTERVALS[provider.sync_mode];
  if (!interval) return null;
  const base = provider.last_successful_sync ? new Date(provider.last_successful_sync) : new Date(0);
  return new Date(base.getTime() + interval * 60 * 1000);
}

export function isSyncOverdue(provider) {
  const next = getNextSyncTime(provider);
  if (!next) return false;
  return next.getTime() <= Date.now();
}

const CHANGE_FIELDS = [
  { field: 'cpu_allocation', label: 'CPU Allocation' },
  { field: 'ram_allocation', label: 'RAM' },
  { field: 'disk_allocation', label: 'Disk Size' },
  { field: 'node', label: 'Node' },
  { field: 'power_state', label: 'Power State' },
  { field: 'status', label: 'Status' },
  { field: 'health', label: 'Health' },
];

export async function syncProvider(provider) {
  const startTime = Date.now();
  const now = new Date().toISOString();

  await logInfraEvent({
    provider: provider.id, provider_name: provider.name,
    severity: 'Info', event_type: 'Sync Started',
    description: `Synchronization started for ${provider.name}`,
  });

  try {
    const nodeResult = await discoverProxmoxNodes(provider);
    if (!nodeResult.success) throw new Error(nodeResult.error);

    const existingNodes = await base44.entities.InfrastructureNode.filter({ provider: provider.id });
    let importedNodes = 0, updatedNodes = 0;
    const offlineNodes = [];

    for (const node of nodeResult.nodes) {
      const existing = existingNodes.find(n => n.node_name === node.node_name);
      if (existing) {
        const wasOnline = existing.status === 'Online';
        const isOnline = node.status === 'Online';
        await base44.entities.InfrastructureNode.update(existing.id, {
          ...node, provider: provider.id, last_sync: now,
        });
        updatedNodes++;
        if (!wasOnline && isOnline) {
          await logInfraEvent({
            provider: provider.id, provider_name: provider.name,
            severity: 'Info', event_type: 'Node Online',
            description: `Node ${node.node_name} came online`,
          });
        } else if (wasOnline && !isOnline) {
          offlineNodes.push(node.node_name);
          await logInfraEvent({
            provider: provider.id, provider_name: provider.name,
            severity: 'Warning', event_type: 'Node Offline',
            description: `Node ${node.node_name} went offline`,
          });
        }
      } else {
        await base44.entities.InfrastructureNode.create({
          ...node, provider: provider.id, last_sync: now,
        });
        importedNodes++;
      }
    }

    const resourceResult = await discoverProxmoxResources(provider);
    if (!resourceResult.success) throw new Error(resourceResult.error);

    const existingAssets = await base44.entities.Asset.filter({ provider: provider.id });
    let importedAssets = 0, updatedAssets = 0, archivedAssets = 0, changesDetected = 0;
    const errors = [];
    const discoveredKeys = new Set(resourceResult.resources.map(r => `${r.vmid}:${r.node}`));

    for (const res of resourceResult.resources) {
      try {
        const existing = existingAssets.find(a => a.vmid === res.vmid && a.node === res.node);
        if (existing) {
          const changes = [];
          const updateData = {
            name: res.name, type: res.type, node: res.node,
            power_state: res.power_state, status: res.status,
            cpu_allocation: res.cpu_allocation, ram_allocation: res.ram_allocation,
            disk_allocation: res.disk_allocation, tags: res.tags,
            provider: provider.id,
            archived: false, archive_date: null, archive_reason: '',
          };

          for (const { field, label } of CHANGE_FIELDS) {
            const oldVal = existing[field];
            const newVal = updateData[field];
            if (String(oldVal ?? '') !== String(newVal ?? '')) {
              changes.push({ label, old_value: String(oldVal ?? '—'), new_value: String(newVal ?? '—') });
            }
          }

          const oldTags = (existing.tags || []).slice().sort().join(',');
          const newTags = (res.tags || []).slice().sort().join(',');
          if (oldTags !== newTags) {
            changes.push({ label: 'Tag', old_value: oldTags || '—', new_value: newTags || '—' });
          }

          await base44.entities.Asset.update(existing.id, updateData);

          if (changes.length > 0) {
            updatedAssets++;
            changesDetected += changes.length;
            for (const change of changes) {
              await logInfraEvent({
                provider: provider.id, provider_name: provider.name,
                severity: ['Power State', 'Status', 'Health'].includes(change.label) ? 'Warning' : 'Info',
                event_type: 'Change Detected',
                asset: existing.id, asset_name: existing.name,
                description: `${change.label} changed: ${change.old_value} → ${change.new_value}`,
                change_type: change.label,
                old_value: change.old_value, new_value: change.new_value,
              });
            }
            await logInfraEvent({
              provider: provider.id, provider_name: provider.name,
              severity: 'Info', event_type: 'Asset Updated',
              asset: existing.id, asset_name: existing.name,
              description: `Asset updated with ${changes.length} change(s)`,
            });
          }
        } else {
          const newAsset = await base44.entities.Asset.create({
            name: res.name, type: res.type, hostname: res.name,
            node: res.node, vmid: res.vmid, power_state: res.power_state,
            status: res.status, health: 'Healthy', role: 'Infrastructure',
            cpu_allocation: res.cpu_allocation, ram_allocation: res.ram_allocation,
            disk_allocation: res.disk_allocation, tags: res.tags,
            provider: provider.id, archived: false,
          });
          importedAssets++;
          await logInfraEvent({
            provider: provider.id, provider_name: provider.name,
            severity: 'Info', event_type: 'Asset Imported',
            asset: newAsset.id, asset_name: newAsset.name,
            description: `Asset imported: ${res.type} ${res.vmid} on ${res.node}`,
          });
        }
      } catch (err) {
        errors.push(`Failed to import VMID ${res.vmid}: ${err.message || err}`);
      }
    }

    for (const existing of existingAssets) {
      if (!existing.vmid || existing.archived) continue;
      const key = `${existing.vmid}:${existing.node}`;
      if (!discoveredKeys.has(key)) {
        const lastKnown = JSON.stringify({
          status: existing.status, health: existing.health,
          power_state: existing.power_state, node: existing.node,
        });
        await base44.entities.Asset.update(existing.id, {
          archived: true, archive_date: now,
          archive_reason: 'Asset no longer found on provider',
          last_known_state: lastKnown, status: 'Offline',
        });
        archivedAssets++;
        await logInfraEvent({
          provider: provider.id, provider_name: provider.name,
          severity: 'Warning', event_type: 'Asset Archived',
          asset: existing.id, asset_name: existing.name,
          description: `Asset archived: no longer found on ${provider.name}`,
        });
      }
    }

    const offlineNodeCount = nodeResult.nodes.filter(n => n.status !== 'Online').length;
    let health = 'Healthy';
    if (errors.length > 0 || offlineNodeCount > 0) health = 'Warning';
    if (errors.length > 3 || (nodeResult.nodes.length > 0 && offlineNodeCount === nodeResult.nodes.length)) health = 'Error';

    const duration = Date.now() - startTime;

    await base44.entities.InfrastructureProvider.update(provider.id, {
      status: 'Connected', health,
      last_sync: now, last_successful_sync: now,
      last_sync_duration: duration,
      sync_imported_count: importedAssets + importedNodes,
      sync_updated_count: updatedAssets + updatedNodes,
      sync_errors: errors, node_count: nodeResult.nodes.length,
    });

    await logInfraEvent({
      provider: provider.id, provider_name: provider.name,
      severity: 'Info', event_type: 'Sync Finished',
      description: `Sync completed: ${importedAssets} imported, ${updatedAssets} updated, ${archivedAssets} archived, ${changesDetected} changes detected in ${(duration / 1000).toFixed(1)}s`,
    });

    return { success: true, importedNodes, updatedNodes, importedAssets, updatedAssets, archivedAssets, changesDetected, errors, duration };
  } catch (err) {
    const duration = Date.now() - startTime;
    await base44.entities.InfrastructureProvider.update(provider.id, {
      status: 'Error', health: 'Error',
      last_sync: now, last_sync_duration: duration,
      sync_errors: [err.message || String(err)],
    });
    await logInfraEvent({
      provider: provider.id, provider_name: provider.name,
      severity: 'Error', event_type: 'Sync Failed',
      description: `Synchronization failed: ${err.message || err}`,
    });
    return { success: false, error: err.message || String(err), duration };
  }
}