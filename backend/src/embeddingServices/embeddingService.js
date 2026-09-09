import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate a vector embedding for a given text.
 * @param {string} text - The text to embed.
 * @param {string} taskType - Optional task type (e.g., 'RETRIEVAL_DOCUMENT', 'RETRIEVAL_QUERY'). Defaults to 'RETRIEVAL_DOCUMENT'.
 * @returns {Promise<number[]>} The vector embedding array.
 */
export const getEmbedding = async (text, taskType = 'RETRIEVAL_DOCUMENT') => {
  if (!text) {
    throw new Error('Text is required to generate an embedding.');
  }

  const model = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
  
  try {
    const response = await ai.models.embedContent({
      model: model,
      contents: text,
      config: {
        taskType: taskType,
      }
    });

    if (!response.embeddings || response.embeddings.length === 0) {
      throw new Error('No embeddings returned from Gemini API.');
    }

    return response.embeddings[0].values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};
