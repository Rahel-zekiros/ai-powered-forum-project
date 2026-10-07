import {
  processDocument,
  searchDocument,
  askDocument,
  listDocumentsForUserService,
  deleteDocumentService,
  getDocumentFile,
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
// Get PDF File (For Interactive Viewer)
// ==========================================

export const getDocumentFileController = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    const { filePath, filename } = await getDocumentFile({
      documentId: Number(documentId),
      userId: req.user.id,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${filename}"`,
    );

    return res.sendFile(filePath);
  } catch (error) {
    console.error("Get Document File Error:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};