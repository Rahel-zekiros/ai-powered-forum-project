import { safeExecute } from "../../db/config.js";

// ==========================================
// Vector Magnitude
// ==========================================

export const vectorMagnitude = (vector) => {
  let sum = 0;

  for (const value of vector) {
    sum += value * value;
  }

  return Math.sqrt(sum);
};

// ==========================================
// Cosine Similarity
// ==========================================
export const cosineSimilarity = (vectorA, vectorB) => {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    return 0;
  }

  if (vectorA.length === 0 || vectorB.length === 0) {
    return 0;
  }
  if (vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }

  const magnitudeA = vectorMagnitude(vectorA);
  const magnitudeB = vectorMagnitude(vectorB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
};
// ==========================================
// Get Document Chunks + Vectors
// ==========================================

export const getDocumentChunks = async (documentId) => {
  const result = await safeExecute(
    `
    SELECT
      dc.chunk_id,
      dc.document_id,
      dc.content,
      dc.chunk_index,
      dc.page_start,
      dc.page_end,
      dcv.embedding_vector
    FROM document_chunks AS dc
    INNER JOIN document_chunk_vectors AS dcv
      ON dc.chunk_id = dcv.chunk_id
    WHERE dc.document_id = ?
      AND dcv.status = ?
    ORDER BY dc.chunk_index ASC
    `,
    [documentId, "ready"],
  );

  if (Array.isArray(result)) {
    return result;
  }

  if (result && Array.isArray(result[0])) {
    return result[0];
  }

  return [];
};

// ==========================================
// Rank Chunks By Similarity
// ==========================================

export const rankChunks = (chunks, queryEmbedding) => {
  return (
    chunks
      .map((chunk) => {
        let storedVector;

        // ==========================================
        // Parse stored embedding
        // ==========================================

        try {
          storedVector =
            typeof chunk.embedding_vector === "string"
              ? JSON.parse(chunk.embedding_vector)
              : chunk.embedding_vector;
        } catch (err) {
          console.error(`Invalid embedding for chunk ${chunk.chunk_id}`, err);

          return null;
        }

        // ==========================================
        // Calculate cosine similarity
        // ==========================================

        const rawSimilarity = cosineSimilarity(queryEmbedding, storedVector);

        // Round to 3 decimal places
        const score = Number(rawSimilarity.toFixed(3));

        // ==========================================
        // Return ranked chunk information
        // ==========================================

        return {
          chunkId: chunk.chunk_id,

          // IMPORTANT:
          // Needed to identify which document
          // the matching chunk belongs to.
          documentId: chunk.document_id,

          chunkIndex: chunk.chunk_index,

          pageStart: chunk.page_start,

          pageEnd: chunk.page_end,

          content: chunk.content,

          similarity: score,

          relevance: score,
        };
      })
      // Remove invalid chunks
      .filter(Boolean)

      // Highest similarity first
      .sort((a, b) => b.similarity - a.similarity)
  );
};
