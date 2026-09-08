import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
import questionRoutes from "./Routes/questionRoutes.js";

export const mainRouter = express.Router();

// Authentication routes
mainRouter.use("/auth", authRoutes);

// Question routes (create + AI draft coach)
mainRouter.use("/questions", questionRoutes);
