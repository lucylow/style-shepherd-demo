/**
 * Audit Trail Service
 * Tracks all LLM recommendations with source IDs, prompts, and metadata for reproducibility
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { vultrPostgres } from '../lib/vultr-postgres.js';

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  userId?: string;
  query: string;
  recommendation: any;
  sourceIds: string[]; // IDs from Searchable or Verisense docs
  modelPrompt: string;
  modelName: string;
  modelParameters: {
    temperature?: number;
    maxTokens?: number;
    [key: string]: any;
  };
  metadata: {
    sessionId?: string;
    agentType?: string;
    processingTime?: number;
    confidence?: number;
    [key: string]: any;
  };
}

export class AuditTrailService {
  private readonly LOGS_DIR = join(process.cwd(), 'logs');
  private readonly EVIDENCE_FILE = join(this.LOGS_DIR, 'demo-evidence.json');

  constructor() {
    // Ensure logs directory exists
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
   * Save audit trail entry to file and database
   */
  async saveAuditTrail(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): Promise<AuditTrailEntry> {
    const fullEntry: AuditTrailEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    // Save to file (for demo/reproducibility)
    await this.appendToFile(fullEntry);

    // Save to database (if available)
    try {
      await this.saveToDatabase(fullEntry);
    } catch (error) {
      console.warn('Failed to save audit trail to database, continuing with file only:', error);
    }

    return fullEntry;
  }

  /**
   * Append entry to demo-evidence.json file
   */
  private async appendToFile(entry: AuditTrailEntry): Promise<void> {
    try {
      let entries: AuditTrailEntry[] = [];

      // Read existing entries if file exists
      try {
        const content = await fs.readFile(this.EVIDENCE_FILE, 'utf-8');
        entries = JSON.parse(content);
        if (!Array.isArray(entries)) {
          entries = [];
        }
      } catch {
        // File doesn't exist or is invalid, start fresh
        entries = [];
      }

      // Append new entry
      entries.push(entry);

      // Keep only last 1000 entries to prevent file from growing too large
      if (entries.length > 1000) {
        entries = entries.slice(-1000);
      }

      // Write back to file
      await fs.writeFile(this.EVIDENCE_FILE, JSON.stringify(entries, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to append audit trail to file:', error);
      throw error;
    }
  }

  /**
   * Save audit trail to database
   */
  private async saveToDatabase(entry: AuditTrailEntry): Promise<void> {
    try {
      const query = `
        INSERT INTO audit_trail (
          id, timestamp, user_id, query, recommendation, source_ids, 
          model_prompt, model_name, model_parameters, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      await vultrPostgres.query(query, [
        entry.id,
        entry.timestamp,
        entry.userId || null,
        entry.query,
        JSON.stringify(entry.recommendation),
        JSON.stringify(entry.sourceIds),
        entry.modelPrompt,
        entry.modelName,
        JSON.stringify(entry.modelParameters),
        JSON.stringify(entry.metadata),
      ]);
    } catch (error) {
      // If table doesn't exist, that's okay for demo mode
      if (error instanceof Error && error.message.includes('does not exist')) {
        console.warn('audit_trail table does not exist, skipping database save');
        return;
      }
      throw error;
    }
  }

  /**
   * Get audit trail entries for a user or query
   */
  async getAuditTrail(filters: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditTrailEntry[]> {
    try {
      // Try database first
      try {
        let query = 'SELECT * FROM audit_trail WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (filters.userId) {
          query += ` AND user_id = $${paramIndex++}`;
          params.push(filters.userId);
        }

        if (filters.startDate) {
          query += ` AND timestamp >= $${paramIndex++}`;
          params.push(filters.startDate);
        }

        if (filters.endDate) {
          query += ` AND timestamp <= $${paramIndex++}`;
          params.push(filters.endDate);
        }

        query += ' ORDER BY timestamp DESC';

        if (filters.limit) {
          query += ` LIMIT $${paramIndex++}`;
          params.push(filters.limit);
        }

        const result = await vultrPostgres.query(query, params);
        return result.map((row: any) => ({
          ...row,
          recommendation: typeof row.recommendation === 'string' ? JSON.parse(row.recommendation) : row.recommendation,
          sourceIds: typeof row.source_ids === 'string' ? JSON.parse(row.source_ids) : row.source_ids,
          modelParameters: typeof row.model_parameters === 'string' ? JSON.parse(row.model_parameters) : row.model_parameters,
          metadata: typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata,
        }));
      } catch {
        // Fallback to file
        return this.getFromFile(filters);
      }
    } catch (error) {
      console.error('Failed to get audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit trail from file
   */
  private async getFromFile(filters: {
    userId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditTrailEntry[]> {
    try {
      const content = await fs.readFile(this.EVIDENCE_FILE, 'utf-8');
      let entries: AuditTrailEntry[] = JSON.parse(content);

      // Apply filters
      if (filters.userId) {
        entries = entries.filter((e) => e.userId === filters.userId);
      }

      if (filters.startDate) {
        entries = entries.filter((e) => e.timestamp >= filters.startDate!);
      }

      if (filters.endDate) {
        entries = entries.filter((e) => e.timestamp <= filters.endDate!);
      }

      // Sort by timestamp descending
      entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Apply limit
      if (filters.limit) {
        entries = entries.slice(0, filters.limit);
      }

      return entries;
    } catch {
      return [];
    }
  }

  /**
   * Extract source IDs from recommendation data
   * Looks for product IDs, user profile IDs, document IDs, etc.
   */
  extractSourceIds(recommendation: any, userProfile?: any): string[] {
    const sourceIds: string[] = [];

    // Extract product IDs from recommendations
    if (Array.isArray(recommendation)) {
      recommendation.forEach((item: any) => {
        if (item.productId) sourceIds.push(`product:${item.productId}`);
        if (item.id) sourceIds.push(`product:${item.id}`);
      });
    } else if (recommendation && typeof recommendation === 'object') {
      if (recommendation.productId) sourceIds.push(`product:${recommendation.productId}`);
      if (recommendation.id) sourceIds.push(`product:${recommendation.id}`);
      if (recommendation.products && Array.isArray(recommendation.products)) {
        recommendation.products.forEach((p: any) => {
          if (p.id) sourceIds.push(`product:${p.id}`);
        });
      }
    }

    // Extract user profile ID
    if (userProfile?.id) {
      sourceIds.push(`verisense:${userProfile.id}`);
    }

    // Extract from metadata if present
    if (recommendation?.metadata?.sourceIds) {
      sourceIds.push(...recommendation.metadata.sourceIds);
    }

    return [...new Set(sourceIds)]; // Remove duplicates
  }
}

export const auditTrailService = new AuditTrailService();
