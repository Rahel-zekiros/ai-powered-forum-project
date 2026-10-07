import express from "express";
import authRoutes from "./auth/routes/auth.routes.js";
import questionRoutes from "../question/routes.js";
import postQuestionRoutes from "./Routes/questionRoutes.js";
import questionDetailRoutes from "./Routes/questionDetailAIroutes.js";
import ragRoutes from "./Routes/rag.Routes.js";
import supportRoutes from '../api/support/support.routes.js';
export const mainRouter = express.Router();

// Authentication routes
mainRouter.use("/auth", authRoutes);

// 1. post question routes
mainRouter.use("/questions", postQuestionRoutes);

// 2. dashboard routes
mainRouter.use("/questions", questionRoutes);

// 3. question detail routes
mainRouter.use("/questions", questionDetailRoutes);


//* 5. RAG
mainRouter.use("/rag", ragRoutes);

// Authenticated customer-support assistant
mainRouter.use('/support', supportRoutes);
