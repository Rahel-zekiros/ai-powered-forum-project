import crypto from "crypto";
import { safeExecute } from "../../db/config.js";
import { generateEmbedding } from "../embeddingServices/embeddingService.js";

/**
 * Generates a random 16-character hex hash for public question URLs.
 *
 * @returns {string} A 16-character hex string.
 */
const generateQuestionHash = () => crypto.randomBytes(8).toString("hex");

/**
 * Creates a question and asynchronously stores a vector embedding of
 * its title for semantic search.
 *
 * @param {Object} params
 * @param {string} params.title - The question title.
 * @param {string} params.content - The question content/body.
 * @param {number} params.userId - The authenticated user's id.
 * @returns {Promise<Object>} The created question record.
 */
export const createQuestionWithVectorService = async ({
  title,
  content,
  userId,
}) => {
  const questionHash = generateQuestionHash();

  const insertSql = `
    INSERT INTO questions (question_hash, user_id, title, content)
    VALUES (?, ?, ?, ?)
  `;
  const result = await safeExecute(insertSql, [
    questionHash,
    userId,
    title,
    content,
  ]);

  const questionId = result.insertId;

  // Auto-embed the title for semantic search. A failed embedding must
  // never fail question creation — the question is already saved.
  try {
    const embedding = await generateEmbedding(title, {
      taskType: "RETRIEVAL_DOCUMENT",
    });

    await safeExecute(
      `INSERT INTO question_vectors (question_id, source_text, embedding, status)
       VALUES (?, ?, ?, 'ready')`,
      [questionId, title, JSON.stringify(embedding)],
    );
  } catch (error) {
    console.error(
      `Embedding failed for question ${questionId}:`,
      error.message,
    );
    await safeExecute(
      `INSERT INTO question_vectors (question_id, source_text, embedding, status)
       VALUES (?, ?, ?, 'failed')`,
      [questionId, title, JSON.stringify([])],
    );
  }

  return {
    id: questionId,
    questionHash,
    title,
    content,
    userId,
  };
};
