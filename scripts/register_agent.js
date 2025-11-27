// scripts/register_agent.js
// Usage:
//    node scripts/register_agent.js
// Optional env:
//    VERISENSE_API_KEY - if present, script will attempt to POST the manifest
//    VERISENSE_REGISTRY_URL - default: https://dashboard.verisense.network/api/agents (placeholder)
// Output:
//    verisense-agent-manifest.json at repo root
//
// Note: This script is safe to run in demo mode (no key required) — it will save the manifest locally and print the curl command.

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

// Use native fetch if available (Node 18+), otherwise we'll handle gracefully
let fetch;
try {
  // Try to use native fetch (Node 18+)
  if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
  } else {
    // Fallback: try to require node-fetch if available
    fetch = require('node-fetch');
  }
} catch (e) {
  // If fetch is not available, we'll skip upload functionality
  fetch = null;
}

function getPkg() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    return pkg;
  } catch (e) {
    return { name: 'style-shepherd-demo', version: '0.0.0', description: '' };
  }
}

function buildManifest({ override = {} } = {}) {
  const pkg = getPkg();
  const id = override.id || process.env.VERISENSE_AGENT_ID || `style-shepherd-${randomUUID()}`;
  const name = override.name || pkg.name || 'style-shepherd-demo';
  const version = override.version || pkg.version || '0.1.0';
  const description = override.description || pkg.description || 'Style Shepherd — voice-first returns-prevention assistant (demo)';
  const author = override.author || (pkg.author && (typeof pkg.author === 'string' ? pkg.author : pkg.author.name)) || 'Lucy Low';

  const entrypoint = override.entrypoint || process.env.AGENT_ENTRYPOINT || '/verisense-demo'; // UI route or MiniApp entry
  const manifest = {
    id,
    name,
    version,
    description,
    author,
    capabilities: {
      a2a: true,
      miniapp: true,
      mcp: true
    },
    entrypoint,
    ui: {
      // relative paths or hosted urls, used by Verisense dashboard when rendering a MiniApp
      url: override.url || process.env.AGENT_UI_URL || `https://your-deploy.example.com${entrypoint}`,
      width: 360,
      height: 720
    },
    scopes: [
      'profile:read',
      'catalog:read',
      'transactions:write',
      'memory:read',
      'memory:write'
    ],
    webhooks: override.webhooks || [
      { name: 'order_update', url: override.webhook_order_update || process.env.WEBHOOK_ORDER_UPDATE || 'https://your-backend.example.com/webhooks/order' }
    ],
    metadata: {
      contact_email: process.env.REGISTER_CONTACT_EMAIL || override.contact_email || 'low.lucyy@gmail.com',
      repo: override.repo || process.env.REPO_URL || 'https://github.com/lucylow/style-shepherd-demo',
      hackathon: override.hackathon || 'AI Champion Ship / Verisense'
    },
    policies: {
      privacy: override.privacy_url || process.env.PRIVACY_URL || 'https://your-app.example.com/privacy',
      terms: override.terms_url || process.env.TERMS_URL || 'https://your-app.example.com/terms'
    },
    created_at: new Date().toISOString()
  };

  return manifest;
}

async function tryUpload(manifest, apiKey, registryUrl) {
  if (!fetch) {
    console.log('Fetch not available - skipping upload. Install node-fetch or use Node 18+ for automatic upload.');
    return { ok: false, error: 'fetch not available' };
  }

  try {
    console.log('Attempting to upload manifest to Verisense registry...');
    const url = registryUrl.replace(/\/$/, '') + '/register'; // endpoint assumed; adapt if necessary
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(manifest)
    });
    const txt = await resp.text();
    if (!resp.ok) {
      console.error('Registry responded with non-OK:', resp.status, txt);
      return { ok: false, status: resp.status, body: txt };
    }
    console.log('Upload success. Registry response:', txt);
    return { ok: true, status: resp.status, body: txt };
  } catch (e) {
    console.error('Upload failed:', e?.message || e);
    return { ok: false, error: e?.message || String(e) };
  }
}

async function main() {
  const manifest = buildManifest();
  const outPath = path.join(process.cwd(), 'verisense-agent-manifest.json');
  fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('Wrote manifest ->', outPath);

  const apiKey = process.env.VERISENSE_API_KEY;
  const registryUrl = process.env.VERISENSE_REGISTRY_URL || 'https://dashboard.verisense.network/api/agents';
  if (apiKey) {
    const result = await tryUpload(manifest, apiKey, registryUrl);
    if (!result.ok) {
      console.log('Upload failed or returned non-OK. You can retry manually with the curl command printed below.');
    } else {
      console.log('Manifest uploaded to registry. Please check Verisense Dashboard for agent listing.');
    }
  } else {
    console.log('No VERISENSE_API_KEY found. Skipping upload.');
  }

  // Print a ready-to-run curl command for manual upload if user wants to do it later:
  console.log('\nManual upload example (copy & paste, replace YOUR_KEY):');
  console.log(`curl -X POST ${registryUrl.replace(/\/$/, '')}/register -H "Authorization: Bearer YOUR_KEY" -H "Content-Type: application/json" -d @verisense-agent-manifest.json`);
  console.log('\nIf registry requires multipart/form-data (file upload), use:');
  console.log(`curl -X POST ${registryUrl.replace(/\/$/, '')}/upload -H "Authorization: Bearer YOUR_KEY" -F "manifest=@verisense-agent-manifest.json"`);
}

main().catch(err => { console.error(err); process.exit(1); });
