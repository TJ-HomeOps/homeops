export function calculateInfrastructureHealth(assets, cases) {
  if (!assets || assets.length === 0) return 100;
  const warningAssets = assets.filter(a => a.health === 'Warning').length;
  const criticalAssets = assets.filter(a => a.health === 'Critical').length;
  const criticalCases = (cases || []).filter(c => c.priority === 'Critical' && c.status !== 'Closed').length;

  let health = 100;
  health -= warningAssets * 5;
  health -= criticalAssets * 15;
  health -= criticalCases * 10;

  return Math.max(0, Math.min(100, Math.round(health)));
}

export function healthColor(health) {
  if (health >= 80) return '#22C55E';
  if (health >= 50) return '#F59E0B';
  return '#EF4444';
}

export function healthLabel(health) {
  if (health >= 80) return 'Operational';
  if (health >= 50) return 'Degraded';
  if (health >= 25) return 'Warning';
  return 'Critical';
}

const SYNC_INTERVAL_MINUTES = {
  'Every 5 Minutes': 5,
  'Every 15 Minutes': 15,
  'Every Hour': 60,
  'Daily': 1440,
};

export function calculateProviderHealth(provider, providerNodes) {
  if (!provider) return 'Unknown';
  if (provider.status === 'Error') return 'Error';
  if (provider.status !== 'Connected') return 'Unknown';

  let score = 100;

  if (provider.sync_errors && provider.sync_errors.length > 0) {
    score -= 20;
  }

  if (provider.last_successful_sync) {
    const ageMinutes = (Date.now() - new Date(provider.last_successful_sync).getTime()) / 60000;
    const interval = SYNC_INTERVAL_MINUTES[provider.sync_mode] || 0;
    if (interval > 0 && ageMinutes > interval * 2) {
      score -= 30;
    } else if (interval > 0 && ageMinutes > interval) {
      score -= 15;
    }
    if (ageMinutes > 1440) {
      score -= 20;
    }
  } else {
    score -= 35;
  }

  const nodes = (providerNodes || []).filter(n => n.provider === provider.id);
  const offlineNodes = nodes.filter(n => n.status !== 'Online');
  if (nodes.length > 0) {
    score -= offlineNodes.length * (15 / nodes.length) * 3;
  }

  if (score >= 80) return 'Healthy';
  if (score >= 50) return 'Warning';
  return 'Error';
}