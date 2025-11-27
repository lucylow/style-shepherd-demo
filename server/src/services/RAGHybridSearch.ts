/**
 * RAG Hybrid Search
 * Advanced hybrid search with multiple fusion strategies
 */

export interface SearchResult {
  id: string;
  score: number;
  metadata: any;
  source: 'vector' | 'text' | 'hybrid';
}

export type FusionStrategy = 'rrf' | 'weighted' | 'reciprocal' | 'weighted_rrf';

export interface HybridSearchOptions {
  strategy?: FusionStrategy;
  vectorWeight?: number;
  textWeight?: number;
  topK?: number;
  minScore?: number;
}

export class RAGHybridSearch {
  private readonly DEFAULT_VECTOR_WEIGHT = 0.7;
  private readonly DEFAULT_TEXT_WEIGHT = 0.3;
  private readonly DEFAULT_TOP_K = 10;

  /**
   * Combine vector and text search results using specified fusion strategy
   */
  fuse(
    vectorResults: Array<{ id: string; score: number; metadata: any }>,
    textResults: Array<{ id: string; score: number; metadata: any }>,
    options: HybridSearchOptions = {}
  ): SearchResult[] {
    const {
      strategy = 'weighted_rrf',
      vectorWeight = this.DEFAULT_VECTOR_WEIGHT,
      textWeight = this.DEFAULT_TEXT_WEIGHT,
      topK = this.DEFAULT_TOP_K,
      minScore = 0,
    } = options;

    switch (strategy) {
      case 'rrf':
        return this.reciprocalRankFusion(vectorResults, textResults, topK, minScore);
      case 'weighted':
        return this.weightedFusion(
          vectorResults,
          textResults,
          vectorWeight,
          textWeight,
          topK,
          minScore
        );
      case 'reciprocal':
        return this.reciprocalFusion(vectorResults, textResults, topK, minScore);
      case 'weighted_rrf':
      default:
        return this.weightedReciprocalRankFusion(
          vectorResults,
          textResults,
          vectorWeight,
          textWeight,
          topK,
          minScore
        );
    }
  }

  /**
   * Reciprocal Rank Fusion (RRF)
   * Combines results based on reciprocal of rank
   */
  private reciprocalRankFusion(
    vectorResults: Array<{ id: string; score: number; metadata: any }>,
    textResults: Array<{ id: string; score: number; metadata: any }>,
    topK: number,
    minScore: number
  ): SearchResult[] {
    const k = 60; // RRF constant (typical value)
    const scores = new Map<string, { score: number; metadata: any; sources: Set<string> }>();

    // Add vector results
    vectorResults.forEach((result, rank) => {
      const rrfScore = 1 / (k + rank + 1);
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += rrfScore;
        existing.sources.add('vector');
      } else {
        scores.set(result.id, {
          score: rrfScore,
          metadata: result.metadata,
          sources: new Set(['vector']),
        });
      }
    });

