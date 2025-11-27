/**
 * Verisense (SenseSpace) Routes
 * Profile and token endpoints for Verisense integration
 * These routes are aliases for /api/sensespace routes for compatibility
 * Also includes agent webhook and OAuth callback endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import sensespaceRoutes from './sensespace.js';
import env from '../config/env.js';
import { z } from 'zod';
import { validateBody, validateQuery } from '../middleware/validation.js';
import { ValidationError } from '../lib/errors.js';

const router = Router();

// Re-export all sensespace routes under /verisense for compatibility
// This allows both /api/sensespace/* and /api/verisense/* to work
router.use('/', sensespaceRoutes);

/**
 * POST /api/verisense/agent-webhook
 * Webhook endpoint for Verisense to send agent events
 * Handles various agent events like user interactions, agent actions, etc.
 */
router.post(
  '/agent-webhook',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verify webhook signature if secret is configured
      const webhookSecret = process.env.VERISENSE_WEBHOOK_SECRET;
      if (webhookSecret && req.headers['x-verisense-signature']) {
        // TODO: Implement signature verification
        // For now, we'll log a warning if secret is set but verification isn't implemented
        console.warn('Webhook secret verification not yet implemented');
      }

      const { event, data, timestamp } = req.body;

      // Validate required fields
      if (!event) {
        throw new ValidationError('Missing event type', {
          field: 'event',
          reason: 'Event type is required for webhook processing',
        });
      }

      // Log the webhook event
      console.log('Verisense agent webhook received:', {
        event,
        timestamp: timestamp || new Date().toISOString(),
        hasData: !!data,
      });

      // Handle different event types
      switch (event) {
        case 'agent.message':
          // Agent received a message from user
          // You can process the message here
          return res.json({
            success: true,
            message: 'Message received',
            event,
          });

        case 'agent.action':
          // Agent wants to perform an action
          // This might trigger human-in-the-loop if needed
          return res.json({
            success: true,
            message: 'Action received',
            event,
            actionId: data?.actionId,
          });

        case 'agent.status':
          // Agent status update
          return res.json({
            success: true,
            message: 'Status update received',
            event,
            status: data?.status,
          });

        case 'user.interaction':
          // User interaction event
          return res.json({
            success: true,
            message: 'User interaction received',
            event,
            userId: data?.userId,
          });

        default:
          // Unknown event type - still return success to prevent retries
          console.warn('Unknown Verisense webhook event:', event);
          return res.json({
            success: true,
            message: 'Event received (unknown type)',
            event,
          });
      }
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/verisense/oauth-callback
 * OAuth callback endpoint for Verisense authentication
 * Handles OAuth redirects from Verisense platform
 */
router.get(
  '/oauth-callback',
  validateQuery(
    z.object({
      code: z.string().optional(),
      state: z.string().optional(),
      error: z.string().optional(),
      error_description: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, state, error, error_description } = req.query;

      // Handle OAuth errors
      if (error) {
        const errorStr = typeof error === 'string' ? error : String(error);
        const errorDescriptionStr = typeof error_description === 'string' 
          ? error_description 
          : error_description ? String(error_description) : undefined;
        console.error('OAuth callback error:', errorStr, errorDescriptionStr);
        throw new ValidationError(
          errorDescriptionStr || 'OAuth authentication failed',
          {
            field: 'oauth_error',
            value: errorStr,
            reason: errorDescriptionStr,
          }
        );
      }

      // Handle successful OAuth callback
      if (code) {
        // Exchange authorization code for access token
        // In a real implementation, you would:
        // 1. Exchange code for token with Verisense OAuth endpoint
        // 2. Store the token securely
        // 3. Redirect user to success page

        const codeStr = typeof code === 'string' ? code : String(code);
        console.log('OAuth callback received:', {
          code: codeStr.substring(0, 10) + '...', // Log partial code for security
          state,
        });

        // For now, return success response
        // In production, you would redirect to a success page
        return res.json({
          success: true,
          message: 'OAuth callback received',
          // In production, redirect to your app:
          // res.redirect(`${process.env.FRONTEND_URL}/auth/success?state=${state}`);
        });
      }

      // No code or error - invalid request
      throw new ValidationError('Missing authorization code', {
        field: 'code',
        reason: 'Authorization code is required for OAuth callback',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

