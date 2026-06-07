import { Pinecone } from '@pinecone-database/pinecone';
import { generateEmbedding } from './geminiService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_DB_PATH = path.join(__dirname, '../local_knowledge_base.json');

// Initialize Pinecone client
let pineconeClient = null;
let pineconeIndex = null;
let usePinecone = false;

// Check if Pinecone is configured
if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
  try {
    console.log('[RAG Service] Pinecone credentials found. Initializing Pinecone...');
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX_NAME);
    usePinecone = true;
    console.log(`[RAG Service] ✓ Pinecone connected to index: ${process.env.PINECONE_INDEX_NAME}`);
  } catch (error) {
    console.error('[RAG Service] Pinecone connection failed. Falling back to local vector store:', error.message);
    usePinecone = false;
  }
} else {
  console.log('[RAG Service] Pinecone not configured. Using local vector store fallback.');
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Load local database
 */
function loadLocalKB() {
  if (fs.existsSync(LOCAL_DB_PATH)) {
    try {
      const raw = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('[RAG Service] Error reading local knowledge base:', e.message);
      return [];
    }
  }
  return [];
}

/**
 * Save to local database
 */
function saveLocalKB(data) {
  try {
    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[RAG Service] Saved ${data.length} records to local cache: ${LOCAL_DB_PATH}`);
  } catch (e) {
    console.error('[RAG Service] Error writing to local knowledge base:', e.message);
  }
}

/**
 * Clean query and perform local keyword matching
 */
function keywordSearch(queryText, topK = 3) {
  console.log('[RAG Service] Performing keyword fallback search...');
  const localKB = loadLocalKB();
  if (localKB.length === 0) {
    console.log('[RAG Service] Local knowledge base is empty.');
    return '';
  }

  // Tokenize and clean query
  const stopWords = new Set(['what', 'is', 'a', 'the', 'of', 'to', 'and', 'for', 'in', 'on', 'at', 'with', 'from', 'by', 'an', 'this', 'that', 'you', 'your', 'i', 'we', 'us', 'our', 'it', 'its', 'they', 'them', 'he', 'she', 'who', 'whom', 'whose', 'which', 'where', 'when', 'why', 'how']);
  const queryWords = queryText.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1 && !stopWords.has(word));

  if (queryWords.length === 0) {
    queryWords.push(...queryText.toLowerCase().split(/\s+/).filter(w => w.length > 0));
  }

  console.log('[RAG Service] Cleaned keywords:', queryWords);

  // Score documents based on term frequency
  const scoredMatches = localKB.map(item => {
    const text = item.metadata?.text || '';
    const textLower = text.toLowerCase();
    
    let score = 0;
    queryWords.forEach(word => {
      const regex = new RegExp('\\b' + word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'g');
      const occurrences = (textLower.match(regex) || []).length;
      if (occurrences > 0) {
        score += occurrences;
      } else if (textLower.includes(word)) {
        score += 0.5; // Partial match
      }
    });

    return {
      text: text,
      score: score
    };
  });

  // Sort and retrieve matches
  const results = scoredMatches
    .filter(match => match.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  console.log(`[RAG Service] Keyword search found ${results.length} matches`);
  results.forEach((r, i) => {
    console.log(`  [Match ${i+1}] Score: ${r.score} | Content: "${r.text.substring(0, 50)}..."`);
  });

  return results
    .map(r => r.text)
    .join('\n\n')
    .substring(0, 1000);
}

/**
 * Query knowledge base context
 * @param {string} queryText - The search query
 * @param {number} topK - Number of results to return
 * @returns {Promise<string>} - Context details
 */
export async function queryContext(queryText, topK = 3) {
  try {
    console.log(`[RAG Service] Querying knowledge base for: "${queryText.substring(0, 60)}..."`);
    
    let queryEmbedding = null;
    try {
      // Generate embedding for query
      queryEmbedding = await generateEmbedding(queryText);
    } catch (embErr) {
      console.warn('[RAG Service] Embedding generation failed. Falling back to keyword search:', embErr.message);
      return keywordSearch(queryText, topK);
    }
    
    if (usePinecone && pineconeIndex) {
      try {
        console.log('[RAG Service] Querying Pinecone index...');
        const response = await pineconeIndex.query({
          vector: queryEmbedding,
          topK: topK,
          includeMetadata: true
        });
        
        const matches = response.matches || [];
        console.log(`[RAG Service] Pinecone returned ${matches.length} matches`);
        
        return matches
          .filter(match => match.score > 0.4)
          .map(match => match.metadata?.text || '')
          .filter(text => text.length > 0)
          .join('\n\n')
          .substring(0, 1000);
      } catch (err) {
        console.warn('[RAG Service] Pinecone query failed, falling back to local search:', err.message);
      }
    }
    
    // Local vector search fallback
    console.log('[RAG Service] Performing local vector search...');
    const localKB = loadLocalKB();
    if (localKB.length === 0) {
      console.log('[RAG Service] Local knowledge base is empty. Performing direct text matching...');
      return keywordSearch(queryText, topK);
    }
    
    // Calculate similarities
    const scoredMatches = localKB.map(item => {
      const score = cosineSimilarity(queryEmbedding, item.values);
      return {
        text: item.metadata?.text || '',
        score: score
      };
    });
    
    // Sort and retrieve top results
    const results = scoredMatches
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(match => match.score > 0.4);
      
    console.log(`[RAG Service] Local search found ${results.length} matches (threshold > 0.4)`);
    results.forEach((r, i) => {
      console.log(`  [Match ${i+1}] Score: ${r.score.toFixed(3)} | Content: "${r.text.substring(0, 50)}..."`);
    });
    
    if (results.length === 0) {
      console.log('[RAG Service] Local vector search returned 0 matches above threshold. Trying keyword search...');
      return keywordSearch(queryText, topK);
    }
    
    return results
      .map(r => r.text)
      .join('\n\n')
      .substring(0, 1000);
      
  } catch (error) {
    console.error('[RAG Service] Error querying context:', error.message);
    return keywordSearch(queryText, topK);
  }
}

/**
 * Upsert vectors to store
 */
export async function upsertVectors(vectors) {
  try {
    // 1. Always save to local cache so local search works as backup
    const localKB = loadLocalKB();
    
    // Merge or insert vectors
    const vectorMap = new Map(localKB.map(v => [v.id, v]));
    for (const v of vectors) {
      vectorMap.set(v.id, v);
    }
    
    saveLocalKB(Array.from(vectorMap.values()));
    
    // 2. Upload to Pinecone if active
    if (usePinecone && pineconeIndex) {
      console.log('[RAG Service] Upserting to Pinecone...');
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await pineconeIndex.upsert(batch);
      }
      console.log('[RAG Service] ✓ Pinecone upload complete');
    }
  } catch (error) {
    console.error('[RAG Service] Error upserting vectors:', error.message);
    throw error;
  }
}

/**
 * Get index stats
 */
export async function getIndexStats() {
  if (usePinecone && pineconeIndex) {
    try {
      const stats = await pineconeIndex.describeIndexStats();
      return {
        totalRecordCount: stats.totalRecordCount,
        dimension: stats.dimension
      };
    } catch (e) {
      console.warn('[RAG Service] Failed to get Pinecone stats:', e.message);
    }
  }
  
  const localKB = loadLocalKB();
  return {
    totalRecordCount: localKB.length,
    dimension: localKB[0]?.values?.length || 768
  };
}

export default {
  queryContext,
  upsertVectors,
  getIndexStats
};
