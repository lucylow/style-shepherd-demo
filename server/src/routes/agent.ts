/**
 * Agent Routes
 * Autonomous agent endpoints for demo invoice generation and audit logs
 */

import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { mockPredictAfter } from '../services/returnsPredictor.js';
import { validateQuery } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

const CATALOG_PATH = path.join(process.cwd(), 'mocks', 'catalog.json');
const INVOICES_DIR = path.join(process.cwd(), 'invoices');
const LOGS_DIR = path.join(process.cwd(), 'logs');

/**
 * Ensure directory exists
 */
function ensureDir(p: string) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

// Ensure directories exist on startup
ensureDir(INVOICES_DIR);
ensureDir(LOGS_DIR);

/**
 * Write invoice JSON file
 */
function writeInvoice(invoice: any): string {
  const timestamp = Date.now();
  const safeOrderId = (invoice.order_id || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `demo_invoice_${safeOrderId}_${timestamp}.json`;
  const filePath = path.join(INVOICES_DIR, filename);
  
  const invoiceData = {
    ...invoice,
    invoice_id: invoice.invoice_id || `inv-${timestamp}`,
    created_at: invoice.created_at || new Date().toISOString(),
  };
  
  fs.writeFileSync(filePath, JSON.stringify(invoiceData, null, 2), 'utf8');
  return filePath;
}

/**
 * Append log entry to agent actions log
 */
function appendLog(entry: any): string {
  const logPath = path.join(LOGS_DIR, 'agent_actions.json');
  let arr: any[] = [];
  
  try {
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8');
      arr = JSON.parse(content);
      if (!Array.isArray(arr)) {
        arr = [];
      }
    }
  } catch (error) {
    // Start fresh if log file is corrupted
    arr = [];
  }
  
  arr.push({
    ...entry,
    ts: entry.ts || new Date().toISOString(),
  });
  
  fs.writeFileSync(logPath, JSON.stringify(arr, null, 2), 'utf8');
  return logPath;
}

/**
 * GET /api/agent/run-checks
 * 
 * HTTP trigger for autonomous agent poller.
 * Runs the same checks as the poller script and writes demo invoices to invoices/.
 * 
 * Query parameters:
 *   - threshold: Minimum prevented value to trigger invoice (default: 20.0)
 *   - commission_rate: Commission rate (default: 0.15)
 * 
 * Response:
 *   {
 *     ok: true,
 *     actions: [...],
 *     timestamp: "2025-01-15T10:00:00Z"
 *   }
 */
router.get(
  '/run-checks',
  validateQuery(
    z.object({
      threshold: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
      commission_rate: z.string().optional().transform((val) => (val ? parseFloat(val) : undefined)),
    })
  ),
  async (req: Request, res: Response) => {
    try {
      // Load configuration
      const threshold = (typeof req.query.threshold === 'number' ? req.query.threshold : undefined) ?? parseFloat(process.env.PREVENTED_VALUE_THRESHOLD || '20.0');
      const commissionRate = (typeof req.query.commission_rate === 'number' ? req.query.commission_rate : undefined) ?? parseFloat(process.env.COMMISSION_RATE || '0.15');

      // Validate configuration
      if (isNaN(threshold) || threshold < 0) {
        return res.status(400).json({ 
          error: 'invalid_threshold', 
          message: 'Threshold must be a non-negative number' 
        });
      }
      if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 1) {
        return res.status(400).json({ 
          error: 'invalid_commission_rate', 
          message: 'Commission rate must be between 0 and 1' 
        });
      }

      // Load catalog
      if (!fs.existsSync(CATALOG_PATH)) {
        return res.status(500).json({ 
          error: 'catalog_missing', 
          path: CATALOG_PATH,
          message: 'Catalog file not found' 
        });
      }

      let catalog: any[];
      try {
        const content = fs.readFileSync(CATALOG_PATH, 'utf8');
        catalog = JSON.parse(content);
        if (!Array.isArray(catalog)) {
          return res.status(500).json({ 
            error: 'invalid_catalog', 
            message: 'Catalog must be an array of orders' 
          });
        }
      } catch (error: any) {
        return res.status(500).json({ 
          error: 'catalog_read_failed', 
          message: `Failed to read catalog: ${error.message}` 
        });
      }

      // Process orders
      const actions: any[] = [];
      const errors: any[] = [];

      for (const order of catalog) {
        try {
          const pred = mockPredictAfter(order);
          
          if (pred.prevented_value > threshold) {
            const invoiceAmount = Math.round(pred.prevented_value * commissionRate * 100) / 100;
            const invoice = {
              invoice_id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              retailer: order.brand || 'demo-retailer',
              order_id: pred.order_id,
              prevented_value: pred.prevented_value,
              invoice_amount: invoiceAmount,
              commission_rate: commissionRate,
              created_at: new Date().toISOString(),
              evidence: {
                predicted_before: pred.predicted_before,
                predicted_after: pred.predicted_after,
                prevented_probability: pred.prevented_probability,
              },
              order_details: {
                product_id: order.product_id,
                product_title: order.product_title,
                order_value: order.order_value,
              },
              note: 'Demo invoice generated by Style Shepherd autonomous agent HTTP trigger',
            };

            const invoicePath = writeInvoice(invoice);
            const logEntry = {
              ts: new Date().toISOString(),
              type: 'invoice_created',
              invoice_path: invoicePath,
              invoice_summary: {
                invoice_id: invoice.invoice_id,
                order_id: invoice.order_id,
                prevented_value: invoice.prevented_value,
                invoice_amount: invoice.invoice_amount,
              },
            };

            appendLog(logEntry);

            actions.push({
              order_id: pred.order_id,
              invoice_path: invoicePath,
              invoice: {
                invoice_id: invoice.invoice_id,
                order_id: invoice.order_id,
                prevented_value: invoice.prevented_value,
                invoice_amount: invoice.invoice_amount,
                commission_rate: commissionRate,
              },
            });
          }
        } catch (error: any) {
          errors.push({
            order_id: order.order_id || 'unknown',
            error: error.message,
          });
        }
      }

      return res.status(200).json({
        ok: true,
        actions,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          total_orders: catalog.length,
          actions_taken: actions.length,
          errors: errors.length,
          threshold,
          commission_rate: commissionRate,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('run-checks error', err);
      return res.status(500).json({
        error: 'run_checks_failed',
        details: String(err?.message || err),
      });
    }
  }
);

export default router;
