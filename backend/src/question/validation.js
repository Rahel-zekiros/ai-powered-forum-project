import { param, body, query } from "express-validator";

/**
 * 1. Question by Hash with Answer Validation
 */
export const getSingleQuestionValidation = [
  param("questionHash")
    .notEmpty()
    .withMessage("Question hash is required")
    .isHexadecimal()
    .withMessage("Invalid question hash format"),
];

/**
 * 2. Answer Post Validation
 */
export const postAnswerValidation = [
  param("questionHash")
    .notEmpty()
    .withMessage("Question hash is required")
    .isHexadecimal()
    .withMessage("Invalid question hash format"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Answer content is required"),
];

/**
 * 3. Similar Questions Validation
 */
export const getSimilarQuestionsValidation = [
  param("questionHash")
    .notEmpty()
    .withMessage("Question hash is required")
    .isHexadecimal()
    .withMessage("Invalid question hash format"),
  query("k")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("k must be an integer between 1 and 20"),
  query("threshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("Threshold must be a float between 0 and 1"),
];

/**
 * 4. Answer Draft Fit Evaluation Validation
 */
export const assessAnswerAgainstQuestionValidation = [
  param("questionHash")
    .notEmpty()
    .withMessage("Question hash is required")
    .isHexadecimal()
    .withMessage("Invalid question hash format"),
  body("answerText")
    .trim()
    .notEmpty()
    .withMessage("Answer text is required to evaluate fit"),
];