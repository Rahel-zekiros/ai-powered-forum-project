import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import { apiClient } from "../../services/core/api.client.js";
import {
  CloudUpload,
  FilePlus2,
  Trash,
  ScanSearch,
  WandSparkles,
  BadgeCheck,
  CopyCheck,
  MessageCircle,
  RefreshCw,
  FileDown,
  NotebookPen,
  LibraryBig,
  ChartNoAxesCombined,
  TriangleAlert,
} from "lucide-react";
import styles from "./knowledgeBase.module.css";

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [showPdf, setShowPdf] = useState(true);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [activeWorkspace, setActiveWorkspace] = useState("search");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  // Selected search result
  const [selectedResult, setSelectedResult] = useState(null);

  // AI Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [aiQuestion, setAiQuestion] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Highlight
  const [highlightedChunk, setHighlightedChunk] = useState(null);

  const chatEndRef = useRef(null);

  /*
   * Render Markdown content
   */
  const renderMarkdown = (content) => {
    return (
      <div className={styles.markdownContent}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw]}
        >
          {content || ""}
        </ReactMarkdown>
      </div>
    );
  };

  /*
   * Keep AI chat scrolled to the latest message
   */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages, isAskingAI]);

  /*
   * Fetch documents from the backend
   */
  async function fetchDocuments() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const res = await apiClient.get("/api/rag/library");

      setDocuments(res.data || []);
    } catch (err) {
      console.error("Error loading documents:", err);
      setErrorMessage("Could not load documents.");
    } finally {
      setIsLoading(false);
    }
  }

  /*
   * Load documents when page opens
   */
  useEffect(() => {
    const loadDocuments = async () => {
      await fetchDocuments();
    };

    loadDocuments();
  }, []);

  /*
   * Handle file selection
   */
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const fileName = file.name.toLowerCase();

      const isPdf =
        file.type === "application/pdf" || fileName.endsWith(".pdf");

      const isTxt = file.type === "text/plain" || fileName.endsWith(".txt");

      if (!isPdf && !isTxt) {
        alert("Please select a valid PDF or TXT file.");
        return;
      }

      setSelectedFile(file);
    }
  };

  /*
   * Upload selected document
   */
  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();

    formData.append("file", selectedFile);

    try {
      setIsUploading(true);
      setErrorMessage("");

      await apiClient.post("/api/rag/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSelectedFile(null);

      await fetchDocuments();
    } catch (err) {
      console.error("Upload Error:", err);

      const message = err.response?.data?.msg || "Failed to upload document.";

      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  /*
   * Delete document
   */
  const handleDelete = async (docId, e) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this document?",
    );

    if (!confirmed) return;

    try {
      await apiClient.delete(`/api/rag/documents/${docId}`);

      if (selectedDoc?.document_id === docId) {
        setSelectedDoc(null);

        setSelectedResult(null);

        setSearchQuery("");
        setSearchResults([]);
        setSearchError("");
        setSearchMessage("");

        setChatMessages([]);
        setAiQuestion("");
        setAiError("");

        setHighlightedChunk(null);
      }

      setDocuments((prev) => prev.filter((doc) => doc.document_id !== docId));
    } catch (err) {
      console.error("Delete Error:", err);

      const message = err.response?.data?.msg || "Failed to delete document.";

      alert(message);
    }
  };

  /*
   * Select document
   */
  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);

    setSearchQuery("");
    setSearchResults([]);
    setSelectedResult(null);

    setSearchError("");
    setSearchMessage("");

    setChatMessages([]);
    setAiQuestion("");
    setAiError("");

    setHighlightedChunk(null);

    if (doc) {
      setIsPreviewLoading(true);

      setTimeout(() => {
        setIsPreviewLoading(false);
      }, 600);
    }
  };

  /*
   * Select search result
   */
  const handleSelectResult = (result) => {
    const chunkIdx = result.chunkIndex ?? null;

    setSelectedResult(result);
    setHighlightedChunk(chunkIdx);
  };

  /*
   * Semantic search
   */
  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);

      setSearchError("");
      setSearchResults([]);
      setSelectedResult(null);
      setSearchMessage("");

      const payload = {
        query: searchQuery.trim(),
      };

      if (selectedDoc) {
        payload.documentId = selectedDoc.document_id;
      }

      const res = await apiClient.post("/api/rag/search", payload);
      console.log("res", res.data)
      if (res.data?.message) {
        setSearchMessage(res.data.message);
        setSearchResults([]);
      } else {
        const results = res.data?.results || [];

        setSearchResults(results);
        setSearchMessage("");

        if (results.length > 0) {
          setSelectedResult(results[0]);

          setHighlightedChunk(results[0].chunkIndex ?? 0);
        }
      }
    } catch (err) {
      console.error("Semantic Search Error:", err);

      setSearchError(
        err.response?.data?.msg || "Failed to perform semantic search.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  /*
   * Ask AI
   */
  const handleAskAI = async (e) => {
    e?.preventDefault();

    if (!aiQuestion.trim() || isAskingAI) {
      return;
    }

    const userQuestion = aiQuestion.trim();

    setAiQuestion("");
    setAiError("");

    const newHistory = [
      ...chatMessages,
      {
        role: "user",
        content: userQuestion,
      },
    ];

    setChatMessages(newHistory);
    setIsAskingAI(true);

    try {
      const payload = {
        question: userQuestion,
        history: chatMessages,
      };

      if (selectedDoc) {
        payload.documentId = selectedDoc.document_id;
      }

      const res = await apiClient.post("/api/rag/ask", payload);

      const fullAnswer = res.data?.answer || "No answer generated.";

      const sources = res.data?.sources || [];

      setChatMessages([
        ...newHistory,
        {
          role: "assistant",
          content: "",
          sources,
        },
      ]);

      let currentText = "";

      const words = fullAnswer.split(" ");

      for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? "" : " ") + words[i];

        setChatMessages([
          ...newHistory,
          {
            role: "assistant",
            content: currentText,
            sources,
          },
        ]);

        await new Promise((resolve) => setTimeout(resolve, 25));
      }
    } catch (err) {
      console.error("Ask Document AI Error:", err);

      setAiError(err.response?.data?.msg || "Failed to generate AI answer.");
    } finally {
      setIsAskingAI(false);
    }
  };

  /*
   * Copy AI answer
   */
  const handleCopyAnswer = (textToCopy, index) => {
    navigator.clipboard.writeText(textToCopy);

    setCopiedIndex(index);

    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  /*
   * Reset chat
   */
  const handleResetChat = () => {
    setChatMessages([]);
    setAiError("");
  };

  /*
   * Export chat
   */
  const handleExportChat = () => {
    if (chatMessages.length === 0) {
      return;
    }

    let markdownContent = `# Knowledge Base AI Chat Export\n\n`;

    chatMessages.forEach((msg) => {
      markdownContent += `### ${msg.role === "user" ? "You" : "AI Assistant"
        }\n${msg.content}\n\n`;
    });

    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.setAttribute("download", `chat-export-${Date.now()}.md`);

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };



  /*
   * Get search result score
   */
  const getResultScore = (result) => {
    if (!result) return null;

    return result.relevance ?? result.similarity ?? null;
  };

  return (
    <div className={styles.contentArea}>
      {/* ==================================================
          TOP BANNER
          ================================================== */}

      <div className={styles.bannerCard}>
        <span className={styles.bannerTag}>KNOWLEDGE BASE & AI RAG</span>

        <h1 className={styles.bannerTitle}>Private Document library</h1>

        <p className={styles.bannerDesc}>
          Upload study or reference PDFs and TXT files. Run semantic search
          across single or all documents, chat with streaming AI, take notes,
          and export sessions.
        </p>
      </div>

      {/* GENERAL ERROR */}

      {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

      {/* ==================================================
          MAIN TWO-COLUMN LAYOUT
          ================================================== */}

      <div className={styles.splitGrid}>
        {/* ==================================================
            LEFT COLUMN
            ================================================== */}

        <div className={styles.leftColumn}>
          <div className={styles.libraryCard}>
            <h3 className={styles.cardTitle}>Library</h3>

            <p className={styles.cardSubtitle}>
              Add and manage your reference files.
            </p>

            {/* ALL DOCUMENTS */}

            <button
              type="button"
              onClick={() => handleSelectDoc(null)}
              className={
                selectedDoc === null
                  ? styles.allDocumentsActive
                  : styles.allDocumentsButton
              }
            >
              <div className={styles.allDocumentsLeft}>
                <LibraryBig
                  size={18}
                  className={
                    selectedDoc === null
                      ? styles.allDocumentsIconActive
                      : styles.allDocumentsIcon
                  }
                />

                <span>All Documents (Cross-Search & Chat)</span>
              </div>

              <span
                className={
                  selectedDoc === null
                    ? styles.activeDocumentBadge
                    : styles.selectDocumentBadge
                }
              >
                {selectedDoc === null ? "Active" : "Click to select"}
              </span>
            </button>

            {/* UPLOAD */}

            <div className={styles.uploadDashedBox}>
              <p className={styles.uploadInstruction}>
                Accepted format: PDF, TXT.
              </p>

              <div className={styles.uploadControls}>
                <label className={styles.chooseFileBtn}>
                  <FilePlus2 size={15} />
                  Choose file
                  <input
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    onChange={handleFileChange}
                    className={styles.hiddenFileInput}
                  />
                </label>

                <button
                  type="button"
                  className={styles.uploadBtn}
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  <CloudUpload size={15} />

                  {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>

              <span className={styles.fileNameDisplay}>
                {selectedFile ? selectedFile.name : "No file selected."}
              </span>
            </div>

            {/* DOCUMENT LIST */}

            {isLoading ? (
              <p className={styles.statusText}>Loading your library...</p>
            ) : documents.length === 0 ? (
              <p className={styles.emptyListText}>
                Your library is empty. Upload a file to begin.
              </p>
            ) : (
              <div className={styles.documentsList}>
                {documents.map((doc) => (
                  <div
                    key={doc.document_id}
                    className={`${styles.documentItem} ${selectedDoc?.document_id === doc.document_id
                      ? styles.selectedItem
                      : ""
                      }`}
                    onClick={() => handleSelectDoc(doc)}
                  >
                    <div className={styles.docInfo}>
                      <span className={styles.docName}>{doc.title}</span>

                      <span className={styles.readyBadge}>READY</span>
                    </div>

                    <button
                      type="button"
                      className={styles.deleteBtn}
                      onClick={(e) => handleDelete(doc.document_id, e)}
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ==================================================
            RIGHT COLUMN
            ================================================== */}

        <div className={styles.rightColumn}>
          {/* ==================================================
              READER
              ================================================== */}

          {selectedDoc ? (
            <div className={styles.activeReaderContainer}>
              <div className={styles.readerSection}>
                <div className={styles.readerHeader}>
                  <div>
                    <h3 className={styles.sectionTitle}>
                      Reader ({selectedDoc.title})
                    </h3>

                    <p className={styles.sectionSubtitle}>Interactive Viewer</p>
                  </div>

                  <div className={styles.readerHeaderActions}>
                    {highlightedChunk !== null && (
                      <button
                        type="button"
                        onClick={() => setHighlightedChunk(null)}
                        className={styles.clearHighlightBtn}
                      >
                        Clear Chunk Highlight
                      </button>
                    )}

                    <button
                      type="button"
                      className={styles.pdfHideButton}
                      onClick={() => setShowPdf((prev) => !prev)}
                    >
                      {showPdf ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* PDF VIEWER */}

                {showPdf &&
                  (isPreviewLoading ? (
                    <div className={styles.readerBoxPlaceholder}>
                      Loading document preview...
                    </div>
                  ) : (
                    <div className={styles.pdfViewerContainer}>
                      <iframe
                        src={`http://localhost:3777/${selectedDoc.storage_path}`}
                        title="Document Preview"
                        className={styles.pdfIframe}
                      />
                    </div>
                  ))}
              </div>

              <div className={styles.sectionDivider} />
            </div>
          ) : (
            /* ALL DOCUMENTS MODE */

            <div className={styles.allDocumentsModeBanner}>
              <WandSparkles size={16} className={styles.allDocumentsModeIcon} />

              <span>
                <strong>All Documents Mode Active:</strong> You are currently
                searching and chatting across your entire library collection.
              </span>
            </div>
          )}

          {/* ==================================================
              KNOWLEDGE WORKSPACE
              ================================================== */}

          <div className={styles.knowledgeWorkspace}>
            {/* ==================================================
                TABS
                ================================================== */}

            <div className={styles.tabs}>
              {/* SEARCH TAB */}

              <button
                type="button"
                className={
                  activeWorkspace === "search"
                    ? `${styles.tab} ${styles.tabActive}`
                    : styles.tab
                }
                onClick={() => setActiveWorkspace("search")}
              >
                <ScanSearch size={15} />
                Search
              </button>

              {/* ASK AI TAB */}

              <button
                type="button"
                className={
                  activeWorkspace === "ai"
                    ? `${styles.tab} ${styles.tabActive}`
                    : styles.tab
                }
                onClick={() => setActiveWorkspace("ai")}
              >
                <WandSparkles size={15} />
                Ask AI
              </button>
            </div>

            {/* ==================================================
                SEARCH WORKSPACE
                ================================================== */}

            {activeWorkspace === "search" && (
              <section className={styles.workspaceCard}>
                {/* SEARCH HEADER */}

                <div className={styles.cardHead}>
                  <div>
                    <h3 className={styles.cardTitle}>Semantic Search</h3>

                    <p className={styles.cardSub}>
                      Find passages by contextual meaning.
                    </p>
                  </div>
                </div>

                {/* SEARCH INPUT */}

                <div className={styles.searchRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>Search query</label>

                    <input
                      type="text"
                      className={styles.textInput}
                      placeholder="Enter keywords or concepts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !isSearching &&
                          searchQuery.trim()
                        ) {
                          handleSemanticSearch();
                        }
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleSemanticSearch}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    <ScanSearch size={14} />

                    {isSearching ? "Searching..." : "Search"}
                  </button>
                </div>

                {/* SEARCH ERROR */}

                {searchError && (
                  <div className={styles.searchErrorBanner}>{searchError}</div>
                )}

                {/* SEARCH MESSAGE */}

                {searchMessage && (
                  <div className={styles.searchMessageBanner}>
                    <TriangleAlert size={18} className={styles.warningIcon} />

                    <span>{searchMessage}</span>
                  </div>
                )}

                {/* ==================================================
                    SEARCH RESULTS
                    ================================================== */}

                {searchResults.length > 0 && (
                  <div className={styles.results}>
                    <div className={styles.resultsMeta}>
                      <div className={styles.searchResultsTitle}>
                        <ChartNoAxesCombined
                          size={16}
                          className={styles.blueIcon}
                        />

                        <strong>Search Results</strong>
                      </div>

                      <span className={styles.resultCount}>
                        {Math.min(searchResults.length, 5)} result
                        {Math.min(searchResults.length, 5) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* RESULT CARDS */}

                    {searchResults.slice(0, 5).map((result, index) => {
                      const score = getResultScore(result);

                      const chunkIdx = result.chunkIndex ?? index;

                      const chunkKey = `${result.documentId || selectedDoc?.document_id || "doc"
                        }-${chunkIdx}`;

                      const isSelected =
                        selectedResult?.chunkId === result.chunkId ||
                        selectedResult === result;

                      return (
                        <div
                          key={result.chunkId ?? chunkKey}
                          onClick={() => handleSelectResult(result)}
                          className={
                            isSelected
                              ? `${styles.result} ${styles.resultActive}`
                              : styles.result
                          }
                        >
                          {/* RESULT HEADER */}

                          <div className={styles.resultHead}>
                            <span>
                              Chunk {chunkIdx}
                              {score !== undefined &&
                                score !== null &&
                                ` • relevance ${score}`}
                            </span>

                            <span className={styles.score}>
                              {isSelected ? "Selected" : "Select"}
                            </span>
                          </div>

                          {/* RESULT CONTENT */}

                          <div className={styles.searchResultContent}>
                            {renderMarkdown(result.content)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ==================================================
                ASK AI WORKSPACE
                ================================================== */}

            {activeWorkspace === "ai" && (
              <section className={styles.workspaceCard}>
                {/* AI HEADER */}

                <div className={styles.cardHead}>
                  <div>
                    <h3 className={styles.cardTitle}>Interactive AI Chat</h3>

                    <p className={styles.cardSub}>
                      Ask follow-up questions with streaming answers grounded in
                      your library.
                    </p>
                  </div>

                  {/* CHAT ACTIONS */}

                  <div className={styles.chatActions}>
                    {chatMessages.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleExportChat}
                          className={styles.ghostBtn}
                          title="Export Chat as Markdown"
                        >
                          <FileDown size={12} />
                          Export
                        </button>

                        <button
                          type="button"
                          onClick={handleResetChat}
                          className={styles.ghostBtn}
                        >
                          <RefreshCw size={12} />
                          Clear
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ==================================================
                    CHAT HISTORY
                    ================================================== */}

                {chatMessages.length > 0 && (
                  <div className={styles.chatList}>
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={
                          msg.role === "user" ? styles.msgUser : styles.msgAi
                        }
                      >
                        {/* MESSAGE HEADER */}

                        <div className={styles.chatMessageHeader}>
                          <span
                            className={
                              msg.role === "user"
                                ? styles.userMessageLabel
                                : styles.assistantMessageLabel
                            }
                          >
                            {msg.role === "user"
                              ? "You"
                              : "AI Assistant Response"}
                          </span>

                          {/* COPY */}

                          {msg.role === "assistant" && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyAnswer(msg.content, index)
                              }
                              className={
                                copiedIndex === index
                                  ? styles.copyBtnCopied
                                  : styles.copyBtn
                              }
                            >
                              {copiedIndex === index ? (
                                <>
                                  <BadgeCheck size={13} />

                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <CopyCheck size={13} />

                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* MESSAGE */}

                        <div className={styles.markdown}>
                          {renderMarkdown(msg.content)}
                        </div>

                        {/* SOURCES */}

                        {msg.sources && msg.sources.length > 0 && (
                          <div className={styles.msgFoot}>
                            <strong className={styles.sourcesLabel}>
                              Source references:
                            </strong>

                            {msg.sources.map((source, sIdx) => {
                              const sChunkIdx = source.chunkIndex ?? sIdx;

                              return (
                                <span
                                  key={source.chunkId || sIdx}
                                  onClick={() => {
                                    setHighlightedChunk(sChunkIdx);

                                    const matchingResult = searchResults.find(
                                      (result) =>
                                        result.chunkId === source.chunkId,
                                    );

                                    if (matchingResult) {
                                      setSelectedResult(matchingResult);
                                    }
                                  }}
                                  className={styles.sourceChip}
                                  title="Click to inspect source chunk"
                                >
                                  [{sIdx + 1}] (chunk {sChunkIdx})
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}

                    <div ref={chatEndRef} />
                  </div>
                )}

                {/* ==================================================
                    ASK AI INPUT
                    ================================================== */}

                <form onSubmit={handleAskAI} className={styles.askRow}>
                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>
                      Follow-up or Question
                    </label>

                    <textarea
                      rows={3}
                      className={styles.textarea}
                      placeholder="Ask a question or request a follow-up across your library..."
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                    />
                  </div>

                  {/* ASK AI BUTTON */}

                  <button
                    type="submit"
                    className={styles.primaryBtn}
                    disabled={isAskingAI || !aiQuestion.trim()}
                  >
                    {isAskingAI ? (
                      <WandSparkles size={14} className={styles.spin} />
                    ) : (
                      <MessageCircle size={14} />
                    )}

                    {isAskingAI ? "Thinking & Streaming..." : "Ask AI"}
                  </button>
                </form>

                {/* AI ERROR */}

                {aiError && <div className={styles.errorBanner}>{aiError}</div>}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
