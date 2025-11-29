/**
 * RAG Query Processor
 * Advanced query processing with expansion, intent classification, and entity extraction
 */

import OpenAI from 'openai';
import type { LLMService } from './LLMService.js';

export interface QueryAnalysis {
  originalQuery: string;
  expandedQueries: string[];
  intent: string;
  entities: Record<string, any>;
  keywords: string[];
  queryType: 'factual' | 'comparative' | 'recommendation' | 'how-to' | 'general';
  confidence: number;
}

export interface QueryExpansionOptions {
  useLLM?: boolean;
  maxExpansions?: number;
  includeSynonyms?: boolean;
}

export class RAGQueryProcessor {
  private openai: OpenAI | null = null;
  private llmService: LLMService | null = null;
  private readonly DEFAULT_MAX_EXPANSIONS = 3;

  constructor(llmService?: LLMService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
    this.llmService = llmService || null;
  }

  /**
   * Analyze and process a query
   */
  async processQuery(
    query: string,
    options: QueryExpansionOptions = {}
  ): Promise<QueryAnalysis> {
    const {
      useLLM = true,
      maxExpansions = this.DEFAULT_MAX_EXPANSIONS,
      includeSynonyms = true,
    } = options;

    // Extract keywords
    const keywords = this.extractKeywords(query);

    // Classify query type
    const queryType = this.classifyQueryType(query);

    // Extract entities (simple pattern-based, can be enhanced with NER)
    const entities = this.extractEntities(query);

    // Determine intent
    const intent = this.determineIntent(query, queryType);

    // Expand query
    const expandedQueries = await this.expandQuery(
      query,
      queryType,
      keywords,
      { useLLM, maxExpansions, includeSynonyms }
    );

    return {
      originalQuery: query,
      expandedQueries,
      intent,
      entities,
      keywords,
      queryType,
      confidence: this.calculateQueryConfidence(query, keywords, entities),
    };
  }

  /**
   * Extract keywords from query
   */
  private extractKeywords(query: string): string[] {
    // Remove stop words and extract meaningful keywords
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
   * Classify query type
   */
  private classifyQueryType(query: string): QueryAnalysis['queryType'] {
    const lowerQuery = query.toLowerCase();

    // Comparative queries
    if (
      /\b(compare|difference|better|best|versus|vs|versus|between)\b/.test(
        lowerQuery
      )
    ) {
      return 'comparative';
    }

    // Recommendation queries
    if (
      /\b(should|recommend|suggest|advice|what.*wear|what.*buy)\b/.test(
        lowerQuery
      )
    ) {
      return 'recommendation';
    }

    // How-to queries
    if (
      /\b(how|way|steps|guide|tutorial|learn)\b/.test(lowerQuery) &&
      /\b(to|do|make|create|build)\b/.test(lowerQuery)
    ) {
      return 'how-to';
    }

    // Factual queries (what, when, where, who)
    if (/\b(what|when|where|who|which)\b/.test(lowerQuery)) {
      return 'factual';
    }

    return 'general';
  }

  /**
   * Extract entities from query (simple pattern-based)
   */
  private extractEntities(query: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extract colors
    const colors = [
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
      'black', 'white', 'gray', 'grey', 'navy', 'beige', 'khaki', 'olive',
      'maroon', 'burgundy', 'teal', 'turquoise', 'coral', 'salmon', 'ivory',
      'cream', 'tan', 'indigo', 'violet', 'magenta', 'cyan', 'lime',
    ];
    const foundColors = colors.filter(color =>
      query.toLowerCase().includes(color)
    );
    if (foundColors.length > 0) {
      entities.colors = foundColors;
    }

    // Extract sizes
    const sizePattern = /\b(xxs|xs|s|m|l|xl|xxl|xxxl|small|medium|large|petite|plus)\b/i;
    const sizeMatch = query.match(sizePattern);
    if (sizeMatch) {
      entities.size = sizeMatch[0].toLowerCase();
    }

    // Extract occasions
    const occasions = [
      'wedding', 'party', 'work', 'office', 'casual', 'formal', 'dinner',
      'date', 'vacation', 'beach', 'gym', 'workout', 'sport', 'business',
      'interview', 'holiday', 'christmas', 'thanksgiving', 'halloween',
    ];
    const foundOccasions = occasions.filter(occasion =>
      query.toLowerCase().includes(occasion)
    );
    if (foundOccasions.length > 0) {
      entities.occasions = foundOccasions;
    }

    // Extract seasons
    const seasons = ['spring', 'summer', 'fall', 'autumn', 'winter'];
    const foundSeasons = seasons.filter(season =>
      query.toLowerCase().includes(season)
    );
    if (foundSeasons.length > 0) {
      entities.seasons = foundSeasons;
    }

    // Extract brands (common fashion brands)
    const brandPattern = /\b(nike|adidas|zara|h&m|gucci|prada|versace|chanel|dior|calvin klein|tommy hilfiger|ralph lauren|levi|gap|old navy|j crew|banana republic)\b/i;
    const brandMatch = query.match(brandPattern);
    if (brandMatch) {
      entities.brands = [brandMatch[0]];
    }

    return entities;
  }

  /**
   * Determine intent from query
   */
  private determineIntent(
    query: string,
    queryType: QueryAnalysis['queryType']
  ): string {
    const lowerQuery = query.toLowerCase();

    // Map query types to intents
    const intentMap: Record<QueryAnalysis['queryType'], string> = {
      factual: 'information_seeking',
      comparative: 'comparison',
      recommendation: 'recommendation_request',
      'how-to': 'instruction_seeking',
      general: 'general_inquiry',
    };

    let intent = intentMap[queryType];

    // Refine based on specific patterns
    if (lowerQuery.includes('buy') || lowerQuery.includes('purchase')) {
      intent = 'purchase_intent';
    } else if (lowerQuery.includes('return') || lowerQuery.includes('refund')) {
      intent = 'return_inquiry';
    } else if (lowerQuery.includes('fit') || lowerQuery.includes('size')) {
      intent = 'fit_inquiry';
    } else if (lowerQuery.includes('price') || lowerQuery.includes('cost')) {
      intent = 'pricing_inquiry';
    }

    return intent;
  }

  /**
   * Expand query with variations and synonyms
   */
  private async expandQuery(
    query: string,
    queryType: QueryAnalysis['queryType'],
    keywords: string[],
    options: QueryExpansionOptions
  ): Promise<string[]> {
    const { useLLM, maxExpansions = this.DEFAULT_MAX_EXPANSIONS, includeSynonyms } = options;
    const expansions: string[] = [query]; // Always include original

    // Rule-based expansion
    const ruleBasedExpansions = this.generateRuleBasedExpansions(
      query,
      queryType,
      keywords
    );
    expansions.push(...ruleBasedExpansions.slice(0, maxExpansions - 1));

    // LLM-based expansion if available
    if (useLLM && this.openai && expansions.length < maxExpansions) {
      try {
        const llmExpansions = await this.generateLLMExpansions(
          query,
          queryType,
          maxExpansions - expansions.length
        );
        expansions.push(...llmExpansions);
      } catch (error) {
        console.warn('LLM query expansion failed, using rule-based only:', error);
      }
    }

    // Synonym expansion if enabled
    if (includeSynonyms && expansions.length < maxExpansions) {
      const synonymExpansions = this.generateSynonymExpansions(
        query,
        keywords,
        maxExpansions - expansions.length
      );
      expansions.push(...synonymExpansions);
    }

    // Deduplicate and return
    return Array.from(new Set(expansions)).slice(0, maxExpansions);
  }

  /**
   * Generate rule-based query expansions
   */
  private generateRuleBasedExpansions(
    query: string,
    queryType: QueryAnalysis['queryType'],
    keywords: string[]
  ): string[] {
    const expansions: string[] = [];

    // For recommendation queries, add variations
    if (queryType === 'recommendation') {
      if (!query.toLowerCase().includes('should')) {
        expansions.push(`What should I ${query}`);
      }
      if (!query.toLowerCase().includes('recommend')) {
        expansions.push(`What do you recommend for ${keywords.join(' ')}`);
      }
    }

    // Add keyword-only version
    if (keywords.length > 0) {
      expansions.push(keywords.join(' '));
    }

    // Add question form if not already a question
    if (!query.includes('?')) {
      expansions.push(`${query}?`);
    }

    return expansions;
  }

  /**
   * Generate LLM-based query expansions
   */
  private async generateLLMExpansions(
    query: string,
    queryType: QueryAnalysis['queryType'],
    maxExpansions: number
  ): Promise<string[]> {
    if (!this.openai || maxExpansions <= 0) return [];

    try {
      const prompt = `Generate ${maxExpansions} alternative phrasings or expansions of this query that would help retrieve relevant information. Return only the queries, one per line, without numbering or bullets.

Query: "${query}"
Query Type: ${queryType}

Alternative queries:`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a query expansion assistant. Generate alternative phrasings that help with information retrieval.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const expansions = response.choices[0]?.message?.content
        ?.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^\d+[.)]/))
        .slice(0, maxExpansions) || [];

