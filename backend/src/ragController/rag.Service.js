import { readPdfFile, extractPdfPages, deletePdfFile } from "./pdfService.js";

import { createChunks } from "./chunkService.js";

import { createEmbedding } from "./embeddingService.js";

import { safeExecute } from "../../db/config.js";

import { generateGroundedAnswer } from "./aiService.js";

// ==========================================
// abduselam
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

// *==== list document:GET /api/rag/documents ======

export const listDocumentsForUserService = async ({ userId }) => {
  const rows = await safeExecute(
    `
    SELECT
      document_id,
      title,
      mime_type,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at
    FROM documents
    WHERE user_id = ?
    ORDER BY created_at DESC
    `,
    [userId],
  );

  return rows.map((document) => ({
    documentId: document.document_id,
    title: document.title,
    mimeType: document.mime_type,
    byteSize: document.byte_size,
    status: document.status,
    errorMessage: document.error_message,
    createdAt: document.created_at,
    updatedAt: document.updated_at,
  }));
};

// * ======= DELETE /api/rag/documents/:documentId ======

export const deleteDocumentService = async ({ documentId, userId }) => {
  const rows = await safeExecute(
    `
    SELECT
      document_id,
      user_id,
      storage_path
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

  const uploadDir = path.resolve(process.cwd(), "upload", "rag");

  const absoluteFilePath = path.resolve(uploadDir, document.storage_path);

  try {
    await fs.unlink(absoluteFilePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
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
// my task
// ==========================================

// ==========================================
// Settings
// ==========================================

const TOP_K = 5;
const SIMILARITY_THRESHOLD = 0.65;

// ==========================================
// Vector Magnitude
// ==========================================

export const vectorMagnitude = (vector) => {
  let sum = 0;

  for (const value of vector) {
    sum += value * value;
  }

  return Math.sqrt(sum);
};

// ==========================================
// Cosine Similarity
// ==========================================

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
// Get Document Chunks + Vectors
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
      dcv.embedding_vector
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
          typeof chunk.embedding_vector === "string"
            ? JSON.parse(chunk.embedding_vector)
            : chunk.embedding_vector;
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
// Get Library Documents
// ==========================================

export const getLibraryDocuments = async (userId) => {
  return await safeExecute(
    `
      SELECT
        document_id,
        filename,
        file_path,
        status,
        created_at
      FROM documents
      WHERE user_id = ?
      ORDER BY created_at DESC
      `,
    [userId],
  );
};

// ==========================================
// Remove Document
// ==========================================

export const removeDocument = async ({ docId, userId }) => {
  const existingDocs = await safeExecute(
    `
        SELECT
          document_id,
          file_path
        FROM documents
        WHERE document_id = ?
          AND user_id = ?
        `,
    [docId, userId],
  );

  if (existingDocs.length === 0) {
    const error = new Error("Document not found or unauthorized.");

    error.statusCode = 404;

    throw error;
  }

  const document = existingDocs[0];

  await safeExecute(
    `
      DELETE dcv
      FROM document_chunk_vectors AS dcv
      INNER JOIN document_chunks AS dc
        ON dcv.chunk_id = dc.chunk_id
      WHERE dc.document_id = ?
      `,
    [docId],
  );

  await safeExecute(
    `
      DELETE FROM document_chunks
      WHERE document_id = ?
      `,
    [docId],
  );

  await safeExecute(
    `
      DELETE FROM documents
      WHERE document_id = ?
        AND user_id = ?
      `,
    [docId, userId],
  );

  if (document.file_path) {
    await deletePdfFile(document.file_path);
  }

  return {
    msg: "Document deleted successfully!",
  };
};

// ==========================================
// Get Ready Document
// ==========================================

const getReadyDocument = async ({ documentId, userId }) => {
  const documents = await safeExecute(
    `
        SELECT
          document_id,
          filename,
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

  // --------------------------------------
  // Create query embedding
  // --------------------------------------

  console.log("Creating query embedding...");

  const queryEmbedding = await createEmbedding(query);

  if (!chunks || chunks.length === 0) {
    return {
      documentId: documentId || null,

      filename: document ? document.filename : "All Documents",

      query,

      totalChunks: 0,

      results: [],

      message: "No documents found.",
    };
  }

  // --------------------------------------
  // Rank chunks
  // --------------------------------------

  const rankedChunks = rankChunks(chunks, queryEmbedding);

  // --------------------------------------
  // Filter
  // --------------------------------------

  const relevantChunks = rankedChunks
    .filter((chunk) => chunk.similarity >= SIMILARITY_THRESHOLD)
    .slice(0, TOP_K);

  if (relevantChunks.length === 0) {
    return {
      documentId: documentId || null,

      filename: document ? document.filename : "All Documents",

      query,

      totalChunks: chunks.length,

      results: [],

      message: "No relevant matches found.",
    };
  }

  return {
    documentId: documentId || null,

    filename: document ? document.filename : "All Documents",

    query,

    totalChunks: chunks.length,

    results: relevantChunks,

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
      answer: "For this question, I do not have a corresponding resource in the uploaded document.",
      sources: [],
    };
  }

  // --------------------------------------
  // Build RAG context
  // --------------------------------------

  const context = selectedChunks
    .map(
      (chunk) =>
        `[Chunk ${chunk.chunkIndex} | Page ${chunk.pageStart}]\n${chunk.content}`,
    )
    .join("\n\n");

  // --------------------------------------
  // Generate grounded Gemini answer
  // --------------------------------------

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
// Save Chunk Note
// ==========================================

export const saveChunkNote = async ({ userId, chunkId, noteText }) => {
  const result = await safeExecute(
    `
        INSERT INTO chunk_notes
        (
          user_id,
          chunk_id,
          note_text
        )
        VALUES (?, ?, ?)
        `,
    [userId, chunkId, noteText],
  );

  return {
    msg: "Note saved successfully!",

    noteId: result.insertId,
  };
};

// ==========================================
// Get User Notes
// ==========================================

export const fetchUserNotesFromDatabase = async (userId) => {
  return await safeExecute(
    `
      SELECT
        cn.note_id,
        cn.note_text,
        cn.created_at,
        dc.chunk_id,
        dc.chunk_index,
        dc.content,
        d.document_id,
        d.filename
      FROM chunk_notes AS cn
      INNER JOIN document_chunks AS dc
        ON cn.chunk_id = dc.chunk_id
      INNER JOIN documents AS d
        ON dc.document_id = d.document_id
      WHERE cn.user_id = ?
      ORDER BY cn.created_at DESC
      `,
    [userId],
  );
};