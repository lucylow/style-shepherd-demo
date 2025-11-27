/**
 * RAG Re-ranker
 * Re-ranks retrieved documents using cross-encoder approach and additional signals
 */

import OpenAI from 'openai';

export interface RerankOptions {
  useLLM?: boolean;
  useKeywordBoost?: boolean;
  useRecencyBoost?: boolean;
  useMetadataBoost?: boolean;
  topK?: number;
}

export interface RerankResult {
  id: string;
  score: number;
  metadata: any;
  rerankScore: number;
  originalScore: number;
  boostFactors: {
    keywordMatch?: number;
    recency?: number;
    metadata?: number;
    llmRelevance?: number;
  };
}

export class RAGReranker {
  private openai: OpenAI | null = null;
  private readonly DEFAULT_TOP_K = 10;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Re-rank search results
   */
  async rerank(
    query: string,
    results: Array<{ id: string; score: number; metadata: any }>,
    options: RerankOptions = {}
  ): Promise<RerankResult[]> {
    const {
      useLLM = false,
      useKeywordBoost = true,
      useRecencyBoost = true,
      useMetadataBoost = true,
      topK = this.DEFAULT_TOP_K,
    } = options;

    if (results.length === 0) return [];

    // Extract query keywords
    const queryKeywords = this.extractKeywords(query);

    // Calculate rerank scores
    const rerankedResults: RerankResult[] = results.map(result => {
      const boostFactors: RerankResult['boostFactors'] = {};

      // Original score
      const originalScore = result.score;

      // Keyword boost
      let keywordBoost = 1.0;
      if (useKeywordBoost) {
        keywordBoost = this.calculateKeywordBoost(
          query,
          queryKeywords,
          result.metadata
        );
        boostFactors.keywordMatch = keywordBoost;
      }

      // Recency boost (if metadata has timestamp)
      let recencyBoost = 1.0;
      if (useRecencyBoost && result.metadata?.created_at) {
        recencyBoost = this.calculateRecencyBoost(result.metadata.created_at);
        boostFactors.recency = recencyBoost;
      }

      // Metadata boost (e.g., popularity, quality signals)
      let metadataBoost = 1.0;
      if (useMetadataBoost) {
        metadataBoost = this.calculateMetadataBoost(result.metadata);
        boostFactors.metadata = metadataBoost;
      }

      // Calculate rerank score
      const rerankScore =
        originalScore * keywordBoost * recencyBoost * metadataBoost;

      return {
        id: result.id,
        score: rerankScore,
        metadata: result.metadata,
        rerankScore,
        originalScore,
        boostFactors,
      };
    });

    // Sort by rerank score
    rerankedResults.sort((a, b) => b.rerankScore - a.rerankScore);

    // LLM-based reranking if enabled (for top candidates)
    if (useLLM && this.openai && rerankedResults.length > 0) {
      const topCandidates = rerankedResults.slice(0, Math.min(20, topK * 2));
      const llmReranked = await this.llmRerank(query, topCandidates);
      
      // Merge LLM scores with existing scores
      const llmScoreMap = new Map(
        llmReranked.map(r => [r.id, r.rerankScore])
      );

      rerankedResults.forEach(result => {
        const llmScore = llmScoreMap.get(result.id);
        if (llmScore !== undefined) {
          // Combine LLM score with existing score (weighted average)
          result.rerankScore = result.rerankScore * 0.6 + llmScore * 0.4;
          result.boostFactors.llmRelevance = llmScore;
        }
      });

      // Re-sort after LLM reranking
      rerankedResults.sort((a, b) => b.rerankScore - a.rerankScore);
    }

    return rerankedResults.slice(0, topK);
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'should', 'could', 'may', 'might', 'must', 'can', 'what',
      'which', 'who', 'when', 'where', 'why', 'how',
    ]);

    return query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 0);
  }

  /**
   * Calculate keyword boost score
   */
  private calculateKeywordBoost(
    query: string,
    keywords: string[],
    metadata: any
  ): number {
    if (keywords.length === 0) return 1.0;

    const searchableText = `${metadata?.title || ''} ${metadata?.content || ''}`.toLowerCase();
    const queryLower = query.toLowerCase();

    let matches = 0;
    let exactMatches = 0;

    // Check for exact query match (highest boost)
    if (searchableText.includes(queryLower)) {
      exactMatches += 2;
    }

    // Check for keyword matches
    for (const keyword of keywords) {
      if (searchableText.includes(keyword)) {
        matches++;
      }
    }

    // Calculate boost (exponential for more matches)
    const matchRatio = matches / keywords.length;
    const boost = 1.0 + matchRatio * 0.3 + (exactMatches > 0 ? 0.2 : 0);

    return Math.min(boost, 1.5); // Cap at 1.5x
  }

  /**
   * Calculate recency boost
   */
  private calculateRecencyBoost(timestamp: string | number): number {
    let date: Date;
    
    if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return 1.0;

    const now = new Date();
    const daysSince = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    // Boost for recent documents (decay over time)
    if (daysSince < 7) return 1.2; // Last week
    if (daysSince < 30) return 1.1; // Last month
    if (daysSince < 90) return 1.05; // Last quarter
    if (daysSince < 365) return 1.0; // Last year
    return 0.95; // Older
  }

  /**
   * Calculate metadata boost
   */
  private calculateMetadataBoost(metadata: any): number {
    let boost = 1.0;

    // Boost for verified/quality content
    if (metadata?.verified === true) boost += 0.1;
    if (metadata?.quality_score) boost += metadata.quality_score * 0.1;

    // Boost for popular content
    if (metadata?.views && metadata.views > 100) boost += 0.05;
    if (metadata?.likes && metadata.likes > 50) boost += 0.05;

    // Boost for featured content
    if (metadata?.featured === true) boost += 0.15;

    // Penalty for low-quality signals
    if (metadata?.spam === true) boost *= 0.5;
    if (metadata?.low_quality === true) boost *= 0.7;

    return Math.min(boost, 1.5); // Cap at 1.5x
  }

  /**
   * LLM-based reranking
   */
  private async llmRerank(
    query: string,
    candidates: RerankResult[]
  ): Promise<RerankResult[]> {
    if (!this.openai || candidates.length === 0) return candidates;

    try {
      // Build prompt for LLM reranking
      const candidateTexts = candidates.map((c, idx) => {
        const content = c.metadata?.content || c.metadata?.excerpt || '';
        const title = c.metadata?.title || c.id;
        return `${idx + 1}. [${title}]\n${content.slice(0, 200)}...`;
      }).join('\n\n');

      const prompt = `Given the query: "${query}"

Rank the following documents by relevance (1 = most relevant, ${candidates.length} = least relevant). Return only a JSON array of numbers representing the new order, e.g., [3, 1, 2, 4, ...]

Documents:
${candidateTexts}

Return only the JSON array:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a relevance ranking assistant. Return only a JSON array of numbers.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (!content) return candidates;

      // Parse JSON array
      const jsonMatch = content.match(/\[[\d,\s]+\]/);
      if (!jsonMatch) return candidates;

      const newOrder = JSON.parse(jsonMatch[0]) as number[];
      if (!Array.isArray(newOrder) || newOrder.length !== candidates.length) {
        return candidates;
      }

      // Reorder candidates and assign new scores
      const reranked: RerankResult[] = [];
      for (let i = 0; i < newOrder.length; i++) {
        const originalIndex = newOrder[i] - 1; // Convert to 0-based
        if (originalIndex >= 0 && originalIndex < candidates.length) {
          const candidate = candidates[originalIndex];
          // Calculate new score based on position (higher position = higher score)
          const positionScore = 1.0 - (i / candidates.length) * 0.5;
          reranked.push({
            ...candidate,
            rerankScore: positionScore,
          });
        }
      }

      return reranked;
    } catch (error) {
      console.warn('LLM reranking failed, using original order:', error);
      return candidates;
    }
  }
}

// Export singleton instance
export const reranker = new RAGReranker();

