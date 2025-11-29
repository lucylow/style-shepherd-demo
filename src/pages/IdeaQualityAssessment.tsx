import HeaderNav from '@/components/HeaderNav';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { IdeaQualitySummary } from '@/components/idea-quality/IdeaQualitySummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IdeaQualityScoringEngine } from '@/services/idea-quality-scoring-service';
import { useEffect, useState } from 'react';
import type { IdeaQualityScore } from '@/lib/idea-quality/types';
import { Sparkles, AlertCircle } from 'lucide-react';

export default function IdeaQualityAssessment() {
  const [qualityScore, setQualityScore] = useState<IdeaQualityScore | null>(null);

  useEffect(() => {
    const engine = new IdeaQualityScoringEngine();
    setQualityScore(engine.calculateCompleteScore());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <HeaderNav />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold mb-2">Idea Quality Assessment</h1>
        <p className="text-gray-600 mb-8">
          Comprehensive scoring across all judging criteria
        </p>

        {/* Main Summary */}
        <div className="mb-8">
          <IdeaQualitySummary />
        </div>

        {/* Detailed Breakdown */}
        {qualityScore && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            {Object.entries(qualityScore.dimensions).map(([dimension, score]) => (
              <Card key={dimension}>
                <CardHeader>
                  <CardTitle className="text-lg capitalize">{dimension}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{score.toFixed(1)}/10</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${(score / 10) * 100}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Key Strengths */}
        {qualityScore && (
          <Card className="bg-green-50 border-l-4 border-green-600 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-900">
                <Sparkles className="w-5 h-5" />
                <span>✨ Key Strengths</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {qualityScore.strengths.map((strength, idx) => (
                  <li key={idx} className="text-green-900">
                    • {strength}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Areas for Improvement */}
        {qualityScore && qualityScore.improvements.length > 0 && (
          <Card className="bg-yellow-50 border-l-4 border-yellow-600 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-900">
                <AlertCircle className="w-5 h-5" />
                <span>🎯 Areas for Enhancement</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {qualityScore.improvements.map((improvement, idx) => (
                  <li key={idx} className="text-yellow-900">
                    • {improvement}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Final Recommendation */}
        {qualityScore && (
          <Card className="bg-blue-600 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Judge's Recommendation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg leading-relaxed mb-6">{qualityScore.recommendation}</p>
              <div className="text-2xl font-bold">{qualityScore.competitiveRanking}</div>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

