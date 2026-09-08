import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001";

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is required");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Generates a vector embedding for a piece of text using Gemini.
 *
 * @param {string} text - The text to embed.
 * @param {Object} [options] - Optional overrides.
 * @param {string} [options.taskType] - Gemini embedding task type
 *   (e.g. 'RETRIEVAL_DOCUMENT', 'RETRIEVAL_QUERY').
 * @returns {Promise<number[]>} The embedding vector.
 * @throws {Error} If the Gemini API call fails.
 */
export const generateEmbedding = async (
  text,
  { taskType = "RETRIEVAL_DOCUMENT" } = {},
) => {
  const response = await ai.models.embedContent({
    model: GEMINI_EMBEDDING_MODEL,
    contents: text,
    config: { taskType },
  });

  const values = response?.embeddings?.[0]?.values;

  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Gemini returned an empty embedding");
  }

  return values;
};
