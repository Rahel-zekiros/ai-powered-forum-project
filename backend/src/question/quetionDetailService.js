import { safeExecute } from "../../db/config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const mapQuestionRow = (row) => ({
  id: row.question_id,
  questionHash: row.question_hash,
  title: row.title,
  content: row.content,
  answerCount: row.reply_count ?? 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? row.created_at,
  author: {
    id: row.author_id,
    firstName: row.first_name,
    lastName: row.last_name,
  },
});

const AUTHOR_SELECT = `
  q.question_id, q.question_hash, q.title, q.content, q.created_at, q.updated_at, q.user_id,
  u.user_id AS author_id, u.first_name, u.last_name
`;

const cosSimilarity = (vecA, vecB) => {
  const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
};

/**
 * 1. Question by Hash with Answer (getSingleQuestionService)
 */
export const getSingleQuestionService = async ({ questionHash }) => {
  const result = await safeExecute(
    `SELECT ${AUTHOR_SELECT},
            (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS reply_count
     FROM questions q
     JOIN users u ON q.user_id = u.user_id
     WHERE q.question_hash = ?`,
    [questionHash],
  );

  const questionRows = Array.isArray(result?.[0]) ? result[0] : result;

  if (!questionRows || !Array.isArray(questionRows) || questionRows.length === 0 || !questionRows[0]) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  const question = mapQuestionRow(questionRows[0]);

  const answerResult = await safeExecute(
    `SELECT a.answer_id, a.question_id, a.content, a.created_at, a.updated_at,
            u.user_id AS author_id, u.first_name, u.last_name
     FROM answers a
     JOIN users u ON a.user_id = u.user_id
     WHERE a.question_id = ?
     ORDER BY a.created_at ASC`,
    [questionRows[0].question_id],
  );

  const answerRows = Array.isArray(answerResult?.[0]) ? answerResult[0] : answerResult;

  const answers = (answerRows || []).map((row) => ({
    id: row.answer_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  }));

  return {
    question,
    answers,
    answersMeta: { limit: 100, total: answers.length },
  };
}; /**
 * 2. Answer Post (postAnswerService)
 */
export const postAnswerService = async ({ questionHash, content, userId }) => {
  // 1. check if exist the question
  const result = await safeExecute(
    `SELECT question_id FROM questions WHERE question_hash = ?`,
    [questionHash],
  );

  const questionRows = Array.isArray(result?.[0]) ? result[0] : result;

  if (!questionRows || !Array.isArray(questionRows) || questionRows.length === 0 || !questionRows[0]) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  const questionId = questionRows[0].question_id;

  // 2. post answer
  const insertResult = await safeExecute(
    `INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)`,
    [questionId, userId, content],
  );

  const newAnswerId = insertResult?.[0]?.insertId ?? insertResult?.insertId;

  // 3. fetch the answer with user
  const newAnswerResult = await safeExecute(
    `SELECT 
        a.answer_id AS id, 
        a.question_id AS questionId, 
        a.content, 
        a.created_at AS createdAt, 
        a.updated_at AS updatedAt,
        u.user_id AS author_id, 
        u.first_name, 
        u.last_name
     FROM answers a
     JOIN users u ON a.user_id = u.user_id
     WHERE a.answer_id = ?`,
    [newAnswerId],
  );

  const newAnswerRows = Array.isArray(newAnswerResult?.[0]) ? newAnswerResult[0] : newAnswerResult;

  if (!newAnswerRows || !newAnswerRows[0]) {
    const error = new Error("Failed to retrieve created answer");
    error.statusCode = 500;
    throw error;
  }

  const row = newAnswerRows[0];

  return {
    id: row.id,
    questionId: row.questionId,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
    author: {
      id: row.author_id,
      firstName: row.first_name,
      lastName: row.last_name,
    },
  };
};
 


/**
 * Service to retrieve similar questions based on cosine similarity (Task 13) mulugeta bezabh
 */
