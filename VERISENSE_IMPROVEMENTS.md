# Verisense Nucleus Improvements

This document describes the improvements made to the Style Shepherd codebase based on Verisense documentation and best practices.

## Overview

The codebase has been enhanced with comprehensive Verisense Nucleus capabilities, including:

- **Nucleus Service**: Core abstraction for decentralized applications
- **KV Storage Service**: Key-value storage operations
- **Timer Service**: Scheduled operations and automation
- **HTTP Request Service**: Proactive network requests
- **Lifecycle Service**: Complete lifecycle management
- **Indexer Service**: Off-chain indexing for complex queries

## Architecture

### Core Services

All Verisense services are located in `server/src/services/verisense/`:

```
verisense/
├── NucleusService.ts       # Core Nucleus abstraction
├── KVStorageService.ts     # Key-value storage
├── TimerService.ts         # Scheduled operations
├── HttpRequestService.ts   # Network requests
├── LifecycleService.ts     # Lifecycle management
├── IndexerService.ts       # Off-chain indexing
├── StyleShepherdNucleus.ts # Integration example
└── index.ts                # Centralized exports
```

### Integration Example

`StyleShepherdNucleus.ts` demonstrates how to integrate all Verisense capabilities:

- Stores user preferences in KV storage
- Uses timers for scheduled tasks (cleanup, sync)
- Makes HTTP requests to external APIs
- Indexes recommendations for complex queries
- Manages Nucleus lifecycle and billing

## Key Features

### 1. Reverse Gas Mode

The Nucleus implements Verisense's reverse gas mode where:
- **Publisher pays** for Nucleus operations
- **Users interact for free** (by default)
- Charges are based on:
  - Storage usage
  - Data write requests
  - System function invocations

### 2. KV Storage

Isolated key-value storage for each Nucleus:
- Deterministic time complexity for consensus
- TTL support for automatic expiration
- Efficient storage usage tracking
- Atomic multi-key operations

### 3. Timers

Scheduled operations for automation:
- One-time or repeating timers
- Configurable delays and intervals
- Maximum execution limits
- Automatic cleanup

### 4. HTTP Requests

Proactive network requests:
- Retry logic with exponential backoff
- Timeout handling
- Request statistics tracking
- Support for all HTTP methods

### 5. Lifecycle Management

Complete lifecycle support:
- **Creation**: Via Verisense Hostnet transaction
- **WASM Update**: Code updates logged as events
- **Recovery**: State recovery by subnet nodes
- **Operation**: Normal operation with billing

### 6. Indexer

Off-chain indexing for complex queries:
- Relational, full-text, and time-series indexing
- Exact match, range, and aggregate queries
- Custom schema definitions
- Efficient query performance

## API Endpoints

New endpoints are available at `/api/verisense-nucleus/`:

### Status
```
GET /api/verisense-nucleus/status
```
Returns comprehensive Nucleus status including:
- Nucleus state and balance
- Storage statistics
- Active timers
- HTTP request stats
- Indexer statistics
- Billing information

### Deposit
```
POST /api/verisense-nucleus/deposit
Body: { amount: number }
```
Deposit funds to Nucleus account.

### User Preferences
```
POST /api/verisense-nucleus/preferences
Body: { userId: string, preferences: object }

GET /api/verisense-nucleus/preferences/:userId
```
Store and retrieve user preferences using KV storage.

### Recommendations
```
POST /api/verisense-nucleus/recommendations
Body: { userId: string, productId: string, score: number, metadata?: object }

GET /api/verisense-nucleus/recommendations/:userId?limit=10
```
Index and query product recommendations using the Indexer service.

### Health Check
```
GET /api/verisense-nucleus/health
```
Check if Nucleus is operational (balance above threshold).

## Usage Examples

### Basic Nucleus Setup

```typescript
import { NucleusService } from './services/verisense/index.js';

const nucleus = new NucleusService({
  id: 'my-nucleus',
  name: 'My Application',
  version: '1.0.0',
  publisherAddress: '0x...',
  initialBalance: 100,
});

// Check status
const state = nucleus.getState();
console.log('Balance:', state.balance);
console.log('Can operate:', nucleus.canOperate());
```

### Using KV Storage

