import {
  getSingleQuestionService,
  getSimilarQuestionsService,
  assessAnswerAgainstQuestionService,
} from "./questionDetailService.js";


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
