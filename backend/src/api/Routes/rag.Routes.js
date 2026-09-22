import express from "express";
import { authenticateUser } from "../../middleware/authentication";
import {
  listDocumentsController,
  deleteDocumentController,
} from "../../ragController/rag.Controller";
import { documentIdParamValidation } from "../../ragController/rag.validation";

const router = express.Router();
// *===============get document:Stream RAG Document

// *==== list document:GET /api/rag/documents ======
router.get("/documents", authenticateUser, listDocumentsController);

// * ======= DELETE /api/rag/documents/:documentId ====
router.delete(
  "/document/:documentId",
  authenticateUser,
  documentIdParamValidation,
  deleteDocumentController,
);
export default router;
