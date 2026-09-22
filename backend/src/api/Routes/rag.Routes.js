import express from "express";
import { authenticateUser } from "../../middleware/authentication";
const router = express.Router();

// *==== list document:GET /api/rag/documents ======
router.get("/document", authenticateUser, listDocumentsController);

export default router;
