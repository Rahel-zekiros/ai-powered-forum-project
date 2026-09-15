import { apiClient } from "./core/api.client.js";



export const getSingleQuestion = async (questionHash) => {
  const response = await apiClient.get(`/api/questions/${questionHash}`);
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
export const createAnswer = async (questionHash, content) => {
  const response = await apiClient.post(`/api/questions/${questionHash}/answers`, {
    content,
  });
  return response.data; 
};
