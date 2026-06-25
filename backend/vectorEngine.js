const lancedb = require('@lancedb/lancedb');
const { pipeline } = require('@xenova/transformers');
const path = require('path');
const fs = require('fs');

let db;
let extractor;
const DB_PATH = path.join(__dirname, 'vector_db');

/**
 * Initialize the vector database and embedding model
 */
async function initVectorDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(DB_PATH, { recursive: true });
  }

  db = await lancedb.connect(DB_PATH);
  
  // Initialize the embedding pipeline
  // Using a small, fast model suitable for local CPU
  extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  
  console.log('Vector Database and Embedding Model initialized.');
}

/**
 * Generate embedding for a given text
 */
async function generateEmbedding(text) {
  if (!extractor) await initVectorDB();
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

/**
 * Add a memory to the vector database
 */
async function addMemory(userId, content, category, metadata = {}) {
  if (!db) await initVectorDB();
  
  const vector = await generateEmbedding(content);
  const tableNames = await db.tableNames();
  
  let table;
  if (!tableNames.includes('memories')) {
    table = await db.createTable('memories', [{
      vector,
      userId,
      content,
      category,
      timestamp: new Date().toISOString(),
      ...metadata
    }]);
  } else {
    table = await db.openTable('memories');
    await table.add([{
      vector,
      userId,
      content,
      category,
      timestamp: new Date().toISOString(),
      ...metadata
    }]);
  }
}

/**
 * Search for relevant memories
 */
async function searchMemories(userId, query, limit = 5) {
  if (!db) await initVectorDB();
  
  const vector = await generateEmbedding(query);
  const tableNames = await db.tableNames();
  
  if (!tableNames.includes('memories')) return [];
  
  const table = await db.openTable('memories');
  const queryBuilder = table.search(vector)
    .where(`userId = ${userId}`)
    .limit(limit);
    
  const results = await queryBuilder.toArray();
  return results;
}

module.exports = {
  initVectorDB,
  addMemory,
  searchMemories
};