```typescript
import { KVStorageService } from './services/verisense/index.js';

const storage = new KVStorageService('nucleus-id');

// Store data
await storage.set('user:123', { name: 'John', age: 30 });

// Retrieve data
const user = await storage.get('user:123');

// Set with TTL
await storage.set('session:abc', { token: 'xyz' }, { ttl: 3600 });
```

### Using Timers

```typescript
import { TimerService } from './services/verisense/index.js';

const timers = new TimerService();

// Create repeating timer
await timers.createTimer({
  id: 'daily-task',
  interval: 24 * 60 * 60 * 1000, // 24 hours
  repeat: true,
  callback: async () => {
    console.log('Running daily task...');
  },
});

// Create one-time timer
await timers.createTimer({
  id: 'cleanup',
  delay: 5000, // 5 seconds
  interval: 0,
  repeat: false,
  callback: async () => {
    console.log('Cleanup complete');
  },
});
```

### Using HTTP Requests

```typescript
import { HttpRequestService } from './services/verisense/index.js';

const http = new HttpRequestService();

// Make GET request
const response = await http.get('https://api.example.com/data', {
  timeout: 5000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
});

// Make POST request
const result = await http.post('https://api.example.com/endpoint', {
  key: 'value',
});
```

### Using Indexer

```typescript
import { IndexerService } from './services/verisense/index.js';

const indexer = new IndexerService({
  type: 'relational',
  name: 'products',
  schema: {
    fields: [
      { name: 'id', type: 'string', indexed: true },
      { name: 'price', type: 'number', indexed: true },
      { name: 'category', type: 'string', indexed: true },
    ],
  },
});

// Index a document
await indexer.index({
  id: 'prod-123',
  price: 99.99,
  category: 'electronics',
});

// Query
const results = await indexer.query({
  type: 'exact',
  field: 'category',
  value: 'electronics',
  sort: { field: 'price', order: 'asc' },
  limit: 10,
});
```

## Integration with Existing Services

The Verisense Nucleus capabilities can be integrated into existing services:

### Example: Update ReturnsAgent

```typescript
import { KVStorageService } from '../verisense/index.js';

class ReturnsAgent {
  private storage: KVStorageService;

  constructor() {
    this.storage = new KVStorageService('returns-agent');
  }

  async predictReturnRisk(orderId: string) {
    // Check cache first
    const cached = await this.storage.get(`prediction:${orderId}`);
    if (cached) {
      return cached;
    }

    // Calculate prediction
    const prediction = await this.calculateRisk(orderId);

    // Cache result
    await this.storage.set(`prediction:${orderId}`, prediction, {
      ttl: 3600, // 1 hour
    });

    return prediction;
  }
}
```

## Billing and Cost Management

The Nucleus tracks costs based on Verisense's billing model:

- **Storage**: Charged per GB
- **Writes**: Charged per operation
- **Function Calls**: Charged per invocation

Monitor costs using:

```typescript
const billing = nucleus.getBillingInfo();
console.log('Balance:', billing.balance);
console.log('Estimated monthly cost:', billing.estimatedMonthlyCost);
console.log('Can operate:', billing.canOperate);
```

## Best Practices

1. **Use KV Storage for frequently accessed data** - Faster than external databases
2. **Set appropriate TTLs** - Avoid storing unnecessary data
3. **Use timers for periodic tasks** - Automate cleanup and sync operations
4. **Cache HTTP responses** - Reduce external API calls
5. **Index frequently queried data** - Use Indexer for complex queries
6. **Monitor balance** - Ensure Nucleus has sufficient funds
7. **Use lifecycle events** - Track all state changes

## Future Enhancements

Potential improvements:

1. **WASM Compilation**: Compile Nucleus code to WASM for deployment
2. **TSS Integration**: Add Threshold Signature Scheme support
3. **Multi-Nucleus Support**: Manage multiple Nucleuses
4. **Advanced Indexing**: Support for more index types
5. **Real-time Sync**: Real-time state synchronization with Hostnet
6. **Monitoring Dashboard**: Visual dashboard for Nucleus status

## References

- [Verisense Documentation](https://docs.verisense.network)
- [Nucleus Core Concepts](https://docs.verisense.network/core-concepts/nucleus)
- [Reverse Gas Mode](https://docs.verisense.network/core-concepts/reverse-gas-mode)
- [Feature-Rich SDK](https://docs.verisense.network/core-concepts/feature-rich-sdk)


