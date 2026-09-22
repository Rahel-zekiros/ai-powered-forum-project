import axios from "axios";

export const createEmbedding = async (text) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent`;
const response = await axios.post(
      url,
      {
        model: "models/gemini-embedding-001",
        content: {
          parts: [
            {
              text: text,
            },
          ],
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
      },
    );

    const values = response.data?.embedding?.values;

    if (!values || !Array.isArray(values) || values.length === 0) {
      throw new Error("Embedding vector is empty or missing.");
    }

    console.log(
      `Embedding created successfully. Vector size: ${values.length}`,
    );

    return values;
  } catch (error) {
    console.error(
      "Embedding Generation Error Detail:",
      error.response?.data || error.message,
    );

    throw error;
  }
};
