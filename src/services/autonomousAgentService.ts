/**
 * Autonomous Agent Service
 * Service for fetching and managing autonomous AI agent status, health, and performance
 */

import api from '@/lib/api';

export interface AgentHealth {
  healthy: 'healthy' | 'degraded' | 'unhealthy';
  healthScore: number;
  lastHealthCheck: number;
}

export interface AgentPerformance {
  avgLatency: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  performanceScore: number;
}

export interface AgentGoal {
  id: string;
  description: string;
  priority: number;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  deadline?: number;
}

export interface AgentDecision {
  id: string;
  timestamp: number;
  decisionType: string;
  context: Record<string, any>;
  outcome?: 'success' | 'failure' | 'pending';
  confidence: number;
  reasoning?: string;
}

export interface LearningOutcome {
  id: string;
  timestamp: number;
  outcome: 'positive' | 'negative' | 'neutral';
  context: Record<string, any>;
  insights?: string[];
}

export interface AutonomousAgentState {
  agentId: string;
  agentName: string;
  health: AgentHealth;
  performance: AgentPerformance;
  goals: AgentGoal[];
  recentDecisions: AgentDecision[];
  learningHistory: LearningOutcome[];
  lastUpdate: number;
}

export interface AgentActivity {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  timestamp: number;
  status: 'success' | 'processing' | 'pending' | 'failed';
  details?: string;
  metadata?: Record<string, any>;
}

export interface AgentsOverview {
  totalAgents: number;
  healthyAgents: number;
  degradedAgents: number;
  unhealthyAgents: number;
  averagePerformance: number;
  totalDecisions: number;
  activeGoals: number;
}

class AutonomousAgentService {
  /**
   * Get all autonomous agents status
   */
  async getAllAgentsStatus(): Promise<AutonomousAgentState[]> {
    try {
      const response = await api.get<{ agents: AutonomousAgentState[] }>('/api/autonomous-agents/status');
      return response.data.agents || [];
    } catch (error) {
      console.error('[AutonomousAgentService] Error fetching agents status:', error);
      // Return mock data for development
      return this.getMockAgentsStatus();
    }
  }

  /**
   * Get specific agent status
   */
  async getAgentStatus(agentId: string): Promise<AutonomousAgentState> {
    try {
      const response = await api.get<{ agent: AutonomousAgentState }>(`/api/autonomous-agents/${agentId}/status`);
      return response.data.agent;
    } catch (error) {
      console.error(`[AutonomousAgentService] Error fetching agent ${agentId} status:`, error);
      throw error;
    }
  }

  /**
   * Get agents overview statistics
   */
  async getAgentsOverview(): Promise<AgentsOverview> {
    try {
      const response = await api.get<{ overview: AgentsOverview }>('/api/autonomous-agents/overview');
      return response.data.overview;
    } catch (error) {
      console.error('[AutonomousAgentService] Error fetching agents overview:', error);
      // Return mock data
      return this.getMockOverview();
    }
  }

  /**
   * Get recent agent activities
   */
  async getRecentActivities(limit: number = 50): Promise<AgentActivity[]> {
    try {
      const response = await api.get<{ activities: AgentActivity[] }>(
        `/api/autonomous-agents/activities?limit=${limit}`
      );
      return response.data.activities || [];
    } catch (error) {
      console.error('[AutonomousAgentService] Error fetching activities:', error);
      return [];
    }
  }

  /**
   * Get agent performance metrics over time
   */
  async getAgentPerformanceHistory(
    agentId: string,
    timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ): Promise<Array<{ timestamp: number; metrics: AgentPerformance }>> {
    try {
      const response = await api.get<{ history: Array<{ timestamp: number; metrics: AgentPerformance }> }>(
        `/api/autonomous-agents/${agentId}/performance?range=${timeRange}`
      );
      return response.data.history || [];
    } catch (error) {
      console.error(`[AutonomousAgentService] Error fetching performance history for ${agentId}:`, error);
      return [];
    }
  }

  /**
   * Mock data for development
   */
  private getMockAgentsStatus(): AutonomousAgentState[] {
    const now = Date.now();
    return [
      {
        agentId: 'search-agent',
        agentName: 'Autonomous Search Agent',
        health: {
          healthy: 'healthy',
          healthScore: 0.95,
          lastHealthCheck: now - 30000,
        },
        performance: {
          avgLatency: 245,
          successRate: 0.98,
          errorRate: 0.02,
          throughput: 45,
          performanceScore: 0.92,
        },
        goals: [
          {
            id: 'goal-1',
            description: 'Improve search relevance by 5%',
            priority: 1,
            status: 'active',
            progress: 0.75,
          },
        ],
        recentDecisions: [
          {
            id: 'dec-1',
            timestamp: now - 60000,
            decisionType: 'search_optimization',
            context: { query: 'summer dress' },
            outcome: 'success',
            confidence: 0.89,
            reasoning: 'Optimized search ranking based on user preferences',
          },
        ],
        learningHistory: [],
        lastUpdate: now,
      },
      {
        agentId: 'returns-agent',
        agentName: 'Returns Prophet Agent',
        health: {
          healthy: 'healthy',
          healthScore: 0.88,
          lastHealthCheck: now - 45000,
        },
        performance: {
          avgLatency: 180,
          successRate: 0.94,
          errorRate: 0.06,
          throughput: 32,
          performanceScore: 0.87,
        },
        goals: [
          {
            id: 'goal-2',
            description: 'Reduce false positive return predictions',
            priority: 2,
            status: 'active',
            progress: 0.60,
          },
        ],
        recentDecisions: [
          {
            id: 'dec-2',
            timestamp: now - 120000,
            decisionType: 'risk_assessment',
            context: { productId: 'prod-123' },
            outcome: 'success',
            confidence: 0.85,
            reasoning: 'Predicted low return risk based on historical data',
          },
        ],
        learningHistory: [],
        lastUpdate: now,
      },
      {
        agentId: 'cart-agent',
        agentName: 'Cart Optimization Agent',
        health: {
          healthy: 'degraded',
          healthScore: 0.65,
          lastHealthCheck: now - 60000,
        },
        performance: {
          avgLatency: 320,
          successRate: 0.87,
          errorRate: 0.13,
          throughput: 28,
          performanceScore: 0.72,
        },
        goals: [
          {
            id: 'goal-3',
            description: 'Improve bundle recommendation accuracy',
            priority: 1,
            status: 'active',
            progress: 0.45,
          },
        ],
        recentDecisions: [],
        learningHistory: [],
        lastUpdate: now,
      },
    ];
  }

  private getMockOverview(): AgentsOverview {
    return {
      totalAgents: 3,
      healthyAgents: 2,
      degradedAgents: 1,
      unhealthyAgents: 0,
      averagePerformance: 0.84,
      totalDecisions: 127,
      activeGoals: 3,
    };
  }
}

export const autonomousAgentService = new AutonomousAgentService();
export default autonomousAgentService;

