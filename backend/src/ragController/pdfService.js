import fs from "fs/promises";
import { PDFExtract } from "pdf.js-extract";

// ==========================================
// Read PDF File
// ==========================================

export const readPdfFile = async (filePath) => {
  return await fs.readFile(filePath);
};

// ==========================================
// Extract Text File (Supports TXT)
// ==========================================
export const extractTextFile = async (filePath) => {
  try {
    console.log("Reading TXT from:", filePath);

    const fileContent = await fs.readFile(filePath, "utf8");

    console.log("TXT length:", fileContent.length);
    console.log("TXT content:", JSON.stringify(fileContent));

    if (!fileContent || !fileContent.trim()) {
      throw new Error("The TXT file is empty.");
    }

    return fileContent.trim();
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

    for (let pageIndex = 0; pageIndex < data.pages.length; pageIndex++) {
      const page = data.pages[pageIndex];

      if (!page || !Array.isArray(page.content)) {
        continue;
      }

      const sortedItems = [...page.content].sort((a, b) => {
        const yA = Number.isFinite(a.y) ? a.y : 0;
        const yB = Number.isFinite(b.y) ? b.y : 0;
        const xA = Number.isFinite(a.x) ? a.x : 0;
        const xB = Number.isFinite(b.x) ? b.x : 0;

        if (Math.abs(yA - yB) > 3) {
          return yA - yB;
        }
        return xA - xB;
      });

      const lines = [];

      for (const item of sortedItems) {
        const text = typeof item.str === "string" ? item.str.trim() : "";

        if (!text) {
          continue;
        }

        const itemY = Number.isFinite(item.y) ? item.y : 0;
        const lastLine = lines[lines.length - 1];

        if (!lastLine || Math.abs(lastLine.y - itemY) > 3) {
          lines.push({
            y: itemY,
            text,
          });
          continue;
        }

        lastLine.text += ` ${text}`;
      }

      const pageText = lines
        .map((line) => line.text.trim())
        .filter(Boolean)
        .join("\n");

      const cleanedPageText = cleanPdfText(pageText);

      if (cleanedPageText && !cleanedPageText.startsWith("%PDF")) {
        pages.push({
          pageNumber: pageIndex + 1,
          text: cleanedPageText,
        });
      }
    }

    if (pages.length === 0) {
      throw new Error(
        "No readable text found in this document. It might be a scanned image-only file.",
      );
    }

    return pages;
  } catch (err) {
    throw new Error(err.message || "Failed to parse document file");
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
  cleaned = cleaned.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/\r/g, "\n");
  cleaned = cleaned.replace(/<\/?[a-z][^>]*>/gi, "");
  cleaned = cleaned.replace(/^[ \t]+/gm, "");
  cleaned = cleaned.replace(/[ \t]+$/gm, "");
  cleaned = cleaned.replace(/^[●•]\s*/gm, "- ");
  cleaned = cleaned.replace(/^[○◦]\s*/gm, "  - ");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

  return cleaned.trim();
};

// ==========================================
// Delete File
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
