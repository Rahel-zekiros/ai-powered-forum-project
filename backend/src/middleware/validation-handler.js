import { validationResult } from "express-validator";
import { InvalidInputError } from "../utils/errors/index.js";

/**
 * Express Middleware: Inspects request validation results and throws custom error
 */
export const handleValidationErrors = (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    // Format error messages cleanly
    const formattedErrorMessages = validationErrors
      .array()
      .map((err) => err.msg)
      .filter((msg, index, self) => self.indexOf(msg) === index) // Removes duplicate error messages
      .join(". ");

    throw new InvalidInputError(formattedErrorMessages);
  }

  next();
};

// Backwards compatibility alias (if imported elsewhere as validationErrorHandler)
export const validationErrorHandler = handleValidationErrors;
export default handleValidationErrors;
