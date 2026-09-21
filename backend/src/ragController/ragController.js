import {
  processDocument,
  getLibraryDocuments,
  removeDocument,
  searchDocument,
  askDocument,
} from "./ragService.js";

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
  } catch (error) {}
};
