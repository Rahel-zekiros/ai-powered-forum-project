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
