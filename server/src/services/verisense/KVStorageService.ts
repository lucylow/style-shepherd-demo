/**
 * Verisense KV Storage Service
 * 
 * Provides key-value storage operations for Nucleus applications.
 * In Verisense, each Nucleus has its own isolated storage space implemented
 * using RocksDB, ensuring deterministic time complexity for consensus.
 * 
 * This service abstracts the KV storage operations and can be used by
 * Nucleus applications for persistent data storage.
 */

export interface KVStorageOptions {
  /** Time-to-live in seconds (optional) */
  ttl?: number;
  /** Whether to overwrite existing key */
  overwrite?: boolean;
}

export interface KVStorageEntry {
  key: string;
  value: string;
  timestamp: number;
  ttl?: number;
  expiresAt?: number;
}

export class KVStorageService {
  private storage: Map<string, KVStorageEntry> = new Map();
  private nucleusId: string;
  private storageUsage: number = 0;

  constructor(nucleusId: string) {
    this.nucleusId = nucleusId;
  }

  /**
   * Store a key-value pair
   * @param key - Storage key
   * @param value - Value to store (will be serialized to string)
   * @param options - Storage options
   */
  async set(
    key: string,
    value: any,
    options: KVStorageOptions = {}
  ): Promise<boolean> {
    try {
      const serializedValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      const entry: KVStorageEntry = {
        key,
        value: serializedValue,
        timestamp: Date.now(),
        ttl: options.ttl,
        expiresAt: options.ttl
          ? Date.now() + options.ttl * 1000
          : undefined,
      };

      // Check if key exists and overwrite is not allowed
      if (!options.overwrite && this.storage.has(key)) {
        return false;
      }

      // Calculate storage usage (key + value size)
      const oldEntry = this.storage.get(key);
      if (oldEntry) {
        this.storageUsage -=
          Buffer.byteLength(oldEntry.key) +
          Buffer.byteLength(oldEntry.value);
      }

      this.storage.set(key, entry);
      this.storageUsage +=
        Buffer.byteLength(key) + Buffer.byteLength(serializedValue);

      return true;
    } catch (error) {
      console.error(`KVStorage.set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve a value by key
   * @param key - Storage key
   * @param parseJson - Whether to parse JSON value (default: true)
   */
  async get<T = any>(key: string, parseJson: boolean = true): Promise<T | null> {
    const entry = this.storage.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.storage.delete(key);
      this.storageUsage -=
        Buffer.byteLength(entry.key) + Buffer.byteLength(entry.value);
      return null;
    }

    if (parseJson) {
      try {
        return JSON.parse(entry.value) as T;
      } catch {
        return entry.value as T;
      }
    }

    return entry.value as T;
  }

  /**
   * Delete a key-value pair
   * @param key - Storage key to delete
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.storage.get(key);
    if (!entry) {
      return false;
    }

    this.storage.delete(key);
    this.storageUsage -=
      Buffer.byteLength(entry.key) + Buffer.byteLength(entry.value);
    return true;
  }

  /**
   * Check if a key exists
   * @param key - Storage key
   */
  async has(key: string): Promise<boolean> {
    const entry = this.storage.get(key);
    if (!entry) {
      return false;
    }

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get all keys (with optional prefix filter)
   * @param prefix - Optional prefix to filter keys
   */
  async keys(prefix?: string): Promise<string[]> {
    const allKeys = Array.from(this.storage.keys());

    // Clean up expired entries
    const now = Date.now();
    for (const key of allKeys) {
      const entry = this.storage.get(key);
      if (entry?.expiresAt && now > entry.expiresAt) {
        await this.delete(key);
      }
    }

    if (!prefix) {
      return Array.from(this.storage.keys());
    }

    return Array.from(this.storage.keys()).filter((key) =>
      key.startsWith(prefix)
    );
  }

  /**
   * Get multiple values by keys
   * @param keys - Array of keys to retrieve
   */
  async mget<T = any>(keys: string[]): Promise<Map<string, T | null>> {
    const result = new Map<string, T | null>();

    for (const key of keys) {
      result.set(key, await this.get<T>(key));
    }

    return result;
  }

  /**
   * Set multiple key-value pairs atomically
   * @param entries - Map of key-value pairs
   */
  async mset(
    entries: Map<string, any>,
    options: KVStorageOptions = {}
  ): Promise<boolean> {
    try {
      for (const [key, value] of entries) {
        await this.set(key, value, options);
      }
      return true;
    } catch (error) {
      console.error('KVStorage.mset error:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageStats(): {
    keyCount: number;
    storageUsageBytes: number;
    storageUsageMB: number;
    nucleusId: string;
  } {
    return {
      keyCount: this.storage.size,
      storageUsageBytes: this.storageUsage,
      storageUsageMB: this.storageUsage / 1024 / 1024,
      nucleusId: this.nucleusId,
    };
  }

  /**
   * Clear all storage (use with caution)
   */
  async clear(): Promise<void> {
    this.storage.clear();
    this.storageUsage = 0;
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.storage.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        await this.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}


