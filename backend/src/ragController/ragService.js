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

    //Extract Pages

    console.log("Extracting PDF pages...");

    const pages = await extractPdfPages(pdfBuffer);

    if (!pages || pages.length === 0) {
      throw new Error("No readable text was found in the PDF.");
    }

    console.log(`Extracted ${pages.length} pages.`);

    // create chunks

    const chunks = createChunks(pages);

    if (!chunks || chunks.length === 0) {
      throw new Error("No text chunks could be created from the PDF.");
    }

    console.log(`Created ${chunks.length} text chunks.`);

    // create embeddings

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const chunkContent = chunk.content;

      console.log(`Creating embedding ${i + 1}/${chunks.length}...`);

      if (!chunkContent || chunkContent.includes("%PDF")) {
        throw new Error("Invalid text content extracted from PDF.");
      }

      // ----------------------------------
      // Save chunk
      // ----------------------------------

      const chunkResult = await safeExecute(
        `
          INSERT INTO document_chunks
          (
            document_id,
            content,
            chunk_index,
            page_start,
            page_end
          )
          VALUES (?, ?, ?, ?, ?)
          `,
        [
          documentId,
          chunkContent,
          chunk.chunkIndex,
          chunk.pageStart,
          chunk.pageEnd,
        ],
      );

      const chunkId = chunkResult.insertId;

      // ----------------------------------
      // Create embedding
      // ----------------------------------

      const embedding = await createEmbedding(chunkContent);

      const embeddingVectorJson = JSON.stringify(embedding);

      // ----------------------------------
      // Save embedding
      // ----------------------------------

      await safeExecute(
        `
        INSERT INTO document_chunk_vectors
        (
          chunk_id,
          embedding_vector,
          status
        )
        VALUES (?, ?, ?)
        `,
        [chunkId, embeddingVectorJson, "ready"],
      );
    }

    //mark document ready

        await safeExecute(
          `
      UPDATE documents
      SET status = ?
      WHERE document_id = ?
      `,
          ["ready", documentId],
        );

        return {
          msg: "PDF uploaded and processed successfully.",

          documentId,

          filename,

          chunksCreated: chunks.length,

          status: "ready",
        };

  } catch (err) {
      console.error("Document Processing Error:", err);

      if (documentId) {
        await safeExecute(
          `
        UPDATE documents
        SET status = ?
        WHERE document_id = ?
        `,
          ["error", documentId],
        ).catch(() => {});
      }

      if (file?.path) {
        await deletePdfFile(file.path);
      }

      throw err;
  }
};
