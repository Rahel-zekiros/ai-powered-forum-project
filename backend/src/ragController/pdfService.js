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
 // ==========================================
      // Sort PDF Items
      // First by Y position
      // Then by X position
      // ==========================================

      const sortedItems = [...page.content].sort((a, b) => {
        const yA = Number.isFinite(a.y) ? a.y : 0;

        const yB = Number.isFinite(b.y) ? b.y : 0;

        const xA = Number.isFinite(a.x) ? a.x : 0;

        const xB = Number.isFinite(b.x) ? b.x : 0;

        // Different lines
        if (Math.abs(yA - yB) > 3) {
          return yA - yB;
        }

        // Same line
        return xA - xB;
      });

      // ==========================================
      // Build Lines
      // ==========================================

      const lines = [];

      for (const item of sortedItems) {
        const text = typeof item.str === "string" ? item.str.trim() : "";

        if (!text) {
          continue;
        }

        const itemY = Number.isFinite(item.y) ? item.y : 0;

        const lastLine = lines[lines.length - 1];
// ========================================
        // Create New Line
        // ========================================

        if (!lastLine || Math.abs(lastLine.y - itemY) > 3) {
          lines.push({
            y: itemY,
            text,
          });

          continue;
        }

        // ========================================
        // Same Line
        // ========================================

        lastLine.text += ` ${text}`;
      }

      // ==========================================
      // Convert Lines to Page Text
      // ==========================================

      const pageText = lines
        .map((line) => line.text.trim())
        .filter(Boolean)
        .join("\n");

      // ==========================================
      // DEBUG: RAW EXTRACTED TEXT
      // ==========================================

      console.log(`\n========== PAGE ${pageIndex + 1} RAW TEXT ==========\n`);

      console.log(pageText);

      console.log(`\n========== END PAGE ${pageIndex + 1} ==========\n`);

      // ==========================================
      // Clean Extracted Text
      // ==========================================

      const cleanedPageText = cleanPdfText(pageText);

      // ==========================================
      // Prevent Raw PDF Binary Text
      // ==========================================

      if (cleanedPageText && !cleanedPageText.startsWith("%PDF")) {
        pages.push({
          pageNumber: pageIndex + 1,
          text: cleanedPageText,
        });
      }
    }
    // ==========================================
    // Make Sure We Found Text
    // ==========================================

    if (pages.length === 0) {
      throw new Error(
        "No readable text found in this PDF. It might be a scanned image-only PDF.",
      );
    }

    return pages;
  } catch (err) {
    throw new Error(err.message || "Failed to parse PDF file");
  }
};

// ==========================================
// Clean PDF Text
// ==========================================

export const cleanPdfText = (text) => {
  if (!text) {
    return "";
  }

  let cleaned = text;

  // ==========================================
  // Normalize Line Endings
  // ==========================================

  cleaned = cleaned.replace(/\r\n/g, "\n");

  cleaned = cleaned.replace(/\r/g, "\n");

  // ==========================================
  // Remove HTML Tags
  // Example:
  // <h1>0</h1> -> 0
  // <p>Hello</p> -> Hello
  // ==========================================

  cleaned = cleaned.replace(/<\/?[a-z][^>]*>/gi, "");

  // ==========================================
  // Remove Spaces at Line Start
  // ==========================================

  cleaned = cleaned.replace(/^[ \t]+/gm, "");

  // ==========================================
  // Remove Spaces at Line End
  // ==========================================

  cleaned = cleaned.replace(/[ \t]+$/gm, "");

  // ==========================================
  // Convert PDF Bullet Symbols
  // to Markdown Bullets
  // ==========================================

  cleaned = cleaned.replace(/^[●•]\s*/gm, "- ");

  cleaned = cleaned.replace(/^[○◦]\s*/gm, "  - ");

  // ==========================================
  // Keep Maximum Two New Lines
  // ==========================================

  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
};

// ==========================================
// Delete PDF File
// ==========================================

export const deletePdfFile = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (fileErr) {
    if (fileErr.code !== "ENOENT") {
      console.error("File Cleanup Error:", fileErr.message);
    }
  }
};
