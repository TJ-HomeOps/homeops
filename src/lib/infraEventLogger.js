import { base44 } from '@/api/base44Client';

export async function logInfraEvent({ provider, provider_name, severity, event_type, asset, asset_name, description, change_type, old_value, new_value }) {
  await base44.entities.InfrastructureEvent.create({
    timestamp: new Date().toISOString(),
    provider: provider || '',
    provider_name: provider_name || '',
    severity: severity || 'Info',
    event_type,
    asset: asset || '',
    asset_name: asset_name || '',
    description: description || '',
    change_type: change_type || '',
    old_value: old_value || '',
    new_value: new_value || '',
  });
}