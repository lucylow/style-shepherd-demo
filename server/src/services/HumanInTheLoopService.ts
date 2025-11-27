/**
 * Human-in-the-Loop Service
 * Tracks all AI agent actions that require human approval/rejection
 * Provides audit trail and integration with Verisense agent system
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { vultrPostgres } from '../lib/vultr-postgres.js';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

export type AgentActionType = 
  | 'add_to_cart'
  | 'create_invoice'
  | 'apply_promotion'
  | 'update_cart'
  | 'checkout'
  | 'search_products'
  | 'recommend_products'
  | 'place_order'
  | 'update_profile'
  | 'other';

export interface HumanApprovalRequest {
  id: string;
  userId: string;
  agentId: string; // Verisense agent ID
  actionType: AgentActionType;
  title: string;
  description: string;
  status: ApprovalStatus;
  requestedAt: string;
  respondedAt?: string;
  expiresAt?: string;
  approvedBy?: string; // User ID who approved
  rejectedBy?: string; // User ID who rejected
  reasoning?: string; // AI agent's reasoning
  userReasoning?: string; // Human's reason for approval/rejection
  confidence?: number; // AI confidence score (0-1)
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

export class HumanInTheLoopService {
  private readonly LOGS_DIR = join(process.cwd(), 'logs');
  private readonly APPROVALS_FILE = join(this.LOGS_DIR, 'human_approvals.json');
  private readonly PENDING_APPROVALS_TTL = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.ensureLogsDirectory();
  }

  private async ensureLogsDirectory() {
    try {
      await fs.mkdir(this.LOGS_DIR, { recursive: true });
    } catch (error) {
      console.warn('Failed to create logs directory:', error);
    }
  }

  /**
   * Create a new human approval request
   */
  async createApprovalRequest(
    request: Omit<HumanApprovalRequest, 'id' | 'status' | 'requestedAt' | 'auditTrail'>
  ): Promise<HumanApprovalRequest> {
    const approvalRequest: HumanApprovalRequest = {
      ...request,
      id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + this.PENDING_APPROVALS_TTL).toISOString(),
      auditTrail: {
        requestPayload: request,
        webhookEvents: [],
      },
    };

    // Save to file
    await this.appendToFile(approvalRequest);

    // Save to database
    try {
      await this.saveToDatabase(approvalRequest);
    } catch (error) {
      console.warn('Failed to save approval request to database, continuing with file only:', error);
    }

    return approvalRequest;
  }

  /**
   * Approve an action
   */
  async approveAction(
    approvalId: string,
    userId: string,
    userReasoning?: string
  ): Promise<HumanApprovalRequest> {
    const approval = await this.getApprovalRequest(approvalId);
    
    if (!approval) {
      throw new Error(`Approval request ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval request ${approvalId} is already ${approval.status}`);
    }

    const updated: HumanApprovalRequest = {
      ...approval,
      status: 'approved',
      respondedAt: new Date().toISOString(),
      approvedBy: userId,
      userReasoning,
      auditTrail: {
        requestPayload: approval.auditTrail?.requestPayload || approval,
        ...approval.auditTrail,
        responsePayload: { approved: true, userId, userReasoning },
        webhookEvents: [
          ...(approval.auditTrail?.webhookEvents || []),
          {
            timestamp: new Date().toISOString(),
            event: 'approved',
            data: { userId, userReasoning },
          },
        ],
      },
    };

    await this.updateApproval(updated);
    return updated;
  }

  /**
   * Reject an action
   */
  async rejectAction(
    approvalId: string,
    userId: string,
    userReasoning?: string
  ): Promise<HumanApprovalRequest> {
    const approval = await this.getApprovalRequest(approvalId);
    
    if (!approval) {
      throw new Error(`Approval request ${approvalId} not found`);
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval request ${approvalId} is already ${approval.status}`);
    }

    const updated: HumanApprovalRequest = {
      ...approval,
      status: 'rejected',
      respondedAt: new Date().toISOString(),
      rejectedBy: userId,
      userReasoning,
      auditTrail: {
        requestPayload: approval.auditTrail?.requestPayload || approval,
        ...approval.auditTrail,
        responsePayload: { approved: false, userId, userReasoning },
        webhookEvents: [
          ...(approval.auditTrail?.webhookEvents || []),
          {
            timestamp: new Date().toISOString(),
            event: 'rejected',
            data: { userId, userReasoning },
          },
        ],
      },
    };

    await this.updateApproval(updated);
    return updated;
  }

  /**
   * Get an approval request by ID
   */
  async getApprovalRequest(approvalId: string): Promise<HumanApprovalRequest | null> {
    try {
      // Try database first
      try {
        const result = await vultrPostgres.query(
          'SELECT * FROM human_approvals WHERE id = $1',
          [approvalId]
        );
        
        if (result.length > 0) {
          return this.mapDatabaseRowToApproval(result[0]);
        }
      } catch {
        // Fallback to file
      }

      // Fallback to file
      const content = await fs.readFile(this.APPROVALS_FILE, 'utf-8');
      const approvals: HumanApprovalRequest[] = JSON.parse(content);
      return approvals.find(a => a.id === approvalId) || null;
    } catch {
      return null;
    }
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
    try {
      // Try database first
      try {
        let query = 'SELECT * FROM human_approvals WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.userId) {
          query += ` AND user_id = $${paramIndex++}`;
          params.push(filters.userId);
        }

        if (filters.agentId) {
          query += ` AND agent_id = $${paramIndex++}`;
          params.push(filters.agentId);
        }

        if (filters.status) {
          query += ` AND status = $${paramIndex++}`;
          params.push(filters.status);
        }

        if (filters.actionType) {
          query += ` AND action_type = $${paramIndex++}`;
          params.push(filters.actionType);
        }

        if (filters.startDate) {
          query += ` AND requested_at >= $${paramIndex++}`;
          params.push(filters.startDate);
        }

        if (filters.endDate) {
          query += ` AND requested_at <= $${paramIndex++}`;
          params.push(filters.endDate);
        }

        query += ' ORDER BY requested_at DESC';

        if (filters.limit) {
          query += ` LIMIT $${paramIndex++}`;
          params.push(filters.limit);
        }

        const result = await vultrPostgres.query(query, params);
        return result.map((row: any) => this.mapDatabaseRowToApproval(row));
      } catch {
        // Fallback to file
        return this.getFromFile(filters);
      }
    } catch (error) {
      console.error('Failed to get approval requests:', error);
      return [];
    }
  }

  /**
   * Get pending approvals that need attention
   */
  async getPendingApprovals(userId?: string): Promise<HumanApprovalRequest[]> {
    const filters: any = { status: 'pending' };
    if (userId) {
      filters.userId = userId;
    }
    return this.getApprovalRequests(filters);
  }

  /**
   * Check and expire old pending approvals
   */
  async expireOldApprovals(): Promise<number> {
    const pending = await this.getPendingApprovals();
    const now = new Date();
    let expiredCount = 0;

    for (const approval of pending) {
      if (approval.expiresAt && new Date(approval.expiresAt) < now) {
        const updated: HumanApprovalRequest = {
          ...approval,
          status: 'expired',
          respondedAt: new Date().toISOString(),
        };
        await this.updateApproval(updated);
        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Get approval statistics
   */
  async getApprovalStats(filters: {
    userId?: string;
    agentId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    expired: number;
    approvalRate: number;
    averageConfidence: number;
    byActionType: Record<string, number>;
  }> {
    const approvals = await this.getApprovalRequests(filters);
    
    const stats = {
      total: approvals.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      approvalRate: 0,
      averageConfidence: 0,
      byActionType: {} as Record<string, number>,
    };

    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const approval of approvals) {
      stats[approval.status as keyof typeof stats]++;
      stats.byActionType[approval.actionType] = (stats.byActionType[approval.actionType] || 0) + 1;
      
      if (approval.confidence !== undefined) {
        totalConfidence += approval.confidence;
        confidenceCount++;
      }
    }

    const responded = stats.approved + stats.rejected;
    stats.approvalRate = responded > 0 ? stats.approved / responded : 0;
    stats.averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;

    return stats;
  }

  /**
   * Append approval to file
   */
  private async appendToFile(approval: HumanApprovalRequest): Promise<void> {
    try {
      let approvals: HumanApprovalRequest[] = [];

      try {
        const content = await fs.readFile(this.APPROVALS_FILE, 'utf-8');
        approvals = JSON.parse(content);
        if (!Array.isArray(approvals)) {
          approvals = [];
        }
      } catch {
        approvals = [];
      }

      // Remove old entry if exists (for updates)
      approvals = approvals.filter(a => a.id !== approval.id);
      approvals.push(approval);

      // Keep only last 5000 entries
      if (approvals.length > 5000) {
        approvals = approvals.slice(-5000);
      }

      await fs.writeFile(this.APPROVALS_FILE, JSON.stringify(approvals, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to append approval to file:', error);
      throw error;
    }
  }

  /**
   * Update approval in file
   */
  private async updateApproval(approval: HumanApprovalRequest): Promise<void> {
    await this.appendToFile(approval);

    // Also update database
    try {
      await this.updateInDatabase(approval);
    } catch (error) {
      console.warn('Failed to update approval in database:', error);
    }
  }

  /**
   * Save to database
   */
  private async saveToDatabase(approval: HumanApprovalRequest): Promise<void> {
    try {
      const query = `
        INSERT INTO human_approvals (
          id, user_id, agent_id, action_type, title, description, status,
          requested_at, responded_at, expires_at, approved_by, rejected_by,
          reasoning, user_reasoning, confidence, risk_level, metadata, audit_trail
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      `;

      await vultrPostgres.query(query, [
        approval.id,
        approval.userId,
        approval.agentId,
        approval.actionType,
        approval.title,
        approval.description,
        approval.status,
        approval.requestedAt,
        approval.respondedAt || null,
        approval.expiresAt || null,
        approval.approvedBy || null,
        approval.rejectedBy || null,
        approval.reasoning || null,
        approval.userReasoning || null,
        approval.confidence || null,
        approval.riskLevel || null,
        JSON.stringify(approval.metadata || {}),
        JSON.stringify(approval.auditTrail || {}),
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        console.warn('human_approvals table does not exist, skipping database save');
        return;
      }
      throw error;
    }
  }

  /**
   * Update in database
   */
  private async updateInDatabase(approval: HumanApprovalRequest): Promise<void> {
    try {
      const query = `
        UPDATE human_approvals SET
          status = $1,
          responded_at = $2,
          approved_by = $3,
          rejected_by = $4,
          user_reasoning = $5,
          audit_trail = $6
        WHERE id = $7
      `;

      await vultrPostgres.query(query, [
        approval.status,
        approval.respondedAt || null,
        approval.approvedBy || null,
        approval.rejectedBy || null,
        approval.userReasoning || null,
        JSON.stringify(approval.auditTrail || {}),
        approval.id,
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        console.warn('human_approvals table does not exist, skipping database update');
        return;
      }
      throw error;
    }
  }

  /**
   * Get from file
   */
  private async getFromFile(filters: {
    userId?: string;
    agentId?: string;
    status?: ApprovalStatus;
    actionType?: AgentActionType;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<HumanApprovalRequest[]> {
    try {
      const content = await fs.readFile(this.APPROVALS_FILE, 'utf-8');
      let approvals: HumanApprovalRequest[] = JSON.parse(content);

      // Apply filters
      if (filters.userId) {
        approvals = approvals.filter(a => a.userId === filters.userId);
      }
      if (filters.agentId) {
        approvals = approvals.filter(a => a.agentId === filters.agentId);
      }
      if (filters.status) {
        approvals = approvals.filter(a => a.status === filters.status);
      }
      if (filters.actionType) {
        approvals = approvals.filter(a => a.actionType === filters.actionType);
      }
      if (filters.startDate) {
        approvals = approvals.filter(a => a.requestedAt >= filters.startDate!);
      }
      if (filters.endDate) {
        approvals = approvals.filter(a => a.requestedAt <= filters.endDate!);
      }

      // Sort by timestamp descending
      approvals.sort((a, b) => 
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
      );

      // Apply limit
      if (filters.limit) {
        approvals = approvals.slice(0, filters.limit);
      }

      return approvals;
    } catch {
      return [];
    }
  }

  /**
   * Map database row to approval request
   */
  private mapDatabaseRowToApproval(row: any): HumanApprovalRequest {
    return {
      id: row.id,
      userId: row.user_id,
      agentId: row.agent_id,
      actionType: row.action_type,
      title: row.title,
      description: row.description,
      status: row.status,
      requestedAt: row.requested_at,
      respondedAt: row.responded_at || undefined,
      expiresAt: row.expires_at || undefined,
      approvedBy: row.approved_by || undefined,
      rejectedBy: row.rejected_by || undefined,
      reasoning: row.reasoning || undefined,
      userReasoning: row.user_reasoning || undefined,
      confidence: row.confidence || undefined,
      riskLevel: row.risk_level || undefined,
      metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
      auditTrail: typeof row.audit_trail === 'string' ? JSON.parse(row.audit_trail) : row.audit_trail,
    };
  }
}

export const humanInTheLoopService = new HumanInTheLoopService();

