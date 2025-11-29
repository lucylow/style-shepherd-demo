/**
 * Autonomous Agent Base Class
 * Provides foundational capabilities for autonomous agent behavior:
 * - Self-learning from outcomes
 * - Autonomous decision-making
 * - Proactive monitoring and action
 * - Self-healing and error recovery
 * - Resource management
 */

import { vultrValkey } from '../../lib/vultr-valkey.js';
import { vultrPostgres } from '../../lib/vultr-postgres.js';

export interface AgentGoal {
  id: string;
  type: 'optimize' | 'monitor' | 'learn' | 'heal' | 'proactive';
  priority: number; // 1-10, higher is more important
  target: string;
  metrics: Record<string, number>;
  deadline?: number; // Timestamp
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface AgentDecision {
  action: string;
  reasoning: string;
  confidence: number;
  expectedOutcome: string;
  risk: number;
  timestamp: number;
}

export interface LearningOutcome {
  action: string;
  success: boolean;
  metrics: Record<string, number>;
  timestamp: number;
  context: Record<string, any>;
}

export interface AgentState {
  agentId: string;
  health: 'healthy' | 'degraded' | 'unhealthy';
  performance: {
    avgLatency: number;
    successRate: number;
    errorRate: number;
    throughput: number;
  };
  goals: AgentGoal[];
  recentDecisions: AgentDecision[];
  learningHistory: LearningOutcome[];
  lastHealthCheck: number;
}

export abstract class AutonomousAgentBase {
  protected agentId: string;
  protected agentName: string;
  protected state: AgentState;
  protected readonly STATE_CACHE_TTL = 3600; // 1 hour
  protected readonly LEARNING_WINDOW = 100; // Last N outcomes to learn from
  protected readonly DECISION_HISTORY_SIZE = 50;
  protected readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute
  protected readonly PROACTIVE_ACTION_INTERVAL = 300000; // 5 minutes

  private healthCheckTimer?: NodeJS.Timeout;
  private proactiveActionTimer?: NodeJS.Timeout;

  constructor(agentId: string, agentName: string) {
    this.agentId = agentId;
    this.agentName = agentName;
    this.state = this.initializeState();
    this.startAutonomousOperations();
  }

  /**
   * Initialize agent state
   */
  private initializeState(): AgentState {
    return {
      agentId: this.agentId,
      health: 'healthy',
      performance: {
        avgLatency: 0,
        successRate: 1.0,
        errorRate: 0,
        throughput: 0,
      },
      goals: [],
      recentDecisions: [],
      learningHistory: [],
      lastHealthCheck: Date.now(),
    };
  }

  /**
   * Start autonomous operations (monitoring, proactive actions)
   */
  private startAutonomousOperations(): void {
    // Load state from cache
    this.loadState().catch(err => {
      console.warn(`[${this.agentName}] Failed to load state:`, err);
    });

    // Start health monitoring
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck().catch(err => {
        console.error(`[${this.agentName}] Health check failed:`, err);
      });
    }, this.HEALTH_CHECK_INTERVAL);

