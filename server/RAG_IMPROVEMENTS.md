# RAG Retrieval Features - Detailed Improvements

This document describes the comprehensive improvements made to the Verisense AI Agent RAG retrieval system.

## Overview

The RAG (Retrieval-Augmented Generation) system has been significantly enhanced with advanced retrieval features, improved query processing, document chunking, re-ranking, hybrid search fusion, caching, and better context management.

## New Components

### 1. RAGQueryProcessor (`services/RAGQueryProcessor.ts`)

**Purpose**: Advanced query processing with expansion, intent classification, and entity extraction.

**Features**:
- **Query Expansion**: Generates multiple query variations using LLM and rule-based methods
- **Intent Classification**: Classifies queries as factual, comparative, recommendation, how-to, or general
- **Entity Extraction**: Extracts entities like colors, sizes, occasions, seasons, and brands
- **Keyword Extraction**: Identifies meaningful keywords from queries
- **Query Confidence Scoring**: Calculates confidence based on query quality

**Usage**:
```typescript
import { queryProcessor } from './services/RAGQueryProcessor.js';

const analysis = await queryProcessor.processQuery(
  "What should I wear to a wedding?",
  { useLLM: true, maxExpansions: 3 }
);
// Returns: QueryAnalysis with expanded queries, intent, entities, etc.
```

### 2. RAGDocumentChunker (`services/RAGDocumentChunker.ts`)

**Purpose**: Splits large documents into smaller chunks with overlap for better retrieval.

**Features**:
- **Smart Chunking**: Preserves paragraphs and sentences when possible
- **Overlap Support**: Configurable overlap between chunks to maintain context
- **Metadata Preservation**: Maintains parent document metadata in chunks
- **Configurable Options**: Chunk size, overlap, separators, and preservation strategies

**Usage**:
```typescript
import { documentChunker } from './services/RAGDocumentChunker.js';

const chunks = documentChunker.chunkDocument({
  id: 'doc1',
  title: 'Fashion Guide',
  content: 'Very long content...',
}, {
  chunkSize: 1000,
  chunkOverlap: 200,
  preserveParagraphs: true
});
```

### 3. RAGReranker (`services/RAGReranker.ts`)

**Purpose**: Re-ranks retrieved documents using multiple signals and optional LLM-based reranking.

**Features**:
- **Multi-Signal Reranking**: Combines keyword matching, recency, and metadata signals
- **LLM-Based Reranking**: Optional LLM-based relevance scoring
- **Boost Factors**: Keyword match, recency, metadata quality, and LLM relevance
- **Configurable Options**: Enable/disable different boost factors

**Usage**:
```typescript
import { reranker } from './services/RAGReranker.js';

const reranked = await reranker.rerank(query, results, {
  useLLM: true,
  useKeywordBoost: true,
  useRecencyBoost: true,
  topK: 10
});
```

### 4. RAGHybridSearch (`services/RAGHybridSearch.ts`)

**Purpose**: Advanced hybrid search with multiple fusion strategies.

**Features**:
- **Reciprocal Rank Fusion (RRF)**: Combines results based on reciprocal of rank
- **Weighted Fusion**: Combines results using weighted scores
- **Weighted RRF**: Combines RRF with weighted scores (default)
- **Reciprocal Fusion**: Uses reciprocal of scores
- **Source Tracking**: Tracks whether results come from vector, text, or both

**Usage**:
```typescript
import { hybridSearch } from './services/RAGHybridSearch.js';

const fused = hybridSearch.fuse(vectorResults, textResults, {
  strategy: 'weighted_rrf',
  vectorWeight: 0.7,
  textWeight: 0.3,
  topK: 10
});
```

### 5. RAGCache (`services/RAGCache.ts`)

**Purpose**: Query and result caching for improved performance.

**Features**:
- **Query Caching**: Caches query results with configurable TTL
- **Embedding Caching**: Caches embeddings to avoid redundant API calls
- **Result Caching**: Caches final RAG responses
- **Automatic Cleanup**: Periodically removes expired entries
- **Size Limits**: Configurable maximum cache sizes

