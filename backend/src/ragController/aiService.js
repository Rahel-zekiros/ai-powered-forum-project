import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const PRIMARY_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.5-flash-lite";
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  const status = Number(
    error?.status ?? error?.code ?? error?.response?.status,
  );
  // Fetch timeout/Network failure  Temporary Server Overload 
  return [429, 500, 502, 503, 504].includes(status) || error?.message?.includes("fetch failed");
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

  const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError;

  for (const currentModel of modelsToTry) {
    console.log(`Attempting generation with model: ${currentModel}`);

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`[${currentModel}] Attempt ${attempt}/2...`);

        const response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
        });

        const answer = response.text?.trim();

        if (!answer) {
          throw new Error("Gemini did not return a valid answer.");
        }

        console.log(`Answer generated successfully using ${currentModel}.`);
        return answer;
      } catch (error) {
        lastError = error;
        console.error(`[${currentModel}] Attempt ${attempt} failed:`, error?.message || error);

        if (!isRetryableError(error)) {
          break; 
        }

        if (attempt < 2) {
          console.log("Retrying in 2 seconds...");
          await sleep(2000);
        }
      }
    }

    console.warn(`Model ${currentModel} failed. Switching to fallback option...`);
  }

  console.error("All model attempts failed.");
  throw lastError;
};