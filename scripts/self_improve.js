#!/usr/bin/env node

/**
 * Self-Improvement Loop (Demo)
 * Reads returns history, computes heuristic updates, writes model metadata
 * 
 * Usage:
 *   node scripts/self_improve.js
 */

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'data', 'returns_history_small.csv');
const MODEL_DIR = path.join(process.cwd(), 'models');
const LOG_DIR = path.join(process.cwd(), 'logs', 'self_improve');

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

ensureDir(MODEL_DIR);
ensureDir(LOG_DIR);

/**
 * Parse CSV file
 */
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const record = {};
    headers.forEach((header, idx) => {
      let value = values[idx] || '';
      // Try to parse as number if it looks like one
      if (value && !isNaN(value) && value.trim() !== '') {
        value = parseFloat(value);
      }
      record[header.trim()] = value;
    });
    records.push(record);
  }
  
  return records;
}

/**
 * Compute heuristic updates from returns history
 */
function computeHeuristicUpdate(records) {
  // Analyze size-related returns
  const sizeReturns = records.filter(r => r.returned == 1 && r.return_reason && 
    (r.return_reason.includes('size') || r.return_reason.includes('Size')));
  
  const totalReturns = records.filter(r => r.returned == 1).length;
  const sizeReturnRate = sizeReturns.length / (totalReturns || 1);
  
  // Analyze fit-related returns
  const fitReturns = records.filter(r => r.returned == 1 && r.return_reason && 
    r.return_reason.includes('fit'));
  
  const fitReturnRate = fitReturns.length / (totalReturns || 1);
  
  // Current heuristic weights (defaults)
  let sizeConfidenceMultiplier = 0.85;
  let fitConfidenceMultiplier = 0.80;
  
  // Adjust multipliers based on data
  // If size returns are high, increase size confidence importance
  if (sizeReturnRate > 0.6) {
    sizeConfidenceMultiplier = Math.min(0.95, sizeConfidenceMultiplier + 0.05);
  } else if (sizeReturnRate < 0.4) {
    sizeConfidenceMultiplier = Math.max(0.75, sizeConfidenceMultiplier - 0.03);
  }
  
  if (fitReturnRate > 0.3) {
    fitConfidenceMultiplier = Math.min(0.90, fitConfidenceMultiplier + 0.04);
  }
  
  // Compute average return rate by size
  const sizeStats = {};
  records.forEach(r => {
    if (r.size) {
      if (!sizeStats[r.size]) {
        sizeStats[r.size] = { total: 0, returned: 0 };
      }
      sizeStats[r.size].total++;
      if (r.returned == 1) {
        sizeStats[r.size].returned++;
      }
    }
  });
  
  const sizeReturnRates = {};
  Object.keys(sizeStats).forEach(size => {
    sizeReturnRates[size] = sizeStats[size].returned / sizeStats[size].total;
  });
  
  return {
    size_confidence_multiplier: Math.round(sizeConfidenceMultiplier * 100) / 100,
    fit_confidence_multiplier: Math.round(fitConfidenceMultiplier * 100) / 100,
    size_return_rates: sizeReturnRates,
    analysis: {
      total_records: records.length,
      total_returns: totalReturns,
      size_return_rate: Math.round(sizeReturnRate * 100) / 100,
      fit_return_rate: Math.round(fitReturnRate * 100) / 100,
      updated_at: new Date().toISOString(),
    },
  };
}

/**
 * Load existing heuristic or return defaults
 */
function loadHeuristic() {
  const heuristicPath = path.join(MODEL_DIR, 'heuristic.json');
  
  if (fs.existsSync(heuristicPath)) {
    try {
      return JSON.parse(fs.readFileSync(heuristicPath, 'utf8'));
    } catch (error) {
      console.warn('⚠️  Failed to load existing heuristic, using defaults');
    }
  }
  
  // Default heuristic
  return {
    size_confidence_multiplier: 0.85,
    fit_confidence_multiplier: 0.80,
    version: '1.0.0',
    created_at: new Date().toISOString(),
  };
}

/**
 * Write heuristic model
 */
function writeHeuristic(heuristic) {
  const heuristicPath = path.join(MODEL_DIR, 'heuristic.json');
  const updated = {
    ...heuristic,
    version: (parseFloat(heuristic.version || '1.0.0') + 0.1).toFixed(1),
    updated_at: new Date().toISOString(),
  };
  
  fs.writeFileSync(heuristicPath, JSON.stringify(updated, null, 2), 'utf8');
  return heuristicPath;
}

/**
 * Write improvement log
 */
function writeImprovementLog(update, oldHeuristic, newHeuristic) {
  const timestamp = Date.now();
  const logEntry = {
    timestamp: new Date().toISOString(),
    update,
    old_heuristic: oldHeuristic,
    new_heuristic: newHeuristic,
    changes: {
      size_multiplier_delta: (newHeuristic.size_confidence_multiplier - oldHeuristic.size_confidence_multiplier).toFixed(3),
      fit_multiplier_delta: (newHeuristic.fit_confidence_multiplier - oldHeuristic.fit_confidence_multiplier).toFixed(3),
    },
  };
  
  const logPath = path.join(LOG_DIR, `improvement_${timestamp}.json`);
  fs.writeFileSync(logPath, JSON.stringify(logEntry, null, 2), 'utf8');
  return logPath;
}

/**
 * Main function
 */
function main() {
  console.log('🧠 Style Shepherd Self-Improvement Loop');
  console.log('========================================\n');
  
  try {
    // Load returns history
    if (!fs.existsSync(DATA_PATH)) {
      throw new Error(`Data file not found at ${DATA_PATH}`);
    }
    
    console.log(`Loading returns history from ${DATA_PATH}...`);
    const records = parseCSV(DATA_PATH);
    console.log(`Loaded ${records.length} records.\n`);
    
    // Load existing heuristic
    const oldHeuristic = loadHeuristic();
    console.log('Current heuristic:');
    console.log(`  Size confidence multiplier: ${oldHeuristic.size_confidence_multiplier}`);
    console.log(`  Fit confidence multiplier: ${oldHeuristic.fit_confidence_multiplier}\n`);
    
    // Compute updates
    console.log('Computing heuristic updates...');
    const update = computeHeuristicUpdate(records);
    
    // Merge with existing heuristic
    const newHeuristic = {
      ...oldHeuristic,
      ...update,
    };
    
    console.log('Updated heuristic:');
    console.log(`  Size confidence multiplier: ${newHeuristic.size_confidence_multiplier}`);
    console.log(`  Fit confidence multiplier: ${newHeuristic.fit_confidence_multiplier}`);
    console.log(`  Size return rates:`, newHeuristic.size_return_rates);
    console.log(`  Analysis:`, newHeuristic.analysis);
    console.log();
    
    // Write updated heuristic
    const heuristicPath = writeHeuristic(newHeuristic);
    console.log(`✅ Heuristic saved to: ${heuristicPath}`);
    
    // Write improvement log
    const logPath = writeImprovementLog(update, oldHeuristic, newHeuristic);
    console.log(`✅ Improvement log saved to: ${logPath}\n`);
    
    console.log('Self-improvement cycle completed!');
  } catch (error) {
    console.error('❌ Self-improvement failed:', error.message);
    process.exit(1);
  }
}

// Run main
main();

