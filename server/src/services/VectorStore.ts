/**
 * Vector Store
 * Simple in-memory vector store with cosine similarity search
 * For production, replace with a proper vector database (Pinecone, Weaviate, Qdrant, etc.)
 */

import fs from 'fs';
import path from 'path';

export interface VectorDocument {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
}

export type FilterOperator = 
  | 'eq'      // equals
  | 'ne'      // not equals
  | 'gt'      // greater than
  | 'gte'     // greater than or equal
  | 'lt'      // less than
  | 'lte'     // less than or equal
  | 'in'      // in array
  | 'nin'     // not in array
  | 'contains' // string contains
  | 'startsWith' // string starts with
  | 'endsWith';  // string ends with

export interface FilterCondition {
  operator?: FilterOperator;
  value: any;
}

export interface SearchOptions {
  topK?: number;
  filter?: Record<string, any | FilterCondition>;
  minScore?: number;
}

export class VectorStore {
  private vectors: Map<string, VectorDocument> = new Map();
  private readonly STORAGE_PATH = path.join(process.cwd(), 'logs', 'vector-store.json');

  constructor() {
    this.loadFromDisk();
  }

  /**
   * Add a vector document to the store
   */
  async add(document: VectorDocument): Promise<void> {
    this.vectors.set(document.id, document);
    this.saveToDisk();
  }

  /**
   * Add multiple documents in batch
   */
  async addBatch(documents: VectorDocument[]): Promise<void> {
    documents.forEach(doc => {
      this.vectors.set(doc.id, doc);
    });
    this.saveToDisk();
  }

  /**
   * Search for similar vectors using cosine similarity
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions = {}
  ): Promise<Array<{ id: string; score: number; metadata: any }>> {
    const { topK = 10, filter, minScore = 0 } = options;

    const results: Array<{ id: string; score: number; metadata: any }> = [];

    for (const [id, doc] of this.vectors.entries()) {
      // Apply filter if provided
      if (filter && !this.matchesFilter(doc.metadata, filter)) {
        continue;
      }

      // Calculate cosine similarity
      const score = this.cosineSimilarity(queryEmbedding, doc.embedding);

      if (score >= minScore) {
        results.push({
          id: doc.id,
          score,
          metadata: doc.metadata,
        });
      }
    }

    // Sort by score (descending) and return top K
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;

    return dotProduct / denominator;
  }

  /**
   * Check if metadata matches filter criteria (enhanced with operators)
   */
  private matchesFilter(metadata: Record<string, any>, filter: Record<string, any | FilterCondition>): boolean {
    for (const [key, condition] of Object.entries(filter)) {
      const metadataValue = metadata[key];
      
      // Simple equality check (backward compatible)
      if (typeof condition !== 'object' || condition === null || !('operator' in condition)) {
        if (metadataValue !== condition) {
          return false;
        }
        continue;
      }

      // Advanced filter with operator
      const filterCondition = condition as FilterCondition;
      const { operator = 'eq', value } = filterCondition;

      switch (operator) {
        case 'eq':
          if (metadataValue !== value) return false;
          break;
        case 'ne':
          if (metadataValue === value) return false;
          break;
        case 'gt':
          if (typeof metadataValue !== 'number' || metadataValue <= value) return false;
          break;
        case 'gte':
          if (typeof metadataValue !== 'number' || metadataValue < value) return false;
          break;
        case 'lt':
          if (typeof metadataValue !== 'number' || metadataValue >= value) return false;
          break;
        case 'lte':
          if (typeof metadataValue !== 'number' || metadataValue > value) return false;
          break;
        case 'in':
          if (!Array.isArray(value) || !value.includes(metadataValue)) return false;
          break;
        case 'nin':
          if (!Array.isArray(value) || value.includes(metadataValue)) return false;
          break;
        case 'contains':
          if (typeof metadataValue !== 'string' || !metadataValue.includes(value)) return false;
          break;
        case 'startsWith':
          if (typeof metadataValue !== 'string' || !metadataValue.startsWith(value)) return false;
          break;
        case 'endsWith':
          if (typeof metadataValue !== 'string' || !metadataValue.endsWith(value)) return false;
          break;
        default:
          // Unknown operator, treat as equality
          if (metadataValue !== value) return false;
      }
    }
    return true;
  }

  /**
   * Get a document by ID
   */
  async get(id: string): Promise<VectorDocument | null> {
    return this.vectors.get(id) || null;
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<boolean> {
    const deleted = this.vectors.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    this.vectors.clear();
    this.saveToDisk();
  }

  /**
   * Get total count of vectors
   */
  async getCount(): Promise<number> {
    return this.vectors.size;
  }

  /**
   * Save vectors to disk
   */
  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.STORAGE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Array.from(this.vectors.entries()).map(([id, doc]) => ({
        id,
        embedding: doc.embedding,
        metadata: doc.metadata,
      }));

      fs.writeFileSync(this.STORAGE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Failed to save vector store to disk:', error);
    }
  }

  /**
   * Load vectors from disk
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.STORAGE_PATH)) {
        const data = JSON.parse(fs.readFileSync(this.STORAGE_PATH, 'utf8'));
        this.vectors.clear();
        
        for (const item of data) {
          this.vectors.set(item.id, {
            id: item.id,
            embedding: item.embedding,
            metadata: item.metadata,
          });
        }

        console.log(`📦 Loaded ${this.vectors.size} vectors from disk`);
      }
    } catch (error) {
      console.warn('Failed to load vector store from disk:', error);
    }
  }
}

