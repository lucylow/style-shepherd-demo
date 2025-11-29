// scripts/validate_agent_json.js
// Validates agent.json meets Verisense hackathon requirements
const fs = require('fs');
const path = require('path');

const filePathRoot = path.resolve(process.cwd(), 'agent.json');
const filePathWellKnown = path.resolve(process.cwd(), 'public', '.well-known', 'agent.json');

function load(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error(`❌ JSON parse error for ${file}:`, e.message);
    process.exit(2);
  }
}

function validateRequiredFields(obj, file) {
  const requiredFields = [
    'id',
    'name',
    'description',
    'version',
    'url',
    'icon',
    'documentation_url',
    'provider',
    'default_input_media_type',
    'default_output_media_type',
    'input_media_types',
    'output_media_types',
    'security',
    'capabilities'
  ];
  
  let ok = true;
  const missing = [];
  
  requiredFields.forEach(field => {
    if (typeof obj[field] === 'undefined') {
      missing.push(field);
      ok = false;
    }
  });
  
  if (missing.length > 0) {
    console.error(`❌ ${file} missing required fields:`, missing.join(', '));
  }
  
  // Validate provider is an object with required fields
  if (obj.provider && typeof obj.provider !== 'object') {
    console.error(`❌ ${file}: provider must be an object`);
    ok = false;
  }
  
  // Validate security is an array
  if (!Array.isArray(obj.security)) {
    console.error(`❌ ${file}: security must be an array (can be empty [])`);
    ok = false;
  }
  
  // Validate capabilities
  if (obj.capabilities) {
    if (typeof obj.capabilities !== 'object') {
      console.error(`❌ ${file}: capabilities must be an object`);
      ok = false;
    } else {
      if (!Array.isArray(obj.capabilities.protocols) || 
          !obj.capabilities.protocols.includes('A2A') ||
          !obj.capabilities.protocols.includes('MCP') ||
          !obj.capabilities.protocols.includes('AP2')) {
        console.error(`❌ ${file}: capabilities.protocols must include ["A2A","MCP","AP2"]`);
        ok = false;
      }
      if (obj.capabilities.streaming !== true) {
        console.error(`❌ ${file}: capabilities.streaming must be true`);
        ok = false;
      }
    }
  }
  
  // Validate media types
  if (!Array.isArray(obj.input_media_types)) {
    console.error(`❌ ${file}: input_media_types must be an array`);
    ok = false;
  }
  if (!Array.isArray(obj.output_media_types)) {
    console.error(`❌ ${file}: output_media_types must be an array`);
    ok = false;
  }
  if (typeof obj.default_input_media_type !== 'string') {
    console.error(`❌ ${file}: default_input_media_type must be a string`);
    ok = false;
  }
  if (typeof obj.default_output_media_type !== 'string') {
    console.error(`❌ ${file}: default_output_media_type must be a string`);
    ok = false;
  }
  
  return ok;
}

let allOk = true;

// Validate root agent.json
if (fs.existsSync(filePathRoot)) {
  const root = load(filePathRoot);
  allOk = allOk && validateRequiredFields(root, 'agent.json');
} else {
  console.error('❌ agent.json missing at repo root');
  allOk = false;
}

// Validate .well-known/agent.json (warn if missing, validate if present)
if (fs.existsSync(filePathWellKnown)) {
  const wk = load(filePathWellKnown);
  allOk = allOk && validateRequiredFields(wk, 'public/.well-known/agent.json');
} else {
  console.warn('⚠️  public/.well-known/agent.json not found — creating it now');
  // Create the directory and copy agent.json
  const wellKnownDir = path.dirname(filePathWellKnown);
  if (!fs.existsSync(wellKnownDir)) {
    fs.mkdirSync(wellKnownDir, { recursive: true });
  }
  if (fs.existsSync(filePathRoot)) {
    fs.copyFileSync(filePathRoot, filePathWellKnown);
    console.log('✅ Created public/.well-known/agent.json from agent.json');
  }
}

if (!allOk) {
  console.error('\n❌ Validation failed. Please fix the errors above.');
  process.exit(1);
}

console.log('\n✅ agent.json validation passed!');
process.exit(0);