      return expansions;
    } catch (error) {
      console.warn('LLM expansion failed:', error);
      return [];
    }
  }

  /**
   * Generate synonym-based expansions
   */
  private generateSynonymExpansions(
    query: string,
    keywords: string[],
    maxExpansions: number
  ): string[] {
    // Simple synonym mapping (can be enhanced with a proper thesaurus)
    const synonymMap: Record<string, string[]> = {
      wear: ['dress', 'put on', 'style'],
      buy: ['purchase', 'get', 'acquire'],
      recommend: ['suggest', 'advise', 'recommend'],
      fit: ['size', 'measurement', 'sizing'],
      color: ['colour', 'hue', 'shade'],
      style: ['fashion', 'look', 'outfit'],
    };

    const expansions: string[] = [];

    for (const [word, synonyms] of Object.entries(synonymMap)) {
      if (expansions.length >= maxExpansions) break;

      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(query)) {
        for (const synonym of synonyms.slice(0, 2)) {
          if (expansions.length >= maxExpansions) break;
          const expanded = query.replace(regex, synonym);
          if (expanded !== query) {
            expansions.push(expanded);
          }
        }
      }
    }

    return expansions.slice(0, maxExpansions);
  }

  /**
   * Calculate query confidence score
   */
  private calculateQueryConfidence(
    query: string,
    keywords: string[],
    entities: Record<string, any>
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost for longer queries with more keywords
    if (keywords.length >= 3) confidence += 0.1;
    if (keywords.length >= 5) confidence += 0.1;

    // Boost for entities
    const entityCount = Object.keys(entities).length;
    if (entityCount > 0) confidence += 0.1;
    if (entityCount >= 2) confidence += 0.1;

    // Boost for question format
    if (query.includes('?')) confidence += 0.05;

    // Boost for specific query types
    if (query.length > 20) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }
}

// Export singleton instance
export const queryProcessor = new RAGQueryProcessor();

