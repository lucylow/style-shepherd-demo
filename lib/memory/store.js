/**
 * Memory Store (File-based)
 * Simple file-based memory store for demo
 * In production, replace with Redis or database-backed store
 */

const fs = require('fs').promises;
const path = require('path');

const memoryDir = path.join(__dirname, '..', 'logs', 'memory');

/**
 * Add a memory item to a session
 */
async function addMemory(sessionId, item) {
  try {
    await fs.mkdir(memoryDir, { recursive: true });
    
    const filePath = path.join(memoryDir, `${sessionId}.json`);
    let memories = [];
    
    try {
      const existing = await fs.readFile(filePath, 'utf-8');
      memories = JSON.parse(existing);
    } catch (error) {
      // File doesn't exist yet, start fresh
      memories = [];
    }
    
    memories.push({
      ...item,
      timestamp: new Date().toISOString(),
    });
    
    await fs.writeFile(filePath, JSON.stringify(memories, null, 2), 'utf-8');
    
    return { success: true, count: memories.length };
  } catch (error) {
    console.error('Memory store error:', error);
    throw error;
  }
}

/**
 * Get all memories for a session
 */
async function getMemory(sessionId) {
  try {
    const filePath = path.join(memoryDir, `${sessionId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist, return empty array
    return [];
  }
}

module.exports = {
  addMemory,
  getMemory,
};

