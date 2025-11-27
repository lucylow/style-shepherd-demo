/**
 * Retrieval Service (RAG)
 * Uses SEARCHABLE_ENDPOINT if configured, otherwise returns mock docs
 */

export type Doc = {
  source_id: string;
  title?: string;
  url?: string;
  excerpt?: string;
  score?: number;
  text?: string;
};

const MOCK_DOCS: Doc[] = [
  {
    source_id: 'doc:trend-2025-1',
    title: '2025 Fall Color Trends',
    url: 'https://example.com/2025-fall-colors',
    excerpt: 'Muted warm tones, peaches and indigo continue to trend for 2025 fall collections.',
    score: 0.95,
  },
  {
    source_id: 'doc:brand-denimco-fit-guide',
    title: 'DenimCo Fit Guide',
    url: 'https://denimco.example/fit',
    excerpt: 'DenimCo recommends ordering true to size for straight fits but sizing up 1 for slim stretch styles.',
    score: 0.87,
  },
  {
    source_id: 'doc:retdata-2024',
    title: 'Returns Analytics (Q4 2024)',
    url: 'https://industry.example/returns-q4-2024',
    excerpt: 'Bottoms (jeans/skirts) show the highest return rates at 65% for online purchases.',
    score: 0.82,
  },
];

/**
 * Retrieve relevant documents for a query (RAG)
 * @param query - User query string
 * @param opts - Options including topK (number of results)
 * @returns Array of relevant documents
 */
export async function retrieveDocs(
  query: string,
  opts: { topK?: number } = {}
): Promise<Doc[]> {
  const topK = opts.topK || 3;

  const endpoint = process.env.SEARCHABLE_ENDPOINT;
  const apiKey = process.env.SEARCHABLE_API_KEY;

  if (endpoint && apiKey) {
    // Call Searchable-like endpoint
    try {
      const url = `${endpoint.replace(/\/$/, '')}/search`;
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ q: query, k: topK }),
      });

      if (!r.ok) {
        const text = await r.text();
        console.warn('Searchable search failed:', r.status, text);
        // fallback to mock
        return MOCK_DOCS.slice(0, topK);
      }

      const json = await r.json();
      // Expect json.results array with fields id, title, url, snippet, score
      const results = (json.results || json.hits || [])
        .slice(0, topK)
        .map((item: any, i: number) => ({
          source_id: item.id || item.source_id || `ext-${i}`,
          title: item.title || item.name || undefined,
          url: item.url,
          excerpt: item.snippet || item.excerpt || item.text?.slice?.(0, 300) || '',
          score: item.score ?? 1 - i * 0.1,
        }));

      return results;
    } catch (e) {
      console.warn('Searchable adapter error, falling back to mock:', (e as Error)?.message || e);
      return MOCK_DOCS.slice(0, topK);
    }
  }

  // No external search configured -> demo fallback: return mock docs (topK)
  return MOCK_DOCS.slice(0, topK);
}