**Usage**:
```typescript
import { queryCache, embeddingCache, resultCache } from './services/RAGCache.js';

// Cache is automatically used by RAGAgent
// Manual usage:
const key = queryCache.generateKey(query, options);
const cached = resultCache.get(key);
if (!cached) {
  // Compute result
  resultCache.set(key, result);
}
```

## Enhanced RAGAgent

The main `RAGAgent` class has been significantly enhanced with:

### New Query Options

```typescript
interface RAGQuery {
  query: string;
  user_id?: string;
  context?: Record<string, any>;
  topK?: number;
  includeSources?: boolean;
  // NEW OPTIONS:
  enableQueryExpansion?: boolean;    // Default: true
  enableReranking?: boolean;         // Default: true
  enableChunking?: boolean;          // Default: false (for indexing)
  fusionStrategy?: FusionStrategy;   // Default: 'weighted_rrf'
  rerankOptions?: RerankOptions;     // Custom reranking options
  useCache?: boolean;                // Default: true
}
```

### Enhanced Response

```typescript
interface RAGResponse {
  answer: string;
  sources: Doc[];
  confidence: number;
  query: string;
  queryAnalysis?: QueryAnalysis;     // NEW: Query analysis details
  metadata?: {
    retrievalTime?: number;
    generationTime?: number;
    totalTime?: number;
    tokensUsed?: number;
    cacheHit?: boolean;              // NEW: Cache hit indicator
    reranked?: boolean;               // NEW: Whether reranking was used
    chunksUsed?: number;              // NEW: Number of chunks in results
  };
}
```

### Improved Indexing

Documents can now be automatically chunked during indexing:

```typescript
await ragAgent.indexDocument({
  id: 'doc1',
  title: 'Long Document',
  content: 'Very long content...',
}, { enableChunking: true });
```

## Enhanced VectorStore

The `VectorStore` now supports advanced metadata filtering with operators:

```typescript
// Simple equality (backward compatible)
filter: { category: 'fashion' }

// Advanced operators
filter: {
  category: { operator: 'eq', value: 'fashion' },
  views: { operator: 'gte', value: 100 },
  tags: { operator: 'in', value: ['trending', 'popular'] },
  title: { operator: 'contains', value: 'summer' }
}
```

**Supported Operators**:
- `eq`: Equals
- `ne`: Not equals
- `gt`: Greater than
- `gte`: Greater than or equal
- `lt`: Less than
- `lte`: Less than or equal
- `in`: In array
- `nin`: Not in array
- `contains`: String contains
- `startsWith`: String starts with
- `endsWith`: String ends with

## Usage Examples

### Basic Query (with all enhancements)

```typescript
import { ragAgent } from './services/RAGAgent.js';

const response = await ragAgent.query({
  query: "What should I wear to a wedding?",
  user_id: "user123",
  topK: 5,
  enableQueryExpansion: true,
  enableReranking: true,
  fusionStrategy: 'weighted_rrf',
  useCache: true
});

console.log(response.answer);
console.log(response.queryAnalysis); // Query analysis details
console.log(response.metadata.cacheHit); // Whether result was cached
```

### Advanced Query with Custom Options

```typescript
const response = await ragAgent.query({
  query: "Compare denim jeans vs chinos",
  user_id: "user123",
  context: {
    occasion: { operator: 'in', value: ['casual', 'work'] },
    price_range: { operator: 'lte', value: 100 }
  },
  topK: 10,
  enableQueryExpansion: true,
  enableReranking: true,
  rerankOptions: {
    useLLM: true,
    useKeywordBoost: true,
    useRecencyBoost: true,
    useMetadataBoost: true
  },
  fusionStrategy: 'rrf'
});
```

### Indexing with Chunking

```typescript
// Index a large document with automatic chunking
await ragAgent.indexDocument({
  id: 'fashion-guide-2025',
  title: 'Complete Fashion Guide 2025',
  content: 'Very long comprehensive guide...',
  url: 'https://example.com/guide',
  metadata: {
    category: 'guide',
    year: 2025,
    verified: true
  }
}, { enableChunking: true });
```

