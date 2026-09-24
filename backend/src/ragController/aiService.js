
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const GENERATION_MODEL =
  process.env.GEMINI_TEXT_MODEL || "gemini-3.6-flash";

const FALLBACK_MODEL =
  process.env.GEMINI_FALLBACK_MODEL || "gemini-3.5-flash";


// ==========================================
// Wait Helper
// ==========================================

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};


// ==========================================
// Retry Only Temporary Gemini Errors
// ==========================================

const isRetryableError = (error) => {
  const status = Number(
    error?.status ??
      error?.code ??
      error?.response?.status
  );

  return [429, 500, 502, 503, 504].includes(status);
};


// ==========================================
// Generate Grounded Answer
// ==========================================

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

  console.log(
    `Primary Gemini model: ${GENERATION_MODEL}`
  );

  console.log(
    `Fallback Gemini model: ${FALLBACK_MODEL}`
  );


  // ==========================================
  // Models to Try
  // ==========================================

  const models = [
    GENERATION_MODEL,
    FALLBACK_MODEL,
  ];


  let lastError;


  // ==========================================
  // Try Primary + Fallback Models
  // ==========================================

  for (const model of models) {

    console.log(
      `==========================================`
    );

    console.log(
      `Trying Gemini model: ${model}`
    );

    console.log(
      `==========================================`
    );


    // ==========================================
    // Retry Current Model 3 Times
    // ==========================================

    for (let attempt = 1; attempt <= 3; attempt++) {

      try {

        console.log(
          `Gemini attempt ${attempt}/3 using ${model}...`
        );


        const response =
          await ai.models.generateContent({
            model,
            contents: prompt,
          });


        const answer = response.text?.trim();


        console.log(
          "========== GEMINI ANSWER =========="
        );

        console.log(answer);

        console.log(
          "========== END GEMINI ANSWER =========="
        );


        if (!answer) {

          throw new Error(
            "Gemini did not return a valid answer."
          );

        }


        console.log(
          `Gemini answer generated successfully using ${model} on attempt ${attempt}.`
        );


        return answer;


      } catch (error) {

        lastError = error;


        console.error(
          "========== GEMINI ERROR =========="
        );

        console.error(
          "Model:",
          model
        );

        console.error(
          "Attempt:",
          `${attempt}/3`
        );

        console.error(
          "Message:",
          error?.message
        );

        console.error(
          "Status:",
          error?.status
        );

        console.error(
          "Code:",
          error?.code
        );

        console.error(
          "========== END GEMINI ERROR =========="
        );


        // ==========================================
        // Permanent Error
        // ==========================================

        if (!isRetryableError(error)) {

          console.error(
            `Non-retryable error from ${model}.`
          );

          throw error;

        }


        // ==========================================
        // Final Attempt for Current Model
        // ==========================================

        if (attempt === 3) {

          console.log(
            `${model} failed after 3 attempts.`
          );

          break;

        }


        // ==========================================
        // Wait Before Retry
        // ==========================================

        const delay = attempt * 2000;


        console.log(
          `${model} temporarily unavailable.`
        );

        console.log(
          `Retrying in ${delay / 1000} seconds...`
        );


        await sleep(delay);

      }

    }

    // ==========================================
    // Move to Next Model
    // ==========================================

    console.log(
      `Moving to next Gemini model...`
    );

  }


  // ==========================================
  // All Models Failed
  // ==========================================

  console.error(
    "=========================================="
  );

  console.error(
    "ALL GEMINI MODELS FAILED."
  );

  console.error(
    "=========================================="
  );


  throw lastError;
};
