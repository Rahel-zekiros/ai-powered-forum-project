import jwt from "jsonwebtoken";
import { UnauthenticatedError } from "../utils/errors/index.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is not defined in environment variables.",
  );
}

/**
 * Middleware: Validates JWT Access Token from HTTP Authorization Header
 */
export const verifyAuthToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError(
      "Access denied. No authentication token provided.",
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedPayload = jwt.verify(token, JWT_SECRET);

    // Attach user information to request object
    req.user = {
      id: decodedPayload.id,
      email: decodedPayload.email,
      firstName: decodedPayload.firstName,
      lastName: decodedPayload.lastName,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthenticatedError(
        "Authentication token has expired. Please sign in again.",
      );
    }
    throw new UnauthenticatedError("Invalid authentication token.");
  }
};

// Backwards compatibility alias
export const authenticateUser = verifyAuthToken;
export default verifyAuthToken;
