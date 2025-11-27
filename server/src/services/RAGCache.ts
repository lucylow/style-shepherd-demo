/**
 * RAG Cache
 * Query and result caching for improved performance
 */

import { createHash } from 'crypto';

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

export class RAGCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly DEFAULT_TTL = 3600000; // 1 hour
  private readonly DEFAULT_MAX_SIZE = 1000;

  constructor(private options: CacheOptions = {}) {
    // Clean up expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Generate cache key from query and options
   */
  generateKey(query: string, options?: Record<string, any>): string {
    const keyData = JSON.stringify({ query, options });
    return createHash('sha256').update(keyData).digest('hex');
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    const maxSize = this.options.maxSize || this.DEFAULT_MAX_SIZE;

    // If cache is full, remove oldest entry
    if (this.cache.size >= maxSize && !this.cache.has(key)) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl || this.DEFAULT_TTL,
    };

    this.cache.set(key, entry);
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize || this.DEFAULT_MAX_SIZE,
    };
  }

  /**
   * Find oldest key (for eviction)
   */
  private findOldestKey(): string | null {
    let oldestKey: string | null = null;
    let oldestTimestamp = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));

    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }
}

// Export singleton instances for different cache types
export const queryCache = new RAGCache<any>({ ttl: 3600000, maxSize: 500 }); // 1 hour
export const embeddingCache = new RAGCache<number[]>({ ttl: 86400000, maxSize: 10000 }); // 24 hours
export const resultCache = new RAGCache<any>({ ttl: 1800000, maxSize: 1000 }); // 30 minutes


