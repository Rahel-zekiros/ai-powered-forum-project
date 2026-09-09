import { apiClient } from "../core/api.client.js";

export const getQuestions = async ({ search, mine } = {}) => {
  const params = {};
  if (search) params.search = search;
  if (mine) params.mine = true;
  const response = await apiClient.get("/api/questions", { params });
  return response.data;
};

export const getSingleQuestion = async (questionHash) => {
  const response = await apiClient.get(`/api/questions/${questionHash}`);
  return response.data;
};

export const createQuestion = async (title, content) => {
  const response = await apiClient.post("/api/questions", { title, content });
  return response.data;
};

export const getDraftCoach = async (title, content) => {
  const response = await apiClient.post("/api/questions/draft-coach", {
    title,
    content,
  });
  return response.data;
};

export const searchQuestions = async (query) => {
  const response = await apiClient.get("/api/questions/search", {
    params: { query },
  });
  return response.data;
};

export const getSimilarQuestions = async (questionHash, k = 5) => {
  const response = await apiClient.get(
    `/api/questions/${questionHash}/similar`,
    {
      params: { k },
    },
  );
  return response.data;
};

export const assessAnswerFit = async (questionHash, answerText) => {
  const response = await apiClient.post(
    `/api/questions/${questionHash}/answer-fit`,
    { answerText },
  );
  return response.data;
};

export const createAnswer = async (questionId, content) => {
  const response = await apiClient.post(`/api/answers`, {
    questionId,
    content,
  });
  return response.data;
};
