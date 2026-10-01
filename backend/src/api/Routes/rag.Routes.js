import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDocumentChunksController } from '../../ragController/rag.Controller.js';
// ==========================================
// Controllers & Validations (Imports)
// ==========================================
import {
  uploadAndProcessDocument,
  getCohortLibrary,
  deleteDocument,
  semanticSearch,
  askDocumentAI,
  listDocumentsController,
  deleteDocumentController  
} from '../../ragController/rag.Controller.js';

import { 
  saveChunkNote, 
  getUserNotes 
} from '../../ragController/rag.Controller.js';

import { documentIdParamValidation } from '../../ragController/rag.validation.js';
import authMiddleware from '../../middleware/authentication.js';

const router = express.Router();

// ==========================================
// Upload Folder
// ==========================================

const uploadDir = 'uploads/cohort_materials';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ==========================================
// Multer Storage
// ==========================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// ==========================================
// PDF & TXT File Filter (Updated)
// ==========================================

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const allowedMimeTypes = ['application/pdf', 'text/plain'];

  if (extension === '.pdf' || extension === '.txt' || allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and TXT files are allowed.'));
  }
};

// ==========================================
// Multer Upload Configuration
// ==========================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// ==========================================
// Routes
// ==========================================

// ==========================================
//  Get Library
// GET /api/rag/library
// ==========================================
router.get(
  '/library',
  authMiddleware,
  getCohortLibrary
);

// ==========================================
// List Documents
// GET /api/rag/documents
// ==========================================
router.get(
  "/documents", 
  authMiddleware, 
  listDocumentsController
);

// ==========================================
//  Upload PDF or TXT
// POST /api/rag/upload
// ==========================================
router.post(
  '/upload',
  authMiddleware,
  upload.single('file'),
  uploadAndProcessDocument
);

// ==========================================
//  Semantic Search
// POST /api/rag/search
// ==========================================
router.post(
  '/search',
  authMiddleware,
  semanticSearch
);

// ==========================================
// Ask AI
// POST /api/rag/ask
// ==========================================
router.post(
  '/ask',
  authMiddleware,
  askDocumentAI
);

// ==========================================
// Delete Document (by docId)
// DELETE /api/rag/documents/:docId
// ==========================================
router.delete(
  '/documents/:docId',
  authMiddleware,
  deleteDocument
);

// ==========================================
//  Delete Document with Validation (by documentId)
// DELETE /api/rag/documents/:documentId
// ==========================================
router.delete(
  "/documents/:documentId",
  authMiddleware,
  documentIdParamValidation,
  deleteDocumentController,
);
// GET /api/rag/documents/:documentId/chunks
router.get(
  '/documents/:documentId/chunks',
  authMiddleware,
  getDocumentChunksController
);

export default router;