/**
 * Proxmox VE API client utilities.
 *
 * Note: Proxmox VE does not set CORS headers by default, so direct browser
 * requests may be blocked. In production, route requests through a reverse
 * proxy (e.g. nginx) that adds CORS headers and forwards to the Proxmox API.
 * The functions below handle errors gracefully and return meaningful messages.
 */

function buildAuthHeader(tokenId, tokenSecret) {
  return `PVEAPIToken=${tokenId}=${tokenSecret}`;
}

function normalizeApiUrl(url) {
  if (!url) return '';
  let u = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(u)) {
    u = `https://${u}`;
  }
  return u;
}

/**
 * Test connection to a Proxmox VE API.
 * @param {object} config - { api_url, api_token_id, api_secret, ignore_ssl }
 * @returns {Promise<{ success: boolean, cluster?: string, version?: string, nodes?: number, latency?: number, error?: string }>}
 */
export async function testProxmoxConnection(config) {
  const baseUrl = normalizeApiUrl(config.api_url);
  const authHeader = buildAuthHeader(config.api_token_id, config.api_secret);

  if (!baseUrl) return { success: false, error: 'API URL is required.' };
  if (!config.api_token_id) return { success: false, error: 'API Token ID is required.' };
  if (!config.api_secret) return { success: false, error: 'API Secret is required.' };

  const startTime = performance.now();

  try {
    const [versionRes, clusterRes, nodesRes] = await Promise.all([
      fetch(`${baseUrl}/api2/json/version`, {
        headers: { Authorization: authHeader },
      }),
      fetch(`${baseUrl}/api2/json/cluster/status`, {
        headers: { Authorization: authHeader },
      }),
      fetch(`${baseUrl}/api2/json/nodes`, {
        headers: { Authorization: authHeader },
      }),
    ]);

    const latency = Math.round(performance.now() - startTime);

    if (!versionRes.ok) {
      const body = await versionRes.text().catch(() => '');
      if (versionRes.status === 401) {
        return { success: false, error: 'Authentication failed. Verify your API Token ID and Secret.' };
      }
      if (versionRes.status === 403) {
        return { success: false, error: 'Access denied. The API token lacks required permissions.' };
      }
      return { success: false, error: `Proxmox API returned HTTP ${versionRes.status}. ${body}` };
    }

    const versionData = await versionRes.json();
    const clusterData = clusterRes.ok ? await clusterRes.json() : { data: [] };
    const nodesData = nodesRes.ok ? await nodesRes.json() : { data: [] };

    const version = versionData?.data?.version || 'Unknown';
    const clusterInfo = (clusterData?.data || []).find(e => e.type === 'cluster');
    const clusterName = clusterInfo?.name || 'Standalone';
    const nodeCount = Array.isArray(nodesData?.data) ? nodesData.data.length : 0;

    return {
      success: true,
      cluster: clusterName,
      version,
      nodes: nodeCount,
      latency,
    };
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      return {
        success: false,
        error: 'Unable to reach the Proxmox API. This is often caused by CORS restrictions or network connectivity. Consider placing a reverse proxy in front of the Proxmox API that adds CORS headers.',
      };
    }
    return { success: false, error: msg };
  }
}

/**
 * Discover nodes from a Proxmox VE provider.
 * @param {object} provider - InfrastructureProvider entity
 * @returns {Promise<{ success: boolean, nodes?: array, error?: string }>}
 */
export async function discoverProxmoxNodes(provider) {
  const baseUrl = normalizeApiUrl(provider.api_url);
  const authHeader = buildAuthHeader(provider.api_token_id, provider.api_secret);

  try {
    const res = await fetch(`${baseUrl}/api2/json/nodes`, {
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      return { success: false, error: `API returned HTTP ${res.status}` };
    }

    const data = await res.json();
    const nodes = (data?.data || []).map(n => ({
      node_name: n.node,
      status: n.status === 'online' ? 'Online' : 'Offline',
      cpu_usage: n.cpu ? Math.round(n.cpu * 100) : 0,
      memory_usage: n.mem && n.maxmem ? Math.round((n.mem / n.maxmem) * 100) : 0,
      storage_usage: n.disk && n.maxdisk ? Math.round((n.disk / n.maxdisk) * 100) : 0,
      running_vms: 0,
      running_lxcs: 0,
      cpu_count: n.maxcpu || 0,
      memory_total: n.maxmem || 0,
      storage_total: n.maxdisk || 0,
    }));

    // Fetch VM/LXC counts per node
    for (const node of nodes) {
      try {
        const rr = await fetch(`${baseUrl}/api2/json/nodes/${node.node_name}/qemu`, {
          headers: { Authorization: authHeader },
        });
        if (rr.ok) {
          const rd = await rr.json();
          node.running_vms = (rd?.data || []).filter(v => v.status === 'running').length;
        }
      } catch { /* ignore per-node errors */ }

      try {
        const lr = await fetch(`${baseUrl}/api2/json/nodes/${node.node_name}/lxc`, {
          headers: { Authorization: authHeader },
        });
        if (lr.ok) {
          const ld = await lr.json();
          node.running_lxcs = (ld?.data || []).filter(c => c.status === 'running').length;
        }
      } catch { /* ignore per-node errors */ }
    }

    return { success: true, nodes };
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      return { success: false, error: 'Unable to reach the Proxmox API. Check network connectivity and CORS configuration.' };
    }
    return { success: false, error: msg };
  }
}

/**
 * Discover infrastructure (VMs + LXC containers) from a Proxmox VE provider.
 * @param {object} provider - InfrastructureProvider entity
 * @returns {Promise<{ success: boolean, resources?: array, error?: string }>}
 */
export async function discoverProxmoxResources(provider) {
  const baseUrl = normalizeApiUrl(provider.api_url);
  const authHeader = buildAuthHeader(provider.api_token_id, provider.api_secret);

  try {
    const res = await fetch(`${baseUrl}/api2/json/cluster/resources`, {
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      return { success: false, error: `API returned HTTP ${res.status}` };
    }

    const data = await res.json();
    const resources = (data?.data || [])
      .filter(r => r.type === 'qemu' || r.type === 'lxc')
      .map(r => ({
        vmid: String(r.vmid),
        name: r.name,
        type: r.type === 'qemu' ? 'VM' : 'LXC',
        node: r.node,
        power_state: r.status === 'running' ? 'Running' : r.status === 'stopped' ? 'Stopped' : 'Unknown',
        status: r.status === 'running' ? 'Online' : 'Offline',
        cpu_allocation: r.cpus ? Number(r.cpus) : null,
        ram_allocation: r.maxmem ? Math.round(r.maxmem / (1024 * 1024 * 1024) * 100) / 100 : null,
        disk_allocation: r.maxdisk ? Math.round(r.maxdisk / (1024 * 1024 * 1024) * 100) / 100 : null,
        tags: r.tags ? String(r.tags).split(/[;,]/).map(t => t.trim()).filter(Boolean) : [],
      }));

    return { success: true, resources };
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
      return { success: false, error: 'Unable to reach the Proxmox API. Check network connectivity and CORS configuration.' };
    }
    return { success: false, error: msg };
  }
}