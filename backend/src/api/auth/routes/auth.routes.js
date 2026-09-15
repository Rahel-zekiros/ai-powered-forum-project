/** * Authentication routes mapping. */ import express from "express";
import {
  registerController,
  loginController,
} from "../controllers/auth.controller.js";
import {
  registerValidation,
  loginValidation,
} from "../middlewares/auth.validation.js";
const router = express.Router();
/** * Register a new user * POST /api/auth/register * Public route */
router.post("/register", registerValidation, registerController);
/** * Authenticate user and return JWT token * POST /api/auth/login * Public route */
router.post("/login", loginValidation, loginController);
export default router;
