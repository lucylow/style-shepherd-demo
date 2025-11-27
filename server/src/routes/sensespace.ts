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
      
      // Call real SenseSpace API with retry logic
      const endpoint = env.SENSESPACE_API_ENDPOINT || 'https://api.sensespace.xyz';
      const url = `${endpoint}/api/miniapps-user/profile/${id}`;
      
      const maxRetries = 3;
      let lastError: any = null;
      
      // Helper to create timeout signal (compatible with older Node.js versions)
      const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), timeoutMs);
        return controller.signal;
      };
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            method: 'GET',
            // Add timeout to prevent hanging requests (10 second timeout)
            signal: createTimeoutSignal(10000),
          });
          
          if (!response.ok) {
            // Don't retry on 4xx errors (client errors)
            if (response.status >= 400 && response.status < 500) {
              const text = await response.text();
              return res.status(response.status).json({ 
                error: text || 'Failed to fetch profile from SenseSpace',
                status: response.status,
                success: false
              });
            }
            
            // Retry on 5xx errors (server errors)
            if (attempt < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
            
            const text = await response.text();
            return res.status(response.status).json({ 
              error: text || 'Failed to fetch profile from SenseSpace',
              status: response.status,
              success: false
            });
          }
          
          const json = await response.json();
          
          // Validate response structure
          if (!json || typeof json !== 'object') {
            throw new Error('Invalid response format from SenseSpace API');
          }
          
          // Cache the result
          profileCache.set(cacheKey, json);
          
          return res.status(200).json({
            ...json,
            success: true
          });
        } catch (fetchError: any) {
          lastError = fetchError;
          
          // Don't retry on abort/timeout if it's the last attempt
          if (fetchError.name === 'AbortError' && attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          // If not the last attempt, retry
          if (attempt < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.warn(`SenseSpace API fetch attempt ${attempt} failed, retrying in ${delay}ms...`, fetchError.message);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
      }
      
      // All retries failed, fallback to mock
      console.error('SenseSpace API fetch failed after all retries:', lastError);
      
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
          success: true,
          warning: 'SenseSpace API unavailable, using mock data'
        });
      } catch {
        return res.status(500).json({ 
          error: 'sensespace_fetch_failed',
          message: lastError?.message || 'Failed to fetch profile',
          success: false
        });
      }
    } catch (error) {
      next(error);
    }
  }
);

export default router;

