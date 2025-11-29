import { lazy, ComponentType } from 'react';

/**
 * Route metadata for SEO and navigation
 */
export interface RouteMetadata {
  title?: string;
  description?: string;
  requiresAuth?: boolean;
  group?: string;
  order?: number;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  path: string;
  component: ComponentType<any>;
  metadata?: RouteMetadata;
}

/**
 * Lazy-loaded page components for code splitting
 */
const Index = lazy(() => import('@/pages/Index'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Products = lazy(() => import('@/pages/Products'));
const VoiceShop = lazy(() => import('@/pages/VoiceShop'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
const Checkout = lazy(() => import('@/pages/Checkout'));
const OrderSuccess = lazy(() => import('@/pages/OrderSuccess'));
const SubscriptionCheckout = lazy(() => import('@/pages/SubscriptionCheckout'));
const SubscriptionSuccess = lazy(() => import('@/pages/SubscriptionSuccess'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Idea Quality Framework
const IdeaQualityIndex = lazy(() => import('@/pages/IdeaQualityIndex'));
const CompetitiveAnalysis = lazy(() => import('@/pages/CompetitiveAnalysis'));
const MarketOpportunity = lazy(() => import('@/pages/MarketOpportunity'));
const ProblemValidation = lazy(() => import('@/pages/ProblemValidation'));
const InnovationScoring = lazy(() => import('@/pages/InnovationScoring'));
const ImpactMeasurement = lazy(() => import('@/pages/ImpactMeasurement'));
const CompetitiveMoats = lazy(() => import('@/pages/CompetitiveMoats'));
const IdeaQualityAssessment = lazy(() => import('@/pages/IdeaQualityAssessment'));
const JudgingCriteriaAssessment = lazy(() => import('@/pages/JudgingCriteriaAssessment'));

// Judge-Ready Demo
const JudgeDemoPage = lazy(() => import('@/pages/JudgeDemo'));
const PilotKPIsPage = lazy(() => import('@/pages/PilotKPIs'));
const UnitEconomicsPage = lazy(() => import('@/pages/UnitEconomics'));
const SponsorMetricsPage = lazy(() => import('@/pages/SponsorMetrics'));

// Lovable Cloud
const LovableDashboard = lazy(() => import('@/pages/LovableDashboard'));
const LovableDeployment = lazy(() => import('@/pages/LovableDeployment'));
const LovableMonitoring = lazy(() => import('@/pages/LovableMonitoring'));
const LovableSettings = lazy(() => import('@/pages/LovableSettings'));
const LovableAnalytics = lazy(() => import('@/pages/LovableAnalytics'));
const LovableEnvironment = lazy(() => import('@/pages/LovableEnvironment'));
const LovableLogs = lazy(() => import('@/pages/LovableLogs'));
const LovableHealth = lazy(() => import('@/pages/LovableHealth'));

// Other pages
const ProfilePage = lazy(() => import('@/pages/Profile'));
const VerisenseDemoPage = lazy(() => import('@/pages/VerisenseDemo'));
const AgentPaymentDemo = lazy(() => import('@/pages/AgentPaymentDemo'));
const AdminMetrics = lazy(() => import('@/pages/admin/metrics'));
const Agents = lazy(() => import('@/pages/Agents'));
const AutonomousAgents = lazy(() => import('@/pages/AutonomousAgents'));

/**
 * Route configuration organized by feature groups
 */
export const routes: RouteConfig[] = [
  // Public routes
  {
    path: '/',
    component: Index,
    metadata: {
      title: 'Home',
      description: 'Welcome to Style Shepherd',
      group: 'public',
      order: 1,
    },
  },
  {
    path: '/products',
    component: Products,
    metadata: {
      title: 'Products',
      description: 'Browse our product catalog',
      group: 'public',
      order: 2,
    },
  },
  {
    path: '/voice-shop',
    component: VoiceShop,
    metadata: {
      title: 'Voice Shop',
      description: 'Shop with voice commands',
      group: 'public',
      order: 3,
    },
  },
  {
    path: '/agents',
    component: Agents,
    metadata: {
      title: 'AI Agents',
      description: 'Manage AI agents',
      group: 'public',
      order: 4,
    },
  },
  {
    path: '/autonomous-agents',
    component: AutonomousAgents,
    metadata: {
      title: 'Autonomous Agents',
      description: 'Monitor and manage autonomous AI agents',
      group: 'public',
      order: 5,
    },
  },

  // Authentication routes
  {
    path: '/login',
    component: Login,
    metadata: {
      title: 'Login',
      description: 'Sign in to your account',
      group: 'auth',
      order: 1,
    },
  },
  {
    path: '/signup',
    component: Signup,
    metadata: {
      title: 'Sign Up',
      description: 'Create a new account',
      group: 'auth',
      order: 2,
    },
  },
  {
    path: '/auth/callback',
    component: AuthCallback,
    metadata: {
      title: 'Authentication',
      description: 'Completing authentication',
      group: 'auth',
      order: 3,
    },
  },

  // Protected routes
  {
    path: '/dashboard',
    component: Dashboard,
    metadata: {
      title: 'Dashboard',
      description: 'Your dashboard',
      requiresAuth: true,
      group: 'protected',
      order: 1,
    },
  },
  {
    path: '/checkout',
    component: Checkout,
    metadata: {
      title: 'Checkout',
      description: 'Complete your purchase',
      requiresAuth: true,
      group: 'protected',
      order: 2,
    },
  },
  {
    path: '/order-success',
    component: OrderSuccess,
    metadata: {
      title: 'Order Success',
      description: 'Your order was successful',
      requiresAuth: true,
      group: 'protected',
      order: 3,
    },
  },
  {
    path: '/subscription-checkout',
    component: SubscriptionCheckout,
    metadata: {
      title: 'Subscription Checkout',
      description: 'Subscribe to our service',
      requiresAuth: true,
      group: 'protected',
      order: 4,
    },
  },
  {
    path: '/subscription-success',
    component: SubscriptionSuccess,
    metadata: {
      title: 'Subscription Success',
      description: 'Your subscription is active',
      requiresAuth: true,
      group: 'protected',
      order: 5,
    },
  },

  // Idea Quality Framework routes
  {
    path: '/idea-quality',
    component: IdeaQualityIndex,
    metadata: {
      title: 'Idea Quality Framework',
      description: 'Assess and improve your ideas',
      group: 'idea-quality',
      order: 1,
    },
  },
  {
    path: '/competitive-analysis',
    component: CompetitiveAnalysis,
    metadata: {
      title: 'Competitive Analysis',
      description: 'Analyze your competition',
      group: 'idea-quality',
      order: 2,
    },
  },
  {
    path: '/market-opportunity',
    component: MarketOpportunity,
    metadata: {
      title: 'Market Opportunity',
      description: 'Evaluate market opportunities',
      group: 'idea-quality',
      order: 3,
    },
  },
  {
    path: '/problem-validation',
    component: ProblemValidation,
    metadata: {
      title: 'Problem Validation',
      description: 'Validate problem-solution fit',
      group: 'idea-quality',
      order: 4,
    },
  },
  {
    path: '/innovation-scoring',
    component: InnovationScoring,
    metadata: {
      title: 'Innovation Scoring',
      description: 'Score your innovation',
      group: 'idea-quality',
      order: 5,
    },
  },
  {
    path: '/impact-measurement',
    component: ImpactMeasurement,
    metadata: {
      title: 'Impact Measurement',
      description: 'Measure your impact',
      group: 'idea-quality',
      order: 6,
    },
  },
  {
    path: '/competitive-moats',
    component: CompetitiveMoats,
    metadata: {
      title: 'Competitive Moats',
      description: 'Analyze competitive advantages',
      group: 'idea-quality',
      order: 7,
    },
  },
  {
    path: '/idea-quality-assessment',
    component: IdeaQualityAssessment,
    metadata: {
      title: 'Idea Quality Assessment',
      description: 'Complete idea quality assessment',
      group: 'idea-quality',
      order: 8,
    },
  },
  {
    path: '/judging-criteria',
    component: JudgingCriteriaAssessment,
    metadata: {
      title: 'Judging Criteria',
      description: 'Assessment criteria for judging',
      group: 'idea-quality',
      order: 9,
    },
  },

  // Judge-Ready Demo routes
  {
    path: '/demo',
    component: JudgeDemoPage,
    metadata: {
      title: 'Judge Demo',
      description: 'Demo for judges',
      group: 'demo',
      order: 1,
    },
  },
  {
    path: '/pilot-kpis',
    component: PilotKPIsPage,
    metadata: {
      title: 'Pilot KPIs',
      description: 'Key performance indicators',
      group: 'demo',
      order: 2,
    },
  },
  {
    path: '/unit-economics',
    component: UnitEconomicsPage,
    metadata: {
      title: 'Unit Economics',
      description: 'Unit economics analysis',
      group: 'demo',
      order: 3,
    },
  },
  {
    path: '/sponsor-metrics',
    component: SponsorMetricsPage,
    metadata: {
      title: 'Sponsor Metrics',
      description: 'Sponsor performance metrics',
      group: 'demo',
      order: 4,
    },
  },

  // Lovable Cloud routes
  {
    path: '/lovable',
    component: LovableDashboard,
    metadata: {
      title: 'Lovable Dashboard',
      description: 'Lovable cloud dashboard',
      group: 'lovable',
      order: 1,
    },
  },
  {
    path: '/lovable/deployment',
    component: LovableDeployment,
    metadata: {
      title: 'Deployment',
      description: 'Manage deployments',
      group: 'lovable',
      order: 2,
    },
  },
  {
    path: '/lovable/monitoring',
    component: LovableMonitoring,
    metadata: {
      title: 'Monitoring',
      description: 'System monitoring',
      group: 'lovable',
      order: 3,
    },
  },
  {
    path: '/lovable/settings',
    component: LovableSettings,
    metadata: {
      title: 'Settings',
      description: 'Lovable settings',
      group: 'lovable',
      order: 4,
    },
  },
  {
    path: '/lovable/analytics',
    component: LovableAnalytics,
    metadata: {
      title: 'Analytics',
      description: 'Analytics dashboard',
      group: 'lovable',
      order: 5,
    },
  },
  {
    path: '/lovable/environment',
    component: LovableEnvironment,
    metadata: {
      title: 'Environment',
      description: 'Environment configuration',
      group: 'lovable',
      order: 6,
    },
  },
  {
    path: '/lovable/logs',
    component: LovableLogs,
    metadata: {
      title: 'Logs',
      description: 'Application logs',
      group: 'lovable',
      order: 7,
    },
  },
  {
    path: '/lovable/health',
    component: LovableHealth,
    metadata: {
      title: 'Health',
      description: 'System health status',
      group: 'lovable',
      order: 8,
    },
  },

  // Profile and demo routes
  {
    path: '/profile/:id',
    component: ProfilePage,
    metadata: {
      title: 'Profile',
      description: 'User profile',
      group: 'profile',
      order: 1,
    },
  },
  {
    path: '/verisense-demo',
    component: VerisenseDemoPage,
    metadata: {
      title: 'Verisense Demo',
      description: 'Verisense demonstration',
      group: 'demo',
      order: 5,
    },
  },
  {
    path: '/agent-payment-demo',
    component: AgentPaymentDemo,
    metadata: {
      title: 'Agent Payment Demo',
      description: 'Agent payment demonstration',
      group: 'demo',
      order: 6,
    },
  },

  // Admin routes
  {
    path: '/admin/metrics',
    component: AdminMetrics,
    metadata: {
      title: 'Admin Metrics',
      description: 'Administrative metrics',
      requiresAuth: true,
      group: 'admin',
      order: 1,
    },
  },

  // 404 - must be last
  {
    path: '*',
    component: NotFound,
    metadata: {
      title: 'Not Found',
      description: 'Page not found',
      group: 'error',
    },
  },
];

/**
 * Get route by path
 */
export function getRouteByPath(path: string): RouteConfig | undefined {
  return routes.find((route) => {
    if (route.path.includes(':')) {
      // Handle dynamic routes
      const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    }
    return route.path === path;
  });
}

/**
 * Get routes by group
 */
export function getRoutesByGroup(group: string): RouteConfig[] {
  return routes.filter((route) => route.metadata?.group === group);
}

/**
 * Get all route groups
 */
export function getRouteGroups(): string[] {
  const groups = new Set<string>();
  routes.forEach((route) => {
    if (route.metadata?.group) {
      groups.add(route.metadata.group);
    }
  });
  return Array.from(groups);
}

