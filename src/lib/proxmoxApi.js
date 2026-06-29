import { base44 } from '@/api/base44Client';

/**
 * Proxmox VE API client utilities.
 *
 * All Proxmox API calls are routed through a secure backend function
 * (proxmoxProxy). The browser never makes direct requests to the Proxmox
 * API — this avoids CORS failures, prevents credential exposure, and
 * supports private infrastructure that is not reachable from the browser.
 *
 * Architecture:  Browser → Base44 Backend Function → Proxmox API
 */

export async function testProxmoxConnection(config) {
  const response = await base44.functions.invoke('proxmoxProxy', {
    action: 'test_connection',
    config,
  });
  return response.data;
}

export async function discoverProxmoxNodes(provider) {
  const response = await base44.functions.invoke('proxmoxProxy', {
    action: 'discover_nodes',
    provider_id: provider.id,
  });
  return response.data;
}

export async function discoverProxmoxResources(provider) {
  const response = await base44.functions.invoke('proxmoxProxy', {
    action: 'discover_resources',
    provider_id: provider.id,
  });
  return response.data;
}