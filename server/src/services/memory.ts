/**
 * Memory Service
 * Simple append-and-recall memory using JSON file storage
 */

import fs from 'fs';
import path from 'path';

type MemoryEntry = { user_id: string; text: string; ts: string; meta?: any };

const MEM_PATH = path.join(process.cwd(), 'logs', 'memory.json');

function ensureMem() {
  const dir = path.dirname(MEM_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(MEM_PATH)) {
    fs.writeFileSync(MEM_PATH, JSON.stringify([]));
  }
}

export async function appendMemory(
  user_id: string,
  item: { query?: string; answer?: string; text?: string; ts?: string; meta?: any }
) {
  ensureMem();
  const arr = JSON.parse(fs.readFileSync(MEM_PATH, 'utf8')) || [];
  const entry: MemoryEntry = {
    user_id,
    text: item.text || `${item.query || ''}\n${item.answer || ''}`.trim(),
    ts: item.ts || new Date().toISOString(),
    meta: item.meta || {},
  };
  arr.push(entry);
  fs.writeFileSync(MEM_PATH, JSON.stringify(arr, null, 2));
  return entry;
}

/**
 * A naive recall: return entries for the user that match any keyword from the query (topK)
 */
export async function recallMemory(
  user_id: string,
  query: string,
  opts: { topK?: number } = {}
): Promise<MemoryEntry[]> {
  ensureMem();
  const arr: MemoryEntry[] = JSON.parse(fs.readFileSync(MEM_PATH, 'utf8')) || [];
  const userEntries = arr.filter((e) => e.user_id === user_id);
  if (!userEntries.length) {
    return [];
  }

  const qWords = (query || '').toLowerCase().split(/\W+/).filter(Boolean);
  if (!qWords.length) {
    return userEntries.slice(-(opts.topK || 5)).reverse();
  }

  // score by keyword overlap
  const scored = userEntries
    .map((e) => {
      const words = (e.text || '').toLowerCase();
      const score = qWords.reduce((s, w) => s + (words.includes(w) ? 1 : 0), 0);
      return { ...e, score };
    })
    .filter((e) => e.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, opts.topK || 5);
}


