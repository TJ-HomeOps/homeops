import { base44 } from '@/api/base44Client';

export async function logActivity(action, entityType, entityId, entityName, details) {
  await base44.entities.ActivityLog.create({
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details: details || ''
  });
}