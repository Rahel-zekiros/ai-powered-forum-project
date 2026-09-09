import { body } from "express-validator";
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
    .withMessage("Content must be a string."),

  validationErrorHandler,
];
