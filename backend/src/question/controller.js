import { StatusCodes } from 'http-status-codes';
import { getQuestionsService, searchQuestionsSemanticService } from './service.js';

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
      message: 'Questions fetched successfully.',
      data: questions,
      meta: {
        limit: 100,
        total: questions.length,
        sortBy: 'newest',
        sortOrder: 'desc'
      }
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
        message: 'Search query is required'
      });
    }

    const data = await searchQuestionsSemanticService({ query, k, threshold });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Semantic search completed successfully',
      data,
      meta: {
        total: data.length,
        k: parseInt(k || 5, 10),
        threshold: parseFloat(threshold || process.env.RECOMMEND_THRESHOLD || 0.75),
        query,
        questionHash: null
      }
    });
  } catch (error) {
    next(error);
  }
};
