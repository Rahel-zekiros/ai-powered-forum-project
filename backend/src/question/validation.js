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
