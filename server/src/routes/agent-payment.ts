/**
 * Agent Payment Routes
 * Proxy routes for SenseSpace Agent Payment API
 * Handles payment intents between users and agents
 * 
 * Based on Verisense SenseSpace Agent Payment API documentation:
 * https://api.sensespace.xyz/v1/agent-payment/intent
 */

import { Router } from 'express';
import env from '../config/env.js';
import {
  BusinessLogicError,
  PaymentError,
  ExternalServiceError,
  ErrorCode,
} from '../lib/errors.js';

const router = Router();

const SENSESPACE_API_BASE = env.SENSESPACE_API_ENDPOINT || 'https://api.sensespace.xyz';
// AGENT_API_KEY can be set via environment variable or passed in Authorization header
const getDefaultAgentApiKey = () => process.env.AGENT_API_KEY || env.SENSESPACE_MINIAPP_TOKEN || null;

/**
 * Type definitions for SenseSpace API responses
 */
interface SenseSpaceErrorResponse {
  error?: string;
  message?: string;
  code?: string;
}

interface SenseSpaceSuccessResponse {
  data?: unknown;
  [key: string]: unknown;
}

/**
 * Get agent API key from request headers or environment
 */
function getAgentApiKey(req: any): string | null {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Return null - will fall back to getDefaultAgentApiKey() in route handlers
  return null;
}

/**
 * POST /api/agent-payment/intent
 * Initialize a payment intent for a transaction between a user and an agent
 * 
 * Request Body:
 * {
 *   "amount": 1000,  // Amount in smallest currency unit (cents)
 *   "userId": "user_id_string"
 * }
 * 
 * Responses:
 * - 200: Payment intent created or payment method needed
 * - 400: Invalid input or agent payment status issue
 * - 401: Missing or invalid agent API key
 * - 500: Server error
 */
router.post('/intent', async (req, res) => {
  try {
    const { amount, userId } = req.body;

    // Validate input
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      throw new BusinessLogicError(
        'Amount must be a positive number',
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (!userId || typeof userId !== 'string') {
      throw new BusinessLogicError(
        'User ID is required and must be a string',
        ErrorCode.VALIDATION_ERROR
      );
    }

    let agentApiKey = getAgentApiKey(req);
    // Fall back to default if not in header
    if (!agentApiKey) {
      agentApiKey = getDefaultAgentApiKey();
    }
    
    if (!agentApiKey) {
      return res.status(401).json({
        success: false,
        error: 'Agent API key is required. Set AGENT_API_KEY environment variable or provide Bearer token in Authorization header.',
      });
    }

    // Call SenseSpace Agent Payment API
    const response = await fetch(`${SENSESPACE_API_BASE}/v1/agent-payment/intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentApiKey}`,
      },
      body: JSON.stringify({
        amount,
        userId,
      }),
    });

    const data = await response.json() as SenseSpaceErrorResponse | SenseSpaceSuccessResponse;

    if (!response.ok) {
      // Forward error from SenseSpace API
      const errorData = data as SenseSpaceErrorResponse;
      return res.status(response.status).json({
        success: false,
        error: errorData.error || errorData.message || 'Failed to initialize payment intent',
        code: errorData.code,
      });
    }

    // Return success response
    const successData = data as SenseSpaceSuccessResponse;
    res.json({
      success: true,
      data: successData.data || successData,
    });
  } catch (error: any) {
    console.error('Error initializing payment intent:', error);

    if (
      error instanceof BusinessLogicError ||
      error instanceof PaymentError
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while initializing payment intent',
    });
  }
});

/**
 * POST /api/agent-payment/intent/:id
 * Confirm a payment intent that is in requires_confirmation state
 * 
 * Path Parameters:
 * - id: Payment intent ID (e.g., pi_xxxxxxxxxxxx)
 * 
 * Request Body:
 * {
 *   "confirmCode": "123456"  // OTP/confirmation code
 * }
 * 
 * Responses:
 * - 200: Payment intent confirmed successfully
 * - 400: Invalid input or confirmation code
 * - 401: Missing or invalid agent API key
 * - 500: Server error
 */
router.post('/intent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmCode } = req.body;

    // Validate input
    if (!id) {
      throw new BusinessLogicError(
        'Payment intent ID is required',
        ErrorCode.VALIDATION_ERROR
      );
    }

    if (!confirmCode || typeof confirmCode !== 'string') {
      throw new BusinessLogicError(
        'Confirmation code is required and must be a string',
        ErrorCode.VALIDATION_ERROR
      );
    }

    let agentApiKey = getAgentApiKey(req);
    // Fall back to default if not in header
    if (!agentApiKey) {
      agentApiKey = getDefaultAgentApiKey();
    }
    
    if (!agentApiKey) {
      return res.status(401).json({
        success: false,
        error: 'Agent API key is required. Set AGENT_API_KEY environment variable or provide Bearer token in Authorization header.',
      });
    }

    // Call SenseSpace Agent Payment API
    const response = await fetch(`${SENSESPACE_API_BASE}/v1/agent-payment/intent/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentApiKey}`,
      },
      body: JSON.stringify({
        confirmCode,
      }),
    });

    const data = await response.json() as SenseSpaceErrorResponse | SenseSpaceSuccessResponse;

    if (!response.ok) {
      // Forward error from SenseSpace API
      const errorData = data as SenseSpaceErrorResponse;
      return res.status(response.status).json({
        success: false,
        error: errorData.error || errorData.message || 'Failed to confirm payment intent',
        code: errorData.code,
      });
    }

    // Return success response
    const successData = data as SenseSpaceSuccessResponse;
    res.json({
      success: true,
      data: successData.data || successData,
    });
  } catch (error: any) {
    console.error('Error confirming payment intent:', error);

    if (
      error instanceof BusinessLogicError ||
      error instanceof PaymentError
    ) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error while confirming payment intent',
    });
  }
});

export default router;

