import { StatusCodes } from "http-status-codes";

/**
 * Global Error Handling Middleware
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Default error shape
  const errorResponse = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    message:
      err.message || "An unexpected error occurred. Please try again later.",
  };

  // Handle MySQL Duplicate Entry Errors (e.g. Unique Email constraint)
  if (err?.code === "ER_DUP_ENTRY") {
    errorResponse.statusCode = StatusCodes.BAD_REQUEST;
    errorResponse.message =
      "The entered email or unique identifier already exists.";
  }

  // Handle JSON Syntax Errors in request body
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    errorResponse.statusCode = StatusCodes.BAD_REQUEST;
    errorResponse.message = "Malformed JSON payload in request body.";
  }

  // Log error stack in development environment
  if (process.env.NODE_ENV !== "production") {
    console.error(" Internal Error Details:", err);
  }

  return res.status(errorResponse.statusCode).json({
    success: false,
    message: errorResponse.message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

// Backwards compatibility alias
export const errorHandler = globalErrorHandler;
export default globalErrorHandler;
