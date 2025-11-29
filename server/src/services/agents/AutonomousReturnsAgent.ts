/**
 * Autonomous Returns Agent
 * Enhanced ReturnsAgent with autonomous capabilities:
 * - Self-learning from prediction accuracy
 * - Autonomous risk threshold adjustment
 * - Proactive risk monitoring
 * - Self-optimizing prediction models
 */

import { AutonomousAgentBase, AgentDecision, AgentGoal, LearningOutcome } from './AutonomousAgentBase.js';
import { ReturnsAgent, ReturnRiskPrediction } from './ReturnsAgent.js';
import type { Product } from './SearchAgent.js';
import { vultrValkey } from '../../lib/vultr-valkey.js';
import { userMemory, orderSQL } from '../../lib/raindrop-config.js';

export interface PredictionAccuracy {
  predictionId: string;
  predictedRisk: number;
  actualOutcome: 'returned' | 'kept';
  accuracy: number;
  timestamp: number;
}

export class AutonomousReturnsAgent extends AutonomousAgentBase {
  private returnsAgent: ReturnsAgent;
  private predictionHistory: Map<string, PredictionAccuracy>;
  private riskThresholds: {
    low: number;
    medium: number;
    high: number;
  };
  private modelAccuracy: number;

  constructor() {
    super('autonomous-returns-agent', 'AutonomousReturnsAgent');
    this.returnsAgent = new ReturnsAgent();
    this.predictionHistory = new Map();
    this.riskThresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.9,
    };
    this.modelAccuracy = 0.85; // Initial accuracy estimate
    this.initializeAutonomousGoals();
  }

  /**
   * Initialize autonomous goals
   */
  private initializeAutonomousGoals(): void {
    // Goal: Improve prediction accuracy
    this.addGoal({
      id: 'improve-accuracy',
      type: 'optimize',
      priority: 9,
      target: 'modelAccuracy',
      metrics: { targetAccuracy: 0.92 },
    });

    // Goal: Optimize risk thresholds
    this.addGoal({
      id: 'optimize-thresholds',
      type: 'optimize',
      priority: 7,
      target: 'riskThresholds',
      metrics: { targetPrecision: 0.88 },
    });

    // Goal: Proactive risk monitoring
    this.addGoal({
      id: 'proactive-monitoring',
      type: 'proactive',
      priority: 6,
      target: 'highRiskItems',
      metrics: { targetDetectionRate: 0.95 },
    });
  }

  /**
   * Enhanced prediction with autonomous decision-making
   */
  async predict(
    userId: string,
    product: Product,
    selectedSize?: string
  ): Promise<ReturnRiskPrediction> {
    const startTime = Date.now();

    try {
      // Make autonomous decision about prediction strategy
      const decision = await this.makeAutonomousDecision({
        operation: 'predict',
        userId,
        product,
        selectedSize,
      });

      // Execute prediction
      let prediction: ReturnRiskPrediction;

      if (decision.action === 'use-conservative-thresholds') {
        prediction = await this.predictWithConservativeThresholds(userId, product, selectedSize);
      } else if (decision.action === 'use-aggressive-thresholds') {
        prediction = await this.predictWithAggressiveThresholds(userId, product, selectedSize);
      } else if (decision.action === 'use-enhanced-features') {
        prediction = await this.predictWithEnhancedFeatures(userId, product, selectedSize);
      } else {
        // Default: standard prediction
        prediction = await this.returnsAgent.predict(userId, product, selectedSize);
      }

      // Adjust prediction based on model accuracy
      if (this.modelAccuracy < 0.8) {
        // Low accuracy - be more conservative
        prediction.riskScore = Math.min(0.95, prediction.riskScore * 1.1);
        prediction.confidence = Math.max(0.5, prediction.confidence * 0.9);
      }

      // Record outcome for learning
      const latency = Date.now() - startTime;
      await this.recordOutcome(
        decision.action,
        true,
        {
          latency,
          riskScore: prediction.riskScore,
          confidence: prediction.confidence,
        },
        { userId, productId: product.id, decision }
      );

      // Store prediction for later accuracy tracking
      const predictionId = `${userId}:${product.id}:${Date.now()}`;
      this.storePrediction(predictionId, prediction);

      return prediction;
    } catch (error) {
      // Record failure
      await this.recordOutcome(
        'predict',
        false,
        { latency: Date.now() - startTime },
        { userId, productId: product.id, error: error instanceof Error ? error.message : String(error) }
      );
      throw error;
    }
  }

  /**
   * Record actual outcome for learning
   */
  async recordActualOutcome(
    userId: string,
    productId: string,
    actualOutcome: 'returned' | 'kept'
  ): Promise<void> {
    // Find matching predictions (batch process for efficiency)
    const prefix = `${userId}:${productId}:`;
    const matchingEntries: Array<[string, PredictionAccuracy]> = [];
    
    for (const [id, prediction] of this.predictionHistory.entries()) {
      if (id.startsWith(prefix)) {
        matchingEntries.push([id, prediction]);
      }
    }

    if (matchingEntries.length === 0) {
      console.debug('[AutonomousReturnsAgent] No matching predictions found for outcome tracking');
      return;
    }

    // Process all matching predictions
    const learningPromises = matchingEntries.map(async ([id, prediction]) => {
      // Calculate accuracy
      const predictedRisk = prediction.predictedRisk;
      const expectedReturn = actualOutcome === 'returned';
      const accuracyScore = expectedReturn
        ? 1 - Math.abs(predictedRisk - 1.0) // If returned, risk should be high
        : 1 - Math.abs(predictedRisk - 0.0); // If kept, risk should be low

      // Update accuracy
      prediction.actualOutcome = actualOutcome;
      prediction.accuracy = accuracyScore;
      this.predictionHistory.set(id, prediction);

      // Learn from outcome (non-blocking)
      return this.learnFromOutcome({
        action: 'predict',
        success: accuracyScore > 0.7,
        metrics: {
          accuracy: accuracyScore,
          predictedRisk,
          actualRisk: actualOutcome === 'returned' ? 1.0 : 0.0,
        },
        timestamp: Date.now(),
        context: { userId, productId, prediction },
      });
    });

    await Promise.allSettled(learningPromises);
    
    // Update model accuracy once after processing all predictions
    this.updateModelAccuracy();
  }

  /**
   * Generate decision options for prediction
   */
  protected async generateDecisionOptions(
    context: Record<string, any>,
    stateAnalysis: ReturnType<typeof this.analyzeState>,
    goalPriorities: Map<string, number>
  ): Promise<AgentDecision[]> {
    const options: AgentDecision[] = [];

    // Option 1: Use conservative thresholds if accuracy is low
    if (this.modelAccuracy < 0.8) {
      options.push({
        action: 'use-conservative-thresholds',
        reasoning: `Model accuracy (${(this.modelAccuracy * 100).toFixed(1)}%) is below target. Use conservative thresholds.`,
        confidence: 0.85,
        expectedOutcome: 'More accurate risk predictions with fewer false negatives',
        risk: 0.15,
        timestamp: Date.now(),
      });
    }

    // Option 2: Use aggressive thresholds if accuracy is high
    if (this.modelAccuracy > 0.9) {
      options.push({
        action: 'use-aggressive-thresholds',
        reasoning: `Model accuracy (${(this.modelAccuracy * 100).toFixed(1)}%) is excellent. Can use more aggressive thresholds.`,
        confidence: 0.8,
        expectedOutcome: 'More precise risk predictions',
        risk: 0.2,
        timestamp: Date.now(),
      });
    }

    // Option 3: Use enhanced features if performance allows
    if (stateAnalysis.performanceScore > 0.7) {
      options.push({
        action: 'use-enhanced-features',
        reasoning: 'Agent performance is healthy. Use enhanced features for better predictions.',
        confidence: 0.75,
        expectedOutcome: 'More accurate predictions with additional context',
        risk: 0.25,
        timestamp: Date.now(),
      });
    }

    // Option 4: Standard prediction (fallback)
    options.push({
      action: 'standard-predict',
      reasoning: 'Use standard prediction strategy',
      confidence: 0.9,
      expectedOutcome: 'Reliable risk prediction',
      risk: 0.1,
      timestamp: Date.now(),
    });

    return options;
  }

  /**
   * Predict with conservative thresholds
   */
  private async predictWithConservativeThresholds(
    userId: string,
    product: Product,
    selectedSize?: string
  ): Promise<ReturnRiskPrediction> {
    const prediction = await this.returnsAgent.predict(userId, product, selectedSize);
    
    // Adjust thresholds to be more conservative
    const adjustedThresholds = {
      low: this.riskThresholds.low * 0.8,
      medium: this.riskThresholds.medium * 0.9,
      high: this.riskThresholds.high,
    };

    // Reclassify risk level
    if (prediction.riskScore < adjustedThresholds.low) {
      prediction.riskLevel = 'low';
    } else if (prediction.riskScore < adjustedThresholds.medium) {
      prediction.riskLevel = 'medium';
    } else {
      prediction.riskLevel = 'high';
    }

    return prediction;
  }

  /**
   * Predict with aggressive thresholds
   */
  private async predictWithAggressiveThresholds(
    userId: string,
    product: Product,
    selectedSize?: string
  ): Promise<ReturnRiskPrediction> {
    const prediction = await this.returnsAgent.predict(userId, product, selectedSize);
    
    // Adjust thresholds to be more aggressive
    const adjustedThresholds = {
      low: this.riskThresholds.low * 1.1,
      medium: this.riskThresholds.medium * 1.05,
      high: this.riskThresholds.high * 0.95,
    };

    // Reclassify risk level
    if (prediction.riskScore < adjustedThresholds.low) {
      prediction.riskLevel = 'low';
    } else if (prediction.riskScore < adjustedThresholds.medium) {
      prediction.riskLevel = 'medium';
    } else {
      prediction.riskLevel = 'high';
    }

    return prediction;
  }

  /**
   * Predict with enhanced features
   */
  private async predictWithEnhancedFeatures(
    userId: string,
    product: Product,
    selectedSize?: string
  ): Promise<ReturnRiskPrediction> {
    // Get additional context
    const userProfile = await userMemory.get(userId).catch(() => null);
    const userHistory = await this.getUserHistory(userId);

    // Enhanced prediction with more context
    const prediction = await this.returnsAgent.predict(userId, product, selectedSize);

    // Add enhanced factors based on additional context
    if (userHistory.recentReturns > 2) {
      prediction.riskScore = Math.min(0.95, prediction.riskScore * 1.15);
      prediction.factors.push({
        factor: 'Recent Return Pattern',
        impact: 0.15,
        description: 'User has multiple recent returns',
      });
    }

    return prediction;
  }

  /**
   * Adjust strategies based on learning
   */
  protected async adjustStrategies(outcome: LearningOutcome): Promise<void> {
    // Update model accuracy
    if (outcome.metrics.accuracy !== undefined) {
      const recentAccuracies = this.state.learningHistory
        .slice(-20)
        .map(o => o.metrics.accuracy)
        .filter((a): a is number => a !== undefined);

      if (recentAccuracies.length > 0) {
        this.modelAccuracy = recentAccuracies.reduce((sum, a) => sum + a, 0) / recentAccuracies.length;
      }
    }

    // Adjust risk thresholds based on accuracy
    if (this.modelAccuracy < 0.8) {
      // Low accuracy - make thresholds more conservative
      this.riskThresholds.low *= 0.95;
      this.riskThresholds.medium *= 0.97;
    } else if (this.modelAccuracy > 0.9) {
      // High accuracy - can be more aggressive
      this.riskThresholds.low *= 1.02;
      this.riskThresholds.medium *= 1.01;
    }

    // Update goals based on performance
    const accuracyGoal = this.state.goals.find(g => g.id === 'improve-accuracy');
    if (accuracyGoal) {
      if (this.modelAccuracy < 0.85) {
        accuracyGoal.priority = 10; // High priority
      } else if (this.modelAccuracy > 0.92) {
        accuracyGoal.priority = 6; // Lower priority
        accuracyGoal.status = 'completed';
      }
    }
  }

  /**
   * Attempt self-healing
   */
  protected async attemptSelfHealing(): Promise<void> {
    console.log(`[${this.agentName}] Attempting self-healing...`);

    // Reset thresholds to defaults if accuracy is very low
    if (this.modelAccuracy < 0.6) {
      this.riskThresholds = {
        low: 0.3,
        medium: 0.6,
        high: 0.9,
      };
      this.modelAccuracy = 0.85; // Reset to initial estimate
      console.log(`[${this.agentName}] Reset thresholds and accuracy`);
    }

    // Clear old prediction history
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30 days
    for (const [id, accuracy] of this.predictionHistory.entries()) {
      if (accuracy.timestamp < cutoff) {
        this.predictionHistory.delete(id);
      }
    }

    this.state.lastHealthCheck = Date.now();
  }

  /**
   * Execute a decision
   */
  protected async executeDecision(decision: AgentDecision): Promise<LearningOutcome> {
    const startTime = Date.now();

    try {
      if (decision.action === 'optimize-thresholds') {
        await this.optimizeThresholds();
      } else if (decision.action === 'monitor-high-risk') {
        await this.monitorHighRiskItems();
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
    if (goal.type === 'optimize' && goal.id === 'optimize-thresholds') {
      await this.optimizeThresholds();
      goal.status = 'in_progress';
    } else if (goal.type === 'proactive' && goal.id === 'proactive-monitoring') {
      await this.monitorHighRiskItems();
      goal.status = 'in_progress';
    }
  }

  /**
   * Optimize risk thresholds
   */
  private async optimizeThresholds(): Promise<void> {
    // Analyze prediction accuracy by risk level
    const accuraciesByLevel = {
      low: [] as number[],
      medium: [] as number[],
      high: [] as number[],
    };

    for (const accuracy of this.predictionHistory.values()) {
      if (accuracy.predictedRisk < this.riskThresholds.low) {
        accuraciesByLevel.low.push(accuracy.accuracy);
      } else if (accuracy.predictedRisk < this.riskThresholds.medium) {
        accuraciesByLevel.medium.push(accuracy.accuracy);
      } else {
        accuraciesByLevel.high.push(accuracy.accuracy);
      }
    }

    // Adjust thresholds to maximize accuracy
    // This is a simplified optimization - in production, use more sophisticated methods
    console.log(`[${this.agentName}] Optimizing thresholds based on accuracy data`);
  }

  /**
   * Monitor high-risk items proactively
   */
  private async monitorHighRiskItems(): Promise<void> {
    // In production, this would query for high-risk items and take proactive actions
    console.log(`[${this.agentName}] Monitoring high-risk items...`);
  }

  /**
   * Store prediction for later accuracy tracking
   */
  private storePrediction(predictionId: string, prediction: ReturnRiskPrediction): void {
    this.predictionHistory.set(predictionId, {
      predictionId,
      predictedRisk: prediction.riskScore,
      actualOutcome: 'kept', // Will be updated when outcome is known
      accuracy: 0.5, // Initial estimate
      timestamp: Date.now(),
    });

    // Keep only recent predictions (more efficient cleanup)
    if (this.predictionHistory.size > 1000) {
      const entries = Array.from(this.predictionHistory.entries());
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      this.predictionHistory = new Map(entries.slice(0, 1000));
    }
  }

  /**
   * Update model accuracy
   */
  private updateModelAccuracy(): void {
    const accuracies = Array.from(this.predictionHistory.values())
      .filter(a => a.actualOutcome !== 'kept' || a.accuracy > 0) // Only completed predictions
      .map(a => a.accuracy);

    if (accuracies.length > 0) {
      this.modelAccuracy = accuracies.reduce((sum, a) => sum + a, 0) / accuracies.length;
    }
  }

  /**
   * Get user history
   */
  private async getUserHistory(userId: string): Promise<{
    recentReturns: number;
    totalReturns: number;
  }> {
    try {
      if (orderSQL && orderSQL.query) {
        const returns = await orderSQL.query(
          `SELECT * FROM returns WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
          [userId]
        );
        const allReturns = await orderSQL.query(
          `SELECT * FROM returns WHERE user_id = $1`,
          [userId]
        );
        return {
          recentReturns: returns.length || 0,
          totalReturns: allReturns.length || 0,
        };
      }
    } catch (error) {
      console.warn('Failed to get user history:', error);
    }

    return {
      recentReturns: 0,
      totalReturns: 0,
    };
  }
}

export const autonomousReturnsAgent = new AutonomousReturnsAgent();

