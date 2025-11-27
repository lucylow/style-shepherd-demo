/**
 * Verisense Indexer Service
 * 
 * Provides off-chain indexing capabilities for complex queries.
 * In Verisense, blockchain storage is restricted to KV databases for
 * deterministic consensus. Indexers enable advanced querying capabilities
 * similar to blockchain explorers, but tailored for specific Nucleus use cases.
 * 
 * This service can be implemented using:
 * - Traditional relational databases
 * - Full-text search engines
 * - AWS serverless architectures
 * - Custom indexing solutions
 */

export interface IndexerConfig {
  /** Indexer type */
  type: 'relational' | 'fulltext' | 'timeseries' | 'custom';
  /** Indexer name */
  name: string;
  /** Index schema definition */
  schema: IndexSchema;
  /** Indexer-specific configuration */
  config?: Record<string, any>;
}

export interface IndexSchema {
  /** Fields to index */
  fields: IndexField[];
  /** Primary key field */
  primaryKey?: string;
  /** Indexes for faster queries */
  indexes?: IndexDefinition[];
}

export interface IndexField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  indexed: boolean;
  searchable?: boolean;
}

export interface IndexDefinition {
  name: string;
  fields: string[];
  unique?: boolean;
}

export interface IndexQuery {
  /** Query type */
  type: 'exact' | 'range' | 'fulltext' | 'aggregate';
  /** Field to query */
  field?: string;
  /** Query value */
  value?: any;
  /** Range query */
  range?: {
    from: any;
    to: any;
  };
  /** Full-text search query */
  searchText?: string;
  /** Aggregation function */
  aggregate?: {
    function: 'count' | 'sum' | 'avg' | 'min' | 'max';
    field: string;
  };
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
  /** Sort order */
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface IndexResult<T = any> {
  results: T[];
  total: number;
  limit: number;
  offset: number;
  queryTime: number;
}

export class IndexerService {
  private config: IndexerConfig;
  private data: Map<string, any[]> = new Map();
  private indexes: Map<string, Map<any, any[]>> = new Map();

  constructor(config: IndexerConfig) {
    this.config = config;
    this.initializeIndexes();
  }

  /**
   * Initialize indexes based on schema
   */
  private initializeIndexes(): void {
    for (const field of this.config.schema.fields) {
      if (field.indexed) {
        this.indexes.set(field.name, new Map());
      }
    }

    // Initialize composite indexes
    if (this.config.schema.indexes) {
      for (const indexDef of this.config.schema.indexes) {
        const indexKey = indexDef.name;
        this.indexes.set(indexKey, new Map());
      }
    }
  }

