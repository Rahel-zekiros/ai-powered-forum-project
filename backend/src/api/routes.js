import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
import questionRoutes from "../question/routes.js";
import postQuestionRoutes from "./Routes/questionRoutes.js";
import questionDetailRoutes from "./Routes/questionDetailAIroutes.js";
import userRoutes from "./Routes/userRoutes.js";
export const mainRouter = express.Router();

// Authentication routes
mainRouter.use("/auth", authRoutes);

// 1. post question routes
mainRouter.use("/questions", postQuestionRoutes);

// 2. dashboard routes
mainRouter.use("/questions", questionRoutes);

// 3. question detail routes
mainRouter.use("/questions", questionDetailRoutes);

// 4. profile/user update routes
mainRouter.use("/users", userRoutes);

//* 5. RAG
mainRouter.use("/rag", ragRouter);
