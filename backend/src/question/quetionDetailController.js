import {
  getSingleQuestionService,
  postAnswerService,
  getSimilarQuestionsService,
  assessAnswerAgainstQuestionService,
} from "../question/questionDetailService.js";

/**
 * 1. Question by Hash with Answer Controller
 */
export const getSingleQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;

    const { question, answers, answersMeta } = await getSingleQuestionService({
      questionHash,
    });

    return res.status(200).json({
      success: true,
      message: "Question fetched successfully",
      question,
      answers,
      answersMeta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Answer Post Controller
 */
export const postAnswerController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const result = await postAnswerService({
      questionHash,
      content,
      userId,
    });

    return res.status(201).json({
      success: true,
      message: "Answer posted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Similar Questions Find Controller
 */
export const getSimilarQuestionsController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { k, threshold } = req.query;
    const userId = req.user?.id;

    const { data, meta } = await getSimilarQuestionsService({
      questionHash,
      userId,
      k,
      threshold,
    });

    return res.status(200).json({
      success: true,
      message: "Similar questions fetched successfully",
      data,
      meta,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Answer Draft Fit Evaluation Controller
 */
export const assessAnswerAgainstQuestionController = async (req, res, next) => {
  try {
    const { questionHash } = req.params;
    const { answerText } = req.body;

    const result = await assessAnswerAgainstQuestionService({
      questionHash,
      answerText,
    });

    return res.status(200).json({
      success: true,
      message: "Answer fit assessed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};