## Performance Improvements

1. **Caching**: Reduces redundant API calls and computation
   - Query results cached for 30 minutes
   - Embeddings cached for 24 hours
   - Significant speedup for repeated queries

2. **Batch Processing**: Embeddings generated in parallel where possible

3. **Smart Context Management**: Better handling of context window limits
   - Prioritizes high-scoring documents
   - Truncates individual documents to fit context

4. **Efficient Hybrid Search**: Optimized fusion algorithms

## Configuration

### Environment Variables

```bash
OPENAI_API_KEY=your_key_here  # Required for real embeddings and LLM features
```

### Cache Configuration

Cache settings can be adjusted in `RAGCache.ts`:

```typescript
export const queryCache = new RAGCache<any>({ 
  ttl: 3600000,      // 1 hour
  maxSize: 500 
});

export const embeddingCache = new RAGCache<number[]>({ 
  ttl: 86400000,      // 24 hours
  maxSize: 10000 
});

export const resultCache = new RAGCache<any>({ 
  ttl: 1800000,       // 30 minutes
  maxSize: 1000 
});
```

## Architecture Flow

```
User Query
    ↓
Query Processing (expansion, intent, entities)
    ↓
Generate Embeddings (with caching)
    ↓
Vector Search + Text Search (parallel)
    ↓
Hybrid Fusion (RRF/Weighted)
    ↓
Re-ranking (optional, with multiple signals)
    ↓
Context Assembly (smart chunk selection)
    ↓
LLM Generation
    ↓
Response (with metadata)
```

## Best Practices

1. **Enable Chunking for Large Documents**: Documents > 2000 characters benefit from chunking
2. **Use Query Expansion**: Improves recall for complex queries
3. **Enable Reranking**: Significantly improves precision for top results
4. **Leverage Caching**: Reduces latency and API costs
5. **Choose Fusion Strategy**: 
   - `weighted_rrf`: Best overall (default)
   - `rrf`: Good for balanced results
   - `weighted`: When you know relative importance of vector vs text

## Future Enhancements

Potential future improvements:
- [ ] Multi-modal retrieval (images, etc.)
- [ ] Query learning from user feedback
- [ ] Advanced chunking strategies (semantic chunking)
- [ ] Integration with external vector databases
- [ ] Streaming responses
- [ ] Query suggestion/autocomplete
- [ ] A/B testing framework for retrieval strategies

## Migration Guide

### From Old RAGAgent

The enhanced RAGAgent is backward compatible. Existing code will work without changes, but you can opt-in to new features:

```typescript
// Old code (still works)
const response = await ragAgent.query({
  query: "What should I wear?",
  user_id: "user123"
});

// New code (with enhancements)
const response = await ragAgent.query({
  query: "What should I wear?",
  user_id: "user123",
  enableQueryExpansion: true,  // Opt-in to new features
  enableReranking: true
});
```

## Testing

Example test queries:

```bash
# Basic query
curl -X POST http://localhost:3000/api/rag-agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What should I wear to Thanksgiving?",
    "user_id": "test-user",
    "topK": 5
  }'

# Advanced query with options
curl -X POST http://localhost:3000/api/rag-agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Compare summer vs winter fashion",
    "user_id": "test-user",
    "enableQueryExpansion": true,
    "enableReranking": true,
    "fusionStrategy": "weighted_rrf"
  }'
```

## Summary

The RAG retrieval system has been significantly enhanced with:

✅ **Query Processing**: Expansion, intent classification, entity extraction  
✅ **Document Chunking**: Smart chunking with overlap for large documents  
✅ **Re-ranking**: Multi-signal reranking with optional LLM scoring  
✅ **Hybrid Search**: Multiple fusion strategies (RRF, weighted, etc.)  
✅ **Caching**: Query, embedding, and result caching  
✅ **Context Management**: Smart context window handling  
✅ **Advanced Filtering**: Rich metadata filtering with operators  
✅ **Multi-vector Retrieval**: Support for query expansion with multiple embeddings  

All features are backward compatible and can be enabled/disabled as needed.


