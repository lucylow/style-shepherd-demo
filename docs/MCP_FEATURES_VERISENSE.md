# MCP Features with Verisense AI Agent

This document explains the Model Context Protocol (MCP) features available in Style Shepherd when integrated with Verisense.

## Table of Contents

1. [What is MCP in Verisense?](#what-is-mcp-in-verisense)
2. [MCP Capabilities](#mcp-capabilities)
3. [Verisense Nucleus Services](#verisense-nucleus-services)
4. [Using MCP Features](#using-mcp-features)
5. [API Endpoints](#api-endpoints)
6. [Examples](#examples)

---

## What is MCP in Verisense?

**Model Context Protocol (MCP)** is a standard that enables AI agents to connect to tools, APIs, and resources. In the Verisense ecosystem, MCP capabilities allow your agent to:

- **Store and retrieve data** persistently using key-value storage
- **Schedule automated tasks** using timers
- **Make proactive HTTP requests** to external APIs
- **Manage application lifecycle** with state synchronization
- **Index and query data** efficiently for complex operations

When you register Style Shepherd as an MCP agent on Verisense, it gains access to these powerful capabilities through the **Verisense Nucleus** infrastructure.

### Relationship with A2A

- **MCP (Model Context Protocol)**: Agent-to-tool communication (how agents connect to tools/APIs)
- **A2A (Agent2Agent Protocol)**: Agent-to-agent communication (how agents collaborate)

Both protocols work together: MCP provides the tools, A2A enables collaboration.

---

## MCP Capabilities

The Style Shepherd agent manifest declares MCP capability:

```json
{
  "capabilities": {
    "a2a": true,
    "miniapp": true,
    "mcp": true  // ← MCP capability enabled
  }
}
```

This enables the agent to use all Verisense Nucleus services.

---

## Verisense Nucleus Services

The following services provide MCP-like functionality:

### 1. **NucleusService** - Core Application Abstraction

The foundation service that manages the decentralized application state.

**Features:**
- State management with state root hashing
- Balance tracking and billing
- Event logging
- WASM code updates
- Recovery operations

**Use Cases:**
- Track application state
- Manage billing and charges
- Log important events
- Handle application updates

### 2. **KVStorageService** - Key-Value Storage

Persistent storage for application data using RocksDB (in production).

**Features:**
- Set/get/delete operations
- TTL (Time-To-Live) support
- Prefix-based key filtering
- Batch operations (mget/mset)
- Storage statistics

**Use Cases:**
- Store user preferences
- Cache API responses
- Maintain session data
- Store configuration

### 3. **TimerService** - Scheduled Operations

Schedule tasks to run at intervals or specific times.

**Features:**
- One-time or repeating timers
- Configurable delays and intervals
- Maximum execution limits
- Timer status tracking
- Automatic cleanup

**Use Cases:**
- Periodic data synchronization
- Scheduled cleanup tasks
- Automated workflows
- Health checks

### 4. **HttpRequestService** - Proactive Network Requests

Make HTTP requests to external APIs autonomously.

**Features:**
- All HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Retry logic with exponential backoff
- Request timeout handling
- Response statistics
- Error handling

**Use Cases:**
- Fetch external data
- Call external APIs
- Send webhook notifications
- Data synchronization

### 5. **LifecycleService** - Application Lifecycle Management

Manage the complete lifecycle of the Nucleus application.

**Features:**
- Creation and deployment
- WASM code updates
- State recovery
- State synchronization with Hostnet
- Billing management

**Use Cases:**
- Track application lifecycle
- Handle updates gracefully
- Recover from failures
- Monitor operational status

### 6. **IndexerService** - Off-Chain Indexing

Efficient indexing and querying of complex data structures.

**Features:**
- Relational indexing
- Complex queries
- Sorting and filtering
- Multi-field indexes
- Query statistics

**Use Cases:**
- Product recommendations
- Search functionality
- Analytics queries
- Complex data retrieval

---

## Using MCP Features

### Initializing the Nucleus

```typescript
import { StyleShepherdNucleus } from './services/verisense/StyleShepherdNucleus';
import type { NucleusConfig } from './services/verisense/index';

const config: NucleusConfig = {
  id: 'style-shepherd-nucleus',
  name: 'Style Shepherd Nucleus',
  version: '1.0.0',
  publisherAddress: '0x...',
  nodeCount: 5,
  initialBalance: 100,
};

const nucleus = new StyleShepherdNucleus(config);
```

### Storing User Preferences (KV Storage)

```typescript
// Store preferences
await nucleus.storeUserPreferences('user123', {
  style: 'kpop',
  size: 'M',
  colors: ['black', 'white'],
  makeup_pref: 'natural',
});

// Retrieve preferences
const preferences = await nucleus.getUserPreferences('user123');
console.log(preferences);
```

### Scheduling Tasks (Timers)

Timers are automatically set up in `StyleShepherdNucleus`, but you can create custom timers:

```typescript
import { TimerService } from './services/verisense/index';

const timerService = new TimerService();

// Create a timer that runs every hour
await timerService.createTimer({
  id: 'hourly_sync',
  name: 'Hourly Data Sync',
  interval: 60 * 60 * 1000, // 1 hour
  repeat: true,
  callback: async () => {
    console.log('Syncing data...');
    // Your sync logic here
  },
});
```

### Making HTTP Requests

```typescript
import { HttpRequestService } from './services/verisense/index';

const httpService = new HttpRequestService();

// Fetch product data
const response = await httpService.get('https://api.example.com/products', {
  timeout: 5000,
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
  },
});

console.log(response.body);
```

### Indexing Recommendations

```typescript
// Index a recommendation
await nucleus.indexRecommendation(
  'user123',
  'product456',
  0.95, // score
  { category: 'fashion', style: 'kpop' } // metadata
);

// Query recommendations
const recommendations = await nucleus.getRecommendations('user123', 10);
console.log(recommendations);
```

---

## API Endpoints

The Nucleus features are exposed via REST API endpoints:

### Status and Health

```bash
# Get Nucleus status
GET /api/verisense-nucleus/status

# Health check
GET /api/verisense-nucleus/health
```

### User Preferences

```bash
# Store preferences
POST /api/verisense-nucleus/preferences
{
  "userId": "user123",
  "preferences": {
    "style": "kpop",
    "size": "M"
  }
}

# Get preferences
GET /api/verisense-nucleus/preferences/:userId
```

### Recommendations

```bash
# Index recommendation
POST /api/verisense-nucleus/recommendations
{
  "userId": "user123",
  "productId": "product456",
  "score": 0.95,
  "metadata": { "category": "fashion" }
}

# Get recommendations
GET /api/verisense-nucleus/recommendations/:userId?limit=10
```

### Deposits

```bash
# Deposit funds
POST /api/verisense-nucleus/deposit
{
  "amount": 50
}
```

---

## Examples

### Example 1: Complete User Preference Flow

```typescript
// 1. Store user preferences
await nucleus.storeUserPreferences('user123', {
  style: 'kpop',
  size: 'M',
  colors: ['black', 'white'],
});

// 2. Fetch product recommendations based on preferences
const preferences = await nucleus.getUserPreferences('user123');
const recommendations = await nucleus.getRecommendations('user123', 5);

// 3. Index new recommendations
for (const rec of recommendations) {
  await nucleus.indexRecommendation(
    'user123',
    rec.productId,
    rec.score,
    rec.metadata
  );
}
```

### Example 2: Scheduled Data Sync

```typescript
// Timer is already set up in StyleShepherdNucleus
// But here's how you'd create a custom one:

const timerService = new TimerService();

await timerService.createTimer({
  id: 'daily_product_sync',
  name: 'Daily Product Catalog Sync',
  interval: 24 * 60 * 60 * 1000, // 24 hours
  repeat: true,
  callback: async () => {
    const httpService = new HttpRequestService();
    
    try {
      const response = await httpService.get(
        'https://api.example.com/products/sync',
        { timeout: 30000 }
      );
      
      console.log('Sync completed:', response.status);
      
      // Update Nucleus state
      nucleus.updateState({
        lastSync: Date.now(),
      });
    } catch (error) {
      console.error('Sync failed:', error);
    }
  },
});
```

### Example 3: Proactive Recommendation System

```typescript
// This could be triggered by a timer or external event
async function generateProactiveRecommendations(userId: string) {
  // 1. Get user preferences
  const preferences = await nucleus.getUserPreferences(userId);
  
  // 2. Fetch trending products from external API
  const httpService = new HttpRequestService();
  const response = await httpService.get(
    `https://api.example.com/trending?style=${preferences.style}`,
    { timeout: 5000 }
  );
  
  // 3. Score and index recommendations
  for (const product of response.body.products) {
    const score = calculateRecommendationScore(product, preferences);
    
    await nucleus.indexRecommendation(
      userId,
      product.id,
      score,
      { source: 'trending', timestamp: Date.now() }
    );
  }
  
  // 4. Get top recommendations
  const topRecs = await nucleus.getRecommendations(userId, 5);
  return topRecs;
}
```

### Example 4: Complete Status Check

```typescript
// Get comprehensive status
const status = nucleus.getStatus();

console.log('Nucleus Status:', status.nucleus);
console.log('Storage Stats:', status.storage);
console.log('Active Timers:', status.timers);
console.log('HTTP Stats:', status.http);
console.log('Billing Info:', status.billing);
```

---

## Integration with Verisense Dashboard

To enable MCP features:

1. **Generate Manifest**:
   ```bash
   DEPLOY_URL=https://your-app.com node scripts/register_agent.js
   ```

2. **Upload to Verisense Dashboard**:
   - Navigate to https://dashboard.verisense.network/
   - Go to **MCP / Agents** section
   - Upload your manifest

3. **Verify MCP Capability**:
   - Ensure `"mcp": true` is set in capabilities
   - Verify all endpoints are accessible
   - Test the Nucleus services

---

## Best Practices

1. **Storage Management**:
   - Use TTL for temporary data
   - Clean up expired entries regularly
   - Monitor storage usage

2. **Timer Management**:
   - Set appropriate intervals
   - Use maxExecutions to prevent infinite loops
   - Cancel timers when no longer needed

3. **HTTP Requests**:
   - Always set timeouts
   - Implement retry logic for critical requests
   - Monitor request statistics

4. **Billing**:
   - Monitor Nucleus balance
   - Set up alerts for low balance
   - Deposit funds proactively

5. **Error Handling**:
   - Wrap operations in try-catch blocks
   - Log errors appropriately
   - Implement fallback mechanisms

---

## Additional Resources

- [Verisense Documentation](https://docs.verisense.network/)
- [A2A Integration Guide](./sensespace/a2a-integration.md)
- [Nucleus Service Examples](../examples/)
- [Timer Examples](../examples/verisense_timer_examples.rs)

---

## Support

For questions or issues:
- Check the [README](../README.md) for general setup
- Review [A2A Integration Guide](./sensespace/a2a-integration.md) for agent communication
- Contact: low.lucyy@gmail.com

