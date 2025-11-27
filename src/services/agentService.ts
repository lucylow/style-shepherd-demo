/**
 * Agent Service
 * Service for fetching and managing AI agents from the backend
 */

import api from '@/lib/api';
import type { VoiceAgent, ConversationExample } from '@/mocks/elevenAgentsTypes';

export interface AgentsResponse {
  agents: VoiceAgent[];
  count: number;
  reference_slide_url?: string;
}

export interface AgentDetailResponse {
  agent: VoiceAgent;
  configuration?: {
    max_turns_before_summary?: number;
    should_ask_size_confirmation?: boolean;
    auto_add_to_cart_after_confirmation?: boolean;
    auto_create_invoice_on_confirm?: boolean;
    voice_properties: {
      voice_id: string;
      stability: number;
      similarity_boost: number;
    };
  };
}

export interface ConversationResponse {
  conversation: ConversationExample;
  agent: VoiceAgent;
}

export interface UsageBillingData {
  agent_usage_examples: Array<{
    agent_id: string;
    monthly_calls: number;
    avg_duration_sec: number;
    estimated_tts_cost_usd: number;
  }>;
  quota: {
    free_tier_calls: number;
    premium_tier_calls: number;
    notes: string;
  };
}

class AgentService {
  /**
   * Get all available agents
   */
  async getAllAgents(): Promise<AgentsResponse> {
    try {
      const response = await api.get<AgentsResponse>('/agents');
      return response.data;
    } catch (error) {
      console.error('[AgentService] Error fetching agents:', error);
      // Fallback to mock data if API fails
      throw error;
    }
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<AgentDetailResponse> {
    try {
      const response = await api.get<AgentDetailResponse>(`/agents/${agentId}`);
      return response.data;
    } catch (error) {
      console.error(`[AgentService] Error fetching agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get agents by capability
   */
  async getAgentsByCapability(capability: string): Promise<{ agents: VoiceAgent[]; capability: string; count: number }> {
    try {
      const response = await api.get<{ agents: VoiceAgent[]; capability: string; count: number }>(
        `/agents/by-capability/${capability}`
      );
      return response.data;
    } catch (error) {
      console.error(`[AgentService] Error fetching agents by capability ${capability}:`, error);
      throw error;
    }
  }

  /**
   * Get agents by style tag
   */
  async getAgentsByStyle(tag: string): Promise<{ agents: VoiceAgent[]; style_tag: string; count: number }> {
    try {
      const response = await api.get<{ agents: VoiceAgent[]; style_tag: string; count: number }>(
        `/agents/by-style/${tag}`
      );
      return response.data;
    } catch (error) {
      console.error(`[AgentService] Error fetching agents by style ${tag}:`, error);
      throw error;
    }
  }

  /**
   * Suggest an agent based on context
   */
  async suggestAgent(context: {
    intent?: string;
    capability?: string;
    style?: string;
    userType?: 'customer' | 'merchant' | 'vip';
  }): Promise<AgentDetailResponse & { suggested_for: typeof context }> {
    try {
      const response = await api.post<AgentDetailResponse & { suggested_for: typeof context }>(
        '/agents/suggest',
        context
      );
      return response.data;
    } catch (error) {
      console.error('[AgentService] Error suggesting agent:', error);
      throw error;
    }
  }

  /**
   * Get conversation example by session ID
   */
  async getConversation(sessionId: string): Promise<ConversationResponse> {
    try {
      const response = await api.get<ConversationResponse>(`/conversations/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error(`[AgentService] Error fetching conversation ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get all conversations for an agent
   */
  async getConversationsByAgent(agentId: string): Promise<{ conversations: ConversationExample[]; agent_id: string; count: number }> {
    try {
      const response = await api.get<{ conversations: ConversationExample[]; agent_id: string; count: number }>(
        `/conversations/by-agent/${agentId}`
      );
      return response.data;
    } catch (error) {
      console.error(`[AgentService] Error fetching conversations for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get usage and billing data
   */
  async getUsageBilling(): Promise<{ usage_and_billing: UsageBillingData }> {
    try {
      const response = await api.get<{ usage_and_billing: UsageBillingData }>('/agents/config/usage-billing');
      return response.data;
    } catch (error) {
      console.error('[AgentService] Error fetching usage/billing data:', error);
      throw error;
    }
  }

  /**
   * Get fallback strategy configuration
   */
  async getFallbackStrategy(): Promise<{ strategy: any }> {
    try {
      const response = await api.get<{ strategy: any }>('/agents/config/fallback-strategy');
      return response.data;
    } catch (error) {
      console.error('[AgentService] Error fetching fallback strategy:', error);
      throw error;
    }
  }
}

export const agentService = new AgentService();
export default agentService;

