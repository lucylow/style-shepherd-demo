/**
 * RAG Document Chunker
 * Splits large documents into smaller chunks with overlap for better retrieval
 */

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    startChar: number;
    endChar: number;
    parentId: string;
    parentTitle?: string;
    parentUrl?: string;
    [key: string]: any;
  };
}

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  separator?: string;
  preserveParagraphs?: boolean;
  preserveSentences?: boolean;
}

export class RAGDocumentChunker {
  private readonly DEFAULT_CHUNK_SIZE = 1000; // characters
  private readonly DEFAULT_CHUNK_OVERLAP = 200; // characters
  private readonly DEFAULT_SEPARATOR = '\n\n';

  /**
   * Chunk a document into smaller pieces
   */
  chunkDocument(
    document: {
      id: string;
      title?: string;
      content: string;
      url?: string;
      metadata?: Record<string, any>;
    },
    options: ChunkingOptions = {}
  ): DocumentChunk[] {
    const {
      chunkSize = this.DEFAULT_CHUNK_SIZE,
      chunkOverlap = this.DEFAULT_CHUNK_OVERLAP,
      separator = this.DEFAULT_SEPARATOR,
      preserveParagraphs = true,
      preserveSentences = true,
    } = options;

    const chunks: DocumentChunk[] = [];

    // If document is small enough, return as single chunk
    if (document.content.length <= chunkSize) {
      return [
        {
          id: `${document.id}_chunk_0`,
          content: document.content,
          metadata: {
            chunkIndex: 0,
            totalChunks: 1,
            startChar: 0,
            endChar: document.content.length,
            parentId: document.id,
            parentTitle: document.title,
            parentUrl: document.url,
            ...document.metadata,
          },
        },
      ];
    }

    // Strategy: Try to preserve paragraphs first, then sentences, then fall back to character-based
    let textSegments: string[] = [];

    if (preserveParagraphs) {
      // Split by paragraphs
      textSegments = document.content.split(separator).filter(s => s.trim().length > 0);
    } else if (preserveSentences) {
      // Split by sentences
      textSegments = document.content
        .split(/[.!?]+\s+/)
        .filter(s => s.trim().length > 0);
    } else {
      // Character-based splitting
      textSegments = [document.content];
    }

    // Build chunks from segments
    let currentChunk = '';
    let currentStartChar = 0;
    let chunkIndex = 0;

    for (let i = 0; i < textSegments.length; i++) {
      const segment = textSegments[i];
      const segmentWithSeparator = preserveParagraphs ? segment + separator : segment + ' ';

      // If adding this segment would exceed chunk size
      if (currentChunk.length + segmentWithSeparator.length > chunkSize && currentChunk.length > 0) {
        // Save current chunk
        chunks.push({
          id: `${document.id}_chunk_${chunkIndex}`,
          content: currentChunk.trim(),
          metadata: {
            chunkIndex,
            totalChunks: 0, // Will be set later
            startChar: currentStartChar,
            endChar: currentStartChar + currentChunk.length,
            parentId: document.id,
            parentTitle: document.title,
            parentUrl: document.url,
            ...document.metadata,
          },
        });

        // Start new chunk with overlap
        if (chunkOverlap > 0 && currentChunk.length > chunkOverlap) {
          // Take last part of previous chunk for overlap
          const overlapText = currentChunk.slice(-chunkOverlap);
          currentChunk = overlapText + segmentWithSeparator;
          currentStartChar = currentStartChar + currentChunk.length - chunkOverlap - segmentWithSeparator.length;
        } else {
          currentChunk = segmentWithSeparator;
          currentStartChar = currentStartChar + currentChunk.length - segmentWithSeparator.length;
        }

        chunkIndex++;
      } else {
        // Add segment to current chunk
        currentChunk += segmentWithSeparator;
      }

      // If segment itself is larger than chunk size, split it further
      if (segment.length > chunkSize) {
        const subChunks = this.splitLargeSegment(
          segment,
          chunkSize,
          chunkOverlap,
          document.id,
          chunkIndex,
          currentStartChar,
          document,
          document.metadata || {}
        );
        
        if (subChunks.length > 0) {
          // Remove the last chunk if we're continuing
          if (chunks.length > 0 && chunks[chunks.length - 1].id === subChunks[0].id) {
            chunks.pop();
          }
          chunks.push(...subChunks);
          chunkIndex = subChunks[subChunks.length - 1].metadata.chunkIndex + 1;
          currentChunk = '';
          currentStartChar = subChunks[subChunks.length - 1].metadata.endChar;
        }
      }
    }

    // Add final chunk if there's remaining content
    if (currentChunk.trim().length > 0) {
      chunks.push({
        id: `${document.id}_chunk_${chunkIndex}`,
        content: currentChunk.trim(),
        metadata: {
          chunkIndex,
          totalChunks: 0, // Will be set below
          startChar: currentStartChar,
          endChar: currentStartChar + currentChunk.length,
          parentId: document.id,
          parentTitle: document.title,
          parentUrl: document.url,
          ...document.metadata,
        },
      });
    }

    // Update total chunks count
    const totalChunks = chunks.length;
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = totalChunks;
    });

    return chunks;
  }

  /**
   * Split a large segment that exceeds chunk size
   */
  private splitLargeSegment(
    segment: string,
    chunkSize: number,
    chunkOverlap: number,
    documentId: string,
    startChunkIndex: number,
    startChar: number,
    document: { id: string; title?: string; url?: string; metadata?: Record<string, any> },
    baseMetadata: Record<string, any>
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    let offset = 0;
    let chunkIndex = startChunkIndex;

    while (offset < segment.length) {
      const endOffset = Math.min(offset + chunkSize, segment.length);
      const chunkContent = segment.slice(offset, endOffset);

      chunks.push({
        id: `${documentId}_chunk_${chunkIndex}`,
        content: chunkContent.trim(),
        metadata: {
          chunkIndex,
          totalChunks: 0, // Will be updated
          startChar: startChar + offset,
          endChar: startChar + endOffset,
          parentId: document.id,
          parentTitle: document.title,
          parentUrl: document.url,
          ...baseMetadata,
        },
      });

      // Move forward with overlap
      offset = endOffset - chunkOverlap;
      chunkIndex++;
    }

    return chunks;
  }

  /**
   * Chunk multiple documents
   */
  chunkDocuments(
    documents: Array<{
      id: string;
      title?: string;
      content: string;
      url?: string;
      metadata?: Record<string, any>;
    }>,
    options: ChunkingOptions = {}
  ): DocumentChunk[] {
    const allChunks: DocumentChunk[] = [];

    for (const doc of documents) {
      const chunks = this.chunkDocument(doc, options);
      allChunks.push(...chunks);
    }

    return allChunks;
  }

  /**
   * Reconstruct original document from chunks (for testing/debugging)
   */
  reconstructDocument(chunks: DocumentChunk[]): string {
    // Sort by chunk index
    const sortedChunks = [...chunks].sort(
      (a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex
    );

    // Simple reconstruction (doesn't handle overlap perfectly)
    return sortedChunks.map(chunk => chunk.content).join('\n\n');
  }
}

// Export singleton instance
export const documentChunker = new RAGDocumentChunker();

