'use client';

import { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CompetitiveAnalysisService } from '@/services/competitive-analysis-service';
import type { ComparisonMatrix } from '@/lib/idea-quality/types';
import { CheckCircle2, TrendingUp } from 'lucide-react';

// Constants moved outside component to prevent recreation
const COMPETITORS = ['Pinterest', 'True Fit', 'Google Shopping'] as const;
const STYLE_SHEPHERD_FEATURES = [
  'Returns Prevention Engine',
  'Voice-First Fashion AI',
  'Cross-Brand Personalization',
  'Environmental Impact Tracking',
] as const;

// Memoize service instance outside component to prevent recreation
const analysisService = new CompetitiveAnalysisService();

function CompetitiveAnalysisDashboardContent() {
  const [comparison, setComparison] = useState<ComparisonMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the data loading function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analysisService.compareAgainstCompetitors(
        [...COMPETITORS],
        [...STYLE_SHEPHERD_FEATURES]
      );
      setComparison(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load competitive analysis';
      setError(errorMessage);
      console.error('Error loading competitive analysis:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Show loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  // Show error state
  if (error || !comparison) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error || 'Failed to load competitive analysis'}</p>
          <button
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            aria-label="Retry loading competitive analysis"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8" role="main" aria-label="Competitive Analysis Dashboard">
      {/* Positioning Statement */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl">Market Positioning</CardTitle>
          <CardDescription>{comparison.marketPositioning.headline}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold mb-2">{comparison.marketPositioning.subheading}</p>
          <p className="text-gray-700 mb-4">{comparison.marketPositioning.keyMessage}</p>
          <div className="space-y-2">
            <p className="font-medium">Differentiation:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {comparison.marketPositioning.differentiation.map((diff, idx) => (
                <li key={idx}>{diff}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Competitors */}
      <section aria-labelledby="competitors-heading">
        <h2 id="competitors-heading" className="text-2xl font-bold mb-4">Competitive Landscape</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="list">
          {comparison.competitors.map((competitor) => (
            <Card key={competitor.id} role="listitem">
              <CardHeader>
                <CardTitle className="text-lg">{competitor.name}</CardTitle>
                <CardDescription>{competitor.category}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Key Features:</p>
                  <ul className="space-y-1 text-xs" aria-label={`${competitor.name} key features`}>
                    {competitor.keyFeatures.slice(0, 2).map((feature, idx) => (
                      <li key={`${competitor.id}-feature-${idx}`}>• {feature.name}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2 text-red-600">Limitations:</p>
                  <ul className="space-y-1 text-xs" aria-label={`${competitor.name} limitations`}>
                    {competitor.limitations.map((lim, idx) => (
                      <li key={`${competitor.id}-limit-${idx}`} className="text-red-700">
                        • {lim.area}: {lim.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Competitive Advantages */}
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Style Shepherd Advantages</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparison.styleShepherd.competitiveAdvantages.map((advantage, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 bg-white rounded-lg border border-green-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-green-900">{advantage.advantage}</h4>
                  <Badge
                    variant={
                      advantage.defensibility === 'high'
                        ? 'default'
                        : advantage.defensibility === 'medium'
                          ? 'secondary'
                          : 'outline'
                    }
                  >
                    {advantage.defensibility}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Time to Replication: {advantage.timeToReplication}</p>
                  <p>Resources Required: {advantage.resourcesRequired}</p>
                  {advantage.networkEffects && (
                    <p className="text-green-600 font-medium">✓ Network Effects</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Unique Points */}
      <Card>
        <CardHeader>
          <CardTitle>Unique Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" role="list" aria-label="Unique capabilities">
            {comparison.styleShepherd.uniquePoints.map((point, idx) => (
              <div key={`unique-point-${idx}`} className="flex items-start space-x-2" role="listitem">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm">{point}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Export memoized component
export const CompetitiveAnalysisDashboard = memo(CompetitiveAnalysisDashboardContent);

