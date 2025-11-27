/**
 * RAG Agent Service
 * Enhanced Retrieval-Augmented Generation Agent with advanced features
 */

import OpenAI from 'openai';
import { llmService } from './LLMService.js';
import { VectorStore } from './VectorStore.js';
import { DocumentIndexer } from './DocumentIndexer.js';
import { queryProcessor, type QueryAnalysis } from './RAGQueryProcessor.js';
import { documentChunker, type DocumentChunk } from './RAGDocumentChunker.js';
import { reranker, type RerankOptions } from './RAGReranker.js';
import { hybridSearch, type FusionStrategy } from './RAGHybridSearch.js';
import { queryCache, embeddingCache, resultCache } from './RAGCache.js';
import type { Doc } from './retrieval.js';

export interface RAGQuery {
  query: string;
  user_id?: string;
  context?: Record<string, any>;
  topK?: number;
  includeSources?: boolean;
  // Enhanced options
  enableQueryExpansion?: boolean;
  enableReranking?: boolean;
  enableChunking?: boolean;
  fusionStrategy?: FusionStrategy;
  rerankOptions?: RerankOptions;
  useCache?: boolean;
}

export interface RAGResponse {
  answer: string;
  sources: Doc[];
  confidence: number;
  query: string;
  queryAnalysis?: QueryAnalysis;
  metadata?: {
    retrievalTime?: number;
    generationTime?: number;
    totalTime?: number;
    tokensUsed?: number;
    cacheHit?: boolean;
    reranked?: boolean;
    chunksUsed?: number;
  };
}

