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
  CircleX,
  DatabaseZap,
  ChartNoAxesCombined,
  TriangleAlert,
  ArrowRight,
  CheckCircle2,
  XCircle,
  X,
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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  const [selectedResult, setSelectedResult] = useState(null);

  const [chatMessages, setChatMessages] = useState([]);
  const [aiQuestion, setAiQuestion] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [highlightedChunk, setHighlightedChunk] = useState(null);

  const [userNotes, setUserNotes] = useState({});
  const [activeNoteText, setActiveNoteText] = useState("");

  const chatEndRef = useRef(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isAskingAI]);
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  const handleSelectResult = (result) => {
    const chunkIdx = result.chunkIndex ?? null;

    setSelectedResult(result);
    setHighlightedChunk(chunkIdx);
  };

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

  // Ask AI
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

  // Copy Answer
  const handleCopyAnswer = (textToCopy, index) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Reset Chat
  const handleResetChat = () => {
    setChatMessages([]);
    setAiError("");
  };

  // Export Chat
  const handleExportChat = () => {
    if (chatMessages.length === 0) return;

    let markdownContent = `# Knowledge Base AI Chat Export\n\n`;
    chatMessages.forEach((msg) => {
      markdownContent += `### ${
        msg.role === "user" ? "You" : "AI Assistant"
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

  // Save Note
  const handleSaveNote = (chunkKey) => {
    if (!activeNoteText.trim()) return;
    setUserNotes((prev) => ({
      ...prev,
      [chunkKey]: activeNoteText.trim(),
    }));
    setActiveNoteText("");
    alert("Note saved successfully for this chunk!");
  };

  // Result Score
  const getResultScore = (result) => {
    if (!result) return null;
    return result.relevance ?? result.similarity ?? null;
  };

  return (
    <div className={styles.contentArea}>
      {/* TOP BANNER */}
      <div className={styles.bannerCard}>
        <span className={styles.bannerTag}>KNOWLEDGE BASE & AI RAG</span>

        <h1 className={styles.bannerTitle}>Private Document library</h1>

        <p className={styles.bannerDesc}>
          Upload study or reference PDFs and TXT files. Run semantic search
          across single or all documents, chat with streaming AI, take notes,
          and export sessions.
        </p>
      </div>

      {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

      <div className={styles.splitGrid}>
        {/* LEFT COLUMN */}
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

                <span>All Documents(Cross-Search & Chat)</span>
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
            {/* DOCUMENTS */}
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
                    className={`${styles.documentItem} ${
                      selectedDoc?.document_id === doc.document_id
                        ? styles.selectedItem
                        : ""
                    }`}
                    onClick={() => handleSelectDoc(doc)}
                  >
                    <div className={styles.docInfo}>
                      <span className={styles.docName}>{doc.filename}</span>

                      <span className={styles.readyBadge}>READY</span>
                    </div>
                    <button
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
        {/* RIGHT COLUMN */}
        <div className={styles.rightColumn}>
          {/* READER */}
          {selectedDoc ? (
            <div className={styles.activeReaderContainer}>
              <div className={styles.readerSection}>
                <div className={styles.readerHeader}>
                  <div>
                    <h3 className={styles.sectionTitle}>
                      Reader ({selectedDoc.filename})
                    </h3>
                    <p className={styles.sectionSubtitle}>Interactive Viewer</p>
                  </div>
                  {highlightedChunk !== null && (
                    <button
                      onClick={() => setHighlightedChunk(null)}
                      className={styles.clearHighlightBtn}
                    >
                      Clear Chunk Highlight
                    </button>
                  )}
                </div>
                {isPreviewLoading ? (
                  <div className={styles.readerBoxPlaceholder}>
                    Loading document preview...
                  </div>
                ) : (
                  <div className={styles.pdfViewerContainer}>
                    <iframe
                      src={`http://localhost:5000/${selectedDoc.file_path}`}
                      title="Document Preview"
                      className={styles.pdfIframe}
                    />
                  </div>
                )}
              </div>
              <div className={styles.sectionDivider} />
            </div>
          ) : (
            <div className={styles.allDocumentsModeBanner}>
              <WandSparkles size={16} className={styles.allDocumentsModeIcon} />
              <span>
                <strong>All Documents Mode Active:</strong> You are currently
                searching and chatting across your entire library collection.
              </span>
            </div>
          )}
          {/* SEMANTIC SEARCH */}
          <div className={styles.featureSection}>
            <h3 className={styles.sectionTitle}>Semantic search</h3>
            <p className={styles.sectionSubtitle}>
              Find passages by contextual meaning.
            </p>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Search query</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Enter keywords or concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSearching && searchQuery.trim()) {
                    handleSemanticSearch();
                  }
                }}
              />
            </div>
            <button
              className={styles.actionOrangeBtn}
              onClick={handleSemanticSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              <ScanSearch size={14} />

              {isSearching ? "Searching..." : "Search"}
            </button>
            {searchError && (
              <div className={styles.searchErrorBanner}>{searchError}</div>
            )}

            {searchMessage && (
              <div className={styles.searchMessageBanner}>
                <span>
                  <TriangleAlert className="w-5 h-5 text-yellow-500" />
                </span>
                <span>{searchMessage}</span>
              </div>
            )}
            {/* SEARCH RESULTS */}
            {searchResults.length > 0 && (
              <div className={styles.searchResultsContainer}>
                <div className={styles.searchResultsHeader}>
                  <div className={styles.searchResultsTitle}>
                    <ChartNoAxesCombined
                      size={16}
                      className={styles.blueIcon}
                    />
                    <strong>Search Results</strong>
                  </div>
                  <span className={styles.resultCount}>
                    {searchResults.length} result
                    {searchResults.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {searchResults.map((result, index) => {
                  const score = getResultScore(result);
                  const chunkIdx = result.chunkIndex ?? index;
                  const chunkKey = `${result.documentId || selectedDoc?.document_id || "doc"}-${chunkIdx}`;
                  const isSelected =
                    selectedResult?.chunkId === result.chunkId ||
                    selectedResult === result;
                  return (
                    <div
                      key={result.chunkId ?? chunkKey}
                      onClick={() => handleSelectResult(result)}
                      className={
                        isSelected
                          ? styles.searchResultCardSelected
                          : styles.searchResultCard
                      }
                    >
                      <div className={styles.resultHeader}>
                        <span className={styles.resultChunkTitle}>
                          Chunk {chunkIdx}
                          {score !== undefined &&
                            score !== null &&
                            ` • relevance ${score}`}
                        </span>

                        <span
                          className={
                            isSelected
                              ? styles.resultSelectedText
                              : styles.resultInspectText
                          }
                        >
                          {isSelected ? "Selected" : "Click to inspect"}
                        </span>
                      </div>

                      <div className={styles.searchResultContent}>
                        {renderMarkdown(result.content)}
                      </div>

                      {userNotes[chunkKey] && (
                        <div className={styles.noteDisplay}>
                          <strong>My Note: </strong>

                          {userNotes[chunkKey]}
                        </div>
                      )}

                      <div
                        className={styles.noteInputRow}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          placeholder="Add private note for this chunk..."
                          value={activeNoteText}
                          onChange={(e) => setActiveNoteText(e.target.value)}
                          className={styles.noteInput}
                        />

                        <button
                          type="button"
                          onClick={() => handleSaveNote(chunkKey)}
                          className={styles.saveNoteBtn}
                        >
                          <NotebookPen size={12} />
                          Save Note
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* SELECTED RESULT */}

            {selectedResult && (
              <div className={styles.selectedResultPanel}>
                <div className={styles.selectedResultHeader}>
                  <div className={styles.selectedResultTitleArea}>
                    <DatabaseZap size={19} className={styles.blueIcon} />

                    <div>
                      <h3 className={styles.selectedResultTitle}>
                        Selected Search Result
                      </h3>

                      <p className={styles.selectedResultSubtitle}>
                        Detailed semantic search information
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedResult(null);
                      setHighlightedChunk(null);
                    }}
                    className={styles.closeButton}
                  >
                    <CircleX size={13} />
                    Close
                  </button>
                </div>

                {/* METADATA */}

                <div className={styles.metadataGrid}>
                  <div className={styles.metadataCard}>
                    <div className={styles.metadataLabel}>CHUNK</div>

                    <strong className={styles.metadataValue}>
                      {selectedResult.chunkIndex ?? "N/A"}
                    </strong>
                  </div>

                  <div className={styles.metadataCard}>
                    <div className={styles.metadataLabel}>RELEVANCE</div>

                    <strong className={styles.metadataRelevance}>
                      {getResultScore(selectedResult) ?? "N/A"}
                    </strong>
                  </div>

                  <div className={styles.metadataCard}>
                    <div className={styles.metadataLabel}>CHUNK ID</div>

                    <strong className={styles.metadataChunkId}>
                      {selectedResult.chunkId ?? "N/A"}
                    </strong>
                  </div>
                </div>

                {/* DOCUMENT */}

                <div className={styles.documentInformation}>
                  <strong>Document:</strong>{" "}
                  {selectedDoc?.filename || "All Documents"}
                </div>

                {/* CONTENT */}

                <div>
                  <h4 className={styles.contentTitle}>Retrieved Content</h4>

                  <div className={styles.retrievedContent}>
                    {renderMarkdown(selectedResult.content)}
                  </div>
                </div>

                {/* SIMILARITY */}

                <div className={styles.similarityPanel}>
                  <div className={styles.similarityHeader}>
                    <ChartNoAxesCombined
                      size={16}
                      className={styles.blueIcon}
                    />

                    <h4 className={styles.similarityTitle}>
                      Semantic Similarity
                    </h4>
                  </div>

                  <div className={styles.similarityContent}>
                    <div className="flex items-center gap-2">
                      Query embedding
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      Chunk embedding
                    </div>
                    <div className="flex items-center gap-2">
                      Cosine similarity
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <strong>{getResultScore(selectedResult)}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      Similarity threshold
                      <ArrowRight className="w-4 h-4 text-gray-500" />
                      <strong>0.600</strong>
                    </div>

                    <div className={styles.similarityDecision}>
                      {getResultScore(selectedResult) >= 0.6 ? (
                        <strong
                          className={`${styles.acceptedResult} flex items-center gap-2`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Relevant result accepted
                        </strong>
                      ) : (
                        <strong
                          className={`${styles.rejectedResult} flex items-center gap-2`}
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                          Result below threshold
                        </strong>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI CHAT */}

          <div className={styles.sectionDivider} />

          <div className={styles.featureSection}>
            <div className={styles.chatHeader}>
              <div>
                <h3 className={styles.sectionTitle}>Interactive AI Chat</h3>

                <p className={styles.sectionSubtitle}>
                  Ask follow-up questions with streaming answers grounded in
                  library.
                </p>
              </div>

              <div className={styles.chatHeaderButtons}>
                {chatMessages.length > 0 && (
                  <>
                    <button
                      onClick={handleExportChat}
                      className={styles.exportButton}
                      title="Export Chat as Markdown"
                    >
                      <FileDown size={12} />
                      Export
                    </button>

                    <button
                      onClick={handleResetChat}
                      className={styles.clearButton}
                    >
                      <RefreshCw size={12} />
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* CHAT HISTORY */}

            {chatMessages.length > 0 && (
              <div className={styles.chatHistory}>
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={
                      msg.role === "user"
                        ? styles.userChatMessage
                        : styles.assistantChatMessage
                    }
                  >
                    <div className={styles.chatMessageHeader}>
                      <span
                        className={
                          msg.role === "user"
                            ? styles.userMessageLabel
                            : styles.assistantMessageLabel
                        }
                      >
                        {msg.role === "user" ? "You" : "AI Assistant Response"}
                      </span>

                      {msg.role === "assistant" && (
                        <button
                          type="button"
                          onClick={() => handleCopyAnswer(msg.content, index)}
                          className={
                            copiedIndex === index
                              ? styles.copyButtonCopied
                              : styles.copyButton
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

                    <div className={styles.chatMarkdownContent}>
                      {renderMarkdown(msg.content)}
                    </div>

                    {/* SOURCES */}

                    {msg.sources && msg.sources.length > 0 && (
                      <div className={styles.sourcesContainer}>
                        <strong>Source references: </strong>

                        {msg.sources.map((source, sIdx) => {
                          const sChunkIdx = source.chunkIndex ?? sIdx;

                          return (
                            <span
                              key={source.chunkId || sIdx}
                              onClick={() => {
                                setHighlightedChunk(sChunkIdx);

                                const matchingResult = searchResults.find(
                                  (result) => result.chunkId === source.chunkId,
                                );

                                if (matchingResult) {
                                  setSelectedResult(matchingResult);
                                }
                              }}
                              className={styles.sourceLink}
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

            {/* QUESTION INPUT */}

            <form onSubmit={handleAskAI} className={styles.aiQuestionForm}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>
                  Follow-up or Question
                </label>

                <textarea
                  rows={3}
                  className={styles.textareaInput}
                  placeholder="Ask a question or request a follow-up across your library..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={styles.actionOrangeBtn}
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

            {aiError && <div className={styles.errorBanner}>{aiError}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
