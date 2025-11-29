/**
 * Payment Manager Routes (AP2 Demo)
 * Simulates AP2-style payment mandates: Intent → Cart Mandate → Payment Mandate
 */

import { Router, Request, Response, NextFunction } from 'express';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { validateBody } from '../middleware/validation.js';
import { z } from 'zod';
import { ValidationError } from '../lib/errors.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure logs directory exists
const logsDir = join(__dirname, '..', '..', '..', 'logs', 'payments');

/**
 * POST /api/tools/payment-manager/intent
 * Create a payment intent (AP2 demo)
 */
router.post(
  '/intent',
  validateBody(
    z.object({
      amount: z.number().positive(),
      currency: z.string().default('USD'),
      userId: z.string().optional(),
      description: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { amount, currency = 'USD', userId, description } = req.body;
      const intentId = `intent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const intent = {
        id: intentId,
        status: 'created',
        amount,
        currency,
        userId: userId || 'demo-user',
        description: description || 'Demo payment intent',
        created_at: new Date().toISOString(),
        demo_mode: true,
      };
      
      // Persist to logs
      await mkdir(logsDir, { recursive: true });
      await writeFile(
        join(logsDir, `${intentId}.json`),
        JSON.stringify(intent, null, 2),
        'utf-8'
      );
      
      return res.json({
        ...intent,
        details: {
          next_step: 'cart_mandate',
          message: 'Intent created. Proceed to cart mandate.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/tools/payment-manager/cart
 * Create a cart mandate (AP2 demo)
 */
router.post(
  '/cart',
  validateBody(
    z.object({
      intent_id: z.string(),
      items: z.array(
        z.object({
          product_id: z.string(),
          quantity: z.number().int().positive(),
          price: z.number().positive(),
        })
      ),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { intent_id, items } = req.body;
      const cartId = `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      
      const cart = {
        id: cartId,
        intent_id,
        status: 'mandated',
        items,
        total,
        created_at: new Date().toISOString(),
        demo_mode: true,
      };
      
      // Persist to logs
      await mkdir(logsDir, { recursive: true });
      await writeFile(
        join(logsDir, `${cartId}.json`),
        JSON.stringify(cart, null, 2),
        'utf-8'
      );
      
      return res.json({
        ...cart,
        details: {
          next_step: 'payment_mandate',
          message: 'Cart mandate created. Ready for payment confirmation.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/tools/payment-manager/confirm
 * Confirm payment mandate (AP2 demo)
 */
router.post(
  '/confirm',
  validateBody(
    z.object({
      cart_id: z.string(),
      payment_method_id: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { cart_id, payment_method_id } = req.body;
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const payment = {
        id: paymentId,
        cart_id,
        status: 'completed',
        payment_method_id: payment_method_id || 'demo_payment_method',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        demo_mode: true,
      };
      
      // Persist to logs
      await mkdir(logsDir, { recursive: true });
      await writeFile(
        join(logsDir, `${paymentId}.json`),
        JSON.stringify(payment, null, 2),
        'utf-8'
      );
      
      return res.json({
        ...payment,
        details: {
          message: 'Payment completed successfully (demo mode).',
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

