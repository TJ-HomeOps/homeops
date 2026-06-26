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