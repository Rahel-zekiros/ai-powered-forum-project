import express from "express";
import {
  createQuestionController,
  generateQuestionDraftCoachController,
} from "../../question/controller.js";
import {
  createQuestionValidation,
  generateQuestionDraftCoachValidation,
} from "../../question/validation.js";
import { authenticateUser } from "../../middleware/authentication.js";

const router = express.Router();

/**
 * @route POST /api/questions/draft-coach
 * @desc Get AI feedback/tips on a question draft (T-17)
 * @access Protected
 */
router.post(
  "/draft-coach",
  authenticateUser,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

/**
 * @route POST /api/questions
 * @desc Create a question and auto-generate its vector embedding (T-09)
 * @access Protected
 */
router.post(
  "/",
  authenticateUser,
  createQuestionValidation,
  createQuestionController,
);

export default router;
