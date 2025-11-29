/**
 * RAG (Retrieval-Augmented Generation) Routes
 * Query endpoint with evidence logging
 */

import { Router, Request, Response, NextFunction } from 'express';
import { validateBody } from '../middleware/validation.js';
import { z } from 'zod';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * POST /api/rag/query
 * RAG endpoint: fetch top-3 docs, build prompt, call mock LLM, log evidence
 */
router.post(
  '/query',
  validateBody(
    z.object({
      query: z.string().min(1),
      user_id: z.string().optional(),
      session_id: z.string().optional(),
    })
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query, user_id, session_id } = req.body;
      
      // Step 1: Fetch top-3 docs from search tool
      let docs: any[] = [];
      try {
        const searchResponse = await fetch('http://localhost:3001/api/tools/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, top_k: 3 }),
        });
        if (searchResponse.ok) {
          const searchData = await searchResponse.json() as { docs?: any[] };
          docs = searchData.docs || [];
        }
      } catch (error) {
        console.warn('Search tool failed, using empty docs:', error);
      }
      
      // Step 2: Build prompt with context
      const contextText = docs
        .map((d, i) => `[${i + 1}] ${d.title}\n${d.excerpt}`)
        .join('\n\n');
      
      const prompt = `User Query: ${query}\n\nRelevant Context:\n${contextText}\n\nProvide a helpful, grounded response based on the context above.`;
      
      // Step 3: Call mock LLM
      let llmResponse: any;
      try {
        const mockLlmPath = join(__dirname, '..', '..', '..', 'lib', 'mock_llm.js');
        const mockLlm = await import(mockLlmPath);
        llmResponse = await mockLlm.generateResponse(prompt, docs);
      } catch (error) {
        // Fallback if import fails
        llmResponse = {
          text: `Based on the provided context, here's a response to: ${query}`,
          model_version: 'demo-v1',
        };
      }
      
      // Step 4: Log evidence
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const evidence = {
        request_id: requestId,
        user_id: user_id || 'anonymous',
        timestamp: new Date().toISOString(),
        tools_used: ['search', 'mock_llm'],
        prompt,
        sources: docs.map(d => ({
          source_id: d.source_id || 'unknown',
          doc_id: d.doc_id || 'unknown',
          url: d.url || '',
        })),
        model_version: llmResponse.model_version || 'demo-v1',
        output: {
          response: llmResponse.text,
          sources_count: docs.length,
        },
      };
      
      // Persist evidence
      try {
        const evidenceDir = join(__dirname, '..', '..', '..', 'logs', 'evidence');
        await require('fs/promises').mkdir(evidenceDir, { recursive: true });
        await require('fs/promises').writeFile(
          join(evidenceDir, `${Date.now()}_${requestId}.json`),
          JSON.stringify(evidence, null, 2),
          'utf-8'
        );
      } catch (logError) {
        console.warn('Evidence logging failed:', logError);
      }
      
      return res.json({
        response: llmResponse.text,
        sources: docs.map(d => ({
          source_id: d.source_id,
          title: d.title,
          excerpt: d.excerpt,
          url: d.url,
        })),
        request_id: requestId,
        model_version: llmResponse.model_version || 'demo-v1',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

