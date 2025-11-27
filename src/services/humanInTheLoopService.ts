/**
 * Human-in-the-Loop Frontend Service
 * Client-side service for interacting with human approval workflows
 */

import { AgentActionType } from '@/contexts/AgentActionContext';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export interface HumanApprovalRequest {
  id: string;
  userId: string;
  agentId: string;
  actionType: AgentActionType;
  title: string;
  description: string;
  status: ApprovalStatus;
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  approvedBy?: string;
  rejectedBy?: string;
  reasoning?: string;
  userReasoning?: string;
  confidence?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  metadata?: {
    products?: any[];
    estimatedValue?: number;
    sessionId?: string;
    conversationId?: string;
    verisenseContext?: any;
    [key: string]: any;
  };
  auditTrail?: {
    requestPayload: any;
    responsePayload?: any;
    webhookEvents?: Array<{
      timestamp: string;
      event: string;
      data: any;
    }>;
  };
}

export interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  approvalRate: number;
  averageConfidence: number;
  byActionType: Record<string, number>;
}

class HumanInTheLoopService {
  private baseUrl = '/api/human-in-the-loop';

  /**
   * Create a new approval request
   */
  async createApprovalRequest(request: {
    userId: string;
    agentId: string;
    actionType: AgentActionType;
    title: string;
    description: string;
    reasoning?: string;
    confidence?: number;
    riskLevel?: 'low' | 'medium' | 'high';
    metadata?: Record<string, any>;
  }): Promise<HumanApprovalRequest> {
    const response = await fetch(`${this.baseUrl}/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create approval request');
    }

    const data = await response.json();
    return data.approval;
  }

  /**
   * Approve an action
   */
  async approveAction(
    approvalId: string,
    userId: string,
    userReasoning?: string
  ): Promise<HumanApprovalRequest> {
    const response = await fetch(`${this.baseUrl}/approve/${approvalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userReasoning }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve action');
    }

    const data = await response.json();
    return data.approval;
  }

  /**
   * Reject an action
   */
  async rejectAction(
    approvalId: string,
    userId: string,
    userReasoning?: string
  ): Promise<HumanApprovalRequest> {
    const response = await fetch(`${this.baseUrl}/reject/${approvalId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userReasoning }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject action');
    }

    const data = await response.json();
    return data.approval;
  }

  /**
   * Get a specific approval request
   */
  async getApprovalRequest(approvalId: string): Promise<HumanApprovalRequest | null> {
    const response = await fetch(`${this.baseUrl}/approval/${approvalId}`);

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.error || 'Failed to get approval request');
    }

    const data = await response.json();
    return data.approval;
  }

  /**
   * Get approval requests with filters
   */
  async getApprovalRequests(filters: {
    userId?: string;
    agentId?: string;
    status?: ApprovalStatus;
    actionType?: AgentActionType;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<HumanApprovalRequest[]> {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.status) params.append('status', filters.status);
    if (filters.actionType) params.append('actionType', filters.actionType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await fetch(`${this.baseUrl}/approvals?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get approval requests');
    }

    const data = await response.json();
    return data.approvals || [];
  }

  /**
   * Get pending approvals
   */
  async getPendingApprovals(userId?: string): Promise<HumanApprovalRequest[]> {
    const params = userId ? new URLSearchParams({ userId }) : '';
    const response = await fetch(`${this.baseUrl}/pending${params ? `?${params.toString()}` : ''}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get pending approvals');
    }

    const data = await response.json();
    return data.approvals || [];
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats(filters: {
    userId?: string;
    agentId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ApprovalStats> {
    const params = new URLSearchParams();
    if (filters.userId) params.append('userId', filters.userId);
    if (filters.agentId) params.append('agentId', filters.agentId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${this.baseUrl}/stats?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get approval stats');
    }

    const data = await response.json();
    return data.stats;
  }
}

export const humanInTheLoopService = new HumanInTheLoopService();


