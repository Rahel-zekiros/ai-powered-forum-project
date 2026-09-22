import fs from "fs/promises";
import { PDFExtract } from "pdf.js-extract";

// ==========================================
// Read PDF File
// ==========================================

export const readPdfFile = async (filePath) => {
  return await fs.readFile(filePath);
};

// ==========================================
// Extract Text File
// ==========================================

export const extractTextFile = async (filePath) => {
  try {
    const fileContent = await fs.readFile(filePath, "utf8");

    return cleanPdfText(fileContent);
  } catch (err) {
    throw new Error(err.message || "Failed to read text file");
  }
};
