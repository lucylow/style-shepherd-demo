/**
 * Verisense Demo Page
 * Demonstrates Personal Shopper & Makeup Artist flows using SenseSpace profile data
 */

import React, { useState } from 'react';
import PageTransition from '@/components/PageTransition';
import UserProfile from '@/components/UserProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Palette } from 'lucide-react';
import type { UserProfileData } from '@/components/UserProfile';

export default function VerisenseDemoPage() {
  const [selectedProfile, setSelectedProfile] = useState<UserProfileData | null>(null);
  const [agentOutput, setAgentOutput] = useState<string | null>(null);

  // Called when profile loads or when user clicks buttons in UserProfile
  function onUseProfile(profile: UserProfileData, action?: 'personal-shopper' | 'makeup-artist') {
    setSelectedProfile(profile);
    
    // If action is specified (from button click), show output immediately
    if (action === 'personal-shopper') {
      if (profile?.preferences?.style === 'kpop') {
        setAgentOutput(
          `Personal Shopper: For a K-pop inspired look, try bright pastels and layered textures. Recommended size: ${profile.preferences.size}.`
        );
      } else {
        setAgentOutput(
          `Personal Shopper: Try neutral tones and comfortable fits. Recommended size: ${profile?.preferences?.size || 'M'}.`
        );
      }
    } else if (action === 'makeup-artist') {
      const pref = profile.preferences?.makeup_pref || 'natural';
      if (pref === 'dewy') {
        setAgentOutput(
          'Makeup Artist: Dewy base, light highlighter, peachy blush — long-lasting for photos.'
        );
      } else {
        setAgentOutput('Makeup Artist: Matte base with defined liner and long-wear lipstick.');
      }
    }
    // If no action specified, just store the profile (for initial load)
  }

  function useAsPersonalShopper() {
    if (!selectedProfile) {
      setAgentOutput('Profile is loading. Please wait...');
      return;
    }
    // Trigger Personal Shopper agent output
    if (selectedProfile?.preferences?.style === 'kpop') {
      setAgentOutput(
        `Personal Shopper: For a K-pop inspired look, try bright pastels and layered textures. Recommended size: ${selectedProfile.preferences.size}.`
      );
    } else {
      setAgentOutput(
        `Personal Shopper: Try neutral tones and comfortable fits. Recommended size: ${selectedProfile?.preferences?.size || 'M'}.`
      );
    }
  }

  function askMakeupArtist() {
    if (!selectedProfile) {
      setAgentOutput('Profile is loading. Please wait...');
      return;
    }
    const pref = selectedProfile.preferences?.makeup_pref || 'natural';
    if (pref === 'dewy') {
      setAgentOutput(
        'Makeup Artist: Dewy base, light highlighter, peachy blush — long-lasting for photos.'
      );
    } else {
      setAgentOutput('Makeup Artist: Matte base with defined liner and long-wear lipstick.');
    }
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Style Shepherd — Verisense Demo</h1>
          <p className="text-muted-foreground text-lg">
            This page uses /api/sensespace/token and /api/sensespace/profile/{'{id}'} and falls
            back to a local demo profile when no server token is set.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <UserProfile userId="user123" onUseProfile={onUseProfile} />

            <div className="flex gap-3">
              <Button
                onClick={useAsPersonalShopper}
                className="flex-1"
                size="lg"
                disabled={!selectedProfile}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Use as Personal Shopper
              </Button>
              <Button
                onClick={askMakeupArtist}
                className="flex-1"
                size="lg"
                variant="secondary"
                disabled={!selectedProfile}
              >
                <Palette className="mr-2 h-4 w-4" />
                Ask Makeup Artist
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Agent Output</CardTitle>
                <CardDescription>
                  Responses from Personal Shopper and Makeup Artist agents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="min-h-[120px] p-4 bg-muted rounded-lg">
                  {agentOutput ? (
                    <p className="text-foreground whitespace-pre-wrap">{agentOutput}</p>
                  ) : (
                    <p className="text-muted-foreground italic">
                      Agent responses will show here. Use the buttons above to interact with the
                      agents.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <aside>
            <Card>
              <CardHeader>
                <CardTitle>Demo Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      If <code className="text-xs bg-muted px-1 rounded">SENSESPACE_MINIAPP_TOKEN</code> is set in the
                      server env, profile will be fetched live.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      Otherwise, demo profile <code className="text-xs bg-muted px-1 rounded">user123</code> from{' '}
                      <code className="text-xs bg-muted px-1 rounded">mocks/sensespace/demo_profile.json</code> is
                      returned.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>The UI shows whether profile is demo-mode.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      Personal Shopper uses profile preferences (style, size) to generate recommendations.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>
                      Makeup Artist uses <code className="text-xs bg-muted px-1 rounded">makeup_pref</code> from
                      profile preferences.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </PageTransition>
  );
}

