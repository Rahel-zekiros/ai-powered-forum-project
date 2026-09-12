import { validationResult } from "express-validator";
import { BadRequestError } from "../../../utils/errors/index.js";
// Custom validation error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstErrorMessage = errors.array()[0].msg;
    throw new BadRequestError(firstErrorMessage);
  }
  next();
};
export const validateUserRegistration = [
  // Express validator field chains
  (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || firstName.trim().length < 3) {
      throw new BadRequestError(
        "First name is required and must be at least 3 characters.",
      );
    }
    if (!lastName || lastName.trim().length < 3) {
      throw new BadRequestError(
        "Last name is required and must be at least 3 characters.",
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError("Please provide a valid email address.");
    }
    if (!password || password.length < 6) {
      throw new BadRequestError("Password must be at least 6 characters long.");
    }
    if (!/\d/.test(password)) {
      throw new BadRequestError(
        "Password must contain at least one numeric digit.",
      );
    }
    next();
  },
  handleValidationErrors,
];
export const validateUserLogin = [
  (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestError("Please enter a valid email address.");
    }
    if (!password) {
      throw new BadRequestError("Password field cannot be empty.");
    }
    next();
  },
  handleValidationErrors,
];
