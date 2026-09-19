<<<<<<< HEAD
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
=======
import express from "express";
import {
  authenticateUser as auth,
  optionalAuth,
} from "../../middleware/authentication.js";

import {
  getSingleQuestionValidation,
  postAnswerValidation,
  getSimilarQuestionsValidation,
  assessAnswerAgainstQuestionValidation,
} from "../../question/validation.js";

import {
  getSingleQuestionController,
  postAnswerController,
  getSimilarQuestionsController,
  assessAnswerAgainstQuestionController,
} from "../../question/quetionDetailController.js";

const router = express.Router();

// 1. Get Single Question with Answers
router.get(
  "/:questionHash",
  optionalAuth,
  getSingleQuestionValidation,
  getSingleQuestionController,
);

// 2. Post Answer to Question
router.post(
  "/:questionHash/answers",
  auth,
  postAnswerValidation,
  postAnswerController,
);

// 3. Get Similar Questions
router.get(
  "/:questionHash/similar",
  optionalAuth,
  getSimilarQuestionsValidation,
  getSimilarQuestionsController,
);

// 4. Assess Answer Fit
router.post(
  "/:questionHash/answer-fit",
  auth,
  assessAnswerAgainstQuestionValidation,
  assessAnswerAgainstQuestionController,
);

export default router;
>>>>>>> fa88eea6ed66efe85ed0af058734a4bf78e32594
