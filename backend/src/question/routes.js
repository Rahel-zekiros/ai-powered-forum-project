import express from "express";
import {
  getQuestionsController,
  searchQuestionsSemanticController,
  createQuestionController,
  generateQuestionDraftCoachController,
} from "./controller.js";

import { authenticateUser } from "../middleware/authentication.js";
import {
  createQuestionValidation,
  generateQuestionDraftCoachValidation,
} from "../../question/validation.js";

const questionRouter = express.Router();

/**
 * T-07: Create Question & Auto-Embed
 *
 * POST /api/questions
 */
questionRouter.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

// Semantic Search Questions
questionRouter.get(
  "/search",
  authenticateUser,
  searchQuestionsSemanticController,
);

/**
 * T-13: AI Question Draft Coach
 *
 * POST /api/questions/draft-coach
 */
questionRouter.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

// List Questions (with keyword search and mine filter)
questionRouter.get("/", authenticateUser, getQuestionsController);

export default questionRouter;
