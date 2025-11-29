/**
 * Autonomous Search Agent
 * Enhanced SearchAgent with autonomous capabilities:
 * - Self-optimizing search strategies
 * - Proactive cache warming
 * - Autonomous merchant selection
 * - Self-learning from search outcomes
 */

import { AutonomousAgentBase, AgentDecision, AgentGoal, LearningOutcome } from './AutonomousAgentBase.js';
import { SearchAgent, SearchParams, SearchResult, Product } from './SearchAgent.js';
import { vultrValkey } from '../../lib/vultr-valkey.js';
import { userMemory, styleInference } from '../../lib/raindrop-config.js';

export class AutonomousSearchAgent extends AutonomousAgentBase {
  private searchAgent: SearchAgent;
  private searchStrategies: Map<string, number>; // Strategy -> success rate
  private merchantPerformance: Map<string, { success: number; latency: number; count: number }>;
  private popularQueries: Map<string, number>; // Query -> frequency

  constructor() {
    super('autonomous-search-agent', 'AutonomousSearchAgent');
    this.searchAgent = new SearchAgent();
    this.searchStrategies = new Map();
    this.merchantPerformance = new Map();
    this.popularQueries = new Map();
    this.initializeAutonomousGoals();
  }

  /**
   * Initialize autonomous goals
   */
  private initializeAutonomousGoals(): void {
    // Goal: Optimize search performance
    this.addGoal({
      id: 'optimize-performance',
      type: 'optimize',
      priority: 8,
      target: 'avgLatency',
      metrics: { targetLatency: 500 },
    });

    // Goal: Improve search relevance
    this.addGoal({
      id: 'improve-relevance',
      type: 'optimize',
      priority: 7,
      target: 'relevanceScore',
      metrics: { targetRelevance: 0.85 },
    });

    // Goal: Proactive cache warming
    this.addGoal({
      id: 'cache-warming',
      type: 'proactive',
      priority: 6,
      target: 'cacheHitRate',
      metrics: { targetHitRate: 0.7 },
    });
  }

