# MCP Tools Quick Reference

Quick reference guide for using Verisense Nucleus MCP tools with AI agents.

## Base URL

```
http://localhost:3001/api/mcp
```

## Tool Discovery

```bash
# List all tools
GET /api/mcp/tools

# Get specific tool definition
GET /api/mcp/tools/kv_storage_set
```

## Common Use Cases

### 1. Store User Preferences

```bash
POST /api/mcp/call
Content-Type: application/json

{
  "tool": "user_preferences_store",
  "arguments": {
    "userId": "user123",
    "preferences": {
      "style": "kpop",
      "size": "M",
      "colors": ["black", "white"],
      "makeup_pref": "natural"
    }
  }
}
```

### 2. Get User Preferences

```bash
POST /api/mcp/call
Content-Type: application/json

{
  "tool": "user_preferences_get",
  "arguments": {
    "userId": "user123"
  }
}
```

### 3. Index a Recommendation

```bash
POST /api/mcp/call
Content-Type: application/json

{
  "tool": "recommendation_index",
  "arguments": {
    "userId": "user123",
    "productId": "prod456",
    "score": 0.95,
    "metadata": {
      "category": "fashion",
      "style": "kpop"
    }
  }
}
```

### 4. Query Recommendations

```bash
POST /api/mcp/call
Content-Type: application/json

{
  "tool": "recommendation_query",
  "arguments": {
    "userId": "user123",
    "limit": 10,
    "minScore": 0.8
  }
}
```

### 5. Make HTTP Request

```bash
POST /api/mcp/call
Content-Type: application/json

{
  "tool": "http_request",
  "arguments": {
    "url": "https://api.example.com/products",
    "method": "GET",
    "timeout": 5000,
    "retry": {
      "maxRetries": 3,
      "retryDelay": 1000
    }
  }
}
```

### 6. Create a Timer

```bash
POST /api/mcp/call
Content-Type: application/json

{
  "tool": "timer_create",
  "arguments": {
    "id": "hourly_sync",
    "name": "Hourly Data Sync",
    "interval": 3600000,
    "repeat": true,
    "action": "sync_data"
  }
}
```

### 7. Check Nucleus Status

```bash
POST /api/mcp/call
Content-Type: application/json

{
  "tool": "nucleus_status",
  "arguments": {}
}
```

### 8. Store Data with TTL

```bash
POST /api/mcp/call
Content-Type: application/json

{
  "tool": "kv_storage_set",
  "arguments": {
    "key": "cache:products:123",
    "value": { "name": "Product", "price": 99.99 },
    "ttl": 3600
  }
}
```

## Tool Categories

### KV Storage
- `kv_storage_set` - Store key-value pair
- `kv_storage_get` - Retrieve value
- `kv_storage_delete` - Delete key
- `kv_storage_list` - List keys
- `kv_storage_has` - Check existence

### Timers
- `timer_create` - Create timer
- `timer_cancel` - Cancel timer
- `timer_list` - List timers
- `timer_status` - Get timer status

### HTTP Requests
- `http_request` - Make HTTP request

### Indexer
- `indexer_index` - Index document
- `indexer_query` - Query index

### Nucleus Management
- `nucleus_status` - Get status
- `nucleus_deposit` - Deposit funds
- `nucleus_health` - Health check

### Convenience Tools
- `user_preferences_store` - Store preferences
- `user_preferences_get` - Get preferences
- `recommendation_index` - Index recommendation
- `recommendation_query` - Query recommendations

## Response Format

Success:
```json
{
  "success": true,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"success\": true, \"key\": \"user:preferences:123\"}"
      }
    ],
    "isError": false
  }
}
```

Error:
```json
{
  "success": false,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"error\": \"Tool not found\"}"
      }
    ],
    "isError": true
  }
}
```

## Example: Complete AI Agent Workflow

```typescript
// 1. Get user preferences
const prefs = await callMCPTool('user_preferences_get', { userId: 'user123' });

// 2. Query recommendations
const recs = await callMCPTool('recommendation_query', {
  userId: 'user123',
  limit: 5
});

// 3. Make external API call
const products = await callMCPTool('http_request', {
  url: 'https://api.example.com/products',
  method: 'GET'
});

// 4. Store updated preferences
await callMCPTool('user_preferences_store', {
  userId: 'user123',
  preferences: { ...prefs, lastQuery: Date.now() }
});

// 5. Index new recommendation
await callMCPTool('recommendation_index', {
  userId: 'user123',
  productId: 'prod789',
  score: 0.92
});
```

## Helper Function

```typescript
async function callMCPTool(tool: string, args: Record<string, any>) {
  const response = await fetch('http://localhost:3001/api/mcp/call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, arguments: args })
  });
  
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.result.content[0].text);
  }
  
  return JSON.parse(data.result.content[0].text);
}
```


