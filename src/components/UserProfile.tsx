/**
 * UserProfile Component
 * Displays user profile using SenseSpace SDK with graceful loading/error UI
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RefreshCw, User, Sparkles, Palette } from 'lucide-react';
import api from '@/lib/api';

export interface UserProfileProps {
  userId: string;
  onUseProfile?: (profile: UserProfileData, action?: 'personal-shopper' | 'makeup-artist') => void;
}

export interface UserProfileData {
  id: string;
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  created_at?: string;
  preferences?: Record<string, any>;
  demo?: boolean;
  _cached?: boolean;
}

export default function UserProfile({ userId, onUseProfile }: UserProfileProps) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch token from server
  useEffect(() => {
    async function fetchToken() {
      try {
        const { data } = await api.get('/sensespace/token');
        setToken(data.token);
      } catch (err: any) {
        console.error('Failed to fetch token:', err);
        setError('Failed to initialize profile client. Using fallback mode.');
        // Still allow profile fetch to proceed with fallback
        setToken('demo-token');
      }
    }
    fetchToken();
  }, []);

  // Fetch profile data
  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Use server proxy endpoint which handles caching and fallbacks
      const { data } = await api.get(`/sensespace/profile/${userId}`);
      setProfile(data);
      // Automatically call onUseProfile when profile loads (for demo page)
      if (onUseProfile && data) {
        onUseProfile(data);
      }
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, onUseProfile]);

  useEffect(() => {
    if (token !== null) {
      fetchProfile();
    }
  }, [token, userId, fetchProfile]);

  // Initializing state
  if (token === null && !error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Initializing profile client...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading && !profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading profile...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => fetchProfile()} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No profile found
  if (!profile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">No profile found.</p>
        </CardContent>
      </Card>
    );
  }

  // Profile display
  const initials = profile.username
    ? profile.username
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile.email
      ? profile.email[0].toUpperCase()
      : 'U';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>User Profile</CardTitle>
          <div className="flex items-center gap-2">
            {profile.demo && (
              <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">
                Demo Mode
              </span>
            )}
            {profile._cached && (
              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-md text-blue-700 dark:text-blue-300">
                Cached
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchProfile(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </div>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar} alt={profile.username || 'User avatar'} />
            <AvatarFallback className="text-2xl">
              {profile.avatar ? <User className="h-12 w-12" /> : initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-2xl font-semibold">{profile.username || 'Unnamed User'}</h3>
            {profile.email && (
              <p className="text-muted-foreground mt-1">{profile.email}</p>
            )}
            {profile.id && (
              <p className="text-sm text-muted-foreground mt-1">ID: {profile.id}</p>
            )}
          </div>
        </div>

        {profile.bio && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Bio</h4>
            <p className="text-muted-foreground">{profile.bio}</p>
          </div>
        )}

        {profile.preferences && Object.keys(profile.preferences).length > 0 && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Preferences</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.preferences).map(([key, value]) => (
                <span
                  key={key}
                  className="text-xs px-3 py-1 bg-muted rounded-full text-foreground"
                >
                  {key}: {String(value)}
                </span>
              ))}
            </div>
          </div>
        )}

        {profile.created_at && (
          <div>
            <h4 className="text-sm font-semibold mb-2">Member Since</h4>
            <p className="text-muted-foreground">
              {new Date(profile.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* Action buttons for demo page */}
        {onUseProfile && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => onUseProfile(profile, 'personal-shopper')}
              className="flex-1"
              variant="default"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Use as Personal Shopper
            </Button>
            <Button
              onClick={() => onUseProfile(profile, 'makeup-artist')}
              className="flex-1"
              variant="secondary"
            >
              <Palette className="mr-2 h-4 w-4" />
              Ask Makeup Artist
            </Button>
          </div>
        )}

        {/* Debug info in development */}
        {import.meta.env.DEV && (
          <details className="mt-6">
            <summary className="text-sm font-semibold cursor-pointer mb-2">
              Debug Info (Dev Only)
            </summary>
            <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-64">
              {JSON.stringify(profile, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

