/**
 * React Hook for SenseSpace User Profile
 * Provides a convenient way to fetch and manage user profiles using the SenseSpace SDK
 * Follows official SDK patterns from @verisense-network/sensespace-miniapp-sdk
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient, getUserIdFromUrl, type UserProfileData, type UserProfileResponse } from '@/lib/sensespace/client';

export interface UseUserProfileOptions {
  enabled?: boolean;
  timeout?: number;
  token?: string;
  endpoint?: string;
}

export interface UseUserProfileReturn {
  data: UserProfileData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * React Hook for fetching SenseSpace user profile
 * 
 * @param userId - User ID to fetch profile for. If not provided, will try to extract from URL.
 * @param options - Configuration options
 * @returns Profile data, loading state, error state, and refetch function
 * 
 * @example
 * ```tsx
 * const { data, loading, error, refetch } = useUserProfile('user123', {
 *   enabled: true,
 *   timeout: 5000
 * });
 * ```
 */
export function useUserProfile(
  userId?: string | null,
  options: UseUserProfileOptions = {}
): UseUserProfileReturn {
  const { enabled = true, timeout = 10000, token, endpoint } = options;
  
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get userId from URL if not provided
  const effectiveUserId = userId || getUserIdFromUrl();

  const fetchProfile = useCallback(async () => {
    if (!effectiveUserId || !enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create client with timeout
      const client = await createClient(token, endpoint);
      
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeout);
      });

      // Race between fetch and timeout
      const response: UserProfileResponse = await Promise.race([
        client.getUserProfile(effectiveUserId),
        timeoutPromise,
      ]);

      if (response.success && response.data) {
        setData(response.data);
        setError(null);
      } else {
        setError(response.error || 'Failed to fetch user profile');
        setData(null);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch user profile';
      setError(errorMessage);
      setData(null);
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId, enabled, timeout, token, endpoint]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    data,
    loading,
    error,
    refetch: fetchProfile,
  };
}

