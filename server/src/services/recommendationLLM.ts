/**
 * LLM Service for Recommendation Generation
 * Wrapper for generating recommendation text from prompts
 * Replace the mock implementation with a real LLM call (Cerebras, OpenAI, etc.)
 */

import { llmService } from './LLMService.js';
import type { Doc } from './retrieval.js';

/**
 * Generate LLM response for recommendation
 * @param prompt - Full prompt text including user profile and document excerpts
 * @param docs - Retrieved documents used in the prompt
 * @param modelInfo - Model information (name, params)
 * @returns Recommendation text string
 */
export async function generateLLMResponse(
  prompt: string,
  docs: Doc[],
  modelInfo: any = { name: 'mock-llm' }
): Promise<string> {
  // Try to use the existing LLMService if available
  if (llmService.isAvailable()) {
    try {
      // Use LLMService to generate response
      // We'll create a simple intent analysis and use generateResponse
      const intentAnalysis = {
        intent: 'get_recommendations',
        entities: {},
        confidence: 0.9,
        sentiment: 'neutral' as const,
      };

      const response = await llmService.generateResponse(
        prompt.split('\n').pop() || '', // Extract the task query
        intentAnalysis,
        [],
        undefined,
        undefined
      );

      return response;
    } catch (error) {
      console.warn('LLMService failed, using mock:', error);
    }
  }

  // ---- FALLBACK: Mock implementation ----
  // For demo: synthesize a short recommendation using the prompt and docs
  const topSources = docs
    .slice(0, 3)
    .map((d: any) => `${d.source_id}:${d.title || d.url}`)
    .join(', ');
  const rec = `Recommendation based on profile + ${topSources}: Choose a ${
    docs[0]?.title ? docs[0].title.split(' ')[0] : 'stylish'
  } piece in your preferred size. Suggested size: M. Brief rationale: ${
    docs[0]?.excerpt || 'Good match.'
  }`;

  return Promise.resolve(rec);
}

