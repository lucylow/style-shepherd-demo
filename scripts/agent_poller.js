#!/usr/bin/env node

/**
 * Autonomous Agent Poller
 * Polls merchant catalog, runs returns prediction, creates demo invoices when threshold met
 * 
 * Usage:
 *   node scripts/agent_poller.js [--once]
 * 
 * Environment variables:
 *   POLL_INTERVAL_MS (default: 15000) - Polling interval in milliseconds
 *   PREVENTED_VALUE_THRESHOLD_CENTS (default: 5000) - Threshold in cents
 *   API_BASE_URL (default: http://localhost:3001) - Backend API base URL
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const CATALOG_PATH = path.join(process.cwd(), 'mocks', 'merchants', 'catalog.json');
const INVOICES_DIR = path.join(process.cwd(), 'logs', 'demo_invoices');
const EVIDENCE_DIR = path.join(process.cwd(), 'logs', 'evidence');

const POLL_INTERVAL_MS = parseInt(process.env.POLL_INTERVAL_MS || '15000', 10);
const THRESHOLD_CENTS = parseInt(process.env.PREVENTED_VALUE_THRESHOLD_CENTS || '5000', 10);
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

const args = process.argv.slice(2);
const RUN_ONCE = args.includes('--once');

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

ensureDir(INVOICES_DIR);
ensureDir(EVIDENCE_DIR);

/**
 * Make HTTP POST request
 */
