/**
 * RAG Agent Service
 * Retrieval-Augmented Generation Agent with vector embeddings
 */

import OpenAI from 'openai';
import { llmService } from './LLMService.js';
import { VectorStore } from './VectorStore.js';
import { DocumentIndexer } from './DocumentIndexer.js';
import type { Doc } from './retrieval.js';

export interface RAGQuery {
  query: string;
  user_id?: string;
  context?: Record<string, any>;
  topK?: number;
  includeSources?: boolean;
}

export interface RAGResponse {
  answer: string;
  sources: Doc[];
  confidence: number;
  query: string;
  metadata?: {
    retrievalTime?: number;
    generationTime?: number;
    totalTime?: number;
    tokensUsed?: number;
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
   * Generate embeddings for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      // Fallback: simple hash-based mock embedding
      return this.mockEmbedding(text);
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error) {
      console.warn('Embedding generation failed, using mock:', error);
      return this.mockEmbedding(text);
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
   * Index a document for retrieval
   */
  async indexDocument(
    document: {
      id: string;
      title?: string;
      content: string;
      url?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const startTime = Date.now();
    
    // Generate embedding for the document
    const textToEmbed = `${document.title || ''} ${document.content}`.trim();
    const embedding = await this.generateEmbedding(textToEmbed);

    // Store in vector store
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

    // Also index via document indexer for full-text search fallback
    await this.documentIndexer.index(document);

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
   * Query the RAG agent
   */
  async query(ragQuery: RAGQuery): Promise<RAGResponse> {
    const totalStartTime = Date.now();
    const { query, user_id, context, topK = this.DEFAULT_TOP_K, includeSources = true } = ragQuery;

    try {
      // 1. Generate query embedding
      const retrievalStartTime = Date.now();
      const queryEmbedding = await this.generateEmbedding(query);

      // 2. Retrieve relevant documents
      const searchResults = await this.vectorStore.search(queryEmbedding, {
        topK,
        filter: context,
      });

      // 3. Also try full-text search as fallback
      const textSearchResults = await this.documentIndexer.search(query, { topK });

      // 4. Combine and deduplicate results
      const combinedDocs = this.combineSearchResults(searchResults, textSearchResults, topK);

      const retrievalTime = Date.now() - retrievalStartTime;

      // 5. Generate response using LLM
      const generationStartTime = Date.now();
      const answer = await this.generateAnswer(query, combinedDocs, user_id, context);
      const generationTime = Date.now() - generationStartTime;

      // 6. Format sources
      const sources: Doc[] = includeSources
        ? combinedDocs.map((doc, idx) => ({
            source_id: doc.id,
            title: doc.metadata?.title,
            url: doc.metadata?.url,
            excerpt: this.extractExcerpt(doc.metadata?.content || '', query),
            score: doc.score,
          }))
        : [];

      const totalTime = Date.now() - totalStartTime;

      return {
        answer,
        sources,
        confidence: this.calculateConfidence(combinedDocs),
        query,
        metadata: {
          retrievalTime,
          generationTime,
          totalTime,
        },
      };
    } catch (error) {
      console.error('RAG query error:', error);
      throw new Error(`RAG query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Combine vector search and text search results
   */
  private combineSearchResults(
    vectorResults: Array<{ id: string; score: number; metadata: any }>,
    textResults: Array<{ id: string; score: number; metadata: any }>,
    topK: number
  ): Array<{ id: string; score: number; metadata: any }> {
    const combined = new Map<string, { id: string; score: number; metadata: any }>();

    // Add vector search results (weighted higher)
    vectorResults.forEach(result => {
      combined.set(result.id, {
        ...result,
        score: result.score * 0.7, // Weight vector search
      });
    });

    // Add text search results (merge scores if already exists)
    textResults.forEach(result => {
      const existing = combined.get(result.id);
      if (existing) {
        existing.score = existing.score + result.score * 0.3;
      } else {
        combined.set(result.id, {
          ...result,
          score: result.score * 0.3,
        });
      }
    });

    // Sort by score and return top K
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
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
   * Generate answer using LLM with retrieved context
   */
  private async generateAnswer(
    query: string,
    docs: Array<{ id: string; score: number; metadata: any }>,
    user_id?: string,
    context?: Record<string, any>
  ): Promise<string> {
    // Build context from retrieved documents
    const contextParts: string[] = [];

    if (context) {
      contextParts.push(`User context: ${JSON.stringify(context)}`);
    }

    contextParts.push('Retrieved documents:');
    docs.forEach((doc, idx) => {
      const content = doc.metadata?.content || '';
      const title = doc.metadata?.title || doc.id;
      contextParts.push(
        `[${idx + 1}] ${title} (relevance: ${doc.score.toFixed(2)})\n${content.slice(0, 500)}`
      );
    });

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

