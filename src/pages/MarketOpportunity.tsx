import HeaderNav from '@/components/HeaderNav';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { MarketOpportunityDashboard } from '@/components/idea-quality/MarketOpportunityDashboard';

export default function MarketOpportunity() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <HeaderNav />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <h1 className="text-4xl font-bold mb-2">Market Opportunity</h1>
        <p className="text-gray-600 mb-8">
          Quantifying the $550B+ returns management and voice commerce opportunity
        </p>
        <MarketOpportunityDashboard />
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