function httpPost(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Call returns predictor API
 */
async function callReturnsPredictor(product) {
  try {
    const response = await httpPost(`${API_BASE_URL}/api/tools/returns-predictor`, {
      product_id: product.product_id,
      size: product.available_sizes?.[0] || 'M',
      metadata: product.metadata || {},
    });
    
    if (response.status === 200) {
      return response.data;
    }
    throw new Error(`API returned ${response.status}`);
  } catch (error) {
    console.warn(`⚠️  Returns predictor API failed for ${product.product_id}, using fallback:`, error.message);
    // Fallback: simple deterministic mock
    const baseProb = 0.35;
    const afterProb = 0.20;
    return {
      before_prob: baseProb,
      after_prob: afterProb,
      confidence: 0.87,
      demo_mode: true,
    };
  }
}

/**
 * Call payment manager API (AP2 demo flow)
 */
async function createPaymentIntent(orderValue, product) {
  try {
    // Step 1: Create intent
    const intentRes = await httpPost(`${API_BASE_URL}/api/tools/payment-manager/intent`, {
      amount: Math.round(orderValue * 100), // Convert to cents
      currency: 'USD',
      description: `Demo invoice for ${product.product_title}`,
    });
    
    if (intentRes.status !== 200) {
      throw new Error(`Intent creation failed: ${intentRes.status}`);
    }
    
    const intentId = intentRes.data.id;
    
    // Step 2: Create cart mandate
    const cartRes = await httpPost(`${API_BASE_URL}/api/tools/payment-manager/cart`, {
      intent_id: intentId,
      items: [{
        product_id: product.product_id,
        quantity: 1,
        price: orderValue,
      }],
    });
    
    if (cartRes.status !== 200) {
      throw new Error(`Cart creation failed: ${cartRes.status}`);
    }
    
    // Step 3: Confirm payment (demo)
    const confirmRes = await httpPost(`${API_BASE_URL}/api/tools/payment-manager/confirm`, {
      cart_id: cartRes.data.id,
    });
    
    return {
      intent_id: intentId,
      cart_id: cartRes.data.id,
      payment_id: confirmRes.data?.id,
      status: 'completed',
    };
  } catch (error) {
    console.warn(`⚠️  Payment manager API failed:`, error.message);
    // Return mock payment for demo
    return {
      intent_id: `intent_mock_${Date.now()}`,
      cart_id: `cart_mock_${Date.now()}`,
      payment_id: `payment_mock_${Date.now()}`,
      status: 'completed',
      demo_mode: true,
    };
  }
}

/**
 * Write demo invoice
 */
function writeDemoInvoice(invoice) {
  const timestamp = Date.now();
  const filename = `demo_invoice_${invoice.order_id || 'unknown'}_${timestamp}.json`;
  const filePath = path.join(INVOICES_DIR, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(invoice, null, 2), 'utf8');
  return filePath;
}

/**
 * Write evidence log
 */
function writeEvidenceLog(evidence) {
  const timestamp = Date.now();
  const evidenceId = evidence.request_id || `ev_${timestamp}`;
  const filename = `${timestamp}_${evidenceId}.json`;
  const filePath = path.join(EVIDENCE_DIR, filename);
  
  fs.writeFileSync(filePath, JSON.stringify(evidence, null, 2), 'utf8');
  return filePath;
}

/**
 * Process a single catalog item
 */
async function processCatalogItem(product, index, total) {
  console.log(`\n[${index + 1}/${total}] Processing ${product.product_title}...`);
  
  // Call returns predictor
  const prediction = await callReturnsPredictor(product);
  console.log(`  Before prob: ${(prediction.before_prob * 100).toFixed(1)}%`);
  console.log(`  After prob: ${(prediction.after_prob * 100).toFixed(1)}%`);
  
  const preventedProb = prediction.before_prob - prediction.after_prob;
  const orderValue = product.price || 100;
  const preventedValueCents = Math.round(preventedProb * orderValue * 100);
  
  console.log(`  Prevented value: $${(preventedValueCents / 100).toFixed(2)} (${preventedValueCents} cents)`);
  
  if (preventedValueCents >= THRESHOLD_CENTS) {
    console.log(`  ⚡ Above threshold (${THRESHOLD_CENTS} cents): Creating invoice...`);
    
    // Create demo invoice
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invoice = {
      invoice_id: `inv_${Date.now()}`,
      order_id: orderId,
      product_id: product.product_id,
      product_title: product.product_title,
      order_value: orderValue,
      prevented_value: preventedValueCents / 100,
      commission_rate: 0.15,
      commission_amount: Math.round(preventedValueCents * 0.15) / 100,
      created_at: new Date().toISOString(),
      prediction: {
        before_prob: prediction.before_prob,
        after_prob: prediction.after_prob,
        confidence: prediction.confidence,
      },
      demo_mode: true,
    };
    
    const invoicePath = writeDemoInvoice(invoice);
    console.log(`  ✅ Invoice created: ${invoicePath}`);
    
    // Call payment manager (AP2 flow)
    const payment = await createPaymentIntent(orderValue, product);
    invoice.payment = payment;
    
    // Update invoice with payment info
    fs.writeFileSync(invoicePath, JSON.stringify(invoice, null, 2), 'utf8');
    
    // Write evidence log
    const evidence = {
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: 'autonomous-agent',
      timestamp: new Date().toISOString(),
      tools_used: ['returns-predictor', 'payment-manager'],
      prompt: `Autonomous audit for product ${product.product_id}`,
      sources: [],
      model_version: 'demo-v1',
      output: {
        invoice_id: invoice.invoice_id,
        order_id: orderId,
        prevented_value: invoice.prevented_value,
        payment_status: payment.status,
      },
    };
    
    const evidencePath = writeEvidenceLog(evidence);
    console.log(`  ✅ Evidence logged: ${evidencePath}`);
    
    return { invoice, payment, evidence };
  } else {
    console.log(`  ⏭️  Below threshold: Skipping`);
    return null;
  }
}

/**
 * Run single poll cycle
 */
async function runOnce() {
  console.log('\n=== Starting Autonomous Agent Poller ===');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Threshold: ${THRESHOLD_CENTS} cents ($${(THRESHOLD_CENTS / 100).toFixed(2)})`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  try {
    if (!fs.existsSync(CATALOG_PATH)) {
      throw new Error(`Catalog not found at ${CATALOG_PATH}`);
    }
    
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    if (!Array.isArray(catalog)) {
      throw new Error('Catalog must be an array');
    }
    
    console.log(`Loaded ${catalog.length} products from catalog.\n`);
    
    let actionsCount = 0;
    
    for (let i = 0; i < catalog.length; i++) {
      const result = await processCatalogItem(catalog[i], i + 1, catalog.length);
      if (result) {
          actionsCount++;
      }
    }
    
    console.log(`\n=== Poll Cycle Complete ===`);
    console.log(`Actions taken: ${actionsCount}`);
    console.log(`Products processed: ${catalog.length}\n`);
    
    return { actionsCount, totalProcessed: catalog.length };
  } catch (error) {
    console.error('❌ Poll cycle failed:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🤖 Style Shepherd Autonomous Agent Poller');
  console.log('==========================================');
  
  try {
    await runOnce();
    
    if (RUN_ONCE) {
      console.log('Single-run mode completed.\n');
      process.exit(0);
    }
    
    console.log(`Starting continuous polling every ${POLL_INTERVAL_MS}ms...`);
    console.log('Press CTRL-C to stop.\n');
    
    const intervalId = setInterval(async () => {
      try {
        await runOnce();
      } catch (error) {
        console.error('Poll cycle error:', error.message);
      }
    }, POLL_INTERVAL_MS);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\nReceived SIGINT, shutting down gracefully...');
      clearInterval(intervalId);
      console.log('Poller stopped.');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n\nReceived SIGTERM, shutting down gracefully...');
      clearInterval(intervalId);
      console.log('Poller stopped.');
      process.exit(0);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run main
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
