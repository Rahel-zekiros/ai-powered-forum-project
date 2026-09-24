import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import toast, { Toaster } from "react-hot-toast";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import styles from "./knowledgeBase.module.css";

export default function KnowledgeBase() {
  // ==========================================
  // DOCUMENT STATES
  // ==========================================

  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ==========================================
  // TXT READER STATES
  // ==========================================

  const [textContent, setTextContent] = useState("");
  const [isLoadingText, setIsLoadingText] = useState(false);

  // ==========================================
  // SEARCH STATES
  // ==========================================

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchMessage, setSearchMessage] = useState("");

  const [selectedResult, setSelectedResult] = useState(null);

  // ==========================================
  // COLLAPSIBLE CHUNKS
  // ==========================================

  const [expandedChunks, setExpandedChunks] = useState({});

  const toggleChunkExpand = (chunkKey, e) => {
    e?.stopPropagation();

    setExpandedChunks((prev) => ({
      ...prev,
      [chunkKey]: !prev[chunkKey],
    }));
  };

  // ==========================================
  // AI CHAT STATES
  // ==========================================

  const [chatMessages, setChatMessages] = useState([]);
  const [aiQuestion, setAiQuestion] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiError, setAiError] = useState("");

  const [copiedIndex, setCopiedIndex] = useState(null);

  // ==========================================
  // HIGHLIGHTED CHUNK
  // ==========================================

  const [highlightedChunk, setHighlightedChunk] = useState(null);

  // ==========================================
  // NOTES
  // ==========================================

  const [userNotes, setUserNotes] = useState({});
  const [activeNoteText, setActiveNoteText] = useState("");

  // ==========================================
  // CHAT SCROLL REF
  // ==========================================

  const chatEndRef = useRef(null);

  // ==========================================
  // MARKDOWN RENDERER
  // ==========================================

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

  // ==========================================
  // AUTO SCROLL CHAT
  // ==========================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages, isAskingAI]);

  // ==========================================
  // FETCH DOCUMENTS
  // ==========================================

  async function fetchDocuments() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const res = await apiClient.get("/api/rag/library");

      setDocuments(res.data || []);
    } catch (err) {
      console.error("Error loading documents:", err);

      setErrorMessage("Could not load documents.");

      toast.error("Could not load documents.", {
        className: styles.errorToast,
        iconTheme: {
          primary: "#dc2626",
          secondary: "#fee2e2",
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  // ==========================================
  // LOAD DOCUMENTS ON COMPONENT MOUNT
  // ==========================================

  useEffect(() => {
    fetchDocuments();
  }, []);

  // ==========================================
  // FILE CHANGE
  // ==========================================

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const fileName = file.name.toLowerCase();

      const isPdf =
        file.type === "application/pdf" || fileName.endsWith(".pdf");

      const isTxt = file.type === "text/plain" || fileName.endsWith(".txt");

      if (!isPdf && !isTxt) {
        toast.error("Please select a valid PDF or TXT file.", {
          className: styles.errorToast,
          iconTheme: {
            primary: "#dc2626",
            secondary: "#fee2e2",
          },
        });

        return;
      }

      setSelectedFile(file);

      toast.success(`File selected: ${file.name}`, {
        className: styles.successToast,
        iconTheme: {
          primary: "#16a34a",
          secondary: "#dcfce7",
        },
      });
    }
  };

  // ==========================================
  // UPLOAD DOCUMENT
  // ==========================================

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

      toast.success("Document uploaded successfully!", {
        className: styles.successToast,
        iconTheme: {
          primary: "#16a34a",
          secondary: "#dcfce7",
        },
      });

      await fetchDocuments();
    } catch (err) {
      console.error("Upload Error:", err);

      const message = err.response?.data?.msg || "Failed to upload document.";

      toast.error(message, {
        className: styles.errorToast,
        iconTheme: {
          primary: "#dc2626",
          secondary: "#fee2e2",
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ==========================================
  // DELETE DOCUMENT
  // ==========================================

  const handleDelete = (docId, e) => {
    e.stopPropagation();

    toast(
      (t) => (
        <div className={styles.confirmToastContainer}>
          <span className={styles.confirmToastText}>
            Are you sure you want to delete this document?
          </span>

          <div className={styles.confirmToastActions}>
            <button
              onClick={() => toast.dismiss(t.id)}
              className={styles.confirmCancelBtn}
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                toast.dismiss(t.id);

                try {
                  await apiClient.delete(`/api/rag/documents/${docId}`);

                  if (selectedDoc?.document_id === docId) {
                    setSelectedDoc(null);
                    setSelectedResult(null);

                    setTextContent("");
                    setIsLoadingText(false);

                    setSearchQuery("");
                    setSearchResults([]);
                    setSearchError("");
                    setSearchMessage("");

                    setChatMessages([]);
                    setAiQuestion("");
                    setAiError("");

                    setHighlightedChunk(null);
                    setExpandedChunks({});
                  }

                  setDocuments((prev) =>
                    prev.filter((doc) => doc.document_id !== docId),
                  );

                  toast.success("Document deleted successfully.", {
                    className: styles.successToast,
                    iconTheme: {
                      primary: "#16a34a",
                      secondary: "#dcfce7",
                    },
                  });
                } catch (err) {
                  console.error("Delete Error:", err);

                  const message =
                    err.response?.data?.msg || "Failed to delete document.";

                  toast.error(message, {
                    className: styles.errorToast,
                    iconTheme: {
                      primary: "#dc2626",
                      secondary: "#fee2e2",
                    },
                  });
                }
              }}
              className={styles.confirmDeleteBtn}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
        className: styles.customToastStyle,
      },
    );
  };

  // ==========================================
  // SELECT DOCUMENT
  // ==========================================

  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);

    // Clear TXT Reader
    setTextContent("");
    setIsLoadingText(false);

    // Clear previous search
    setSearchQuery("");
    setSearchResults([]);
    setSelectedResult(null);

    setSearchError("");
    setSearchMessage("");

    setExpandedChunks({});

    // Clear previous chat
    setChatMessages([]);
    setAiQuestion("");
    setAiError("");

    // Clear highlighted chunk
    setHighlightedChunk(null);
  };

  // ==========================================
  // LOAD TXT CONTENT FOR READER
  // ==========================================

  useEffect(() => {
    const loadTxtContent = async () => {
      if (!selectedDoc) {
        setTextContent("");
        return;
      }

      const isTxt = selectedDoc.filename?.toLowerCase().endsWith(".txt");

      // If selected document is PDF,
      // do not load TXT content.
      if (!isTxt) {
        setTextContent("");
        return;
      }

      try {
        setIsLoadingText(true);

        const fileUrl = `http://localhost:5000/${selectedDoc.file_path}`;

        console.log("Loading TXT Reader:", fileUrl);

        const response = await fetch(fileUrl);

        if (!response.ok) {
          throw new Error(`Failed to load TXT file: ${response.status}`);
        }

        const text = await response.text();

        console.log("TXT content loaded:", text);

        setTextContent(text);
      } catch (error) {
        console.error("TXT Reader Error:", error);

        setTextContent("");

        toast.error("Could not load TXT file.", {
          className: styles.errorToast,
          iconTheme: {
            primary: "#dc2626",
            secondary: "#fee2e2",
          },
        });
      } finally {
        setIsLoadingText(false);
      }
    };

    loadTxtContent();
  }, [selectedDoc]);

  // ==========================================
  // SELECT SEARCH RESULT
  // ==========================================

  const handleSelectResult = (result) => {
    const chunkIdx = result.chunkIndex ?? null;

    const chunkKey = `${
      result.documentId || selectedDoc?.document_id || "doc"
    }-${chunkIdx}`;

    setSelectedResult(result);

    setHighlightedChunk(chunkIdx);

    setExpandedChunks((prev) => ({
      ...prev,
      [chunkKey]: true,
    }));
  };

  // ==========================================
  // SEMANTIC SEARCH
  // ==========================================

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);

      setSearchError("");
      setSearchResults([]);
      setSelectedResult(null);
      setSearchMessage("");
      setExpandedChunks({});

      const payload = {
        question: searchQuery.trim(),
      };

      if (selectedDoc) {
        payload.documentId = selectedDoc.document_id;
      }
      

      const res = await apiClient.post("/api/rag/ask", payload);

      if (res.data?.message) {
        setSearchMessage(res.data.message);
        setSearchResults([]);
      } else {
        const results = res.data?.sources || [];
        setSearchResults(results);
        setSearchMessage("");

        if (results.length > 0) {
          setSelectedResult(results[0]);

          const firstChunkKey = `${
            results[0].documentId || selectedDoc?.document_id || "doc"
          }-${results[0].chunkIndex ?? 0}`;

          setExpandedChunks({
            [firstChunkKey]: true,
          });

          setHighlightedChunk(results[0].chunkIndex ?? 0);

          toast.success(`Found ${results.length} matching results.`, {
            className: styles.successToast,
            iconTheme: {
              primary: "#16a34a",
              secondary: "#dcfce7",
            },
          });
        } else {
          toast("No matching results found.");
        }
      }
    } catch (err) {
      
      const errorMsg =
        err.response?.data?.msg || "Failed to perform semantic search.";

      setSearchError(errorMsg);

      toast.error(errorMsg, {
        className: styles.errorToast,
        iconTheme: {
          primary: "#dc2626",
          secondary: "#fee2e2",
        },
      });
    } finally {
      setIsSearching(false);
    }
  };

  // ==========================================
  // ASK AI
  // ==========================================

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

      toast.success("AI answer generated successfully!", {
        className: styles.successToast,
        iconTheme: {
          primary: "#16a34a",
          secondary: "#dcfce7",
        },
      });

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

      const errorMsg =
        err.response?.data?.msg || "Failed to generate AI answer.";

      setAiError(errorMsg);

      toast.error(errorMsg, {
        className: styles.errorToast,
        iconTheme: {
          primary: "#dc2626",
          secondary: "#fee2e2",
        },
      });
    } finally {
      setIsAskingAI(false);
    }
  };

  // ==========================================
  // COPY ANSWER
  // ==========================================

  const handleCopyAnswer = (textToCopy, index) => {
    navigator.clipboard.writeText(textToCopy);

    setCopiedIndex(index);

    toast.success("Copied to clipboard!", {
      className: styles.successToast,
      iconTheme: {
        primary: "#16a34a",
        secondary: "#dcfce7",
      },
    });

    setTimeout(() => {
      setCopiedIndex(null);
    }, 2000);
  };

  // ==========================================
  // RESET CHAT
  // ==========================================

  const handleResetChat = () => {
    setChatMessages([]);
    setAiError("");

    toast("Chat cleared.");
  };

  // ==========================================
  // EXPORT CHAT
  // ==========================================

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

    toast.success("Chat exported successfully!", {
      className: styles.successToast,
      iconTheme: {
        primary: "#16a34a",
        secondary: "#dcfce7",
      },
    });
  };

  // ==========================================
  // SAVE NOTE
  // ==========================================

  const handleSaveNote = (chunkKey) => {
    if (!activeNoteText.trim()) return;

    setUserNotes((prev) => ({
      ...prev,
      [chunkKey]: activeNoteText.trim(),
    }));

    setActiveNoteText("");

    toast.success("Note saved successfully for this chunk!", {
      className: styles.successToast,
      iconTheme: {
        primary: "#16a34a",
        secondary: "#dcfce7",
      },
    });
  };

  // ==========================================
  // RESULT SCORE
  // ==========================================

  const getResultScore = (result) => {
    if (!result) return null;

    return result.relevance ?? result.similarity ?? null;
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className={styles.contentArea}>
      <Toaster position="top-right" reverseOrder={false} />

      {/* ========================================
          TOP BANNER
      ======================================== */}

      <div className={styles.bannerCard}>
        <span className={styles.bannerTag}>KNOWLEDGE BASE & AI RAG</span>

        <h1 className={styles.bannerTitle}>Private Document library</h1>

        <p className={styles.bannerDesc}>
          Upload study or reference PDFs and TXT files. Run semantic search
          across single or all documents, chat with streaming AI, take notes,
          and export sessions.
        </p>
      </div>

      {/* ERROR */}

      {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

      <div className={styles.splitGrid}>
        {/* ========================================
            LEFT COLUMN
        ======================================== */}

        <div className={styles.leftColumn}>
          <div className={styles.libraryCard}>
            <h3 className={styles.cardTitle}>Library</h3>

            <p className={styles.cardSubtitle}>
              Add and manage your reference files.
            </p>

            {/* ======================================
                ALL DOCUMENTS
            ====================================== */}

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

            {/* ======================================
                UPLOAD
            ====================================== */}

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

            {/* ======================================
                DOCUMENTS
            ====================================== */}

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

        {/* ========================================
            RIGHT COLUMN
        ======================================== */}

        <div className={styles.rightColumn}>
          {/* ======================================
              READER
          ====================================== */}

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

                {/* ==================================
                    PDF / TXT READER
                ================================== */}

                <div className={styles.pdfViewerContainer}>
                  {selectedDoc.filename?.toLowerCase().endsWith(".txt") ? (
                    isLoadingText ? (
                      <div className={styles.txtLoading}>
                        Loading document...
                      </div>
                    ) : textContent ? (
                      <pre className={styles.txtReader}>{textContent}</pre>
                    ) : (
                      <div className={styles.txtLoading}>
                        No text content found.
                      </div>
                    )
                  ) : (
                    <iframe
                      src={`http://localhost:5000/${selectedDoc.file_path}`}
                      title={selectedDoc.filename}
                      className={styles.pdfIframe}
                    />
                  )}
                </div>
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

          {/* ======================================
              SEMANTIC SEARCH
          ====================================== */}

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

            {/* SEARCH ERROR */}

            {searchError && (
              <div className={styles.searchErrorBanner}>{searchError}</div>
            )}

            {/* SEARCH MESSAGE */}

            {searchMessage && (
              <div className={styles.searchMessageBanner}>
                <span>
                  <TriangleAlert size={18} />
                </span>

                <span>{searchMessage}</span>
              </div>
            )}

            {/* ====================================
                SEARCH RESULTS
            ==================================== */}

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

                  const chunkKey = `${
                    result.documentId || selectedDoc?.document_id || "doc"
                  }-${chunkIdx}`;

                  const isSelected =
                    selectedResult?.chunkId === result.chunkId ||
                    selectedResult === result;

                  const isExpanded = expandedChunks[chunkKey] || false;

                  return (
                    <div
                      key={result.chunkId ?? chunkKey}
                      className={
                        isSelected
                          ? styles.searchResultCardSelected
                          : styles.searchResultCard
                      }
                    >
                      {/* ACCORDION HEADER */}

                      <div
                        className={styles.resultHeader}
                        onClick={(e) => {
                          handleSelectResult(result);

                          toggleChunkExpand(chunkKey, e);
                        }}
                      >
                        <span className={styles.resultChunkTitle}>
                          Chunk {chunkIdx}
                          {score !== undefined &&
                            score !== null &&
                            ` • relevance ${score}`}
                        </span>

                        <div className={styles.chatHeaderButtons}>
                          <span
                            className={
                              isSelected
                                ? styles.resultSelectedText
                                : styles.resultInspectText
                            }
                          >
                            {isSelected ? "Selected" : "Click to inspect"}
                          </span>

                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </div>
                      </div>

                      {/* ACCORDION CONTENT */}

                      {isExpanded && (
                        <div>
                          <div className={styles.searchResultContent}>
                            {renderMarkdown(result.content)}
                          </div>

                          {/* NOTE */}

                          {userNotes[chunkKey] && (
                            <div className={styles.noteDisplay}>
                              <strong>My Note: </strong>

                              {userNotes[chunkKey]}
                            </div>
                          )}

                          {/* NOTE INPUT */}

                          <div
                            className={styles.noteInputRow}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              placeholder="Add private note for this chunk..."
                              value={activeNoteText}
                              onChange={(e) =>
                                setActiveNoteText(e.target.value)
                              }
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
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ====================================
                SELECTED RESULT
            ==================================== */}

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
              </div>
            )}
          </div>

          {/* ======================================
              AI CHAT
          ====================================== */}

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

                                  const matchKey = `${
                                    matchingResult.documentId ||
                                    selectedDoc?.document_id ||
                                    "doc"
                                  }-${sChunkIdx}`;

                                  setExpandedChunks((prev) => ({
                                    ...prev,
                                    [matchKey]: true,
                                  }));
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