  /**
   * Index a document
   * @param document - Document to index
   */
  async index(document: Record<string, any>): Promise<boolean> {
    try {
      const collection = this.getCollection();
      collection.push(document);

      // Update indexes
      for (const field of this.config.schema.fields) {
        if (field.indexed && document[field.name] !== undefined) {
          const index = this.indexes.get(field.name);
          if (index) {
            const value = document[field.name];
            if (!index.has(value)) {
              index.set(value, []);
            }
            index.get(value)!.push(document);
          }
        }
      }

      // Update composite indexes
      if (this.config.schema.indexes) {
        for (const indexDef of this.config.schema.indexes) {
          const indexKey = indexDef.name;
          const index = this.indexes.get(indexKey);
          if (index) {
            const compositeKey = indexDef.fields
              .map((field) => document[field])
              .join('|');
            if (!index.has(compositeKey)) {
              index.set(compositeKey, []);
            }
            index.get(compositeKey)!.push(document);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Indexer.index error:', error);
      return false;
    }
  }

  /**
   * Query the index
   * @param query - Query definition
   */
  async query<T = any>(query: IndexQuery): Promise<IndexResult<T>> {
    const startTime = Date.now();
    let results: T[] = [];

    try {
      const collection = this.getCollection();

      switch (query.type) {
        case 'exact':
          results = this.queryExact(collection, query);
          break;

        case 'range':
          results = this.queryRange(collection, query);
          break;

        case 'fulltext':
          results = this.queryFulltext(collection, query);
          break;

        case 'aggregate':
          results = this.queryAggregate(collection, query);
          break;

        default:
          results = collection as T[];
      }

      // Apply sorting
      if (query.sort) {
        results.sort((a: any, b: any) => {
          const aVal = a[query.sort!.field];
          const bVal = b[query.sort!.field];
          const order = query.sort!.order === 'asc' ? 1 : -1;

          if (aVal < bVal) return -1 * order;
          if (aVal > bVal) return 1 * order;
          return 0;
        });
      }

      // Apply pagination
      const total = results.length;
      const offset = query.offset || 0;
      const limit = query.limit || 100;

      results = results.slice(offset, offset + limit);

      const queryTime = Date.now() - startTime;

      return {
        results,
        total,
        limit,
        offset,
        queryTime,
      };
    } catch (error) {
      console.error('Indexer.query error:', error);
      return {
        results: [],
        total: 0,
        limit: query.limit || 100,
        offset: query.offset || 0,
        queryTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Exact match query
   */
  private queryExact(collection: any[], query: IndexQuery): any[] {
    if (!query.field || query.value === undefined) {
      return collection;
    }

    // Use index if available
    const index = this.indexes.get(query.field);
    if (index) {
      return index.get(query.value) || [];
    }

    // Fallback to full scan
    return collection.filter((doc) => doc[query.field!] === query.value);
  }

  /**
   * Range query
   */
  private queryRange(collection: any[], query: IndexQuery): any[] {
    if (!query.field || !query.range) {
      return collection;
    }

    return collection.filter((doc) => {
      const value = doc[query.field!];
      return value >= query.range!.from && value <= query.range!.to;
    });
  }

  /**
   * Full-text search query
   */
  private queryFulltext(collection: any[], query: IndexQuery): any[] {
    if (!query.searchText) {
      return collection;
    }

    const searchTerms = query.searchText.toLowerCase().split(/\s+/);

    return collection.filter((doc) => {
      // Search in all searchable fields
      for (const field of this.config.schema.fields) {
        if (field.searchable && doc[field.name]) {
          const fieldValue = String(doc[field.name]).toLowerCase();
          if (searchTerms.some((term) => fieldValue.includes(term))) {
            return true;
          }
        }
      }
      return false;
    });
  }

  /**
   * Aggregate query
   */
  private queryAggregate(collection: any[], query: IndexQuery): any[] {
    if (!query.aggregate) {
      return [];
    }

    const { function: aggFunc, field } = query.aggregate;
    const values = collection
      .map((doc) => doc[field])
      .filter((val) => val !== undefined && val !== null);

    let result: number;

    switch (aggFunc) {
      case 'count':
        result = values.length;
        break;
      case 'sum':
        result = values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case 'min':
        result = Math.min(...values);
        break;
      case 'max':
        result = Math.max(...values);
        break;
      default:
        result = 0;
    }

    return [{ [field]: result, function: aggFunc }];
  }

  /**
   * Get collection for this indexer
   */
  private getCollection(): any[] {
    const collectionKey = this.config.name;
    if (!this.data.has(collectionKey)) {
      this.data.set(collectionKey, []);
    }
    return this.data.get(collectionKey)!;
  }

  /**
   * Clear all indexed data
   */
  async clear(): Promise<void> {
    this.data.clear();
    this.indexes.clear();
    this.initializeIndexes();
  }

  /**
   * Get indexer statistics
   */
  getStats(): {
    documentCount: number;
    indexCount: number;
    indexedFields: string[];
  } {
    const collection = this.getCollection();

    return {
      documentCount: collection.length,
      indexCount: this.indexes.size,
      indexedFields: Array.from(this.indexes.keys()),
    };
  }
}