    // Start proactive actions
    this.proactiveActionTimer = setInterval(() => {
      this.performProactiveActions().catch(err => {
        console.error(`[${this.agentName}] Proactive action failed:`, err);
      });
    }, this.PROACTIVE_ACTION_INTERVAL);
  }

  /**
   * Stop autonomous operations
   */
  public stopAutonomousOperations(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.proactiveActionTimer) {
      clearInterval(this.proactiveActionTimer);
    }
  }

  /**
   * Make an autonomous decision based on current state and goals
   */
  protected async makeAutonomousDecision(
    context: Record<string, any>
  ): Promise<AgentDecision> {
    // Analyze current state
    const stateAnalysis = this.analyzeState();

    // Evaluate goals
    const goalPriorities = this.evaluateGoals();

    // Generate decision options
    const options = await this.generateDecisionOptions(context, stateAnalysis, goalPriorities);

    // Select best option using decision logic
    const decision = this.selectBestOption(options, context);

    // Record decision
    this.recordDecision(decision);

    return decision;
  }

  /**
   * Analyze current agent state
   */
  protected analyzeState(): {
    healthScore: number;
    performanceScore: number;
    goalProgress: number;
    recommendations: string[];
  } {
    const state = this.state;
    
    // Calculate health score (0-1)
    let healthScore = 1.0;
    if (state.health === 'degraded') healthScore = 0.6;
    if (state.health === 'unhealthy') healthScore = 0.3;

    // Calculate performance score (0-1)
    const performanceScore = 
      state.performance.successRate * 0.5 +
      (1 - Math.min(state.performance.errorRate, 1)) * 0.3 +
      Math.min(state.performance.throughput / 100, 1) * 0.2;

    // Calculate goal progress
    const completedGoals = state.goals.filter(g => g.status === 'completed').length;
    const goalProgress = state.goals.length > 0 
      ? completedGoals / state.goals.length 
      : 1.0;

    // Generate recommendations
    const recommendations: string[] = [];
    if (state.performance.errorRate > 0.1) {
      recommendations.push('High error rate detected - investigate and fix');
    }
    if (state.performance.avgLatency > 1000) {
      recommendations.push('High latency detected - optimize performance');
    }
    if (state.health === 'unhealthy') {
      recommendations.push('Agent health is unhealthy - immediate action required');
    }
    if (goalProgress < 0.5 && state.goals.length > 0) {
      recommendations.push('Low goal completion rate - review and adjust strategies');
    }

    return {
      healthScore,
      performanceScore,
      goalProgress,
      recommendations,
    };
  }

  /**
   * Evaluate current goals and their priorities
   */
  protected evaluateGoals(): Map<string, number> {
    const priorities = new Map<string, number>();
    const now = Date.now();

    for (const goal of this.state.goals) {
      if (goal.status === 'completed' || goal.status === 'failed') continue;

      let priority = goal.priority;

      // Increase priority if deadline is approaching
      if (goal.deadline && goal.deadline > now) {
        const timeRemaining = goal.deadline - now;
        const urgency = Math.max(0, 1 - timeRemaining / 3600000); // Urgency increases as deadline approaches
        priority += urgency * 3;
      }

      // Increase priority for in-progress goals
      if (goal.status === 'in_progress') {
        priority += 1;
      }

      priorities.set(goal.id, priority);
    }

    return priorities;
  }

  /**
   * Generate decision options (to be implemented by subclasses)
   */
  protected abstract generateDecisionOptions(
    context: Record<string, any>,
    stateAnalysis: ReturnType<typeof this.analyzeState>,
    goalPriorities: Map<string, number>
  ): Promise<AgentDecision[]>;

  /**
   * Select best decision option
   */
  protected selectBestOption(
    options: AgentDecision[],
    context: Record<string, any>
  ): AgentDecision {
    if (options.length === 0) {
      // Default decision
      return {
        action: 'continue',
        reasoning: 'No actionable options available',
        confidence: 0.5,
        expectedOutcome: 'Maintain current state',
        risk: 0.1,
        timestamp: Date.now(),
      };
    }

    // Score each option
    const scored = options.map(option => {
      let score = option.confidence * 0.4; // Confidence weight
      score += (1 - option.risk) * 0.3; // Lower risk = higher score
      
      // Prefer actions that align with high-priority goals
      const goalAlignment = this.calculateGoalAlignment(option);
      score += goalAlignment * 0.3;

      return { option, score };
    });

    // Select highest scoring option
    scored.sort((a, b) => b.score - a.score);
    return scored[0].option;
  }

  /**
   * Calculate how well a decision aligns with current goals
   */
  protected calculateGoalAlignment(decision: AgentDecision): number {
    // Simple heuristic: check if action type matches goal type
    let alignment = 0.5; // Base alignment

    for (const goal of this.state.goals) {
      if (goal.status !== 'in_progress') continue;

      // Check if decision action matches goal type
      if (decision.action.includes(goal.type)) {
        alignment += 0.2;
      }
      if (decision.expectedOutcome.includes(goal.target)) {
        alignment += 0.3;
      }
    }

    return Math.min(1.0, alignment);
  }

  /**
   * Record a decision for learning
   */
  protected recordDecision(decision: AgentDecision): void {
    this.state.recentDecisions.push(decision);
    
    // Keep only recent decisions
    if (this.state.recentDecisions.length > this.DECISION_HISTORY_SIZE) {
      this.state.recentDecisions.shift();
    }

    // Persist state
    this.saveState().catch(err => {
      console.warn(`[${this.agentName}] Failed to save state:`, err);
    });
  }

  /**
   * Learn from an outcome
   */
  protected async learnFromOutcome(outcome: LearningOutcome): Promise<void> {
    // Add to learning history
    this.state.learningHistory.push(outcome);

    // Keep only recent outcomes
    if (this.state.learningHistory.length > this.LEARNING_WINDOW) {
      this.state.learningHistory.shift();
    }

    // Update performance metrics
    this.updatePerformanceMetrics(outcome);

    // Adjust strategies based on learning
    await this.adjustStrategies(outcome);

    // Persist state
    await this.saveState();
  }

  /**
   * Update performance metrics from outcome
   */
  protected updatePerformanceMetrics(outcome: LearningOutcome): void {
    const recentOutcomes = this.state.learningHistory.slice(-20); // Last 20 outcomes
    
    if (recentOutcomes.length === 0) return;

    const successes = recentOutcomes.filter(o => o.success).length;
    const failures = recentOutcomes.length - successes;

    this.state.performance.successRate = successes / recentOutcomes.length;
    this.state.performance.errorRate = failures / recentOutcomes.length;

    // Update latency if available
    if (outcome.metrics.latency) {
      const latencies = recentOutcomes
        .map(o => o.metrics.latency)
        .filter((l): l is number => l !== undefined);
      
      if (latencies.length > 0) {
        this.state.performance.avgLatency = 
          latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
      }
    }

    // Update throughput
    this.state.performance.throughput = recentOutcomes.length / 10; // Actions per 10 outcomes
  }

  /**
   * Adjust strategies based on learning (to be implemented by subclasses)
   */
  protected abstract adjustStrategies(outcome: LearningOutcome): Promise<void>;

  /**
   * Perform health check
   */
  protected async performHealthCheck(): Promise<void> {
    try {
      const analysis = this.analyzeState();
      
      // Determine health status
      if (analysis.healthScore < 0.3) {
        this.state.health = 'unhealthy';
      } else if (analysis.healthScore < 0.7) {
        this.state.health = 'degraded';
      } else {
        this.state.health = 'healthy';
      }

      this.state.lastHealthCheck = Date.now();

      // If unhealthy, attempt self-healing
      if (this.state.health === 'unhealthy') {
        await this.attemptSelfHealing();
      }

      // Persist state
      await this.saveState();
    } catch (error) {
      console.error(`[${this.agentName}] Health check error:`, error);
      this.state.health = 'degraded';
    }
  }

  /**
   * Attempt self-healing (to be implemented by subclasses)
   */
  protected abstract attemptSelfHealing(): Promise<void>;

  /**
   * Perform proactive actions
   */
  protected async performProactiveActions(): Promise<void> {
    try {
      const analysis = this.analyzeState();
      const goalPriorities = this.evaluateGoals();

      // Check if proactive action is needed
      if (analysis.recommendations.length > 0) {
        const decision = await this.makeAutonomousDecision({
          trigger: 'proactive',
          recommendations: analysis.recommendations,
          goalPriorities: Array.from(goalPriorities.entries()),
        });

        // Execute decision if confidence is high enough
        if (decision.confidence > 0.7 && decision.risk < 0.3) {
          await this.executeDecision(decision);
        }
      }

      // Work on high-priority goals
      const highPriorityGoals = this.state.goals
        .filter(g => {
          const priority = goalPriorities.get(g.id) || 0;
          return priority >= 7 && g.status === 'pending';
        })
        .slice(0, 1); // Work on one goal at a time

      for (const goal of highPriorityGoals) {
        await this.workOnGoal(goal);
      }
    } catch (error) {
      console.error(`[${this.agentName}] Proactive action error:`, error);
    }
  }

  /**
   * Execute a decision (to be implemented by subclasses)
   */
  protected abstract executeDecision(decision: AgentDecision): Promise<LearningOutcome>;

  /**
   * Work on a goal (to be implemented by subclasses)
   */
  protected abstract workOnGoal(goal: AgentGoal): Promise<void>;

  /**
   * Add a goal for the agent to work towards
   */
  public addGoal(goal: Omit<AgentGoal, 'status'>): void {
    this.state.goals.push({
      ...goal,
      status: 'pending',
    });
    this.saveState().catch(err => {
      console.warn(`[${this.agentName}] Failed to save goal:`, err);
    });
  }

  /**
   * Get current agent state
   */
  public getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Load state from cache
   */
  protected async loadState(): Promise<void> {
    try {
      const cached = await vultrValkey.get<AgentState>(
        `agent-state:${this.agentId}`
      );
      if (cached) {
        this.state = cached;
      }
    } catch (error) {
      console.warn(`[${this.agentName}] Failed to load state from cache:`, error);
    }
  }

  /**
   * Save state to cache
   */
  protected async saveState(): Promise<void> {
    try {
      await vultrValkey.set(
        `agent-state:${this.agentId}`,
        this.state,
        this.STATE_CACHE_TTL
      );
    } catch (error) {
      console.warn(`[${this.agentName}] Failed to save state to cache:`, error);
    }
  }

  /**
   * Record operation outcome for learning
   */
  public async recordOutcome(
    action: string,
    success: boolean,
    metrics: Record<string, number> = {},
    context: Record<string, any> = {}
  ): Promise<void> {
    const outcome: LearningOutcome = {
      action,
      success,
      metrics,
      timestamp: Date.now(),
      context,
    };

    await this.learnFromOutcome(outcome);
  }
}

