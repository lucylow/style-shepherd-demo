import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Shield,
  Zap,
  Calculator,
  Info,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import HeaderNav from '../../../src/components/HeaderNav';
import Footer from '../../../src/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../src/components/ui/card';
import { Button } from '../../../src/components/ui/button';
import { Badge } from '../../../src/components/ui/badge';
import { Progress } from '../../../src/components/ui/progress';

export default function AdminMetrics() {
  const [queryLatency, setQueryLatency] = useState({
    p50: 145,
    p95: 280,
    p99: 450,
    avg: 165,
    trend: 'down' as 'up' | 'down',
  });

  const [returnsPrevented, setReturnsPrevented] = useState({
    percentage: 28.3,
    totalPrevented: 54923,
    totalReturns: 194000,
    valueSaved: 2470000,
    trend: 'up' as 'up' | 'down',
  });

  const [revenue, setRevenue] = useState({
    mrr: 245000,
    arr: 2940000,
    growthRate: 12.5,
    trend: 'up' as 'up' | 'down',
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setQueryLatency(prev => ({
        ...prev,
        p50: 140 + Math.random() * 15,
        p95: 270 + Math.random() * 30,
        p99: 440 + Math.random() * 40,
        avg: 160 + Math.random() * 20,
      }));

      setReturnsPrevented(prev => ({
        ...prev,
        percentage: prev.percentage + (Math.random() - 0.5) * 0.2,
        totalPrevented: prev.totalPrevented + Math.floor(Math.random() * 5),
      }));

      setRevenue(prev => ({
        ...prev,
        mrr: prev.mrr + (Math.random() - 0.5) * 2000,
        arr: prev.mrr * 12,
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Calculations for "Why it matters"
  const costPerReturn = 45; // Average cost to process a return
  const queriesPerDay = 125000; // Daily query volume
  const costPerSecondCompute = 0.05; // $0.05 per second of compute

  const latencyImpact = {
    userExperience: queryLatency.avg < 200 ? 'Excellent' : queryLatency.avg < 500 ? 'Good' : 'Needs Improvement',
    conversionImpact: queryLatency.avg < 200 ? '+2.3%' : queryLatency.avg < 500 ? '+1.1%' : '-0.8%',
    costPerQuery: (queryLatency.avg / 1000) * costPerSecondCompute,
    annualSavings: ((queryLatency.avg - 200) / 1000) * costPerSecondCompute * queriesPerDay * 365,
    annualCost: (queryLatency.avg / 1000) * costPerSecondCompute * queriesPerDay * 365,
  };

  const returnsImpact = {
    industryAverage: 25.0,
    improvement: returnsPrevented.percentage - 25.0,
    costPerReturn: costPerReturn,
    annualSavings: returnsPrevented.totalPrevented * costPerReturn,
    revenueRetention: (returnsPrevented.valueSaved / revenue.arr) * 100,
    totalReturnCostAvoided: returnsPrevented.totalPrevented * costPerReturn,
  };

  const revenueImpact = {
    growthProjection: revenue.arr * (1 + revenue.growthRate / 100),
    customerLTV: revenue.mrr * 24, // Assuming 24 month average LTV
    churnImpact: revenue.mrr * 0.02, // 2% monthly churn
    netRetention: 108.5, // Net revenue retention rate
    annualChurnCost: revenue.mrr * 0.02 * 12,
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(Math.round(value));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <HeaderNav />
      <main id="main" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Metrics Dashboard</h1>
                <p className="text-muted-foreground">Performance, business impact, and revenue metrics</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link to="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {/* Query Latency Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Query Latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">{queryLatency.avg.toFixed(0)}ms</div>
                  <p className="text-xs text-muted-foreground mt-1">Average response time</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P50 (Median)</span>
                    <span className="font-medium">{queryLatency.p50.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P95</span>
                    <span className="font-medium">{queryLatency.p95.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">P99</span>
                    <span className="font-medium">{queryLatency.p99.toFixed(0)}ms</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs">
                    {queryLatency.trend === 'down' ? (
                      <TrendingDown className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      {queryLatency.trend === 'down' ? 'Improving' : 'Degrading'} performance
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            {/* Why it matters */}
            <div className="px-6 pb-6 pt-0 relative z-10">
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-2 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                  <Calculator className="w-4 h-4" />
                  Why it matters
                </div>
                <div className="text-xs space-y-1.5 text-blue-900 dark:text-blue-200">
                  <div className="font-medium">
                    • {latencyImpact.userExperience} UX: {latencyImpact.conversionImpact} conversion impact
                  </div>
                  <div>
                    • Cost per query: ${latencyImpact.costPerQuery.toFixed(4)} = ({queryLatency.avg}ms ÷ 1000) × ${costPerSecondCompute}/sec
                  </div>
                  <div>
                    • Annual compute cost: {formatCurrency(latencyImpact.annualCost)} = {formatNumber(queriesPerDay)} queries/day × 365 days × ${latencyImpact.costPerQuery.toFixed(4)}
                  </div>
                  {latencyImpact.annualSavings < 0 && (
                    <div className="text-green-700 dark:text-green-400 font-medium">
                      • Annual savings vs 200ms target: {formatCurrency(Math.abs(latencyImpact.annualSavings))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Returns Prevented Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Returns Prevented</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">{returnsPrevented.percentage.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatNumber(returnsPrevented.totalPrevented)} prevented returns
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Returns</span>
                    <span className="font-medium">{formatNumber(returnsPrevented.totalReturns)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Value Saved</span>
                    <span className="font-medium text-green-600">{formatCurrency(returnsPrevented.valueSaved)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">vs Industry Avg</span>
                    <span className="font-medium text-green-600">
                      +{returnsImpact.improvement.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs">
                    {returnsPrevented.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      {returnsPrevented.trend === 'up' ? 'Improving' : 'Declining'} prevention rate
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            {/* Why it matters */}
            <div className="px-6 pb-6 pt-0 relative z-10">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 space-y-2 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300">
                  <Calculator className="w-4 h-4" />
                  Why it matters
                </div>
                <div className="text-xs space-y-1.5 text-green-900 dark:text-green-200">
                  <div className="font-medium">
                    • {returnsImpact.improvement.toFixed(1)}% better than industry avg (25% baseline)
                  </div>
                  <div>
                    • Cost savings: {formatNumber(returnsPrevented.totalPrevented)} returns × ${returnsImpact.costPerReturn} = {formatCurrency(returnsImpact.annualSavings)}
                  </div>
                  <div>
                    • Revenue retention: {returnsImpact.revenueRetention.toFixed(1)}% of ARR = {formatCurrency(returnsPrevented.valueSaved)} ÷ {formatCurrency(revenue.arr)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* MRR/ARR Card */}
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium">Revenue Metrics</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">{formatCurrency(revenue.mrr)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Monthly Recurring Revenue</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ARR</span>
                    <span className="font-medium">{formatCurrency(revenue.arr)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Growth Rate</span>
                    <span className="font-medium text-green-600">+{revenue.growthRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Net Retention</span>
                    <span className="font-medium">{revenueImpact.netRetention}%</span>
                  </div>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-xs">
                    {revenue.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className="text-muted-foreground">
                      {revenue.trend === 'up' ? 'Growing' : 'Declining'} revenue
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            {/* Why it matters */}
            <div className="px-6 pb-6 pt-0 relative z-10">
              <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 space-y-2 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
                  <Calculator className="w-4 h-4" />
                  Why it matters
                </div>
                <div className="text-xs space-y-1.5 text-purple-900 dark:text-purple-200">
                  <div>
                    • Projected ARR: {formatCurrency(revenueImpact.growthProjection)} = {formatCurrency(revenue.arr)} × (1 + {revenue.growthRate}%)
                  </div>
                  <div>
                    • Avg Customer LTV: {formatCurrency(revenueImpact.customerLTV)} = {formatCurrency(revenue.mrr)} × 24 months
                  </div>
                  <div>
                    • Monthly churn cost: {formatCurrency(revenueImpact.churnImpact)} = {formatCurrency(revenue.mrr)} × 2% churn rate
                  </div>
                  <div className="font-medium">
                    • Annual churn cost: {formatCurrency(revenueImpact.annualChurnCost)} = {formatCurrency(revenueImpact.churnImpact)} × 12 months
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Detailed Metrics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Performance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Query Latency Breakdown</CardTitle>
              <CardDescription>Percentile distribution of query response times</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>P50 (Median)</span>
                    <span className="font-medium">{queryLatency.p50.toFixed(0)}ms</span>
                  </div>
                  <Progress value={50} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    50% of queries complete in {queryLatency.p50.toFixed(0)}ms or less
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>P95</span>
                    <span className="font-medium">{queryLatency.p95.toFixed(0)}ms</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    95% of queries complete in {queryLatency.p95.toFixed(0)}ms or less
                  </p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>P99</span>
                    <span className="font-medium">{queryLatency.p99.toFixed(0)}ms</span>
                  </div>
                  <Progress value={90} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">
                    99% of queries complete in {queryLatency.p99.toFixed(0)}ms or less
                  </p>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="w-4 h-4 text-blue-500" />
                    <span className="font-medium">Target: &lt;200ms average</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current performance: {queryLatency.avg < 200 ? '✅ Meeting target' : '⚠️ Above target'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Returns Prevention Impact */}
          <Card>
            <CardHeader>
              <CardTitle>Returns Prevention Impact</CardTitle>
              <CardDescription>Business value from prevented returns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {returnsPrevented.percentage.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Prevention Rate</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(returnsPrevented.valueSaved)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Value Saved</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Industry Average</span>
                    <span>{returnsImpact.industryAverage}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Our Performance</span>
                    <span className="font-medium">{returnsPrevented.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Improvement</span>
                    <span className="font-medium text-green-600">
                      +{returnsImpact.improvement.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Cost Savings Calculation</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>
                      {formatNumber(returnsPrevented.totalPrevented)} returns × ${returnsImpact.costPerReturn} = {formatCurrency(returnsImpact.annualSavings)}
                    </div>
                    <div className="pt-2">
                      This represents {returnsImpact.revenueRetention.toFixed(1)}% of annual recurring revenue retained through prevention.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Projections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Revenue Projections & Unit Economics</CardTitle>
              <CardDescription>Forward-looking revenue metrics and customer economics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Current ARR</div>
                  <div className="text-2xl font-bold">{formatCurrency(revenue.arr)}</div>
                  <div className="text-xs text-muted-foreground">
                    Based on current MRR: {formatCurrency(revenue.mrr)}/month
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Projected ARR (Next Year)</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(revenueImpact.growthProjection)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Assuming {revenue.growthRate}% growth rate
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Average Customer LTV</div>
                  <div className="text-2xl font-bold">{formatCurrency(revenueImpact.customerLTV)}</div>
                  <div className="text-xs text-muted-foreground">
                    Based on 24-month average retention
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm font-medium mb-3">Churn Impact</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Churn Rate</span>
                        <span>2.0%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly Churn Cost</span>
                        <span className="font-medium">{formatCurrency(revenueImpact.churnImpact)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Annual Churn Cost</span>
                        <span className="font-medium">
                          {formatCurrency(revenueImpact.annualChurnCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-3">Retention Metrics</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Net Revenue Retention</span>
                        <span className="font-medium text-green-600">{revenueImpact.netRetention}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Growth Rate</span>
                        <span className="font-medium text-green-600">+{revenue.growthRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Returns Prevention Value</span>
                        <span className="font-medium">
                          {formatCurrency(returnsPrevented.valueSaved)} ({returnsImpact.revenueRetention.toFixed(1)}% of ARR)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}

