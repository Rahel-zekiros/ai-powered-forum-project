import { apiClient } from "./core/api.client";

export const getQuestions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await apiClient.get(
    `/api/questions${query ? `?${query}` : ""}`,
  );
  // console.log("getQuestions response:", response);
  return response.data;
};

export const searchQuestionsSemantic = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await apiClient.get(
    `/api/questions/search${query ? `?${query}` : ""}`,
  );
  return response.data;
};
//Upload an image file. Returns { url: "http://localhost:3888/uploads/..." }

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file); // "image" must match upload.single("image") in the backend

  const response = await apiClient.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// T-07: Create Question
export const createQuestion = async ({ title, content, imageUrl }) => {
  const response = await apiClient.post("/api/questions", {
    title,
    content,
    imageUrl,
  });
  return response.data;
};

// T-13: AI Question Draft Coach
export const generateQuestionDraftCoach = async ({ title, content }) => {
  const response = await apiClient.post("/api/questions/draft-coach", {
    title,
    content,
  });
  return response.data;
};
