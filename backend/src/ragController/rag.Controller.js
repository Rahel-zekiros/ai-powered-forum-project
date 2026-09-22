import {
  processDocument,
  getLibraryDocuments,
  removeDocument,
  searchDocument,
  askDocument,
  listDocumentsForUserService,
} from "./rag.Service.js";

// Upload and Process Documents

export const uploadAndProcessDocument = async (req, res) => {
  const userId = req.user.id || req.user.userId;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      msg: "Please select a valid PDF file.",
    });
  }
  try {
    const result = await processDocument({
      userId,
      file,
    });

    return res.status(201).json(result);
  } catch (error) {
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

// * ======= DELETE /api/rag/documents/:documentId ====
