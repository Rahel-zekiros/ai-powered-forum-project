
const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 100;

export const createChunks = (
  pages,
  chunkSize = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP,
) => {
  const chunks = [];

  if (!Array.isArray(pages) || pages.length === 0) {
    return chunks;
  }

  let globalChunkIndex = 0;

  for (const page of pages) {
    if (!page?.text?.trim()) {
      continue;
    }

    // Keep the original line breaks
    const pageText = page.text.trim();

    // ==========================================
    // Small page = one chunk
    // ==========================================

    if (pageText.length <= chunkSize) {
      console.log(`\n========== CHUNK ${globalChunkIndex} ==========\n`);

      console.log(pageText);

      console.log(`\n========== END CHUNK ${globalChunkIndex} ==========\n`);

      chunks.push({
        content: pageText,
        chunkIndex: globalChunkIndex,
        pageStart: page.pageNumber,
        pageEnd: page.pageNumber,
      });

      globalChunkIndex++;
      continue;
    }
