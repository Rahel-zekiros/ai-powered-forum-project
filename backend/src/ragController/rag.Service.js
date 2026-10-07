import fs from "fs/promises";
import path from "path";
import {
  readPdfFile,
  extractPdfPages,
  extractTextFile,
  deletePdfFile,
} from "./pdfService.js";
import { createChunks } from "./chunkService.js";
import { createEmbedding } from "./embeddingService.js";
import { safeExecute } from "../../db/config.js";
import { generateGroundedAnswer } from "./aiService.js";

// ==========================================
// Process Document (Supports PDF & TXT)
// ==========================================

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

    // ==========================================
    // Check File Type (PDF vs TXT)
    // ==========================================

    const isTxt =
      file.mimetype === "text/plain" || filename.toLowerCase().endsWith(".txt");

    let pages = [];

    if (isTxt) {
      console.log("Reading Text file...");

      const textContent = await extractTextFile(file.path);

      pages = [
        {
          pageNumber: 1,
          text: textContent,
        },
      ];

      console.log("Text file read successfully.");
    } else {
      const pdfBuffer = await readPdfFile(file.path);
      pages = await extractPdfPages(pdfBuffer);
    }

    if (!pages || pages.length === 0) {
      throw new Error("No readable text was found in the document.");
    }

    console.log(`Extracted ${pages.length} pages/sections.`);

    // ==========================================
    // Create chunks with Fallback Protection
    // ==========================================

    let chunks = createChunks(pages);

    if (!chunks || chunks.length === 0) {
      const rawText = pages[0]?.text?.trim();

      if (rawText) {
        chunks = [
          {
            content: rawText,
            chunkIndex: 0,
            pageStart: 1,
            pageEnd: 1,
          },
        ];
      }
    }

    if (!chunks || chunks.length === 0) {
      throw new Error("No text chunks could be created from the document.");
    }

    console.log(`Created ${chunks.length} text chunks.`);

    // ==========================================
    // Create Embeddings and Save Chunks
    // ==========================================

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkContent = chunk.content;

      console.log(`Creating embedding ${i + 1}/${chunks.length}...`);

      if (!chunkContent || (!isTxt && chunkContent.includes("%PDF"))) {
        throw new Error("Invalid text content extracted.");
      }

      // ==========================================
      // Save Chunk
      // ==========================================

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

      // ==========================================
      // Create Embedding
      // ==========================================

      const embedding = await createEmbedding(chunkContent);
      const embeddingVectorJson = JSON.stringify(embedding);

      // ==========================================
      // Save Embedding
      // ==========================================

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

    // ==========================================
    // Mark Document Ready
    // ==========================================

    await safeExecute(
      `
        UPDATE documents
        SET status = ?
        WHERE document_id = ?
      `,
      ["ready", documentId],
    );

    return {
      msg: "Document uploaded and processed successfully.",
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

// ==========================================
// List Documents
// GET /api/rag/documents
// ==========================================

export const listDocumentsForUserService = async ({ userId }) => {
  const rows = await safeExecute(
    `
      SELECT
        document_id,
        filename AS title,
        file_path,
        status,
        created_at
      FROM documents
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return rows.map((document) => ({
    documentId: document.document_id,
    title: document.title,
    filePath: document.file_path,
    status: document.status,
    createdAt: document.created_at,
  }));
};

// ==========================================
// DELETE /api/rag/documents/:documentId
// ==========================================

export const deleteDocumentService = async ({ documentId, userId }) => {
  const rows = await safeExecute(
    `
      SELECT
        document_id,
        user_id,
        file_path
      FROM documents
      WHERE document_id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [documentId, userId],
  );

  if (!rows.length) {
    const error = new Error("Document not found.");
    error.statusCode = 404;
    throw error;
  }

  const document = rows[0];

  try {
    if (document.file_path) {
      await deletePdfFile(document.file_path);
    }
  } catch (error) {
    console.error("Error deleting file physically:", error);
  }

  await safeExecute(
    `
      DELETE FROM documents
      WHERE document_id = ?
        AND user_id = ?
    `,
    [documentId, userId],
  );

  return {
    id: documentId,
  };
};

// ==========================================
// Settings & Math Helpers
// ==========================================

const TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.65;
const normalizeSearchText = (text) =>
  text.toLowerCase().replace(/\s+/g, " ").trim();
export const vectorMagnitude = (vector) => {
  let sum = 0;
  for (const value of vector) {
    sum += value * value;
  }
  return Math.sqrt(sum);
};

export const cosineSimilarity = (vectorA, vectorB) => {
  if (
    !Array.isArray(vectorA) ||
    !Array.isArray(vectorB) ||
    vectorA.length === 0 ||
    vectorB.length === 0 ||
    vectorA.length !== vectorB.length
  ) {
    return 0;
  }

  let dotProduct = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
  }

  const magnitudeA = vectorMagnitude(vectorA);
  const magnitudeB = vectorMagnitude(vectorB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
};

// ==========================================
// Get Document Chunks
// ==========================================

export const getDocumentChunks = async (documentId) => {
  const result = await safeExecute(
    `
      SELECT
        dc.chunk_id,
        dc.document_id,
        dc.content,
        dc.chunk_index,
        dc.page_start,
        dc.page_end,
        dcv.embedding_vector AS embedding,
        dcv.embedding_vector AS embedding_vector
      FROM document_chunks AS dc
      INNER JOIN document_chunk_vectors AS dcv
        ON dc.chunk_id = dcv.chunk_id
      WHERE dc.document_id = ?
        AND dcv.status = ?
      ORDER BY dc.chunk_index ASC
    `,
    [documentId, "ready"],
  );

  if (Array.isArray(result)) {
    return result;
  }

  if (result && Array.isArray(result[0])) {
    return result[0];
  }

  return [];
};

// ==========================================
// Rank Chunks
// ==========================================

export const rankChunks = (chunks, queryEmbedding) => {
  return chunks
    .map((chunk) => {
      let storedVector;

      try {
        storedVector =
          typeof chunk.embedding === "string"
            ? JSON.parse(chunk.embedding)
            : chunk.embedding;
      } catch (err) {
        console.error(`Invalid embedding for chunk ${chunk.chunk_id}`, err);
        return null;
      }

      const rawSimilarity = cosineSimilarity(queryEmbedding, storedVector);
      const score = Number(rawSimilarity.toFixed(3));

      return {
        chunkId: chunk.chunk_id,
        documentId: chunk.document_id,
        chunkIndex: chunk.chunk_index,
        pageStart: chunk.page_start,
        pageEnd: chunk.page_end,
        content: chunk.content,
        similarity: score,
        relevance: score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.similarity - a.similarity);
};

// ==========================================
// Get Ready Document
// ==========================================

const getReadyDocument = async ({ documentId, userId }) => {
  const documents = await safeExecute(
    `
      SELECT
        document_id,
        filename AS title,
        file_path,
        status
      FROM documents
      WHERE document_id = ?
        AND user_id = ?
    `,
    [documentId, userId],
  );

  if (documents.length === 0) {
    const error = new Error("Document not found or unauthorized.");
    error.statusCode = 404;
    throw error;
  }

  const document = documents[0];

  if (document.status !== "ready") {
    const error = new Error("This document is not ready for RAG search yet.");
    error.statusCode = 400;
    throw error;
  }

  return document;
};

// ==========================================
// Semantic Search
// ==========================================

export const searchDocument = async ({ userId, documentId, query }) => {
  let chunks = [];
  let document = null;

  if (documentId) {
    document = await getReadyDocument({
      documentId,
      userId,
    });

    chunks = await getDocumentChunks(documentId);
  } else {
    chunks = await safeExecute(
      `
        SELECT
          dc.chunk_id,
          dc.document_id,
          dc.content,
          dc.chunk_index,
          dc.page_start,
          dc.page_end,
          dcv.embedding_vector
        FROM document_chunks AS dc
        INNER JOIN document_chunk_vectors AS dcv
          ON dc.chunk_id = dcv.chunk_id
        INNER JOIN documents AS d
          ON dc.document_id = d.document_id
        WHERE d.user_id = ?
          AND d.status = 'ready'
      `,
      [userId],
    );
  }

  console.log("Creating query embedding...");

  const queryEmbedding = await createEmbedding(query);

  if (!chunks || chunks.length === 0) {
    return {
      documentId: documentId || null,
      title: document ? document.title : "All Documents",
      query,
      totalChunks: 0,
      results: [],
      message: "No documents found.",
    };
  }

  const rankedChunks = rankChunks(chunks, queryEmbedding);
  const normalizedQuery = normalizeSearchText(query);

  const exactMatches = rankedChunks.filter((chunk) =>
    normalizeSearchText(chunk.content).includes(normalizedQuery),
  );

  const relevantChunks =
    exactMatches.length > 0
      ? exactMatches.slice(0, TOP_K)
      : rankedChunks
          .filter((chunk) => chunk.similarity >= SIMILARITY_THRESHOLD)
          .slice(0, TOP_K);

  const results =
    relevantChunks.length > 0 ? relevantChunks : rankedChunks.slice(0, TOP_K);
  return {
    documentId: documentId || null,
    filename: document ? document.title : "All Documents",
    query,
    totalChunks: chunks.length,
    results,
    message: null,
  };
};

// ==========================================
// Ask Document AI
// ==========================================

export const askDocument = async ({ userId, documentId, question }) => {
  let chunks = [];
  let document = null;

  if (documentId) {
    document = await getReadyDocument({
      documentId,
      userId,
    });

    chunks = await getDocumentChunks(documentId);
  } else {
    // Cross-Search (All Documents Mode)
    chunks = await safeExecute(
      `
        SELECT
          dc.chunk_id,
          dc.document_id,
          dc.content,
          dc.chunk_index,
          dc.page_start,
          dc.page_end,
          dcv.embedding_vector AS embedding,
          dcv.embedding_vector AS embedding_vector
        FROM document_chunks AS dc
        INNER JOIN document_chunk_vectors AS dcv
          ON dc.chunk_id = dcv.chunk_id
        INNER JOIN documents AS d
          ON dc.document_id = d.document_id
        WHERE d.user_id = ?
          AND d.status = 'ready'
      `,
      [userId],
    );
  }

  console.log("Creating question embedding...");

  const questionEmbedding = await createEmbedding(question);

  if (!chunks || chunks.length === 0) {
    return {
      answer:
        "Your library is currently empty. Please upload a reference PDF first.",
      sources: [],
    };
  }

  const rankedChunks = rankChunks(chunks, questionEmbedding);

  const selectedChunks = rankedChunks
    .filter((chunk) => chunk.similarity >= SIMILARITY_THRESHOLD)
    .slice(0, TOP_K);

  if (selectedChunks.length === 0) {
    return {
      answer:
        "For this question, I do not have a corresponding resource in the uploaded document.",
      sources: [],
    };
  }

  const context = selectedChunks
    .map(
      (chunk) =>
        `[Chunk ${chunk.chunkIndex} | Page ${chunk.pageStart}]\n${chunk.content}`,
    )
    .join("\n\n");

  const answer = await generateGroundedAnswer({
    documentName: document ? document.filename : "All Library Documents",
    context,
    question,
  });

  return {
    answer,
    sources: selectedChunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      similarity: chunk.similarity,
      relevance: chunk.relevance,
      content: chunk.content,
    })),
  };
};

// ==========================================
// Get Document File Path for Download/View
// ==========================================
export const getDocumentFile = async ({ documentId, userId }) => {
  const rows = await safeExecute(
    `
      SELECT
        document_id,
        filename,
        file_path
      FROM documents
      WHERE document_id = ?
        AND user_id = ?
      LIMIT 1
    `,
    [documentId, userId],
  );

  if (!rows || rows.length === 0) {
    const error = new Error("Document not found or unauthorized.");
    error.statusCode = 404;
    throw error;
  }

  const document = rows[0];
  const absolutePath = path.resolve(document.file_path);

  return {
    filePath: absolutePath,
    filename: document.filename,
  };
};
