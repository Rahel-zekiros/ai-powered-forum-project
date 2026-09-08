import { StatusCodes } from "http-status-codes";
import { createQuestionWithVectorService } from "./service.js";
import { generateQuestionDraftCoachService } from "./geminiTextCoach.service.js";

/**
 * Handles POST /api/questions (T-09).
 * Creates a question and triggers background vector embedding.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const createQuestionController = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const userId = req.user.id;

    const question = await createQuestionWithVectorService({
      title,
      content,
      userId,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Question posted successfully.",
      data: question,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST /api/questions/draft-coach (T-17).
 * Returns AI-generated feedback tips for a question draft.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const generateQuestionDraftCoachController = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const result = await generateQuestionDraftCoachService({
      title,
      content,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Draft suggestions generated",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
