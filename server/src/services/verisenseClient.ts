/**
 * Verisense (SenseSpace) Client Service
 * Helper to fetch user profile from the server proxy endpoint
 */

import axios from 'axios';
import env from '../config/env.js';

/**
 * Fetch user profile from Verisense/SenseSpace proxy
 * Uses the local server endpoint: /api/verisense/profile/:id or /api/sensespace/profile/:id
 * @param userId - User ID to fetch profile for
 * @returns User profile object
 */
export async function fetchProfile(userId: string): Promise<any> {
  // Use the local server proxy endpoint
  // In server-side context, we can use localhost or construct from env
  const port = env.PORT || 3001;
  const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
  const url = `${baseUrl}/api/verisense/profile/${encodeURIComponent(userId)}`;
  
  try {
    const resp = await axios.get(url);
    return resp.data;
  } catch (err: any) {
    // Best-effort fallback: return a minimal demo stub
    console.warn('fetchProfile fallback to demo for', userId, err?.message);
    return {
      id: userId,
      username: 'demo-user',
      preferences: { size: 'M', style: 'kpop' },
      demo: true,
    };
  }
}

