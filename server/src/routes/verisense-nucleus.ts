/**
 * Verisense Nucleus API Routes
 * 
 * Provides REST API endpoints for interacting with Verisense Nucleus capabilities.
 * These endpoints demonstrate the integration of Verisense features into Style Shepherd.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateParams } from '../middleware/validation.js';
import { StyleShepherdNucleus } from '../services/verisense/StyleShepherdNucleus.js';
import type { NucleusConfig } from '../services/verisense/index.js';

const router = Router();

// Singleton instance (in production, this would be managed differently)
let nucleusInstance: StyleShepherdNucleus | null = null;

/**
 * Initialize Nucleus instance
 */
function getNucleus(): StyleShepherdNucleus {
  if (!nucleusInstance) {
    const config: NucleusConfig = {
      id: 'style-shepherd-nucleus',
      name: 'Style Shepherd Nucleus',
      version: '1.0.0',
      publisherAddress: process.env.NUCLEUS_PUBLISHER_ADDRESS || '0x0000000000000000000000000000000000000000',
      nodeCount: 5, // Default decentralization level
      initialBalance: 100, // Initial balance in Verisense tokens
    };

    nucleusInstance = new StyleShepherdNucleus(config);
  }

  return nucleusInstance;
}

/**
 * GET /api/verisense-nucleus/status
 * Get Nucleus status and statistics
 */
router.get('/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nucleus = getNucleus();
    const status = nucleus.getStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/verisense-nucleus/deposit
 * Deposit funds to Nucleus account
 */
router.post(
  '/deposit',
  validateBody(
    z.object({
      amount: z.number().positive('Amount must be positive'),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount } = req.body;
      const nucleus = getNucleus();

      nucleus.deposit(amount);

      res.status(200).json({
        success: true,
        message: `Deposited ${amount} to Nucleus account`,
        data: nucleus.getStatus().nucleus,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/verisense-nucleus/preferences
 * Store user preferences in KV storage
 */
router.post(
  '/preferences',
  validateBody(
    z.object({
      userId: z.string().min(1, 'User ID is required'),
      preferences: z.record(z.any()),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, preferences } = req.body;
      const nucleus = getNucleus();

      const success = await nucleus.storeUserPreferences(userId, preferences);

      res.status(200).json({
        success,
        message: success
          ? 'Preferences stored successfully'
          : 'Failed to store preferences',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/verisense-nucleus/preferences/:userId
 * Get user preferences from KV storage
 */
router.get(
  '/preferences/:userId',
  validateParams(z.object({ userId: z.string().min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const nucleus = getNucleus();

      const preferences = await nucleus.getUserPreferences(userId);

      res.status(200).json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/verisense-nucleus/recommendations
 * Index a product recommendation
 */
router.post(
  '/recommendations',
  validateBody(
    z.object({
      userId: z.string().min(1),
      productId: z.string().min(1),
      score: z.number().min(0).max(1),
      metadata: z.record(z.any()).optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, productId, score, metadata } = req.body;
      const nucleus = getNucleus();

      const success = await nucleus.indexRecommendation(
        userId,
        productId,
        score,
        metadata
      );

      res.status(200).json({
        success,
        message: success
          ? 'Recommendation indexed successfully'
          : 'Failed to index recommendation',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/verisense-nucleus/recommendations/:userId
 * Get recommendations for a user
 */
router.get(
  '/recommendations/:userId',
  validateParams(z.object({ userId: z.string().min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const nucleus = getNucleus();

      const recommendations = await nucleus.getRecommendations(userId, limit);

      res.status(200).json({
        success: true,
        data: recommendations,
        count: recommendations.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/verisense-nucleus/health
 * Health check endpoint
 */
router.get('/health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const nucleus = getNucleus();
    const canOperate = nucleus.canOperate();

    res.status(200).json({
      success: true,
      healthy: canOperate,
      message: canOperate
        ? 'Nucleus is operational'
        : 'Nucleus balance below threshold',
    });
  } catch (error) {
    next(error);
  }
});

export default router;

