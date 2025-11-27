# RAG Agent Documentation

A comprehensive Retrieval-Augmented Generation (RAG) agent implementation for the Style Shepherd platform.

## Overview

The RAG Agent combines vector embeddings with full-text search to provide accurate, context-aware responses to user queries. It uses OpenAI embeddings (with fallback to mock embeddings) and integrates with the existing LLM service for response generation.

## Features

- **Vector Embeddings**: Uses OpenAI `text-embedding-3-small` for semantic search
- **Hybrid Search**: Combines vector similarity search with full-text keyword matching
- **Document Indexing**: Index documents with metadata for efficient retrieval
- **Context-Aware**: Supports user context and filtering
- **Source Attribution**: Returns sources with each answer for transparency
- **Persistent Storage**: Automatically saves and loads index from disk

## Architecture

### Components

1. **RAGAgent** (`services/RAGAgent.ts`)
   - Main agent interface
   - Orchestrates retrieval and generation
   - Manages document indexing

2. **VectorStore** (`services/VectorStore.ts`)
   - In-memory vector store with cosine similarity search
   - Persistent storage to disk
   - Filter support for metadata

3. **DocumentIndexer** (`services/DocumentIndexer.ts`)
   - Full-text search index
   - Keyword-based matching
   - Complements vector search

## API Endpoints

### Query the RAG Agent

```http
POST /api/rag-agent/query
Content-Type: application/json

{
  "query": "What should I wear to Thanksgiving dinner?",
  "user_id": "user123",
  "context": { "occasion": "formal" },
  "topK": 5,
  "includeSources": true
}
```

**Response:**
```json
{
  "answer": "For Thanksgiving dinner with family, choose a warm knit sweater...",
  "sources": [
    {
      "source_id": "doc:thanksgiving-styling",
      "title": "Thanksgiving Dinner Styling Tips",
      "url": "https://example.com/thanksgiving-styling",
      "excerpt": "For Thanksgiving dinner with family...",
      "score": 0.92
    }
  ],
  "confidence": 0.89,
  "query": "What should I wear to Thanksgiving dinner?",
  "metadata": {
    "retrievalTime": 45,
    "generationTime": 320,
    "totalTime": 365
  }
}
```

### Index a Document

```http
POST /api/rag-agent/index
Content-Type: application/json

{
  "id": "doc:unique-id",
  "title": "Document Title",
  "content": "Full document content here...",
  "url": "https://example.com/doc",
  "metadata": {
    "category": "styling",
    "season": "fall"
  }
}
```

### Index Multiple Documents

```http
POST /api/rag-agent/index/batch
Content-Type: application/json

{
  "documents": [
    {
      "id": "doc:1",
      "title": "Title 1",
      "content": "Content 1..."
    },
    {
      "id": "doc:2",
      "title": "Title 2",
      "content": "Content 2..."
    }
  ]
}
```

### Get Index Statistics

```http
GET /api/rag-agent/stats
```

**Response:**
```json
{
  "documentCount": 25,
  "vectorCount": 25
}
```

### Clear Index

```http
DELETE /api/rag-agent/index
```

## Usage Examples

### Initialize with Sample Documents

```typescript
import { initializeRAGWithSamples } from './services/rag-sample-documents.js';

// Initialize with sample documents
await initializeRAGWithSamples();
```

### Query Programmatically

```typescript
import { ragAgent } from './services/RAGAgent.js';

const response = await ragAgent.query({
  query: "What colors are trending for fall 2025?",
  user_id: "user123",
  topK: 3,
});

console.log(response.answer);
console.log(response.sources);
```

### Index Custom Documents

```typescript
import { ragAgent } from './services/RAGAgent.js';

await ragAgent.indexDocument({
  id: 'doc:custom-1',
  title: 'Custom Document',
  content: 'Your document content here...',
  url: 'https://example.com/custom',
  metadata: {
    category: 'custom',
    tags: ['important'],
  },
});
```

## Configuration

### Environment Variables

- `OPENAI_API_KEY`: Required for real embeddings (optional, falls back to mock embeddings)

### Storage

- Vector store: `logs/vector-store.json`
- Document index: `logs/document-index.json`

Both are automatically created and managed by the services.

## Integration with Existing Services

The RAG Agent integrates with:

- **LLMService**: Uses existing LLM service for response generation
- **Memory Service**: Can be extended to use conversation memory
- **Audit Trail**: Responses can be logged via audit trail service

## Performance Considerations

- **Embedding Generation**: ~50-200ms per document (with OpenAI API)
- **Vector Search**: ~10-50ms for 1000 documents (in-memory)
- **LLM Generation**: ~200-500ms (depends on LLM service)

For production use with large document sets (>10,000), consider:
- Using a dedicated vector database (Pinecone, Weaviate, Qdrant)
- Batch processing for embeddings
- Caching frequently accessed documents

## Limitations

1. **In-Memory Storage**: Current implementation uses in-memory storage. For production, use a proper vector database.
2. **Mock Embeddings**: Without OpenAI API key, uses simple hash-based mock embeddings (not production-ready).
3. **Simple Full-Text Search**: Current full-text search is keyword-based. For production, consider Elasticsearch or similar.

## Future Enhancements

- [ ] Support for chunking large documents
- [ ] Integration with external vector databases
- [ ] Advanced filtering and faceted search
- [ ] Query expansion and refinement
- [ ] Multi-modal support (images, etc.)
- [ ] Streaming responses
- [ ] Query caching

## Testing

Example test query:

```bash
curl -X POST http://localhost:3000/api/rag-agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What should I wear to Thanksgiving dinner?",
    "user_id": "test-user",
    "topK": 3
  }'
```

## License

Part of the Style Shepherd platform.

