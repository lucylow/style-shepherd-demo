/**
 * Content Parser for SenseSpace
 * Parses mixed content (Markdown + XML cards) according to Verisense specification
 */

export interface ParsedContent {
  type: 'markdown' | 'tool' | 'miniapp' | 'payment';
  content: string;
  data?: {
    func?: string;
    result?: string;
    id?: string;
    url?: string;
    intentId?: string;
  };
}

/**
 * Parse XML tags from content
 * Extracts <tool>, <miniapp>, and <payment> tags
 */
export function parseXMLTags(content: string): ParsedContent[] {
  const parts: ParsedContent[] = [];
  let remaining = content;
  let lastIndex = 0;

  // Regex to match XML tags: <tool>, <miniapp>, <payment>
  const tagRegex = /<(tool|miniapp|payment)>([\s\S]*?)<\/\1>/gi;
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    const tagType = match[1].toLowerCase();
    const tagContent = match[2];
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;

    // Add markdown content before this tag
    if (startIndex > lastIndex) {
      const markdownContent = content.slice(lastIndex, startIndex).trim();
      if (markdownContent) {
        parts.push({
          type: 'markdown',
          content: markdownContent,
        });
      }
    }

    // Parse the XML tag content
    if (tagType === 'tool') {
      const funcMatch = tagContent.match(/<func>([\s\S]*?)<\/func>/i);
      const resultMatch = tagContent.match(/<result>([\s\S]*?)<\/result>/i);
      
      parts.push({
        type: 'tool',
        content: '',
        data: {
          func: funcMatch ? funcMatch[1].trim() : '',
          result: resultMatch ? resultMatch[1].trim() : '',
        },
      });
    } else if (tagType === 'miniapp') {
      const idMatch = tagContent.match(/<id>([\s\S]*?)<\/id>/i);
      const urlMatch = tagContent.match(/<url>([\s\S]*?)<\/url>/i);
      
      parts.push({
        type: 'miniapp',
        content: '',
        data: {
          id: idMatch ? idMatch[1].trim() : '',
          url: urlMatch ? urlMatch[1].trim() : '',
        },
      });
    } else if (tagType === 'payment') {
      const intentMatch = tagContent.match(/<intent-id>([\s\S]*?)<\/intent-id>/i);
      
      parts.push({
        type: 'payment',
        content: '',
        data: {
          intentId: intentMatch ? intentMatch[1].trim() : '',
        },
      });
    }

    lastIndex = endIndex;
  }

  // Add remaining markdown content
  if (lastIndex < content.length) {
    const markdownContent = content.slice(lastIndex).trim();
    if (markdownContent) {
      parts.push({
        type: 'markdown',
        content: markdownContent,
      });
    }
  }

  // If no XML tags found, return the entire content as markdown
  if (parts.length === 0) {
    parts.push({
      type: 'markdown',
      content: content,
    });
  }

  return parts;
}


