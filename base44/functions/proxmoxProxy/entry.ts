import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function buildAuthHeader(tokenId, tokenSecret) {
  // Proxmox API Token auth format: PVEAPIToken=user@realm!tokenid=secret
  // The exclamation mark in the token ID must be preserved.
  return `PVEAPIToken=${tokenId}=${tokenSecret}`;
}

function normalizeApiUrl(url) {
  if (!url) return '';
  let u = url.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//.test(u)) {
    u = `https://${u}`;
  }
  // Force HTTPS for Proxmox default port 8006
  if (/^http:\/\//.test(u) && /:8006(\/|$)/.test(u)) {
    u = u.replace(/^http:/, 'https:');
  }
  return u;
}

function createFetchOptions(headers, ignoreSsl) {
  const options = { headers };
  if (ignoreSsl) {
    try {
      const createClient = globalThis.Deno?.createHttpClient;
      if (typeof createClient === 'function') {
        options.client = createClient({ acceptInvalidCerts: true });
      } else {
        console.log('[proxmoxProxy] Warning: Deno.createHttpClient not available — SSL certificates will be verified (ignore_ssl cannot be honored)');
      }
    } catch (e) {
      console.log('[proxmoxProxy] Warning: Failed to create HTTP client for ignore_ssl:', e.message);
    }
  }
  return options;
}

async function proxmoxFetch(baseUrl, path, authHeader, ignoreSsl) {
  const url = `${baseUrl}/api2/json${path}`;
  console.log(`[proxmoxProxy] >> Request URL: ${url}`);
  console.log(`[proxmoxProxy] >> Auth: PVEAPIToken=${authHeader.split('=')[1] ?? ''}=*** (secret redacted)`);
  const options = createFetchOptions({ Authorization: authHeader }, ignoreSsl);
  const res = await fetch(url, options);
  console.log(`[proxmoxProxy] << HTTP Status: ${res.status} ${res.statusText}`);
  return res;
}

async function readErrorBody(res) {
  const body = await res.text().catch(() => '');
  console.log(`[proxmoxProxy] << Response Body: ${body}`);
  return body;
}

async function handleTestConnection(creds) {
  const baseUrl = normalizeApiUrl(creds.api_url);
  if (!baseUrl) return { success: false, error: 'API URL is required.' };
  if (!creds.api_token_id) return { success: false, error: 'API Token ID is required.' };
  if (!creds.api_secret) return { success: false, error: 'API Secret is required.' };

  const authHeader = buildAuthHeader(creds.api_token_id, creds.api_secret);
  const ignoreSsl = creds.ignore_ssl || false;
  const startTime = Date.now();

  try {
    const versionRes = await proxmoxFetch(baseUrl, '/version', authHeader, ignoreSsl);
    const latency = Date.now() - startTime;

    if (!versionRes.ok) {
      const rawBody = await readErrorBody(versionRes);
      return {
        success: false,
        error: `Proxmox API returned HTTP ${versionRes.status}`,
        status: versionRes.status,
        raw_body: rawBody,
        latency,
      };
    }

    const versionBody = await readErrorBody(versionRes);
    const versionData = JSON.parse(versionBody);

    const clusterRes = await proxmoxFetch(baseUrl, '/cluster/status', authHeader, ignoreSsl);
    const nodesRes = await proxmoxFetch(baseUrl, '/nodes', authHeader, ignoreSsl);

    const clusterData = clusterRes.ok ? JSON.parse(await readErrorBody(clusterRes)) : { data: [] };
    const nodesData = nodesRes.ok ? JSON.parse(await readErrorBody(nodesRes)) : { data: [] };

    const version = versionData?.data?.version || 'Unknown';
    const clusterInfo = (clusterData?.data || []).find(e => e.type === 'cluster');
    const clusterName = clusterInfo?.name || 'Standalone';
    const nodeCount = Array.isArray(nodesData?.data) ? nodesData.data.length : 0;

    return { success: true, cluster: clusterName, version, nodes: nodeCount, latency };
  } catch (err) {
    const msg = err?.message || String(err);
    console.log(`[proxmoxProxy] Exception: ${msg}`);
    return { success: false, error: msg };
  }
}

