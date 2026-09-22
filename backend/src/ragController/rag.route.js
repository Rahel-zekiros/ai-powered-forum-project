import express from "express";
import { authenticateUser } from "../middleware/authentication";
import { listDocumentsController } from "./rag.Controller.js";

const router = express.Router();

// *==== list document:GET /api/rag/documents ======
router.get("/document", authenticateUser, listDocumentsController);

export default router;
