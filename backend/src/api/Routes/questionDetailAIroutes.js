import express from "express";
import {
  authenticateUser as auth,
  optionalAuth,
} from "../../../middleware/authentication.js";

import {
  createQuestionValidation,
  getQuestionsValidation,
  getSingleQuestionValidation,
  searchQuestionsValidation,
  getSimilarQuestionsValidation,
  generateQuestionDraftCoachValidation,
  assessAnswerAgainstQuestionValidation,
} from "../../question/validation.js";

import {
  createQuestionController,
  getQuestionsController,
  getSingleQuestionController,
  searchQuestionsController,
  getSimilarQuestionsController,
  generateQuestionDraftCoachController,
  assessAnswerAgainstQuestionController,
} from "../../question/questionDetailController.js";

const router = express.Router();

router.post(
  "/draft-coach",
  optionalAuth,
  generateQuestionDraftCoachValidation,
  generateQuestionDraftCoachController,
);

router.post("/", auth, createQuestionValidation, createQuestionController);

router.get("/", optionalAuth, getQuestionsValidation, getQuestionsController);

router.get(
  "/search",
  optionalAuth,
  searchQuestionsValidation,
  searchQuestionsController,
);

router.get(
  "/:questionHash",
  optionalAuth,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

router.get(
  "/:questionHash/similar",
  optionalAuth,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

router.post(
  "/:questionHash/answer-fit",
  auth,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);

export default router;
