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
// ==========================================
// Extract PDF Pages
// ==========================================

export const extractPdfPages = async (pdfBuffer) => {
  try {
    const pdfExtract = new PDFExtract();

    const data = await pdfExtract.extractBuffer(pdfBuffer);

    if (!data || !Array.isArray(data.pages)) {
      throw new Error("Invalid PDF file structure or empty pages.");
    }

    const pages = [];

    // ==========================================
    // Process Every PDF Page
    // ==========================================

    for (let pageIndex = 0; pageIndex < data.pages.length; pageIndex++) {
      const page = data.pages[pageIndex];

      if (!page || !Array.isArray(page.content)) {
        continue;
      }
