/**
 * Tools API Routes
 * Endpoints for autonomous agent tools (returns predictor, search, payment manager, etc.)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateBody } from '../middleware/validation.js';
import { z } from 'zod';
import { ValidationError } from '../lib/errors.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * POST /api/tools/returns-predictor
 * Deterministic mock returns predictor for demo
 */
router.post(
  '/returns-predictor',
  validateBody(
    z.object({
      order_id: z.string().optional(),
      product_id: z.string(),
      size: z.string().optional(),
      user_id: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { product_id, size, metadata } = req.body;
      
      // Deterministic mock: compute probabilities based on product and size
      // Higher return prob for sizes at extremes (XS, XL) vs M
      let baseProb = 0.35;
      if (size === 'XS' || size === 'XL') baseProb = 0.52;
      if (size === 'S' || size === 'L') baseProb = 0.42;
      if (size === 'M') baseProb = 0.28;
      
      // Adjust based on product type
      if (product_id?.includes('dress')) baseProb += 0.08;
      if (product_id?.includes('jeans')) baseProb += 0.05;
      
      const afterProb = Math.max(0.15, baseProb - 0.15); // Intervention reduces by ~15%
      const confidence = 0.87; // Demo confidence
      
      return res.json({
        before_prob: Math.min(0.95, baseProb),
        after_prob: Math.max(0.05, afterProb),
        confidence,
        demo_mode: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/tools/search
 * Returns top-N docs for RAG (mock Ambient/Cambrian sources)
 */
router.post(
  '/search',
  validateBody(
    z.object({
      query: z.string().min(1),
      top_k: z.number().int().positive().default(3),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, top_k = 3 } = req.body;
      
      // Mock search results from Ambient/Cambrian
      const mockDocs = [
        {
          doc_id: 'ambient-trend-001',
          source_id: 'ambient',
          title: 'Wide-leg Denim Trends',
          excerpt: 'Wide-leg jeans are trending up 23% in SEA markets. Sustainable denim is gaining popularity.',
          url: 'https://ambient.example.com/trends/denim-2025',
          relevance_score: 0.92,
        },
        {
          doc_id: 'cambrian-onchain-001',
          source_id: 'cambrian_onchain',
          title: 'On-chain Purchase Data',
          excerpt: '92% of transactions verified on-chain. Average transaction value: $125.70.',
          url: 'https://cambrian.example.com/data/onchain',
          relevance_score: 0.85,
        },
        {
          doc_id: 'ambient-color-001',
          source_id: 'ambient',
          title: 'Sage Green Color Trend',
          excerpt: 'Sage green replacing olive tones. Earth tones are in for 2025.',
          url: 'https://ambient.example.com/trends/colors-2025',
          relevance_score: 0.78,
        },
        {
          doc_id: 'cambrian-offchain-001',
          source_id: 'cambrian_offchain',
          title: 'User Behavior Patterns',
          excerpt: 'Size issues account for 65% of returns. Fit issues at 23%.',
          url: 'https://cambrian.example.com/data/behavior',
          relevance_score: 0.75,
        },
      ];
      
      // Simple keyword matching for demo
      const lowerQuery = query.toLowerCase();
      const filtered = mockDocs
        .filter(doc => {
          const text = `${doc.title} ${doc.excerpt}`.toLowerCase();
          return text.includes(lowerQuery.split(' ')[0]);
        })
        .slice(0, top_k);
      
      const results = filtered.length > 0 ? filtered : mockDocs.slice(0, top_k);
      
      return res.json({
        docs: results,
        query,
        top_k: results.length,
        demo_mode: true,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/tools/ambient
 * Returns Ambient trends mock data
 */
router.get('/ambient', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mockPath = join(__dirname, '..', '..', '..', 'mocks', 'sponsors', 'ambient_trends.json');
    const data = await readFile(mockPath, 'utf-8');
    return res.json(JSON.parse(data));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tools/cambrian-onchain
 * Returns Cambrian on-chain mock data
 */
router.get('/cambrian-onchain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mockPath = join(__dirname, '..', '..', '..', 'mocks', 'sponsors', 'cambrian_onchain.json');
    const data = await readFile(mockPath, 'utf-8');
    return res.json(JSON.parse(data));
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/tools/cambrian-offchain
 * Returns Cambrian off-chain mock data
 */
router.get('/cambrian-offchain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mockPath = join(__dirname, '..', '..', '..', 'mocks', 'sponsors', 'cambrian_offchain.json');
    const data = await readFile(mockPath, 'utf-8');
    return res.json(JSON.parse(data));
  } catch (error) {
    next(error);
  }
});

export default router;