    // Add text results
    textResults.forEach((result, rank) => {
      const rrfScore = 1 / (k + rank + 1);
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += rrfScore;
        existing.sources.add('text');
      } else {
        scores.set(result.id, {
          score: rrfScore,
          metadata: result.metadata,
          sources: new Set(['text']),
        });
      }
    });

    // Convert to results array
    const results: SearchResult[] = Array.from(scores.entries())
      .map(([id, data]): SearchResult => ({
        id,
        score: data.score,
        metadata: data.metadata,
        source: (data.sources.size > 1 ? 'hybrid' : (data.sources.has('vector') ? 'vector' : 'text')) as 'vector' | 'text' | 'hybrid',
      }))
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }

  /**
   * Weighted Fusion
   * Combines results using weighted scores
   */
  private weightedFusion(
    vectorResults: Array<{ id: string; score: number; metadata: any }>,
    textResults: Array<{ id: string; score: number; metadata: any }>,
    vectorWeight: number,
    textWeight: number,
    topK: number,
    minScore: number
  ): SearchResult[] {
    const scores = new Map<string, { score: number; metadata: any; sources: Set<string> }>();

    // Normalize weights
    const totalWeight = vectorWeight + textWeight;
    const normalizedVectorWeight = vectorWeight / totalWeight;
    const normalizedTextWeight = textWeight / totalWeight;

    // Add vector results
    vectorResults.forEach(result => {
      const weightedScore = result.score * normalizedVectorWeight;
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += weightedScore;
        existing.sources.add('vector');
      } else {
        scores.set(result.id, {
          score: weightedScore,
          metadata: result.metadata,
          sources: new Set(['vector']),
        });
      }
    });

    // Add text results
    textResults.forEach(result => {
      const weightedScore = result.score * normalizedTextWeight;
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += weightedScore;
        existing.sources.add('text');
      } else {
        scores.set(result.id, {
          score: weightedScore,
          metadata: result.metadata,
          sources: new Set(['text']),
        });
      }
    });

    // Convert to results array
    const results: SearchResult[] = Array.from(scores.entries())
      .map(([id, data]): SearchResult => ({
        id,
        score: data.score,
        metadata: data.metadata,
        source: (data.sources.size > 1 ? 'hybrid' : (data.sources.has('vector') ? 'vector' : 'text')) as 'vector' | 'text' | 'hybrid',
      }))
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }

  /**
   * Reciprocal Fusion
   * Similar to RRF but uses reciprocal of score instead of rank
   */
  private reciprocalFusion(
    vectorResults: Array<{ id: string; score: number; metadata: any }>,
    textResults: Array<{ id: string; score: number; metadata: any }>,
    topK: number,
    minScore: number
  ): SearchResult[] {
    const scores = new Map<string, { score: number; metadata: any; sources: Set<string> }>();

    // Add vector results (using reciprocal of (1 - score) to handle similarity scores)
    vectorResults.forEach(result => {
      const reciprocalScore = 1 / (2 - result.score); // Transform similarity to reciprocal
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += reciprocalScore;
        existing.sources.add('vector');
      } else {
        scores.set(result.id, {
          score: reciprocalScore,
          metadata: result.metadata,
          sources: new Set(['vector']),
        });
      }
    });

    // Add text results
    textResults.forEach(result => {
      const reciprocalScore = 1 / (2 - result.score);
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += reciprocalScore;
        existing.sources.add('text');
      } else {
        scores.set(result.id, {
          score: reciprocalScore,
          metadata: result.metadata,
          sources: new Set(['text']),
        });
      }
    });

    // Convert to results array
    const results: SearchResult[] = Array.from(scores.entries())
      .map(([id, data]): SearchResult => ({
        id,
        score: data.score,
        metadata: data.metadata,
        source: (data.sources.size > 1 ? 'hybrid' : (data.sources.has('vector') ? 'vector' : 'text')) as 'vector' | 'text' | 'hybrid',
      }))
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }

  /**
   * Weighted Reciprocal Rank Fusion
   * Combines RRF with weighted scores
   */
  private weightedReciprocalRankFusion(
    vectorResults: Array<{ id: string; score: number; metadata: any }>,
    textResults: Array<{ id: string; score: number; metadata: any }>,
    vectorWeight: number,
    textWeight: number,
    topK: number,
    minScore: number
  ): SearchResult[] {
    const k = 60; // RRF constant
    const scores = new Map<string, { score: number; metadata: any; sources: Set<string> }>();

    // Normalize weights
    const totalWeight = vectorWeight + textWeight;
    const normalizedVectorWeight = vectorWeight / totalWeight;
    const normalizedTextWeight = textWeight / totalWeight;

    // Add vector results with weighted RRF
    vectorResults.forEach((result, rank) => {
      const rrfScore = (1 / (k + rank + 1)) * normalizedVectorWeight;
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += rrfScore;
        existing.sources.add('vector');
      } else {
        scores.set(result.id, {
          score: rrfScore,
          metadata: result.metadata,
          sources: new Set(['vector']),
        });
      }
    });

    // Add text results with weighted RRF
    textResults.forEach((result, rank) => {
      const rrfScore = (1 / (k + rank + 1)) * normalizedTextWeight;
      const existing = scores.get(result.id);
      if (existing) {
        existing.score += rrfScore;
        existing.sources.add('text');
      } else {
        scores.set(result.id, {
          score: rrfScore,
          metadata: result.metadata,
          sources: new Set(['text']),
        });
      }
    });

    // Convert to results array
    const results: SearchResult[] = Array.from(scores.entries())
      .map(([id, data]): SearchResult => ({
        id,
        score: data.score,
        metadata: data.metadata,
        source: (data.sources.size > 1 ? 'hybrid' : (data.sources.has('vector') ? 'vector' : 'text')) as 'vector' | 'text' | 'hybrid',
      }))
      .filter(r => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return results;
  }
}

// Export singleton instance
export const hybridSearch = new RAGHybridSearch();

