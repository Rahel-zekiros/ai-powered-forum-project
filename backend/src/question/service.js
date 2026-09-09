import { safeExecute } from '../../db/config.js';
import { getEmbedding } from '../embeddingServices/embeddingService.js';

/**
 * List Questions
 * Handles keyword searching and user filtering.
 */
export const getQuestionsService = async ({ search, mine, userId }) => {
  let query = `
    SELECT 
      q.question_id AS id, q.question_hash AS questionHash, q.title, q.content, q.created_at AS createdAt, q.updated_at AS updatedAt,
      u.user_id AS authorId, u.first_name AS authorFirstName, u.last_name AS authorLastName,
      COUNT(a.answer_id) AS answerCount
    FROM questions q
    JOIN users u ON q.user_id = u.user_id
    LEFT JOIN answers a ON q.question_id = a.question_id
    WHERE 1=1
  `;
  const params = [];

  if (mine === 'true' || mine === true) {
    query += ` AND q.user_id = ?`;
    params.push(userId);
  }

  if (search) {
    query += ` AND (q.title LIKE ? OR q.content LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }

  query += ` GROUP BY q.question_id ORDER BY q.created_at DESC LIMIT 100`;

  const rows = await safeExecute(query, params);

  return rows.map(row => ({
    id: row.id,
    questionHash: row.questionHash,
    title: row.title,
    content: row.content,
    answerCount: row.answerCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.authorId,
      firstName: row.authorFirstName,
      lastName: row.authorLastName
    }
  }));
};

/**
 * Helper for Task T-11
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Semantic Search Questions
 * Embeds the user query and computes cosine similarity against all stored vectors.
 */
export const searchQuestionsSemanticService = async ({ query, k = 5, threshold }) => {
  const envThreshold = parseFloat(process.env.RECOMMEND_THRESHOLD || 0.75);
  const minThreshold = threshold !== undefined ? parseFloat(threshold) : envThreshold;
  const limit = parseInt(k, 10);

  // 1. Embed query (using Gemini text-embedding-004)
  const queryEmbedding = await getEmbedding(query, 'RETRIEVAL_QUERY');

  // 2. Fetch vectors
  const vectorRows = await safeExecute(`SELECT question_id, embedding FROM question_vectors WHERE status = 'ready'`, []);
  
  // 3. Compute similarity
  const scored = vectorRows.map(row => {
    const dbVector = typeof row.embedding === 'string' ? JSON.parse(row.embedding) : row.embedding;
    return {
      questionId: row.question_id,
      score: cosineSimilarity(queryEmbedding, dbVector)
    };
  });

  // 4. Filter and sort
  const filtered = scored
    .filter(item => item.score >= minThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (filtered.length === 0) return [];

  // 5. Fetch hydrated details
  const questionIds = filtered.map(f => f.questionId);
  const inClause = questionIds.map(() => '?').join(',');
  const querySql = `
    SELECT 
      q.question_id AS id, q.question_hash AS questionHash, q.title, q.content, q.created_at AS createdAt, q.updated_at AS updatedAt,
      u.user_id AS authorId, u.first_name AS authorFirstName, u.last_name AS authorLastName,
      (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS answerCount
    FROM questions q
    JOIN users u ON q.user_id = u.user_id
    WHERE q.question_id IN (${inClause})
  `;
  const hydratedRows = await safeExecute(querySql, questionIds);

  // Map and attach scores in original sorted order
  return filtered.map(f => {
    const row = hydratedRows.find(r => r.id === f.questionId);
    return {
      id: row.id,
      questionHash: row.questionHash,
      title: row.title,
      content: row.content,
      answerCount: row.answerCount,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      author: {
        id: row.authorId,
        firstName: row.authorFirstName,
        lastName: row.authorLastName
      },
      score: f.score
    };
  });
};