async function handleDiscoverNodes(provider) {
  const baseUrl = normalizeApiUrl(provider.api_url);
  const authHeader = buildAuthHeader(provider.api_token_id, provider.api_secret);
  const ignoreSsl = provider.ignore_ssl || false;

  try {
    const res = await proxmoxFetch(baseUrl, '/nodes', authHeader, ignoreSsl);
    if (!res.ok) {
      const rawBody = await readErrorBody(res);
      return { success: false, error: `Proxmox API returned HTTP ${res.status}`, status: res.status, raw_body: rawBody };
    }

    const body = await readErrorBody(res);
    const data = JSON.parse(body);
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

    for (const node of nodes) {
      try {
        const rr = await proxmoxFetch(baseUrl, `/nodes/${node.node_name}/qemu`, authHeader, ignoreSsl);
        if (rr.ok) {
          const rd = JSON.parse(await readErrorBody(rr));
          node.running_vms = (rd?.data || []).filter(v => v.status === 'running').length;
        }
      } catch { }

      try {
        const lr = await proxmoxFetch(baseUrl, `/nodes/${node.node_name}/lxc`, authHeader, ignoreSsl);
        if (lr.ok) {
          const ld = JSON.parse(await readErrorBody(lr));
          node.running_lxcs = (ld?.data || []).filter(c => c.status === 'running').length;
        }
      } catch { }
    }

    return { success: true, nodes };
  } catch (err) {
    const msg = err?.message || String(err);
    console.log(`[proxmoxProxy] Exception: ${msg}`);
    return { success: false, error: msg };
  }
}

async function handleDiscoverResources(provider) {
  const baseUrl = normalizeApiUrl(provider.api_url);
  const authHeader = buildAuthHeader(provider.api_token_id, provider.api_secret);
  const ignoreSsl = provider.ignore_ssl || false;

  try {
    const res = await proxmoxFetch(baseUrl, '/cluster/resources', authHeader, ignoreSsl);
    if (!res.ok) {
      const rawBody = await readErrorBody(res);
      return { success: false, error: `Proxmox API returned HTTP ${res.status}`, status: res.status, raw_body: rawBody };
    }

    const body = await readErrorBody(res);
    const data = JSON.parse(body);
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
    console.log(`[proxmoxProxy] Exception: ${msg}`);
    return { success: false, error: msg };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, provider_id, config } = body;

    console.log(`[proxmoxProxy] Action: ${action}, provider_id: ${provider_id || '(none)'}`);

    if (!action) return Response.json({ error: 'Action is required' }, { status: 400 });

    let result;

    if (action === 'test_connection') {
      let creds;
      if (provider_id) {
        creds = await base44.entities.InfrastructureProvider.get(provider_id);
      } else if (config) {
        creds = config;
      } else {
        return Response.json({ error: 'Either provider_id or config is required' }, { status: 400 });
      }
      result = await handleTestConnection(creds);
    } else if (action === 'discover_nodes') {
      if (!provider_id) return Response.json({ error: 'provider_id is required' }, { status: 400 });
      const provider = await base44.entities.InfrastructureProvider.get(provider_id);
      result = await handleDiscoverNodes(provider);
    } else if (action === 'discover_resources') {
      if (!provider_id) return Response.json({ error: 'provider_id is required' }, { status: 400 });
      const provider = await base44.entities.InfrastructureProvider.get(provider_id);
      result = await handleDiscoverResources(provider);
    } else {
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }

    return Response.json(result);
  } catch (error) {
    console.log(`[proxmoxProxy] Handler exception: ${error.message || error}`);
    return Response.json({ error: error.message || String(error) }, { status: 500 });
  }
});