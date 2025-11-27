/**
 * MCP (Model Context Protocol) Server for Verisense Nucleus Services
 * 
 * Exposes Verisense Nucleus capabilities as MCP tools that AI agents can discover and use.
 * This implementation follows the MCP specification for tool definitions and execution.
 */

import { StyleShepherdNucleus } from './StyleShepherdNucleus.js';
import type { NucleusConfig } from './index.js';

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * MCP Tool Result
 */
export interface MCPToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: any;
  }>;
  isError?: boolean;
}

/**
 * MCP Server for Verisense Nucleus
 */
export class MCPServer {
  private nucleus: StyleShepherdNucleus;
  private tools: Map<string, MCPTool> = new Map();

  constructor(config: NucleusConfig) {
    this.nucleus = new StyleShepherdNucleus(config);
    this.registerTools();
  }

  /**
   * Register all available MCP tools
   */
  private registerTools(): void {
    // KV Storage Tools
    this.registerTool({
      name: 'kv_storage_set',
      description: 'Store a key-value pair in the Nucleus KV storage. Supports TTL for automatic expiration.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Storage key (e.g., "user:preferences:123")',
          },
          value: {
            description: 'Value to store (can be any JSON-serializable object)',
          },
          ttl: {
            type: 'number',
            description: 'Time-to-live in seconds (optional)',
          },
          overwrite: {
            type: 'boolean',
            description: 'Whether to overwrite existing key (default: true)',
          },
        },
        required: ['key', 'value'],
      },
    });

    this.registerTool({
      name: 'kv_storage_get',
      description: 'Retrieve a value from KV storage by key.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Storage key to retrieve',
          },
        },
        required: ['key'],
      },
    });

    this.registerTool({
      name: 'kv_storage_delete',
      description: 'Delete a key-value pair from KV storage.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Storage key to delete',
          },
        },
        required: ['key'],
      },
    });

    this.registerTool({
      name: 'kv_storage_list',
      description: 'List all keys in KV storage, optionally filtered by prefix.',
      inputSchema: {
        type: 'object',
        properties: {
          prefix: {
            type: 'string',
            description: 'Optional prefix to filter keys (e.g., "user:")',
          },
        },
      },
    });

    this.registerTool({
      name: 'kv_storage_has',
      description: 'Check if a key exists in KV storage.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Storage key to check',
          },
        },
        required: ['key'],
      },
    });

    // Timer Tools
    this.registerTool({
      name: 'timer_create',
      description: 'Create a scheduled timer for automated tasks. Supports one-time or repeating timers.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique timer identifier',
          },
          name: {
            type: 'string',
            description: 'Timer name/description',
          },
          delay: {
            type: 'number',
            description: 'Delay in milliseconds before first execution',
          },
          interval: {
            type: 'number',
            description: 'Interval in milliseconds between executions (required for repeat timers)',
          },
          repeat: {
            type: 'boolean',
            description: 'Whether to repeat (false = one-time execution)',
          },
          maxExecutions: {
            type: 'number',
            description: 'Maximum number of executions (for repeat timers)',
          },
          action: {
            type: 'string',
            description: 'Action to perform when timer fires (e.g., "sync_data", "cleanup_cache")',
          },
        },
        required: ['id', 'interval', 'repeat'],
      },
    });

    this.registerTool({
      name: 'timer_cancel',
      description: 'Cancel an active timer.',
      inputSchema: {
        type: 'object',
        properties: {
          timerId: {
            type: 'string',
            description: 'Timer identifier to cancel',
          },
        },
        required: ['timerId'],
      },
    });

    this.registerTool({
      name: 'timer_list',
      description: 'List all active timers with their status.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });

    this.registerTool({
      name: 'timer_status',
      description: 'Get status of a specific timer.',
      inputSchema: {
        type: 'object',
        properties: {
          timerId: {
            type: 'string',
            description: 'Timer identifier',
          },
        },
        required: ['timerId'],
      },
    });

    // HTTP Request Tools
    this.registerTool({
      name: 'http_request',
      description: 'Make an HTTP request to an external API. Supports GET, POST, PUT, DELETE, PATCH with retry logic.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Request URL',
          },
          method: {
            type: 'string',
            enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
            description: 'HTTP method',
          },
          headers: {
            type: 'object',
            description: 'Request headers',
          },
          body: {
            description: 'Request body (JSON object or string)',
          },
          timeout: {
            type: 'number',
            description: 'Request timeout in milliseconds',
          },
          retry: {
            type: 'object',
            description: 'Retry configuration',
            properties: {
              maxRetries: {
                type: 'number',
                description: 'Maximum number of retries',
              },
              retryDelay: {
                type: 'number',
                description: 'Delay between retries in milliseconds',
              },
            },
          },
        },
        required: ['url'],
      },
    });

    // Indexer Tools
    this.registerTool({
      name: 'indexer_index',
      description: 'Index a document for efficient querying. Used for product recommendations, search, etc.',
      inputSchema: {
        type: 'object',
        properties: {
          document: {
            type: 'object',
            description: 'Document to index (must match indexer schema)',
          },
        },
        required: ['document'],
      },
    });

    this.registerTool({
      name: 'indexer_query',
      description: 'Query indexed documents. Supports exact match, range, full-text search, and aggregations.',
      inputSchema: {
        type: 'object',
        properties: {
          queryType: {
            type: 'string',
            enum: ['exact', 'range', 'fulltext', 'aggregate'],
            description: 'Query type',
          },
          field: {
            type: 'string',
            description: 'Field to query (for exact/range queries)',
          },
          value: {
            description: 'Query value (for exact queries)',
          },
          range: {
            type: 'object',
            description: 'Range query (from, to)',
            properties: {
              from: { description: 'Range start' },
              to: { description: 'Range end' },
            },
          },
          searchText: {
            type: 'string',
            description: 'Full-text search query',
          },
          aggregate: {
            type: 'object',
            description: 'Aggregation function',
            properties: {
              function: {
                type: 'string',
                enum: ['count', 'sum', 'avg', 'min', 'max'],
              },
              field: { type: 'string' },
            },
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results',
          },
          offset: {
            type: 'number',
            description: 'Result offset for pagination',
          },
          sort: {
            type: 'object',
            description: 'Sort configuration',
            properties: {
              field: { type: 'string' },
              order: { type: 'string', enum: ['asc', 'desc'] },
            },
          },
        },
        required: ['queryType'],
      },
    });

    // Nucleus Management Tools
    this.registerTool({
      name: 'nucleus_status',
      description: 'Get comprehensive Nucleus status including balance, storage stats, timers, and billing info.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });

    this.registerTool({
      name: 'nucleus_deposit',
      description: 'Deposit funds to the Nucleus account for operations.',
      inputSchema: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Amount to deposit',
          },
        },
        required: ['amount'],
      },
    });

    this.registerTool({
      name: 'nucleus_health',
      description: 'Check if Nucleus is operational (balance above threshold).',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    });

    // User Preferences Tools (convenience wrappers)
    this.registerTool({
      name: 'user_preferences_store',
      description: 'Store user preferences in KV storage (convenience wrapper for kv_storage_set).',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'User identifier',
          },
          preferences: {
            type: 'object',
            description: 'User preferences object',
          },
        },
        required: ['userId', 'preferences'],
      },
    });

    this.registerTool({
      name: 'user_preferences_get',
      description: 'Get user preferences from KV storage (convenience wrapper for kv_storage_get).',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'User identifier',
          },
        },
        required: ['userId'],
      },
    });

    // Recommendation Tools (convenience wrappers)
    this.registerTool({
      name: 'recommendation_index',
      description: 'Index a product recommendation for a user (convenience wrapper for indexer_index).',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'User identifier',
          },
          productId: {
            type: 'string',
            description: 'Product identifier',
          },
          score: {
            type: 'number',
            description: 'Recommendation score (0-1)',
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata',
          },
        },
        required: ['userId', 'productId', 'score'],
      },
    });

    this.registerTool({
      name: 'recommendation_query',
      description: 'Query product recommendations for a user (convenience wrapper for indexer_query).',
      inputSchema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description: 'User identifier',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of recommendations',
          },
          minScore: {
            type: 'number',
            description: 'Minimum recommendation score',
          },
        },
        required: ['userId'],
      },
    });
  }

  /**
   * Register a tool
   */
  private registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * List all available tools
   */
  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool definition
   */
  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Execute a tool
   */
  async callTool(name: string, args: Record<string, any>): Promise<MCPToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Tool "${name}" not found. Available tools: ${Array.from(this.tools.keys()).join(', ')}`,
          },
        ],
        isError: true,
      };
    }

    try {
      let result: any;

      switch (name) {
        // KV Storage
        case 'kv_storage_set':
          result = await this.nucleus.getKVStorage().set(
            args.key,
            args.value,
            { ttl: args.ttl, overwrite: args.overwrite !== false }
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: result, key: args.key }),
              },
            ],
          };

        case 'kv_storage_get':
          result = await this.nucleus.getKVStorage().get(args.key);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ value: result, key: args.key }),
              },
            ],
          };

        case 'kv_storage_delete':
          result = await this.nucleus.getKVStorage().delete(args.key);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: result, key: args.key }),
              },
            ],
          };

        case 'kv_storage_list':
          result = await this.nucleus.getKVStorage().keys(args.prefix);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ keys: result, count: result.length }),
              },
            ],
          };

        case 'kv_storage_has':
          result = await this.nucleus.getKVStorage().has(args.key);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ exists: result, key: args.key }),
              },
            ],
          };

        // Timers
        case 'timer_create':
          // Note: In a real implementation, the action would be executed via a callback
          // For MCP, we'll store the action intent and execute it when the timer fires
          result = await this.nucleus.getTimerService().createTimer({
            id: args.id,
            name: args.name,
            delay: args.delay,
            interval: args.interval,
            repeat: args.repeat,
            maxExecutions: args.maxExecutions,
            callback: async () => {
              console.log(`Timer ${args.id} fired: ${args.action}`);
              // In production, this would execute the specified action
            },
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: true, timerId: result }),
              },
            ],
          };

        case 'timer_cancel':
          result = await this.nucleus.getTimerService().cancelTimer(args.timerId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: result, timerId: args.timerId }),
              },
            ],
          };

        case 'timer_list':
          result = this.nucleus.getTimerService().getAllTimers();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ timers: result, count: result.length }),
              },
            ],
          };

        case 'timer_status':
          result = this.nucleus.getTimerService().getTimerStatus(args.timerId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ status: result }),
              },
            ],
          };

        // HTTP Requests
        case 'http_request':
          result = await this.nucleus.getHttpService().request(args.url, {
            method: args.method || 'GET',
            headers: args.headers,
            body: args.body,
            timeout: args.timeout,
            retry: args.retry,
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: result.status,
                  body: result.body,
                  responseTime: result.responseTime,
                }),
              },
            ],
          };

        // Indexer
        case 'indexer_index':
          result = await this.nucleus.getIndexer().index(args.document);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: result }),
              },
            ],
          };

        case 'indexer_query':
          result = await this.nucleus.getIndexer().query({
            type: args.queryType,
            field: args.field,
            value: args.value,
            range: args.range,
            searchText: args.searchText,
            aggregate: args.aggregate,
            limit: args.limit,
            offset: args.offset,
            sort: args.sort,
          });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  results: result.results,
                  total: result.total,
                  queryTime: result.queryTime,
                }),
              },
            ],
          };

        // Nucleus Management
        case 'nucleus_status':
          result = this.nucleus.getStatus();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result),
              },
            ],
          };

        case 'nucleus_deposit':
          this.nucleus.deposit(args.amount);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: `Deposited ${args.amount} to Nucleus`,
                }),
              },
            ],
          };

        case 'nucleus_health':
          result = this.nucleus.canOperate();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ healthy: result, operational: result }),
              },
            ],
          };

        // User Preferences (convenience)
        case 'user_preferences_store':
          result = await this.nucleus.storeUserPreferences(args.userId, args.preferences);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: result, userId: args.userId }),
              },
            ],
          };

        case 'user_preferences_get':
          result = await this.nucleus.getUserPreferences(args.userId);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ preferences: result, userId: args.userId }),
              },
            ],
          };

        // Recommendations (convenience)
        case 'recommendation_index':
          result = await this.nucleus.indexRecommendation(
            args.userId,
            args.productId,
            args.score,
            args.metadata
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: result }),
              },
            ],
          };

        case 'recommendation_query':
          result = await this.nucleus.getRecommendations(args.userId, args.limit || 10);
          // Filter by minScore if provided
          const filtered = args.minScore
            ? result.filter((r: any) => r.score >= args.minScore)
            : result;
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ recommendations: filtered, count: filtered.length }),
              },
            ],
          };

        default:
          return {
            content: [
              {
                type: 'text',
                text: `Error: Tool "${name}" execution not implemented`,
              },
            ],
            isError: true,
          };
      }
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: error.message || 'Unknown error',
              tool: name,
              args,
            }),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Get Nucleus instance (for direct access if needed)
   */
  getNucleus(): StyleShepherdNucleus {
    return this.nucleus;
  }
}