export const getSimilarQuestionsService = async ({
  questionHash,
  userId,
  k = 5,
  threshold = 0.75,
}) => {
  const sourceResult = await safeExecute(
    `SELECT qv.question_id, qv.embedding_vector AS embedding
     FROM question_vectors qv
     JOIN questions q ON qv.question_id = q.question_id
     WHERE q.question_hash = ?`,
    [questionHash],
  );

  const sourceRows = Array.isArray(sourceResult?.[0]) ? sourceResult[0] : sourceResult;

  if (!sourceRows || !Array.isArray(sourceRows) || sourceRows.length === 0 || !sourceRows[0]) {
    return {
      data: [],
      meta: { total: 0, k: parseInt(k, 10), threshold: parseFloat(threshold), query: null, questionHash },
    };
  }

  const sourceQuestionId = sourceRows[0].question_id;
  const sourceEmbedding =
    typeof sourceRows[0].embedding === "string"
      ? JSON.parse(sourceRows[0].embedding)
      : sourceRows[0].embedding;

  const targetResult = await safeExecute(
    `SELECT qv.question_id, qv.embedding_vector AS embedding
     FROM question_vectors qv
     WHERE qv.question_id != ? AND qv.status = 'ready'`,
    [sourceQuestionId],
  );

  const targetRows = Array.isArray(targetResult?.[0]) ? targetResult[0] : targetResult;

  const scoredQuestions = (targetRows || []).map((row) => {
    const targetEmbedding =
      typeof row.embedding === "string"
        ? JSON.parse(row.embedding)
        : row.embedding;
    return {
      question_id: row.question_id,
      score: cosSimilarity(sourceEmbedding, targetEmbedding),
    };
  });

  const filtered = scoredQuestions
    .filter((q) => q.score >= parseFloat(threshold))
    .sort((a, b) => b.score - a.score)
    .slice(0, parseInt(k, 10));

  const questionIds = filtered.map((q) => q.question_id);
  let data = [];

  if (questionIds.length > 0) {
    const placeholders = questionIds.map(() => "?").join(",");
    const detailsResult = await safeExecute(
      `SELECT ${AUTHOR_SELECT},
              (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS reply_count
       FROM questions q
       JOIN users u ON q.user_id = u.user_id
       WHERE q.question_id IN (${placeholders})`,
      questionIds,
    );

    const questionDetails = Array.isArray(detailsResult?.[0]) ? detailsResult[0] : detailsResult;

    data = filtered.map((similar) => {
      const details = (questionDetails || []).find(
        (q) => q.question_id === similar.question_id,
      );
      return details ? { ...mapQuestionRow(details), score: similar.score } : null;
    }).filter(Boolean);
  }

  return {
    data,
    meta: {
      total: data.length,
      k: parseInt(k, 10),
      threshold: parseFloat(threshold),
      query: null,
      questionHash,
    },
  };
};

/**
 * Service for AI Answer Fit Evaluation (Task 14) Abdulhadi seid
 */
export const assessAnswerAgainstQuestionService = async ({
  questionHash,
  answerText,
}) => {
  const result = await safeExecute(
    `SELECT q.title, q.content FROM questions q WHERE q.question_hash = ?`,
    [questionHash],
  );

  const questionRows = Array.isArray(result?.[0]) ? result[0] : result;

  if (!questionRows || !Array.isArray(questionRows) || questionRows.length === 0 || !questionRows[0]) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  const { title: questionTitle, content: questionContent } = questionRows[0];

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.6-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = `
You are an expert technical evaluator. Evaluate whether the provided answer properly addresses the core issue in the question below.

Original Question Title: ${questionTitle || "No title provided"}
Original Question Content: ${questionContent}

Draft Answer to Evaluate:
${answerText}

Respond ONLY in valid JSON with exactly these two keys:
- "level": one of "strong", "partial", or "weak"
- "note": a short (1-2 sentence) explanation of the rating and how the answer could improve
  `;

  const responseResult = await model.generateContent(prompt);
  const responseText = responseResult.response.text();

  try {
    const parsed = JSON.parse(responseText);
    return {
      level: parsed.level || "unknown",
      note: parsed.note || responseText,
    };
  } catch (parseError) {
    return { level: "unknown", note: responseText };
  }
};