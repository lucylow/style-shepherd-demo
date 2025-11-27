/**
 * Verisense (SenseSpace) Routes
 * Profile and token endpoints for Verisense integration
 * These routes are aliases for /api/sensespace routes for compatibility
 */

import { Router, Request, Response, NextFunction } from 'express';
import sensespaceRoutes from './sensespace.js';

const router = Router();

// Re-export all sensespace routes under /verisense for compatibility
// This allows both /api/sensespace/* and /api/verisense/* to work
router.use('/', sensespaceRoutes);

export default router;

