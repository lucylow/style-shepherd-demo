#!/usr/bin/env node
/**
 * scripts/validate_manifest.cjs
 * Basic validation to ensure required fields exist in verisense-agent-manifest.json
 */

const fs = require('fs');
const path = require('path');

const mpath = path.join(process.cwd(), 'verisense-agent-manifest.json');

if (!fs.existsSync(mpath)) {
  console.error('Error: verisense-agent-manifest.json not found at repo root.');
  process.exit(2);
}

const raw = fs.readFileSync(mpath, 'utf8');
let manifest;
try {
  manifest = JSON.parse(raw);
} catch (err) {
  console.error('Error: manifest is not valid JSON:', err.message);
  process.exit(3);
}

const required = ['name', 'title', 'description', 'version', 'owner', 'endpoints', 'scopes'];
const missing = required.filter((k) => !(k in manifest));
if (missing.length) {
  console.error('Manifest validation failed. Missing fields:', missing.join(', '));
  process.exit(4);
}

if (!manifest.endpoints || !manifest.endpoints.webhook || !manifest.endpoints.ui) {
  console.error('Manifest validation failed. endpoints.webhook and endpoints.ui are required.');
  process.exit(5);
}

console.log('Manifest looks valid ✅');
process.exit(0);

