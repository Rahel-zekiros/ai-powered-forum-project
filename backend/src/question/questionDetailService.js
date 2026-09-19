import { safeExecute } from "../../../../db/config.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

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

/**
 * Service for fetching a single question with its answers (Task 10)
 */
export const getSingleQuestionService = async ({ questionHash }) => {
  const [questionRows] = await safeExecute(
    `SELECT ${AUTHOR_SELECT},
            (SELECT COUNT(*) FROM answers a WHERE a.question_id = q.question_id) AS reply_count
     FROM questions q
     JOIN users u ON q.user_id = u.user_id
     WHERE q.question_hash = ?`,
    [questionHash],
  );

  if (!questionRows || questionRows.length === 0) {
    const error = new Error("Question not found");
    error.statusCode = 404;
    throw error;
  }

  const question = mapQuestionRow(questionRows[0]);

  const [answerRows] = await safeExecute(
    `SELECT a.answer_id, a.question_id, a.content, a.created_at, a.updated_at,
            u.user_id AS author_id, u.first_name, u.last_name
     FROM answers a
     JOIN users u ON a.user_id = u.user_id
     WHERE a.question_id = ?
     ORDER BY a.created_at ASC`,
    [questionRows[0].question_id],
  );

  const answers = answerRows.map((row) => ({
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
};