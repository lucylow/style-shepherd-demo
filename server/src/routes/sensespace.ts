/**
 * SenseSpace (Verisense) MiniApp SDK Routes
 * Token management and user profile proxy endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import env from '../config/env.js';
import { validateParams } from '../middleware/validation.js';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const router = Router();

// In-memory LRU cache for profile data (60s TTL)
const profileCache = new LRUCache<string, any>({
  max: 500,
  ttl: 60 * 1000, // 60 seconds
});

// Helper to get mock profile path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * GET /api/sensespace/token
 * Returns a secure miniapp token for frontend use
 * In production: you would mint/rotate miniapp tokens securely
 * For demo: returns server-side env token if present, otherwise demo token
 */
router.get('/token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = env.SENSESPACE_MINIAPP_TOKEN || null;
    
    if (token) {
      return res.status(200).json({ 
        token, 
        source: 'env' 
      });
    }
    
    // Fallback demo token
    return res.status(200).json({ 
      token: 'demo-token', 
      demo: true, 
      source: 'mock' 
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sensespace/profile/:id
 * Server-side proxy that calls SenseSpace profile endpoint
 * Caches results for 60s, returns normalized user profile JSON
 */
router.get(
  '/profile/:id',
  validateParams(z.object({ 
    id: z.string().min(1, 'User ID is required') 
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const cacheKey = `sensespace:profile:${id}`;
      
      // Check cache first
      const cached = profileCache.get(cacheKey);
      if (cached) {
        return res.status(200).json({ 
          ...cached, 
          _cached: true 
        });
      }
      
      const token = env.SENSESPACE_MINIAPP_TOKEN;
      
      // If no token, return mock profile
      if (!token) {
        try {
          // Try to load mock profile from mocks directory
          const mockPath = join(
            __dirname, 
            '..', 
            '..', 
            '..', 
            'mocks', 
            'sensespace', 
            'demo_profile.json'
          );
          const mockData = await readFile(mockPath, 'utf-8');
          const mock = JSON.parse(mockData);
          
          // Cache the mock for consistency
          profileCache.set(cacheKey, mock);
          
          return res.status(200).json({ 
            ...mock, 
            demo: true 
          });
        } catch (mockError) {
          // If mock file doesn't exist, return a default mock
          const defaultMock = {
            id,
            username: 'Demo User',
            avatar: '/placeholder.svg',
            email: 'demo@example.com',
            created_at: new Date().toISOString(),
            bio: 'Demo profile - no SenseSpace token configured',
            preferences: { size: 'M', style: 'casual' },
            demo: true,
          };
          
          profileCache.set(cacheKey, defaultMock);
          return res.status(200).json(defaultMock);
        }
      }
      
      // Call real SenseSpace API
      try {
        const endpoint = env.SENSESPACE_API_ENDPOINT || 'https://api.sensespace.xyz';
        const url = `${endpoint}/api/miniapps-user/profile/${id}`;
        
        const response = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          method: 'GET',
        });
        
        if (!response.ok) {
          const text = await response.text();
          return res.status(response.status).json({ 
            error: text || 'Failed to fetch profile from SenseSpace',
            status: response.status
          });
        }
        
        const json = await response.json();
        
        // Cache the result
        profileCache.set(cacheKey, json);
        
        return res.status(200).json(json);
      } catch (fetchError: any) {
        console.error('SenseSpace API fetch error:', fetchError);
        
        // Fallback to mock on error
        try {
          const mockPath = join(
            __dirname, 
            '..', 
            '..', 
            '..', 
            'mocks', 
            'sensespace', 
            'demo_profile.json'
          );
          const mockData = await readFile(mockPath, 'utf-8');
          const mock = JSON.parse(mockData);
          
          return res.status(200).json({ 
            ...mock, 
            demo: true,
            error: 'SenseSpace API unavailable, using mock data'
          });
        } catch {
          return res.status(500).json({ 
            error: 'sensespace_fetch_failed',
            message: fetchError.message 
          });
        }
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;

