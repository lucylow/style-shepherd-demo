# Verisense Nucleus Quick Start Guide

This guide helps you quickly get started with the Verisense Nucleus improvements.

## Installation

The Verisense services are already integrated. No additional installation is required.

## Basic Usage

### 1. Check Nucleus Status

```bash
curl http://localhost:3001/api/verisense-nucleus/status
```

### 2. Store User Preferences

```bash
curl -X POST http://localhost:3001/api/verisense-nucleus/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "preferences": {
      "size": "M",
      "style": "casual",
      "colors": ["blue", "black"]
    }
  }'
```

### 3. Retrieve User Preferences

```bash
curl http://localhost:3001/api/verisense-nucleus/preferences/user123
```

### 4. Index a Recommendation

```bash
curl -X POST http://localhost:3001/api/verisense-nucleus/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "productId": "prod-456",
    "score": 0.95,
    "metadata": {
      "reason": "style_match",
      "confidence": 0.92
    }
  }'
```

### 5. Get Recommendations

```bash
curl "http://localhost:3001/api/verisense-nucleus/recommendations/user123?limit=10"
```

### 6. Deposit Funds

```bash
curl -X POST http://localhost:3001/api/verisense-nucleus/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 50
  }'
```

## Programmatic Usage

### TypeScript/JavaScript

```typescript
import { StyleShepherdNucleus } from './services/verisense/StyleShepherdNucleus.js';
import type { NucleusConfig } from './services/verisense/index.js';

// Initialize Nucleus
const config: NucleusConfig = {
  id: 'my-nucleus',
  name: 'My Application',
  version: '1.0.0',
  publisherAddress: '0x...',
  initialBalance: 100,
};

const nucleus = new StyleShepherdNucleus(config);

// Store preferences
await nucleus.storeUserPreferences('user123', {
  size: 'M',
  style: 'casual',
});

// Get preferences
const preferences = await nucleus.getUserPreferences('user123');

// Index recommendation
await nucleus.indexRecommendation('user123', 'prod-456', 0.95);

// Get recommendations
const recommendations = await nucleus.getRecommendations('user123', 10);

// Check status
const status = nucleus.getStatus();
console.log('Nucleus balance:', status.nucleus.balance);
console.log('Can operate:', nucleus.canOperate());
```

## Key Concepts

### Reverse Gas Mode
- Publisher pays for operations
- Users interact for free
- Charges based on storage, writes, and function calls

### KV Storage
- Fast key-value storage
- TTL support
- Isolated per Nucleus

### Timers
- Scheduled operations
- One-time or repeating
- Automatic cleanup

### HTTP Requests
- Proactive network requests
- Retry logic
- Timeout handling

### Indexer
- Off-chain indexing
- Complex queries
- Fast retrieval

## Next Steps

1. Read [VERISENSE_IMPROVEMENTS.md](./VERISENSE_IMPROVEMENTS.md) for detailed documentation
2. Explore the service implementations in `server/src/services/verisense/`
3. Check the integration example in `StyleShepherdNucleus.ts`
4. Review API routes in `server/src/routes/verisense-nucleus.ts`

## Troubleshooting

### Nucleus Balance Too Low
If you see "Nucleus balance below threshold", deposit funds:
```bash
curl -X POST http://localhost:3001/api/verisense-nucleus/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

### Check Health
```bash
curl http://localhost:3001/api/verisense-nucleus/health
```

## Resources

- [Verisense Documentation](https://docs.verisense.network)
- [Full Improvements Documentation](./VERISENSE_IMPROVEMENTS.md)