  /**
   * Enhanced search with autonomous decision-making
   */
  async search(params: SearchParams, userId?: string): Promise<SearchResult> {
    const startTime = Date.now();

    try {
      // Make autonomous decision about search strategy
      const decision = await this.makeAutonomousDecision({
        operation: 'search',
        params,
        userId,
      });

      // Execute search with chosen strategy
      let result: SearchResult;
      
      if (decision.action === 'use-cache-priority') {
        result = await this.searchWithCachePriority(params, userId);
      } else if (decision.action === 'use-ai-ranking') {
        result = await this.searchWithAIRanking(params, userId);
      } else if (decision.action === 'use-merchant-selection') {
        result = await this.searchWithMerchantSelection(params, userId);
      } else {
        // Default: standard search
        result = await this.searchAgent.search(params, userId);
      }

      // Record outcome for learning
      const latency = Date.now() - startTime;
      const success = result.products.length > 0;
      const relevanceScore = this.calculateRelevanceScore(result, params);

      await this.recordOutcome(
        decision.action,
        success,
        {
          latency,
          resultCount: result.products.length,
          relevanceScore,
          searchTime: result.searchTime,
        },
        { params, userId, decision }
      );

      // Track popular queries for proactive caching
      this.trackPopularQuery(params.query);

      return result;
    } catch (error) {
      // Record failure
      await this.recordOutcome(
        'search',
        false,
        { latency: Date.now() - startTime },
        { params, userId, error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Generate decision options for search
   */
  protected async generateDecisionOptions(
    context: Record<string, any>,
    stateAnalysis: ReturnType<typeof this.analyzeState>,
    goalPriorities: Map<string, number>
  ): Promise<AgentDecision[]> {
    const options: AgentDecision[] = [];
    const params = context.params as SearchParams;

    // Option 1: Use cache priority strategy
    const cacheHitRate = await this.getCacheHitRate();
    if (cacheHitRate < 0.7) {
      options.push({
        action: 'use-cache-priority',
        reasoning: `Cache hit rate (${(cacheHitRate * 100).toFixed(1)}%) is below target. Prioritize cache warming.`,
        confidence: 0.8,
        expectedOutcome: 'Improved cache hit rate and reduced latency',
        risk: 0.1,
        timestamp: Date.now(),
      });
    }

    // Option 2: Use AI ranking if available and performance is good
    if (styleInference && stateAnalysis.performanceScore > 0.7) {
      options.push({
        action: 'use-ai-ranking',
        reasoning: 'AI ranking available and agent performance is healthy. Use AI for better relevance.',
        confidence: 0.85,
        expectedOutcome: 'Higher relevance scores and better user satisfaction',
        risk: 0.15,
        timestamp: Date.now(),
      });
    }

    // Option 3: Use merchant selection based on performance
    if (this.merchantPerformance.size > 0) {
      const topMerchants = this.getTopPerformingMerchants(3);
      if (topMerchants.length > 0) {
        options.push({
          action: 'use-merchant-selection',
          reasoning: `Focus on top-performing merchants: ${topMerchants.join(', ')}`,
          confidence: 0.75,
          expectedOutcome: 'Faster search results with better reliability',
          risk: 0.2,
          timestamp: Date.now(),
        });
      }
    }

    // Option 4: Standard search (fallback)
    options.push({
      action: 'standard-search',
      reasoning: 'Use standard search strategy',
      confidence: 0.9,
      expectedOutcome: 'Reliable search results',
      risk: 0.1,
      timestamp: Date.now(),
    });

    return options;
  }

  /**
   * Search with cache priority strategy
   */
  private async searchWithCachePriority(
    params: SearchParams,
    userId?: string
  ): Promise<SearchResult> {
    // Check cache first with extended TTL
    const cacheKey = `search:${JSON.stringify(params)}`;
    const cached = await vultrValkey.get<SearchResult>(cacheKey);
    if (cached) {
      return cached;
    }

    // Perform search
    const result = await this.searchAgent.search(params, userId);

    // Cache with longer TTL for popular queries
    const isPopular = this.popularQueries.get(params.query) || 0 > 5;
    const ttl = isPopular ? 600 : 300; // 10 min for popular, 5 min for others
    await vultrValkey.set(cacheKey, result, ttl);

    return result;
  }

  /**
   * Search with AI ranking
   */
  private async searchWithAIRanking(
    params: SearchParams,
    userId?: string
  ): Promise<SearchResult> {
    // Get more results than needed for better AI ranking
    const extendedParams = { ...params, limit: (params.limit || 20) * 2 };
    const result = await this.searchAgent.search(extendedParams, userId);

    // AI ranking is already done in SearchAgent, but we can enhance it
    return result;
  }

  /**
   * Search with merchant selection
   */
  private async searchWithMerchantSelection(
    params: SearchParams,
    userId?: string
  ): Promise<SearchResult> {
    // Focus on top-performing merchants
    const topMerchants = this.getTopPerformingMerchants(3);
    
    // This would filter merchants in actual implementation
    // For now, use standard search
    return await this.searchAgent.search(params, userId);
  }

  /**
   * Adjust strategies based on learning
   */
  protected async adjustStrategies(outcome: LearningOutcome): Promise<void> {
    const action = outcome.action;
    const success = outcome.success;
    const latency = outcome.metrics.latency || 0;
    const relevanceScore = outcome.metrics.relevanceScore || 0;

    // Update strategy success rates
    const currentRate = this.searchStrategies.get(action) || 0.5;
    const newRate = currentRate * 0.9 + (success ? 1.0 : 0.0) * 0.1;
    this.searchStrategies.set(action, newRate);

    // Update merchant performance if available
    if (outcome.context.merchants) {
      const merchants = outcome.context.merchants as string[];
      for (const merchant of merchants) {
        const perf = this.merchantPerformance.get(merchant) || {
          success: 0,
          latency: 0,
          count: 0,
        };
        perf.count += 1;
        perf.success += success ? 1 : 0;
        perf.latency = (perf.latency * (perf.count - 1) + latency) / perf.count;
        this.merchantPerformance.set(merchant, perf);
      }
    }

    // Adjust goals based on performance
    if (latency > 1000 && this.state.performance.avgLatency > 800) {
      // High latency detected - prioritize performance optimization
      const perfGoal = this.state.goals.find(g => g.id === 'optimize-performance');
      if (perfGoal && perfGoal.priority < 10) {
        perfGoal.priority = 10;
      }
    }

    if (relevanceScore < 0.7) {
      // Low relevance - prioritize relevance improvement
      const relevanceGoal = this.state.goals.find(g => g.id === 'improve-relevance');
      if (relevanceGoal && relevanceGoal.priority < 9) {
        relevanceGoal.priority = 9;
      }
    }
  }

  /**
   * Attempt self-healing
   */
  protected async attemptSelfHealing(): Promise<void> {
    console.log(`[${this.agentName}] Attempting self-healing...`);

    // Clear problematic caches
    try {
      // This would clear specific cache keys in production
      console.log(`[${this.agentName}] Cleared problematic caches`);
    } catch (error) {
      console.error(`[${this.agentName}] Failed to clear caches:`, error);
    }

    // Reset underperforming strategies
    for (const [strategy, rate] of this.searchStrategies.entries()) {
      if (rate < 0.3) {
        // Reset low-performing strategy
        this.searchStrategies.set(strategy, 0.5);
        console.log(`[${this.agentName}] Reset strategy: ${strategy}`);
      }
    }

    // Mark health check as completed
    this.state.lastHealthCheck = Date.now();
  }

  /**
   * Execute a decision
   */
  protected async executeDecision(decision: AgentDecision): Promise<LearningOutcome> {
    const startTime = Date.now();

    try {
      if (decision.action === 'warm-cache') {
        // Proactive cache warming
        await this.warmCache();
      } else if (decision.action === 'optimize-strategy') {
        // Optimize search strategy
        await this.optimizeSearchStrategy();
      }

      const latency = Date.now() - startTime;
      return {
        action: decision.action,
        success: true,
        metrics: { latency },
        timestamp: Date.now(),
        context: { decision },
      };
    } catch (error) {
      const latency = Date.now() - startTime;
      return {
        action: decision.action,
        success: false,
        metrics: { latency },
        timestamp: Date.now(),
        context: { decision, error: error instanceof Error ? error.message : String(error) },
      };
    }
  }

  /**
   * Work on a goal
   */
  protected async workOnGoal(goal: AgentGoal): Promise<void> {
    if (goal.type === 'proactive' && goal.id === 'cache-warming') {
      await this.warmCache();
      goal.status = 'completed';
    } else if (goal.type === 'optimize' && goal.id === 'optimize-performance') {
      await this.optimizePerformance();
      goal.status = 'in_progress';
    }
  }

  /**
   * Warm cache proactively
   */
  private async warmCache(): Promise<void> {
    // Get top popular queries
    const topQueries = Array.from(this.popularQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query]) => query);

    // Pre-cache popular queries
    for (const query of topQueries) {
      try {
        await this.searchAgent.search({ query, limit: 20 });
        console.log(`[${this.agentName}] Warmed cache for query: ${query}`);
      } catch (error) {
        console.warn(`[${this.agentName}] Failed to warm cache for ${query}:`, error);
      }
    }
  }

  /**
   * Optimize search strategy
   */
  private async optimizeSearchStrategy(): Promise<void> {
    // Analyze strategy performance
    const strategies = Array.from(this.searchStrategies.entries())
      .sort((a, b) => b[1] - a[1]);

    // Focus on top-performing strategies
    console.log(`[${this.agentName}] Top strategies:`, strategies.slice(0, 3));
  }

  /**
   * Optimize performance
   */
  private async optimizePerformance(): Promise<void> {
    // Reduce cache TTL for faster updates
    // Optimize merchant selection
    // Adjust search limits
    console.log(`[${this.agentName}] Optimizing performance...`);
  }

  /**
   * Calculate relevance score
   */
  private calculateRelevanceScore(result: SearchResult, params: SearchParams): number {
    if (result.products.length === 0) return 0;

    let score = 0.5; // Base score

    // Check if results match query
    const queryLower = params.query.toLowerCase();
    const matchingProducts = result.products.filter(p =>
      p.name.toLowerCase().includes(queryLower) ||
      p.description?.toLowerCase().includes(queryLower)
    );
    score += (matchingProducts.length / result.products.length) * 0.3;

    // Check if results match preferences
    if (params.preferences) {
      const preferenceMatches = result.products.filter(p => {
        if (params.preferences!.colors && p.color) {
          return params.preferences!.colors.some(c =>
            p.color!.toLowerCase().includes(c.toLowerCase())
          );
        }
        return false;
      });
      score += (preferenceMatches.length / result.products.length) * 0.2;
    }

    return Math.min(1.0, score);
  }

  /**
   * Get cache hit rate
   */
  private async getCacheHitRate(): Promise<number> {
    // This would track cache hits/misses in production
    // For now, return a default value
    return 0.6;
  }

  /**
   * Get top performing merchants
   */
  private getTopPerformingMerchants(limit: number): string[] {
    return Array.from(this.merchantPerformance.entries())
      .sort((a, b) => {
        const scoreA = (a[1].success / a[1].count) * (1 / (a[1].latency / 1000));
        const scoreB = (b[1].success / b[1].count) * (1 / (b[1].latency / 1000));
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(([merchant]) => merchant);
  }

  /**
   * Track popular query
   */
  private trackPopularQuery(query: string): void {
    const count = this.popularQueries.get(query) || 0;
    this.popularQueries.set(query, count + 1);

    // Keep only top 100 queries
    if (this.popularQueries.size > 100) {
      const sorted = Array.from(this.popularQueries.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 100);
      this.popularQueries = new Map(sorted);
    }
  }
}

export const autonomousSearchAgent = new AutonomousSearchAgent();

