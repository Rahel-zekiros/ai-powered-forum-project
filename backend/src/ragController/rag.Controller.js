import {
  processDocument,
  getLibraryDocuments,
  removeDocument,
  searchDocument,
  askDocument,
  listDocumentsForUserService,
  deleteDocumentService,
  getDocumentChunks, // 
} from "./rag.Service.js";


// Upload and Process Documents  Abduselam

export const uploadAndProcessDocument = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      msg: "Please select a valid PDF or TXT file.",
    });
  }
  try {
    const result = await processDocument({
      userId,
      file,
    });

    return res.status(201).json(result);
  } catch (err) {
    console.error("RAG Pipeline Error:", err);

    return res.status(500).json({
      msg:
        err.message ||
        "Server error occurred during the AI RAG pipeline execution.",
    });
  }
};

// *==== list document:GET /api/rag/documents ======

export const listDocumentsController = async (req, res, next) => {
  try {
    const documents = await listDocumentsForUserService({
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Documents fetched successfully.",
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

// * ======= DELETE /api/rag/documents/:documentId ======

export const deleteDocumentController = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const result = await deleteDocumentService({
      documentId: Number(documentId),
      userId: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Document deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================
// Get Library Documents
// ==========================================

export const getCohortLibrary = async (req, res) => {
  const userId = req.user.id || req.user.userId;

  try {
    const documents = await getLibraryDocuments(userId);

    return res.status(200).json(documents);
  } catch (err) {
    console.error("Get Library Error:", err.message);

    return res.status(500).json({
      msg: "Server error occurred while fetching the document library.",
    });
  }
};

// ==========================================
// Delete Document (Alt)
// ==========================================

export const deleteDocument = async (req, res) => {
  const { docId } = req.params;
  const userId = req.user.id || req.user.userId;

  try {
    const result = await removeDocument({
      docId,
      userId,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Delete Document Error:", err.message);

    if (err.statusCode) {
      return res.status(err.statusCode).json({
        msg: err.message,
      });
    }

    return res.status(500).json({
      msg: "Server error occurred while deleting the document.",
    });
  }
};

// ==========================================
// Semantic Search (Updated for Cross-Search)
// ==========================================

export const semanticSearch = async (req, res) => {
  const userId = req.user.id || req.user.userId;

  const { documentId, query } = req.body;

  if (!query?.trim()) {
    return res.status(400).json({
      msg: "Search query is required.",
    });
  }

  try {
    const result = await searchDocument({
      userId,
      documentId: documentId || null, 
      query: query.trim(),
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Semantic Search Error:", err);

    if (err.statusCode) {
      return res.status(err.statusCode).json({
        msg: err.message,
      });
    }

    return res.status(500).json({
      msg: err.message || "Server error occurred during semantic search.",
    });
  }
};

// ==========================================
// Ask AI (Updated for Cross-Search)
// ==========================================

export const askDocumentAI = async (req, res) => {
  const userId = req.user.id || req.user.userId;

  const { documentId, question, history } = req.body;

  if (!question?.trim()) {
    return res.status(400).json({
      msg: "Question is required.",
    });
  }

  try {
    const result = await askDocument({
      userId,
      documentId: documentId || null, 
      question: question.trim(),
      history: history || [],
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Ask Document AI Error:", err);

    if (err.statusCode) {
      return res.status(err.statusCode).json({
        msg: err.message,
      });
    }

    return res.status(500).json({
      msg:
        err.message || "Server error occurred while generating the AI answer.",
    });
  }
};

// ==========================================
// Save Chunk Note
// ==========================================

export const saveChunkNote = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const { chunkId, noteText } = req.body;

  if (!chunkId || !noteText?.trim()) {
    return res.status(400).json({
      msg: "Chunk ID and note text are required.",
    });
  }

  try {
    const result = await saveNoteToDatabase({
      userId,
      chunkId,
      noteText: noteText.trim(),
    });

    return res.status(201).json({
      msg: "Note saved successfully!",
      ...result,
    });
  } catch (err) {
    console.error("Save Note Error:", err);
    return res.status(500).json({
      msg: "Server error occurred while saving the note.",
    });
  }
};

// ==========================================
// Get User Notes
// ==========================================

export const getUserNotes = async (req, res) => {
  const userId = req.user.id || req.user.userId;

  try {
    const notes = await fetchUserNotesFromDatabase(userId);
    return res.status(200).json(notes);
  } catch (err) {
    console.error("Get Notes Error:", err);
    return res.status(500).json({
      msg: "Server error occurred while fetching notes.",
    });
  }
};

// ==========================================
// Get Document Chunks (For Interactive Viewer)
// ==========================================

export const getDocumentChunksController = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const chunks = await getDocumentChunks(documentId);

    return res.status(200).json({
      success: true,
      message: "Document chunks fetched successfully.",
      chunks: chunks,
    });
  } catch (error) {
    console.error("Get Document Chunks Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server error occurred while fetching chunks.",
    });
  }
};