export class RAGAgent {
  private openai: OpenAI | null = null;
  private vectorStore: VectorStore;
  private documentIndexer: DocumentIndexer;
  private readonly DEFAULT_TOP_K = 5;
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private readonly MAX_CONTEXT_LENGTH = 4000;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
      console.log('✅ RAG Agent initialized with OpenAI embeddings');
    } else {
      console.warn('⚠️ OPENAI_API_KEY not found, RAG Agent will use mock embeddings');
    }

    this.vectorStore = new VectorStore();
    this.documentIndexer = new DocumentIndexer();
  }

  /**
   * Generate embeddings for text using OpenAI (with caching)
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Check cache first
    const cacheKey = embeddingCache.generateKey(text);
    const cached = embeddingCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    if (!this.openai) {
      // Fallback: simple hash-based mock embedding
      const embedding = this.mockEmbedding(text);
      embeddingCache.set(cacheKey, embedding);
      return embedding;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text,
      });

      const embedding = response.data[0].embedding;
      embeddingCache.set(cacheKey, embedding);
      return embedding;
    } catch (error) {
      console.warn('Embedding generation failed, using mock:', error);
      const embedding = this.mockEmbedding(text);
      embeddingCache.set(cacheKey, embedding);
      return embedding;
    }
  }

  /**
   * Simple mock embedding for demo purposes
   */
  private mockEmbedding(text: string): number[] {
    // Create a simple hash-based embedding (not production-ready)
    const hash = text.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    // Generate a 384-dimensional vector (matching text-embedding-3-small)
    const embedding = new Array(384).fill(0).map((_, i) => {
      return Math.sin((hash + i) * 0.1) * 0.1;
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => val / magnitude);
  }

  /**
   * Index a document for retrieval (with optional chunking)
   */
  async indexDocument(
    document: {
      id: string;
      title?: string;
      content: string;
      url?: string;
      metadata?: Record<string, any>;
    },
    options: { enableChunking?: boolean } = {}
  ): Promise<void> {
    const startTime = Date.now();
    const { enableChunking = false } = options;

    // Chunk document if enabled and content is large
    if (enableChunking && document.content.length > 2000) {
      const chunks = documentChunker.chunkDocument(document);
      console.log(`📑 Document ${document.id} split into ${chunks.length} chunks`);

      // Index each chunk
      for (const chunk of chunks) {
        const textToEmbed = `${chunk.metadata.parentTitle || ''} ${chunk.content}`.trim();
        const embedding = await this.generateEmbedding(textToEmbed);

        await this.vectorStore.add({
          id: chunk.id,
          embedding,
          metadata: {
            ...chunk.metadata,
            content: chunk.content,
            isChunk: true,
            parentId: document.id,
          },
        });

        await this.documentIndexer.index({
          id: chunk.id,
          title: chunk.metadata.parentTitle,
          content: chunk.content,
          url: chunk.metadata.parentUrl,
          metadata: chunk.metadata,
        });
      }
    } else {
      // Index as single document
      const textToEmbed = `${document.title || ''} ${document.content}`.trim();
      const embedding = await this.generateEmbedding(textToEmbed);

      await this.vectorStore.add({
        id: document.id,
        embedding,
        metadata: {
          title: document.title,
          content: document.content,
          url: document.url,
          ...document.metadata,
        },
      });

      await this.documentIndexer.index(document);
    }

    const duration = Date.now() - startTime;
    console.log(`📄 Indexed document ${document.id} in ${duration}ms`);
  }

  /**
   * Index multiple documents in batch
   */
  async indexDocuments(documents: Array<{
    id: string;
    title?: string;
    content: string;
    url?: string;
    metadata?: Record<string, any>;
  }>): Promise<void> {
    console.log(`📚 Indexing ${documents.length} documents...`);
    const startTime = Date.now();

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      await Promise.all(batch.map(doc => this.indexDocument(doc)));
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Indexed ${documents.length} documents in ${duration}ms`);
  }

  /**
   * Query the RAG agent (enhanced with all new features)
   */
  async query(ragQuery: RAGQuery): Promise<RAGResponse> {
    const totalStartTime = Date.now();
    const {
      query,
      user_id,
      context,
      topK = this.DEFAULT_TOP_K,
      includeSources = true,
      enableQueryExpansion = true,
      enableReranking = true,
      fusionStrategy = 'weighted_rrf',
      rerankOptions = {},
      useCache = true,
    } = ragQuery;

    try {
      // Check cache first
      let cacheHit = false;
      if (useCache) {
        const cacheKey = queryCache.generateKey(query, { topK, context });
        const cached = resultCache.get(cacheKey);
        if (cached) {
          cacheHit = true;
          return {
            ...cached,
            metadata: {
              ...cached.metadata,
              cacheHit: true,
            },
          };
        }
      }

      const retrievalStartTime = Date.now();

      // 1. Process and expand query
      let queryAnalysis: QueryAnalysis | undefined;
      let queriesToSearch = [query];

      if (enableQueryExpansion) {
        queryAnalysis = await queryProcessor.processQuery(query);
        queriesToSearch = [
          queryAnalysis.originalQuery,
          ...queryAnalysis.expandedQueries.slice(0, 2), // Use top 2 expansions
        ];
        console.log(`🔍 Query expanded: ${queriesToSearch.length} variations`);
      }

      // 2. Generate embeddings for all query variations
      const queryEmbeddings = await Promise.all(
        queriesToSearch.map(q => this.generateEmbedding(q))
      );
      const primaryQueryEmbedding = queryEmbeddings[0];

      // 3. Retrieve from vector store (using primary query)
      const vectorResults = await this.vectorStore.search(primaryQueryEmbedding, {
        topK: topK * 2, // Retrieve more for reranking
        filter: context,
      });

      // 4. Retrieve from text index
      const textResults = await this.documentIndexer.search(query, {
        topK: topK * 2,
      });

      // 5. Hybrid search fusion
      const hybridResults = hybridSearch.fuse(vectorResults, textResults, {
        strategy: fusionStrategy,
        topK: enableReranking ? topK * 2 : topK, // More candidates for reranking
      });

      // 6. Re-rank results if enabled
      let finalResults = hybridResults;
      let reranked = false;
      if (enableReranking && hybridResults.length > 0) {
        const rerankedResults = await reranker.rerank(query, hybridResults, {
          ...rerankOptions,
          topK,
        });
        // Create a map of original results by id to preserve source property
        const originalResultsMap = new Map(hybridResults.map(r => [r.id, r]));
        finalResults = rerankedResults.map(r => ({
          id: r.id,
          score: r.rerankScore,
          metadata: r.metadata,
          source: originalResultsMap.get(r.id)?.source || 'hybrid',
        }));
        reranked = true;
        console.log(`🎯 Re-ranked ${finalResults.length} results`);
      }

      const retrievalTime = Date.now() - retrievalStartTime;

      // 7. Generate response using LLM
      const generationStartTime = Date.now();
      const answer = await this.generateAnswer(
        query,
        finalResults,
        user_id,
        context,
        queryAnalysis
      );
      const generationTime = Date.now() - generationStartTime;

      // 8. Format sources
      const sources: Doc[] = includeSources
        ? finalResults.map((doc, idx) => ({
            source_id: doc.id,
            title: doc.metadata?.title || doc.metadata?.parentTitle,
            url: doc.metadata?.url || doc.metadata?.parentUrl,
            excerpt: this.extractExcerpt(
              doc.metadata?.content || '',
              query,
              200
            ),
            score: doc.score,
          }))
        : [];

      const totalTime = Date.now() - totalStartTime;

      const response: RAGResponse = {
        answer,
        sources,
        confidence: this.calculateConfidence(finalResults),
        query,
        queryAnalysis,
        metadata: {
          retrievalTime,
          generationTime,
          totalTime,
          cacheHit,
          reranked,
          chunksUsed: finalResults.filter(r => r.metadata?.isChunk).length,
        },
      };

      // Cache result
      if (useCache && !cacheHit) {
        const cacheKey = queryCache.generateKey(query, { topK, context });
        resultCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      console.error('RAG query error:', error);
      throw new Error(
        `RAG query failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Combine vector search and text search results (deprecated - use hybridSearch instead)
   * @deprecated Use hybridSearch.fuse() instead
   */
  private combineSearchResults(
    vectorResults: Array<{ id: string; score: number; metadata: any }>,
    textResults: Array<{ id: string; score: number; metadata: any }>,
    topK: number
  ): Array<{ id: string; score: number; metadata: any }> {
    // Use hybrid search for consistency
    const results = hybridSearch.fuse(vectorResults, textResults, {
      strategy: 'weighted',
      topK,
    });
    return results.map(r => ({ id: r.id, score: r.score, metadata: r.metadata }));
  }

  /**
   * Extract relevant excerpt from content
   */
  private extractExcerpt(content: string, query: string, maxLength: number = 200): string {
    if (!content) return '';

    const queryWords = query.toLowerCase().split(/\s+/);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

    // Find sentence with most query word matches
    let bestSentence = sentences[0] || content;
    let maxMatches = 0;

    for (const sentence of sentences) {
      const lowerSentence = sentence.toLowerCase();
      const matches = queryWords.filter(word => lowerSentence.includes(word)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    }

    // Return excerpt around best sentence
    const index = content.indexOf(bestSentence);
    const start = Math.max(0, index - 50);
    const end = Math.min(content.length, index + bestSentence.length + 50);
    let excerpt = content.slice(start, end).trim();

    if (excerpt.length > maxLength) {
      excerpt = excerpt.slice(0, maxLength) + '...';
    }

    return excerpt;
  }

  /**
   * Generate answer using LLM with retrieved context (enhanced)
   */
  private async generateAnswer(
    query: string,
    docs: Array<{ id: string; score: number; metadata: any }>,
    user_id?: string,
    context?: Record<string, any>,
    queryAnalysis?: QueryAnalysis
  ): Promise<string> {
    // Build context from retrieved documents (with better chunk management)
    const contextParts: string[] = [];

    if (context) {
      contextParts.push(`User context: ${JSON.stringify(context)}`);
    }

    // Add query analysis if available
    if (queryAnalysis) {
      contextParts.push(
        `Query intent: ${queryAnalysis.intent} (${queryAnalysis.queryType})`
      );
      if (Object.keys(queryAnalysis.entities).length > 0) {
        contextParts.push(
          `Extracted entities: ${JSON.stringify(queryAnalysis.entities)}`
        );
      }
    }

    // Manage context window - prioritize high-scoring documents
    const sortedDocs = [...docs].sort((a, b) => b.score - a.score);
    let contextLength = 0;
    const maxContextLength = this.MAX_CONTEXT_LENGTH - 500; // Reserve space for prompt

    contextParts.push('Retrieved documents:');
    for (const [idx, doc] of sortedDocs.entries()) {
      const content = doc.metadata?.content || '';
      const title = doc.metadata?.title || doc.metadata?.parentTitle || doc.id;
      const docText = `[${idx + 1}] ${title} (relevance: ${doc.score.toFixed(2)})\n${content}`;
      
      // Check if adding this doc would exceed context limit
      if (contextLength + docText.length > maxContextLength && idx > 0) {
        break; // Stop adding documents if we'd exceed limit
      }
      
      contextParts.push(docText.slice(0, 500)); // Limit individual doc length
      contextLength += docText.length;
    }

    const contextText = contextParts.join('\n\n');

    // Build prompt
    const prompt = `You are a helpful AI assistant with access to relevant documents. Answer the user's question based on the retrieved context below. If the context doesn't contain enough information, say so honestly.

${contextText}

User question: ${query}

Provide a clear, concise answer. If you reference information from the documents, mention which document number(s) you're citing (e.g., [1], [2]).`;

    // Use LLM service if available
    if (llmService.isAvailable()) {
      try {
        const intentAnalysis = {
          intent: 'answer_question',
          entities: {},
          confidence: 0.9,
          sentiment: 'neutral' as const,
        };

        const response = await llmService.generateResponse(
          prompt,
          intentAnalysis,
          [],
          undefined,
          undefined,
          { sessionId: user_id, agentType: 'rag' }
        );

        return response;
      } catch (error) {
        console.warn('LLM service failed, using fallback:', error);
      }
    }

    // Fallback: simple template-based response
    if (docs.length > 0) {
      const topDoc = docs[0];
      const excerpt = this.extractExcerpt(topDoc.metadata?.content || '', query, 150);
      return `Based on the retrieved information, ${excerpt} (Source: ${topDoc.metadata?.title || topDoc.id})`;
    }

    return "I couldn't find relevant information to answer your question. Please try rephrasing or providing more context.";
  }

  /**
   * Calculate confidence score based on retrieved documents
   */
  private calculateConfidence(docs: Array<{ score: number }>): number {
    if (docs.length === 0) return 0;

    // Average score of top documents
    const avgScore = docs.reduce((sum, doc) => sum + doc.score, 0) / docs.length;
    
    // Boost confidence if we have multiple high-quality results
    const diversityBonus = Math.min(docs.length / 5, 0.2);
    
    return Math.min(avgScore + diversityBonus, 1.0);
  }

  /**
   * Clear all indexed documents
   */
  async clearIndex(): Promise<void> {
    await this.vectorStore.clear();
    await this.documentIndexer.clear();
    console.log('🗑️ Cleared RAG index');
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<{ documentCount: number; vectorCount: number }> {
    return {
      documentCount: await this.documentIndexer.getCount(),
      vectorCount: await this.vectorStore.getCount(),
    };
  }
}

// Export singleton instance
export const ragAgent = new RAGAgent();

