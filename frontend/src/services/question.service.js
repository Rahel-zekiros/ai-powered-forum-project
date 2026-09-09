import apiClient from './core/api.client';

export const getQuestions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await apiClient.get(`/api/questions${query ? `?${query}` : ''}`);
  return response.data;
};

export const searchQuestionsSemantic = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await apiClient.get(`/api/questions/search${query ? `?${query}` : ''}`);
  return response.data;
};
