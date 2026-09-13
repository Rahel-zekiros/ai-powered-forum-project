import { StatusCodes } from "http-status-codes";
import {
  getQuestionsService,
  searchQuestionsSemanticService,
  createQuestionWithVectorService,
} from "./service.js";

import { generateQuestionDraftCoachService } from "./geminiTextCoach.service.js";

/** T-07: Create Question & Auto-Embed Controller//
 *
 * Handles POST /api/questions.
 * Extracts the question title and content from the request body,
 * gets the authenticated user's ID, and passes the data to the
 * service layer to create the question and generate its embedding.
 */
export const createQuestionController = async (req, res, next) => {
  try {
    // Extract question title and content from the request body
    const { title, content } = req.body;

    // Get the authenticated user's ID from the JWT middleware
    const userId = req.user.id;

    // Create the question and generate its AI vector embedding
    const newQuestion = await createQuestionWithVectorService({
      title,
      content,
      userId,
    });

    // Return a successful 201 Created response
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Question posted successfully.",
      data: newQuestion,
    });
  } catch (error) {
    // Pass any error to the centralized error-handling middleware
    next(error);
  }
};

/**
 * T-13: AI Question Draft Coach
 *
 * Handles POST /api/questions/draft-coach.
 */
export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    //  Extract draft title and content
    const { title, content } = req.body;

    // Generate AI feedback and suggestions
    const data = await generateQuestionDraftCoachService({
      title,
      content,
    });

    //  Return AI draft coaching result
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Draft suggestions generated",
      data,
    });
  } catch (error) {
    // Pass errors to centralized error handler
    next(error);
  }
};

/**
 * List Questions
 * Handles fetching list of questions, including keyword search and 'mine' filter.
 */
export const getQuestionsController = async (req, res, next) => {
  try {
    const { search, mine } = req.query;
    const userId = req.user.id;

    const questions = await getQuestionsService({ search, mine, userId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Questions fetched successfully.",
      data: questions,
      meta: {
        limit: 100,
        total: questions.length,
        sortBy: "newest",
        sortOrder: "desc",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Semantic Search Questions
 * Handles semantic search for questions using AI vector cosine similarity.
 */
export const searchQuestionsSemanticController = async (req, res, next) => {
  try {
    const { query, k, threshold } = req.query;

    if (!query) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: "Search query is required",
      });
    }

    const data = await searchQuestionsSemanticService({ query, k, threshold });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Semantic search completed successfully",
      data,
      meta: {
        total: data.length,
        k: parseInt(k || 5, 10),
        threshold: parseFloat(
          threshold || process.env.RECOMMEND_THRESHOLD || 0.75,
        ),
        query,
        questionHash: null,
      },
    });
  } catch (error) {
    next(error);
  }
};
