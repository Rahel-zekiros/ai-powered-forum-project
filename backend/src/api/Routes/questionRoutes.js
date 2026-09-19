import express from "express";

import { authenticateUser } from "../../middleware/authentication.js";

import {
  createQuestionController, 
  generateQuestionDraftCoachController, 
} from "../../question/controller.js";

import {
  createQuestionValidation, 
  generateQuestionDraftCoachValidation,
} from "../../question/validation.js";

const router = express.Router();

/**
 * T-07: Create Question & Auto-Embed
 *
 * POST /api/questions
 *
 * Creates a new question and automatically generates
 * an AI vector embedding for semantic search.
 */
router.post(
  "/",
 authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

/**
 * T-13: AI Question Draft Coach
 *
 * POST /api/questions/draft-coach
 *
 * Generates AI feedback and suggestions
 * for a question draft before submission.
 */
router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

export default router;
