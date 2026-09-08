import { body } from "express-validator";
import { validationErrorHandler } from "../middleware/validation-handler.js";

/**
 * Validation for POST /api/questions (T-09)
 */
export const createQuestionValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 255 })
    .withMessage("Title must be between 5 and 255 characters"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters"),

  validationErrorHandler,
];

/**
 * Validation for POST /api/questions/draft-coach (T-17)
 */
export const generateQuestionDraftCoachValidation = [
  body("title")
    .optional({ checkFalsy: true })
    .trim()
    .isString()
    .withMessage("Title must be a string"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 10 })
    .withMessage("Content must be at least 10 characters"),

  validationErrorHandler,
];
