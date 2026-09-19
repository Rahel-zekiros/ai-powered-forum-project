<<<<<<< HEAD
import { body, query, param } from "express-validator";

export const createQuestionValidation = [
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .isString()
    .withMessage("Title must be a string")
    .isLength({ min: 5, max: 255 })
    .withMessage("Title must be between 5 and 255 characters long"),
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long"),
];

export const getQuestionsValidation = [
  query("search")
    .optional()
    .isString()
    .withMessage("Search query must be a string"),
  query("mine")
    .optional()
    .isBoolean()
    .withMessage("mine must be true or false")
    .toBoolean(),
];

export const getSingleQuestionValidation = [
  param("questionHash")
    .notEmpty()
    .withMessage("Question hash is required")
    .matches(/^[a-f0-9]{16}$/)
    .withMessage("Question hash must be a 16-character lowercase hex string"),
];

export const searchQuestionsValidation = [
  query("query")
    .notEmpty()
    .withMessage("Search query is required")
    .isString()
    .withMessage("Search query must be a string")
    .isLength({ min: 5 })
    .withMessage("Search query must be at least 5 characters long"),
  query("k")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("k must be an integer between 1 and 20"),
  query("threshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("Threshold must be a float between 0 and 1"),
];

export const getSimilarQuestionsValidation = [
  param("questionHash")
    .notEmpty()
    .withMessage("Question hash is required")
    .matches(/^[a-f0-9]{16}$/)
    .withMessage("Question hash must be a 16-character lowercase hex string"),
  query("k")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("k must be an integer between 1 and 20"),
  query("threshold")
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage("Threshold must be a float between 0 and 1"),
];

export const generateQuestionDraftCoachValidation = [
  body("title").optional().isString().withMessage("Title must be a string"),
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .isString()
    .withMessage("Content must be a string"),
];

export const assessAnswerAgainstQuestionValidation = [
  param("questionHash")
    .notEmpty()
    .withMessage("Question hash is required")
    .matches(/^[a-f0-9]{16}$/)
    .withMessage("Question hash must be a 16-character lowercase hex string"),
  body("answerText")
    .notEmpty()
    .withMessage("Answer text is required")
    .isString()
    .withMessage("Answer text must be a string")
    .isLength({ min: 20 })
    .withMessage("Answer text must be at least 20 characters long"),
];
=======
import { param, body, query } from "express-validator";
import { validationErrorHandler } from "../middleware/validation-handler.js";

/**
 * T-07: Create Question Validation
 *
 * Validates the title and content before creating a question.
 */

export const createQuestionValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required.")
    .isLength({ min: 5, max: 255 })
    .withMessage("Title must be between 5 and 255 characters."),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required.")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long."),

  validationErrorHandler,
];

/**
 * T-13: AI Question Draft Coach Validation
 *
 * Validates the question draft before sending it to Gemini AI. */

export const generateQuestionDraftCoachValidation = [
  body("title")
    .optional()
    .trim()
    .isString()
    .withMessage("Title must be a string."),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required.")
    .isString()
    .withMessage("Content must be a string.")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters long."),

  validationErrorHandler,
];

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
  body("content").trim().notEmpty().withMessage("Answer content is required"),
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
>>>>>>> fa88eea6ed66efe85ed0af058734a4bf78e32594
