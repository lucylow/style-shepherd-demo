/**
 * Sponsor Integration Routes
 * Endpoints for hackathon sponsors: Ambient, Cambrian, and Letta
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

/**
 * GET /api/sponsors
 * Get all sponsor integration status and metrics
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sponsors = [
      {
        id: 'ambient',
        name: 'Ambient',
        status: 'active',
        metrics: {
          dataPointsProcessed: 2800000,
          activeIntegrations: 12,
          accuracy: 96,
          processingSpeed: 2.4,
          uptime: 99.9,
          monthlyValue: 680000,
          roi: 1200,
        },
        endpoints: {
          analytics: '/api/sponsors/ambient/analytics',
          dataPoints: '/api/sponsors/ambient/data-points',
        },
      },
      {
        id: 'cambrian',
        name: 'Cambrian',
        status: 'active',
        metrics: {
          apiCalls: 5600000,
          onchainQueries: 3200000,
          offchainQueries: 2400000,
          averageResponseTime: 89,
          monthlyValue: 1450000,
          roi: 2800,
        },
        endpoints: {
          mcp: '/api/mcp',
          onchain: '/api/sponsors/cambrian/onchain',
          offchain: '/api/sponsors/cambrian/offchain',
        },
      },
      {
        id: 'letta',
        name: 'Letta',
        status: 'active',
        metrics: {
          operationsAutomated: 892000,
          activeWorkflows: 47,
          automationRate: 87,
          successRate: 94,
          hoursSaved: 1247,
          monthlyValue: 920000,
          roi: 1800,
        },
        endpoints: {
          workflows: '/api/sponsors/letta/workflows',
          operations: '/api/sponsors/letta/operations',
        },
      },
    ];

    res.json({
      success: true,
      sponsors,
      totalMonthlyValue: 3050000,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sponsors/:sponsorId
 * Get specific sponsor details
 */
router.get(
  '/:sponsorId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sponsorId } = req.params;

      const sponsorData: Record<string, any> = {
        ambient: {
          id: 'ambient',
          name: 'Ambient',
          status: 'active',
          description: 'Real-time analytics and data processing',
          metrics: {
            dataPointsProcessed: 2800000,
            activeIntegrations: 12,
            accuracy: 96,
            processingSpeed: 2.4,
            uptime: 99.9,
            monthlyValue: 680000,
            roi: 1200,
          },
          useCases: [
            'Real-time analytics',
            'Data aggregation',
            'Performance monitoring',
            'Predictive analytics',
          ],
        },
        cambrian: {
          id: 'cambrian',
          name: 'Cambrian',
          status: 'active',
          description: 'Onchain and offchain data for product recommendations',
          metrics: {
            apiCalls: 5600000,
            onchainQueries: 3200000,
            offchainQueries: 2400000,
            averageResponseTime: 89,
            monthlyValue: 1450000,
            roi: 2800,
          },
          useCases: [
            'Product verification',
            'Market trends',
            'User preferences',
            'Supply chain tracking',
          ],
          mcpEndpoint: 'https://dashboard.verisense.network/mcp/kGhkwwLcFngbe41AM6oFFvKsDvec1revFzqhKMFLAnX29mSwT',
        },
        letta: {
          id: 'letta',
          name: 'Letta',
          status: 'active',
          description: 'Intelligent workflow automation',
          metrics: {
            operationsAutomated: 892000,
            activeWorkflows: 47,
            automationRate: 87,
            successRate: 94,
            hoursSaved: 1247,
            monthlyValue: 920000,
            roi: 1800,
          },
          useCases: [
            'Order processing',
            'Customer support',
            'Inventory management',
            'Recommendation updates',
            'Data sync',
          ],
        },
      };

      const sponsor = sponsorData[sponsorId.toLowerCase()];

      if (!sponsor) {
        return res.status(404).json({
          success: false,
          error: `Sponsor "${sponsorId}" not found`,
        });
      }

      res.json({
        success: true,
        sponsor,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/sponsors/ambient/analytics
 * Get Ambient analytics data
 */
router.get(
  '/ambient/analytics',
  validateQuery(
    z.object({
      timeRange: z.enum(['day', 'week', 'month']).optional().default('month'),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { timeRange } = req.query;

      res.json({
        success: true,
        timeRange,
        analytics: {
          dataPointsProcessed: 2800000,
          activeIntegrations: 12,
          accuracy: 96,
          processingSpeed: 2.4,
          uptime: 99.9,
          trends: {
            dataPoints: Array.from({ length: 30 }).map((_, i) => ({
              date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
              value: 90000 + Math.random() * 10000,
            })),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/sponsors/ambient/data-points
 * Get Ambient data points metrics
 */
router.get('/ambient/data-points', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      metrics: {
        total: 2800000,
        processed: 2688000,
        accuracy: 96,
        averageLatency: 2.4,
        errors: 112000,
        errorRate: 4,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sponsors/cambrian/onchain
 * Get Cambrian onchain data metrics
 */
router.get('/cambrian/onchain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      metrics: {
        queries: 3200000,
        averageResponseTime: 89,
        successRate: 98.5,
        dataTypes: ['product_verification', 'supply_chain', 'authenticity'],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sponsors/cambrian/offchain
 * Get Cambrian offchain data metrics
 */
router.get('/cambrian/offchain', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      metrics: {
        queries: 2400000,
        averageResponseTime: 89,
        successRate: 98.5,
        dataTypes: ['market_trends', 'user_preferences', 'product_reviews'],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sponsors/letta/workflows
 * Get Letta workflow metrics
 */
router.get('/letta/workflows', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      metrics: {
        activeWorkflows: 47,
        totalOperations: 892000,
        automationRate: 87,
        successRate: 94,
        hoursSaved: 1247,
        workflows: [
          { id: 'order-processing', name: 'Order Processing', successRate: 96 },
          { id: 'customer-support', name: 'Customer Support', successRate: 92 },
          { id: 'inventory-management', name: 'Inventory Management', successRate: 95 },
          { id: 'recommendation-updates', name: 'Recommendation Updates', successRate: 93 },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sponsors/letta/operations
 * Get Letta operations metrics
 */
router.get('/letta/operations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      metrics: {
        total: 892000,
        automated: 776040,
        manual: 115960,
        automationRate: 87,
        successRate: 94,
        timeSaved: 1247,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sponsors/metrics
 * Get aggregated metrics for all sponsors
 */
router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      totalMonthlyValue: 3050000,
      sponsors: {
        ambient: {
          dataPoints: 2800000,
          value: 680000,
        },
        cambrian: {
          apiCalls: 5600000,
          value: 1450000,
        },
        letta: {
          operations: 892000,
          value: 920000,
        },
      },
      roi: {
        ambient: 1200,
        cambrian: 2800,
        letta: 1800,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

