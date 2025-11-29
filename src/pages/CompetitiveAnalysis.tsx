import HeaderNav from '@/components/HeaderNav';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { CompetitiveAnalysisDashboard } from '@/components/idea-quality/CompetitiveAnalysisDashboard';

export default function CompetitiveAnalysis() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <HeaderNav />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold mb-2">Competitive Analysis</h1>
        <p className="text-gray-600 mb-8">
          How Style Shepherd compares to existing solutions in the market
        </p>
        <CompetitiveAnalysisDashboard />
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

