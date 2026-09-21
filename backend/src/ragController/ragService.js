import { readPdfFile, extractPdfPages, deletePdfFile } from "./pdfService.js";

import { createChunks } from "./chunkService.js";

import { createEmbedding } from "./embeddingService.js";

import { safeExecute } from "../../db/config.js";

import { generateGroundedAnswer } from "./aiService.js";


export const processDocument = async ({ userId, file }) =>{
    
}