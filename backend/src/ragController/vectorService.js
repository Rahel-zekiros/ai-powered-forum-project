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
