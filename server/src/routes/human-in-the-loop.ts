/**
 * Human-in-the-Loop API Routes
 * Endpoints for managing human approval workflows with Verisense agents
 */

import { Router, Request, Response, NextFunction } from 'express';
import { humanInTheLoopService, HumanApprovalRequest, AgentActionType } from '../services/HumanInTheLoopService.js';
import { validateParams, validateBody } from '../middleware/validation.js';
import { z } from 'zod';

const router = Router();

/**
 * POST /api/human-in-the-loop/request
 * Create a new human approval request (called by Verisense agent or internal services)
 */
router.post(
  '/request',
  validateBody(z.object({
    userId: z.string().min(1),
    agentId: z.string().min(1),
    actionType: z.string(),
    title: z.string().min(1),
    description: z.string().min(1),
    reasoning: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
    riskLevel: z.enum(['low', 'medium', 'high']).optional(),
    metadata: z.record(z.any()).optional(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approval = await humanInTheLoopService.createApprovalRequest({
        userId: req.body.userId,
        agentId: req.body.agentId,
        actionType: req.body.actionType as AgentActionType,
        title: req.body.title,
        description: req.body.description,
        reasoning: req.body.reasoning,
        confidence: req.body.confidence,
        riskLevel: req.body.riskLevel,
        metadata: req.body.metadata,
      });

      res.status(201).json({
        success: true,
        approval,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/human-in-the-loop/approve/:id
 * Approve an action
 */
router.post(
  '/approve/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(z.object({
    userId: z.string().min(1),
    userReasoning: z.string().optional(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approval = await humanInTheLoopService.approveAction(
        req.params.id,
        req.body.userId,
        req.body.userReasoning
      );

      res.json({
        success: true,
        approval,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/human-in-the-loop/reject/:id
 * Reject an action
 */
router.post(
  '/reject/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  validateBody(z.object({
    userId: z.string().min(1),
    userReasoning: z.string().optional(),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approval = await humanInTheLoopService.rejectAction(
        req.params.id,
        req.body.userId,
        req.body.userReasoning
      );

      res.json({
        success: true,
        approval,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/human-in-the-loop/approval/:id
 * Get a specific approval request
 */
router.get(
  '/approval/:id',
  validateParams(z.object({ id: z.string().min(1) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const approval = await humanInTheLoopService.getApprovalRequest(req.params.id);

      if (!approval) {
        return res.status(404).json({
          success: false,
          error: 'Approval request not found',
        });
      }

      res.json({
        success: true,
        approval,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/human-in-the-loop/approvals
 * Get approval requests with filters
 */
router.get(
  '/approvals',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: any = {};

      if (req.query.userId) {
        filters.userId = req.query.userId as string;
      }
      if (req.query.agentId) {
        filters.agentId = req.query.agentId as string;
      }
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      if (req.query.actionType) {
        filters.actionType = req.query.actionType as string;
      }
      if (req.query.startDate) {
        filters.startDate = req.query.startDate as string;
      }
      if (req.query.endDate) {
        filters.endDate = req.query.endDate as string;
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string, 10);
      }

      const approvals = await humanInTheLoopService.getApprovalRequests(filters);

      res.json({
        success: true,
        approvals,
        count: approvals.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/human-in-the-loop/pending
 * Get pending approvals for a user
 */
router.get(
  '/pending',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.query.userId as string | undefined;
      const approvals = await humanInTheLoopService.getPendingApprovals(userId);

      res.json({
        success: true,
        approvals,
        count: approvals.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/human-in-the-loop/stats
 * Get approval statistics
 */
router.get(
  '/stats',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters: any = {};

      if (req.query.userId) {
        filters.userId = req.query.userId as string;
      }
      if (req.query.agentId) {
        filters.agentId = req.query.agentId as string;
      }
      if (req.query.startDate) {
        filters.startDate = req.query.startDate as string;
      }
      if (req.query.endDate) {
        filters.endDate = req.query.endDate as string;
      }

      const stats = await humanInTheLoopService.getApprovalStats(filters);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/human-in-the-loop/expire
 * Manually expire old pending approvals (usually called by a cron job)
 */
router.post(
  '/expire',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expiredCount = await humanInTheLoopService.expireOldApprovals();

      res.json({
        success: true,
        expiredCount,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/human-in-the-loop/verisense-webhook
 * Webhook endpoint for Verisense to trigger human approval requests
 */
router.post(
  '/verisense-webhook',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { event, data } = req.body;

      // Handle different Verisense webhook events
      if (event === 'agent.action.request') {
        // Verisense agent wants to perform an action that needs approval
        const approval = await humanInTheLoopService.createApprovalRequest({
          userId: data.userId,
          agentId: data.agentId || 'style-shepherd-agent',
          actionType: data.actionType as AgentActionType,
          title: data.title || `AI Agent wants to ${data.actionType}`,
          description: data.description || 'The AI agent wants to perform an action.',
          reasoning: data.reasoning,
          confidence: data.confidence,
          riskLevel: data.riskLevel,
          metadata: {
            ...data.metadata,
            verisenseContext: data.context,
            webhookEvent: event,
          },
        });

        // Return approval ID for Verisense to track
        return res.json({
          success: true,
          approvalId: approval.id,
          status: approval.status,
          message: 'Approval request created',
        });
      }

      if (event === 'agent.action.status') {
        // Verisense is checking the status of an approval
        const approval = await humanInTheLoopService.getApprovalRequest(data.approvalId);
        
        if (!approval) {
          return res.status(404).json({
            success: false,
            error: 'Approval request not found',
          });
        }

        return res.json({
          success: true,
          approval,
        });
      }

      res.status(400).json({
        success: false,
        error: 'Unknown webhook event',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;


