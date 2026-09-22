import { param } from "express-validator";
import { validationErrorHandler } from "../middleware/validation-handler.js";

// *======= get meta document and list documents========
export const documentIdParamValidation = [
  param("documentId")
    .isInt({ min: 1 })
    .withMessage("documentId must be a positive integer."),

  validationErrorHandler,
];
