// scripts/validate_agent_json.js
const fs = require('fs');
const path = require('path');

const filePathRoot = path.resolve(process.cwd(), 'agent.json');
const filePathWellKnown = path.resolve(process.cwd(), 'public', '.well-known', 'agent.json');

function load(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('JSON parse error for', file, e.message);
    process.exit(2);
  }
}

function assertMediaFields(obj, file) {
  const required = [
    'input_media_types',
    'default_input_media_type',
    'output_media_types',
    'default_output_media_type'
  ];
  let ok = true;
  required.forEach(k => {
    if (!Array.isArray(obj[k]) && typeof obj[k] === 'undefined') {
      console.error(`${file} missing required field: ${k} (must exist; arrays for lists)`);
      ok = false;
    }
    if (k === 'default_input_media_type' || k === 'default_output_media_type') {
      if (typeof obj[k] !== 'string') {
        console.error(`${file} ${k} must be a string`);
        ok = false;
      }
    }
  });
  return ok;
}

let allOk = true;
if (fs.existsSync(filePathRoot)) {
  const root = load(filePathRoot);
  allOk = allOk && assertMediaFields(root, 'agent.json');
} else {
  console.error('agent.json missing at repo root');
  allOk = false;
}

if (fs.existsSync(filePathWellKnown)) {
  const wk = load(filePathWellKnown);
  allOk = allOk && assertMediaFields(wk, 'public/.well-known/agent.json');
} else {
  console.warn('public/.well-known/agent.json not found — this is optional but recommended for Dashboard import');
}

if (!allOk) process.exit(3);
console.log('agent.json validation passed ✔️');

