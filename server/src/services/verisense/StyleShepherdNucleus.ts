/**
 * Style Shepherd Nucleus Integration
 * 
 * Demonstrates how to integrate Verisense Nucleus capabilities
 * into the Style Shepherd application.
 * 
 * This service shows:
 * - How to use KV storage for user preferences
 * - How to use timers for scheduled tasks
 * - How to use HTTP requests for external API calls
 * - How to use indexers for complex queries
 * - How to manage Nucleus lifecycle
 */

import {
  NucleusService,
  KVStorageService,
  TimerService,
  HttpRequestService,
  LifecycleService,
  IndexerService,
  type NucleusConfig,
  type IndexerConfig,
} from './index.js';

export class StyleShepherdNucleus {
  private nucleus: NucleusService;
  private kvStorage: KVStorageService;
  private timerService: TimerService;
  private httpService: HttpRequestService;
  private lifecycleService: LifecycleService;
  private indexer: IndexerService;

  constructor(config: NucleusConfig) {
    // Initialize Nucleus
    this.nucleus = new NucleusService(config);

    // Initialize services
    this.kvStorage = new KVStorageService(config.id);
    this.timerService = new TimerService();
    this.httpService = new HttpRequestService();
    this.lifecycleService = new LifecycleService(this.nucleus);

    // Initialize indexer for product recommendations
    const indexerConfig: IndexerConfig = {
      type: 'relational',
      name: 'product_recommendations',
      schema: {
        fields: [
          { name: 'userId', type: 'string', indexed: true },
          { name: 'productId', type: 'string', indexed: true },
          { name: 'score', type: 'number', indexed: true },
          { name: 'timestamp', type: 'date', indexed: true },
          { name: 'metadata', type: 'json', indexed: false },
        ],
        primaryKey: 'userId',
        indexes: [
          {
            name: 'user_product',
            fields: ['userId', 'productId'],
            unique: true,
          },
        ],
      },
    };
    this.indexer = new IndexerService(indexerConfig);

    // Set up scheduled tasks
    this.setupScheduledTasks();
  }

  /**
   * Store user preferences in KV storage
   */
  async storeUserPreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<boolean> {
    const key = `user:preferences:${userId}`;
    return this.kvStorage.set(key, preferences);
  }

  /**
   * Get user preferences from KV storage
   */
  async getUserPreferences(userId: string): Promise<Record<string, any> | null> {
    const key = `user:preferences:${userId}`;
    return this.kvStorage.get(key);
  }

  /**
   * Fetch product data from external API using HTTP service
   */
  async fetchProductData(productId: string): Promise<any> {
    try {
      // Example: Fetch from external product API
      const response = await this.httpService.get(
        `https://api.example.com/products/${productId}`,
        {
          timeout: 5000,
          retry: {
            maxRetries: 3,
            retryDelay: 1000,
          },
        }
      );

      return response.body;
    } catch (error) {
      console.error('Failed to fetch product data:', error);
      return null;
    }
  }

  /**
   * Index a product recommendation
   */
  async indexRecommendation(
    userId: string,
    productId: string,
    score: number,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    return this.indexer.index({
      userId,
      productId,
      score,
      timestamp: new Date().toISOString(),
      metadata: metadata || {},
    });
  }

  /**
   * Query recommendations for a user
   */
  async getRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    const result = await this.indexer.query({
      type: 'exact',
      field: 'userId',
      value: userId,
      sort: {
        field: 'score',
        order: 'desc',
      },
      limit,
    });

    return result.results;
  }

  /**
   * Set up scheduled tasks using Timer service
   */
  private setupScheduledTasks(): void {
    // Daily cleanup of expired recommendations
    this.timerService.createTimer({
      id: 'daily_cleanup',
      name: 'Daily Recommendation Cleanup',
      interval: 24 * 60 * 60 * 1000, // 24 hours
      repeat: true,
      callback: async () => {
        console.log('Running daily cleanup...');
        // Clean up expired entries from KV storage
        await this.kvStorage.cleanupExpired();
        // Charge for operation
        this.nucleus.charge(0.01, 'Daily cleanup operation');
      },
    });

    // Periodic state synchronization
    this.timerService.createTimer({
      id: 'state_sync',
      name: 'State Synchronization',
      interval: 60 * 60 * 1000, // 1 hour
      repeat: true,
      callback: async () => {
        console.log('Synchronizing state with Hostnet...');
        await this.lifecycleService.synchronizeState();
      },
    });

    // Periodic external data sync
    this.timerService.createTimer({
      id: 'external_sync',
      name: 'External Data Synchronization',
      interval: 6 * 60 * 60 * 1000, // 6 hours
      repeat: true,
      callback: async () => {
        console.log('Syncing external data...');
        // Example: Sync product catalog from external API
        try {
          const response = await this.httpService.get(
            'https://api.example.com/products/sync',
            {
              timeout: 30000,
            }
          );
          console.log('External sync completed:', response.status);
        } catch (error) {
          console.error('External sync failed:', error);
        }
      },
    });
  }

  /**
   * Get Nucleus status
   */
  getStatus() {
    return {
      nucleus: this.lifecycleService.getStatus(),
      storage: this.kvStorage.getStorageStats(),
      timers: this.timerService.getAllTimers(),
      http: this.httpService.getStats(),
      indexer: this.indexer.getStats(),
      billing: this.nucleus.getBillingInfo(),
    };
  }

  /**
   * Deposit funds to Nucleus
   */
  deposit(amount: number): void {
    this.lifecycleService.deposit(amount);
  }

  /**
   * Check if Nucleus can operate
   */
  canOperate(): boolean {
    return this.lifecycleService.canOperate();
  }

  /**
   * Get KV Storage service (for MCP server access)
   */
  getKVStorage(): KVStorageService {
    return this.kvStorage;
  }

  /**
   * Get Timer service (for MCP server access)
   */
  getTimerService(): TimerService {
    return this.timerService;
  }

  /**
   * Get HTTP Request service (for MCP server access)
   */
  getHttpService(): HttpRequestService {
    return this.httpService;
  }

  /**
   * Get Indexer service (for MCP server access)
   */
  getIndexer(): IndexerService {
    return this.indexer;
  }
}

