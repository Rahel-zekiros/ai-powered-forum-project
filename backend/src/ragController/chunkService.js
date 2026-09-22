
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
 // ==========================================
    // Large page = multiple chunks
    // ==========================================

    let start = 0;

    while (start < pageText.length) {
      let end = Math.min(start + chunkSize, pageText.length);

      if (end < pageText.length) {
        // Prefer paragraph boundary
        const paragraphBreak = pageText.lastIndexOf("\n\n", end);

        // Then sentence boundary
        const sentenceBreak = pageText.lastIndexOf(". ", end);

        // Then normal line boundary
        const newlineBreak = pageText.lastIndexOf("\n", end);

        // Finally word boundary
        const spaceBreak = pageText.lastIndexOf(" ", end);

        if (paragraphBreak > start + 200) {
          end = paragraphBreak + 2;
        } else if (sentenceBreak > start + 200) {
          end = sentenceBreak + 2;
        } else if (newlineBreak > start + 200) {
          end = newlineBreak + 1;
        } else if (spaceBreak > start) {
          end = spaceBreak;
        }
      }
