/**
 * Document Indexer
 * Full-text search index for documents (fallback/complement to vector search)
 */

import fs from 'fs';
import path from 'path';

export interface IndexedDocument {
  id: string;
  title?: string;
  content: string;
  url?: string;
  metadata?: Record<string, any>;
}

export interface SearchOptions {
  topK?: number;
}

export class DocumentIndexer {
  private documents: Map<string, IndexedDocument> = new Map();
  private readonly STORAGE_PATH = path.join(process.cwd(), 'logs', 'document-index.json');

  constructor() {
    this.loadFromDisk();
  }

  /**
   * Index a document
   */
  async index(document: IndexedDocument): Promise<void> {
    this.documents.set(document.id, document);
    this.saveToDisk();
  }

  /**
   * Index multiple documents
   */
  async indexBatch(documents: IndexedDocument[]): Promise<void> {
    documents.forEach(doc => {
      this.documents.set(doc.id, doc);
    });
    this.saveToDisk();
  }

  /**
   * Search documents using simple keyword matching
   */
  async search(query: string, options: SearchOptions = {}): Promise<Array<{ id: string; score: number; metadata: any }>> {
    const { topK = 10 } = options;

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) {
      return [];
    }

    const results: Array<{ id: string; score: number; metadata: any }> = [];

    for (const [id, doc] of this.documents.entries()) {
      const searchableText = `${doc.title || ''} ${doc.content}`.toLowerCase();
      
      // Calculate score based on keyword matches
      let score = 0;
      let matches = 0;

      for (const word of queryWords) {
        const count = (searchableText.match(new RegExp(word, 'g')) || []).length;
        if (count > 0) {
          matches++;
          score += count;
        }
      }

      // Normalize score
      if (matches > 0) {
        score = (matches / queryWords.length) * (score / queryWords.length);
        results.push({
          id: doc.id,
          score: Math.min(score, 1.0),
          metadata: {
            title: doc.title,
            content: doc.content,
            url: doc.url,
            ...doc.metadata,
          },
        });
      }
    }

    // Sort by score and return top K
    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /**
   * Get a document by ID
   */
  async get(id: string): Promise<IndexedDocument | null> {
    return this.documents.get(id) || null;
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<boolean> {
    const deleted = this.documents.delete(id);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    this.documents.clear();
    this.saveToDisk();
  }

  /**
   * Get total count of documents
   */
  async getCount(): Promise<number> {
    return this.documents.size;
  }

  /**
   * Save index to disk
   */
  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.STORAGE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const data = Array.from(this.documents.entries()).map(([id, doc]) => ({
        id,
        title: doc.title,
        content: doc.content,
        url: doc.url,
        metadata: doc.metadata,
      }));

      fs.writeFileSync(this.STORAGE_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn('Failed to save document index to disk:', error);
    }
  }

  /**
   * Load index from disk
   */
  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.STORAGE_PATH)) {
        const data = JSON.parse(fs.readFileSync(this.STORAGE_PATH, 'utf8'));
        this.documents.clear();
        
        for (const item of data) {
          this.documents.set(item.id, {
            id: item.id,
            title: item.title,
            content: item.content,
            url: item.url,
            metadata: item.metadata,
          });
        }

        console.log(`📚 Loaded ${this.documents.size} documents from index`);
      }
    } catch (error) {
      console.warn('Failed to load document index from disk:', error);
    }
  }
}

