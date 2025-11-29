/**
 * Evidence Logging Routes
 * Persist audit trail and evidence for LLM recommendations
 */

import { Router, Request, Response, NextFunction } from 'express';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateBody } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const evidenceDir = join(__dirname, '..', '..', '..', 'logs', 'evidence');

/**
 * POST /api/evidence/log
 * Log evidence payload (prompt, sources, model version, output)
 */
router.post(
  '/log',
  validateBody(
    z.object({
      request_id: z.string().optional(),
      user_id: z.string().optional(),
      timestamp: z.string().optional(),
      tools_used: z.array(z.string()).optional(),
      prompt: z.string(),
      sources: z.array(
        z.object({
          source_id: z.string(),
          doc_id: z.string().optional(),
          url: z.string().optional(),
        })
      ).optional(),
      model_version: z.string(),
      output: z.any(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evidence = {
        request_id: req.body.request_id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: req.body.user_id || 'anonymous',
        timestamp: req.body.timestamp || new Date().toISOString(),
        tools_used: req.body.tools_used || [],
        prompt: req.body.prompt,
        sources: req.body.sources || [],
        model_version: req.body.model_version || 'demo-v1',
        output: req.body.output,
      };
      
      const evidenceId = evidence.request_id;
      const filename = `${Date.now()}_${evidenceId}.json`;
      
      // Ensure directory exists
      await mkdir(evidenceDir, { recursive: true });
      
      // Write evidence file
      await writeFile(
        join(evidenceDir, filename),
        JSON.stringify(evidence, null, 2),
        'utf-8'
      );
      
      return res.json({
        success: true,
        evidence_id: evidenceId,
        filename,
        timestamp: evidence.timestamp,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

