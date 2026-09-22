import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GENERATION_MODEL = "gemini-3.6-flash";

// Wait helper
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Retry only temporary Gemini errors
const isRetryableError = (error) => {
  const status = Number(
    error?.status ?? error?.code ?? error?.response?.status,
  );

  return [429, 500, 502, 503, 504].includes(status);
};
export const generateGroundedAnswer = async ({
  documentName,
  context,
  question,
}) => {
  const prompt = `
You are an AI assistant inside an educational document Q&A system.

You must answer the user's question using ONLY the context retrieved from the uploaded PDF.

STRICT RULES:
1. Use only the provided PDF context.
2. Do not use general knowledge.
3. Do not invent or hallucinate information.
4. Include citation numbers in brackets like [1], [2] when citing information from the context chunks.
5. If the answer is not supported by the context, respond EXACTLY and ONLY with this phrase:
"For this question, I do not have a corresponding resource in the uploaded document."
6. Keep the answer clear and directly related to the question.
7. If the context contains code, preserve the code accurately.

DOCUMENT:
${documentName}

RETRIEVED CONTEXT:
${context}

USER QUESTION:
${question}

ANSWER:
`;

  console.log(`Generating grounded Gemini answer with ${GENERATION_MODEL}...`);

  let lastError;

  // Try Gemini up to 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`Gemini attempt ${attempt}/3...`);

      const response = await ai.models.generateContent({
        model: GENERATION_MODEL,
        contents: prompt,
      });

      const answer = response.text?.trim();

      console.log("========== GEMINI ANSWER ==========");
      console.log(answer);
      console.log("========== END GEMINI ANSWER ==========");

      if (!answer) {
        throw new Error("Gemini did not return a valid answer.");
      }

      console.log(
        `Gemini answer generated successfully on attempt ${attempt}.`,
      );

      return answer;
    } catch (error) {
      lastError = error;

      console.error(
        `Gemini attempt ${attempt} failed:`,
        error?.message || error,
      );

      // If this is NOT a temporary error,
      // don't retry it.
      if (!isRetryableError(error)) {
        throw error;
      }

      // If this was the final attempt,
      // stop retrying.
      if (attempt === 3) {
        break;
      }

      // Wait before trying again
      const delay = attempt * 2000;

      console.log(
        `Gemini temporarily unavailable. Retrying in ${delay / 1000} seconds...`,
      );

      await sleep(delay);
    }
  }

  // All 3 attempts failed
  console.error("Gemini failed after 3 attempts.");

  throw lastError;
};
