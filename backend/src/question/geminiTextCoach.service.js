import { GoogleGenAI } from "@google/genai";

/*
==================================================
GEMINI CONFIGURATION
==================================================
*/

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash-lite";

/*
==================================================
HELPER
Parse JSON returned by Gemini
==================================================
*/

const parseJsonResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch (error) {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Invalid JSON response from Gemini.");
    }

    return JSON.parse(match[0]);
  }
};

/*
==================================================
T-13
AI QUESTION DRAFT COACH
==================================================
*/

export const generateQuestionDraftCoachService = async ({ title, content }) => {
  const prompt = `
You are an AI coach for a programming and software engineering forum.

Review the following question draft.

Title:
${title || "(No title provided)"}

Content:
${content}

Evaluate:

1. Clarity of the question
2. Whether enough technical information is provided
3. Whether error messages should be included
4. Whether code examples should be included
5. Whether the question is specific enough
6. How the user can improve the question

Return ONLY valid JSON using exactly this format:

{
  "feedback": "short helpful feedback",
  "suggestions": [
    "suggestion 1",
    "suggestion 2",
    "suggestion 3"
  ]
}

Do not use markdown.
Do not include any text outside the JSON.
`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const text = response.text;

  const result = parseJsonResponse(text);

  return {
    feedback: result.feedback || "",
    suggestions: Array.isArray(result.suggestions) ? result.suggestions : [],
  };
};
