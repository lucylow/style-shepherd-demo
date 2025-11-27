#!/usr/bin/env node
/**
 * scripts/register_agent.cjs
 * Generates verisense-agent-manifest.json from env or defaults and prints next steps.
 *
 * Usage:
 *   node scripts/register_agent.cjs
 *   or set env vars and run: DEPLOY_URL=https://app.example.com node scripts/register_agent.cjs
 */

const fs = require('fs');
const path = require('path');

const outPath = path.join(process.cwd(), 'verisense-agent-manifest.json');

const opts = {
  name: process.env.AGENT_NAME || 'style-shepherd-agent',
  title: process.env.AGENT_TITLE || 'Style Shepherd — Personal Shopper & Makeup Artist Agent',
  description:
    process.env.AGENT_DESCRIPTION ||
    'Voice-first Personal Shopper, Makeup Artist and Style Guide agent that proactively reduces returns by recommending sizes, outfits, and makeup looks.',
  version: process.env.AGENT_VERSION || '0.1.0',
  ownerName: process.env.OWNER_NAME || 'Lucy Low',
  ownerEmail: process.env.OWNER_EMAIL || 'low.lucyy@gmail.com',
  ownerOrg: process.env.OWNER_ORG || 'Style Shepherd (hackathon)',
  deployUrl: process.env.DEPLOY_URL || '<YOUR_DEPLOYED_URL>',
  webhookPath: process.env.WEBHOOK_PATH || '/api/verisense/agent-webhook',
  uiPath: process.env.UI_PATH || '/verisense-demo',
  oauthPath: process.env.OAUTH_PATH || '/api/verisense/oauth-callback'
};

const manifest = {
  name: opts.name,
  title: opts.title,
  description: opts.description,
  version: opts.version,
  owner: {
    name: opts.ownerName,
    email: opts.ownerEmail,
    organization: opts.ownerOrg
  },
  endpoints: {
    webhook: `${opts.deployUrl}${opts.webhookPath}`,
    ui: `${opts.deployUrl}${opts.uiPath}`,
    oauth_callback: `${opts.deployUrl}${opts.oauthPath}`
  },
  scopes: ['profile:read', 'catalog:read', 'orders:write'],
  tags: ['personal-shopper', 'makeup', 'returns-prevention', 'voice-agent', 'fashion'],
  manifestCreatedAt: new Date().toISOString(),
  notes: 'Replace placeholders before uploading to the Verisense dashboard.'
};

fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`Wrote manifest to ${outPath}\n`);
console.log('Next steps:');
console.log('  1) Replace <YOUR_DEPLOYED_URL> in the manifest with your actual deployment URL (if still present).');
console.log('  2) Sign into the Verisense Dashboard: https://dashboard.verisense.network/');
console.log('  3) Create a new Agent / MCP and upload this manifest (choose "Upload manifest" or paste JSON).');
console.log('  4) Follow the dashboard onboarding steps to set up credentials and webhooks.');
console.log('  5) If your agent requires OAuth, configure the callback URL to the manifest oauth_callback value.');
console.log('\nIf you want, run `node scripts/register_agent.cjs DEPLOY_URL=https://app.example.com` to auto-fill the URL.\n');

