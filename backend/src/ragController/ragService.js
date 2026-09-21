import { readPdfFile, extractPdfPages, deletePdfFile } from "./pdfService.js";

import { createChunks } from "./chunkService.js";

import { createEmbedding } from "./embeddingService.js";

import { safeExecute } from "../../db/config.js";

import { generateGroundedAnswer } from "./aiService.js";

export const processDocument = async ({ userId, file }) => {
  let documentId = null;
  try {
    const filename = file.originalname;

    const filePath = file.path.replace(/\\/g, "/");

    console.log(`Starting RAG processing for: ${filename}`);

    const docResult = await safeExecute(
      `
        INSERT INTO documents
        (user_id, filename, file_path, status)
        VALUES (?, ?, ?, ?)
        `,
      [userId, filename, filePath, "processing"],
    );
    documentId = docResult.insertId;

    // Read PDF

    console.log("Reading PDF file...");

    const pdfBuffer = await readPdfFile(file.path);



  } catch (error) {}
};
