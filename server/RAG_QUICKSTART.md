# RAG Agent Quick Start Guide

Get your RAG agent up and running in minutes!

## Prerequisites

- Node.js and npm installed
- Server running (see `server/README.md`)
- Optional: `OPENAI_API_KEY` environment variable for real embeddings

## Quick Start

### 1. Initialize with Sample Documents

```bash
curl -X POST http://localhost:3000/api/rag-agent/init-samples
```

This will index 8 sample documents about fashion, styling, and sizing.

### 2. Query the Agent

```bash
curl -X POST http://localhost:3000/api/rag-agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What should I wear to Thanksgiving dinner?",
    "topK": 3
  }'
```

### 3. Check Index Statistics

```bash
curl http://localhost:3000/api/rag-agent/stats
```

## Example Queries

### Fashion Trends
```json
{
  "query": "What colors are trending for fall 2025?",
  "topK": 3
}
```

### Sizing Questions
```json
{
  "query": "How should I size DenimCo jeans?",
  "topK": 2
}
```

### Styling Advice
```json
{
  "query": "What should I wear to a formal event?",
  "user_id": "user123",
  "context": { "occasion": "formal" },
  "topK": 3
}
```

## Index Your Own Documents

### Single Document
```bash
curl -X POST http://localhost:3000/api/rag-agent/index \
  -H "Content-Type: application/json" \
  -d '{
    "id": "doc:my-doc-1",
    "title": "My Document",
    "content": "Your document content here...",
    "url": "https://example.com/doc",
    "metadata": {
      "category": "custom"
    }
  }'
```

### Multiple Documents
```bash
curl -X POST http://localhost:3000/api/rag-agent/index/batch \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {
        "id": "doc:1",
        "title": "Document 1",
        "content": "Content 1..."
      },
      {
        "id": "doc:2",
        "title": "Document 2",
        "content": "Content 2..."
      }
    ]
  }'
```

## Response Format

Every query returns:

```json
{
  "answer": "The generated answer...",
  "sources": [
    {
      "source_id": "doc:trend-2025-1",
      "title": "2025 Fall Color Trends",
      "url": "https://example.com/2025-fall-colors",
      "excerpt": "Relevant excerpt...",
      "score": 0.92
    }
  ],
  "confidence": 0.89,
  "query": "Your query",
  "metadata": {
    "retrievalTime": 45,
    "generationTime": 320,
    "totalTime": 365
  }
}
```

## Programmatic Usage

### TypeScript/JavaScript

```typescript
import { ragAgent } from './services/RAGAgent.js';

// Query
const response = await ragAgent.query({
  query: "What colors are trending?",
  topK: 3,
});

console.log(response.answer);
console.log(response.sources);

// Index document
await ragAgent.indexDocument({
  id: 'doc:custom',
  title: 'Custom Doc',
  content: 'Content...',
});
```

## Next Steps

- Read the full [RAG_AGENT_README.md](./RAG_AGENT_README.md) for detailed documentation
- Check out [examples/rag-agent-example.ts](./src/examples/rag-agent-example.ts) for code examples
- Customize the agent for your specific use case

## Troubleshooting

### No documents found
- Make sure you've initialized with sample documents or indexed your own
- Check index statistics: `GET /api/rag-agent/stats`

### Low confidence scores
- Index more relevant documents
- Try rephrasing your query
- Increase `topK` to retrieve more documents

### Slow responses
- Reduce `topK` parameter
- Consider using a dedicated vector database for large document sets
- Check if OpenAI API is responding (if using real embeddings)

## Support

For issues or questions, check:
- [RAG_AGENT_README.md](./RAG_AGENT_README.md) - Full documentation
- Server logs for error messages
- API response error details

