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
    const pageText = (page?.text || "").trim();

    if (!pageText) {
      continue;
    }

    // ==========================================
    // Small page = one chunk
    // ==========================================
    if (pageText.length <= chunkSize) {
      chunks.push({
        content: pageText,
        chunkIndex: globalChunkIndex,
        pageStart: page.pageNumber || 1,
        pageEnd: page.pageNumber || 1,
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
        const paragraphBreak = pageText.lastIndexOf("\n\n", end);
        const sentenceBreak = pageText.lastIndexOf(". ", end);
        const newlineBreak = pageText.lastIndexOf("\n", end);
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

      const chunkText = pageText.slice(start, end).trim();

      if (chunkText) {
        chunks.push({
          content: chunkText,
          chunkIndex: globalChunkIndex,
          pageStart: page.pageNumber || 1,
          pageEnd: page.pageNumber || 1,
        });

        globalChunkIndex++;
      }

      if (end >= pageText.length) {
        break;
      }

      let nextStart = end - overlap;

      while (
        nextStart > start &&
        nextStart < pageText.length &&
        pageText[nextStart - 1] !== " " &&
        pageText[nextStart - 1] !== "\n"
      ) {
        nextStart--;
      }

      if (nextStart <= start || nextStart >= end) {
        start = end;
      } else {
        start = nextStart;
      }
    }
  }

  if (chunks.length === 0 && pages.length > 0) {
    const fallbackText = (pages[0]?.text || "").trim();
    if (fallbackText) {
      chunks.push({
        content: fallbackText,
        chunkIndex: 0,
        pageStart: 1,
        pageEnd: 1,
      });
    }
  }

  return chunks;
};