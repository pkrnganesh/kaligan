import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generate embedding using Gemini text-embedding-004
 * @param {string} text - Text to embed
 * @returns {Promise<Array<number>>} - Embedding vector
 */
export async function generateEmbedding(text) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in the environment');
    }

    // Reuse or re-initialize if the key changed
    const ai = process.env.GEMINI_API_KEY ? genAI : new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: 'text-embedding-004' });
    
    const result = await model.embedContent(text);
    const embedding = result.embedding;

    if (!embedding || !embedding.values) {
      throw new Error('Failed to generate embedding values');
    }

    return embedding.values;
  } catch (error) {
    console.error('[Gemini Service] Error generating embedding:', error.message);
    throw error;
  }
}

export default {
  generateEmbedding
};
