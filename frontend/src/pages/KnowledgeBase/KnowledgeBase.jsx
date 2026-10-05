import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

import { apiClient } from "../../services/core/api.client.js";

import LibrarySection from "./LibrarySection";
import RagFeaturesSection from "./RagFeaturesSection";

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

  // ==========================================
  // COLLAPSIBLE CHUNKS
  // ==========================================

  const [expandedChunks, setExpandedChunks] = useState({});
const toggleChunkExpand = (chunkKey, e) => {
  e?.stopPropagation();

  setExpandedChunks((prev) => ({
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
  // CHAT SCROLL REF
  // ==========================================

  const chatEndRef = useRef(null);

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

  // ==========================================
  // AUTO SCROLL CHAT
  // ==========================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages, isAskingAI]);

  // ==========================================
  // FILE CHANGE
  // ==========================================

  /*
   * Handle file selection
   */
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      const fileName = file.name.toLowerCase();

      const isPdf =
        file.type === "application/pdf" || fileName.endsWith(".pdf");

      const isTxt =
        file.type === "text/plain" || fileName.endsWith(".txt");

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

      const message =
        err.response?.data?.msg || "Failed to upload document.";

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

                try {
                  await apiClient.delete(
                    `/api/rag/documents/${docId}`
                  );

        setSelectedResult(null);

        setSearchQuery("");
        setSearchResults([]);
        setSearchError("");
        setSearchMessage("");

        setChatMessages([]);
        setAiQuestion("");
        setAiError("");

                    setChatMessages([]);
                    setAiQuestion("");
                    setAiError("");
                    setExpandedChunks({});
                  }

                  setDocuments((prev) =>
                    prev.filter(
                      (doc) => doc.document_id !== docId
                    )
                  );

                  toast.success(
                    "Document deleted successfully.",
                    {
                      className: styles.successToast,
                      iconTheme: {
                        primary: "#16a34a",
                        secondary: "#dcfce7",
                      },
                    }
                  );
                } catch (err) {
                  console.error("Delete Error:", err);

                  const message =
                    err.response?.data?.msg ||
                    "Failed to delete document.";

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
      }
    );
  };

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

    // Clear highlighted chunk
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

      const isTxt =
        selectedDoc.filename?.toLowerCase().endsWith(".txt");

      if (!isTxt) {
        setTextContent("");
        return;
      }

try {
  setIsLoadingText(true);

  const response = await apiClient.get(
    `/${selectedDoc.file_path}`
  );

  console.log("TXT content loaded:", response.data);

  setTextContent(response.data);

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

  /*
   * Select search result
   */
  const handleSelectResult = (result) => {
    const chunkIdx = result.chunkIndex ?? null;

    const chunkKey = `${
      result.documentId ||
      selectedDoc?.document_id ||
      "doc"
    }-${chunkIdx}`;

    setSelectedResult(result);

    setExpandedChunks((prev) => ({
      ...prev,
      [chunkKey]: true,
    }));
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

      const res = await apiClient.post(
        "/api/rag/ask",
        payload
      );

      const res = await apiClient.post("/api/rag/search", payload);
      console.log("res", res.data)
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
            results[0].documentId ||
            selectedDoc?.document_id ||
            "doc"
          }-${results[0].chunkIndex ?? 0}`;

          setExpandedChunks({
            [firstChunkKey]: true,
          });

          toast.success(
            `Found ${results.length} matching results.`,
            {
              className: styles.successToast,
              iconTheme: {
                primary: "#16a34a",
                secondary: "#dcfce7",
              },
            }
          );
        } else {
          toast("No matching results found.");
        }
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.msg ||
        "Failed to perform semantic search.";

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

      const res = await apiClient.post(
        "/api/rag/ask",
        payload
      );

      const fullAnswer =
        res.data?.answer || "No answer generated.";

      const sources = res.data?.sources || [];

      toast.success(
        "AI answer generated successfully!",
        {
          className: styles.successToast,
          iconTheme: {
            primary: "#16a34a",
            secondary: "#dcfce7",
          },
        }
      );

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
        currentText +=
          (i === 0 ? "" : " ") + words[i];

        setChatMessages([
          ...newHistory,
          {
            role: "assistant",
            content: currentText,
            sources,
          },
        ]);

        await new Promise((resolve) =>
          setTimeout(resolve, 25)
        );
      }
    } catch (err) {
      console.error(
        "Ask Document AI Error:",
        err
      );

      const errorMsg =
        err.response?.data?.msg ||
        "Failed to generate AI answer.";

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

    let markdownContent =
      `# Knowledge Base AI Chat Export\n\n`;

    chatMessages.forEach((msg) => {
      markdownContent += `### ${
        msg.role === "user"
          ? "You"
          : "AI Assistant"
      }\n${msg.content}\n\n`;
    });

    const blob = new Blob([markdownContent], {
      type: "text/markdown;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.setAttribute(
      "download",
      `chat-export-${Date.now()}.md`
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    toast.success(
      "Chat exported successfully!",
      {
        className: styles.successToast,
        iconTheme: {
          primary: "#16a34a",
          secondary: "#dcfce7",
        },
      }
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className={styles.contentArea}>
      <Toaster
        position="top-right"
        reverseOrder={false}
      />

      {/* ========================================
          TOP BANNER
          ================================================== */}

      <div className={styles.bannerCard}>
        <span className={styles.bannerTag}>
          KNOWLEDGE BASE & AI RAG
        </span>

        <h1 className={styles.bannerTitle}>
          Private Document library
        </h1>

        <p className={styles.bannerDesc}>
          Upload study or reference PDFs and TXT
          files. Run semantic search across single
          or all documents, chat with streaming AI,
          and export sessions.
        </p>
      </div>

      {/* GENERAL ERROR */}

      {errorMessage && (
        <div className={styles.errorBanner}>
          {errorMessage}
        </div>
      )}

      {/* ==================================================
          MAIN TWO-COLUMN LAYOUT
          ================================================== */}

      <div className={styles.splitGrid}>
        {/* ==================================================
            LEFT COLUMN
            ================================================== */}

        <div className={styles.leftColumn}>
          <LibrarySection
            documents={documents}
            selectedDoc={selectedDoc}
            selectedFile={selectedFile}
            isLoading={isLoading}
            isUploading={isUploading}
            handleFileChange={handleFileChange}
            handleUpload={handleUpload}
            handleDelete={handleDelete}
            handleSelectDoc={handleSelectDoc}
          />
        </div>

        {/* ==================================================
            RIGHT COLUMN
            ================================================== */}

        <div className={styles.rightColumn}>
          <RagFeaturesSection
            selectedDoc={selectedDoc}
            textContent={textContent}
            isLoadingText={isLoadingText}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            searchError={searchError}
            searchMessage={searchMessage}
            selectedResult={selectedResult}
            setSelectedResult={setSelectedResult}
            expandedChunks={expandedChunks}
            setExpandedChunks={setExpandedChunks}
            handleSelectResult={handleSelectResult}
            toggleChunkExpand={toggleChunkExpand}
            handleSemanticSearch={handleSemanticSearch}
            chatMessages={chatMessages}
            aiQuestion={aiQuestion}
            setAiQuestion={setAiQuestion}
            isAskingAI={isAskingAI}
            aiError={aiError}
            copiedIndex={copiedIndex}
            handleAskAI={handleAskAI}
            handleCopyAnswer={handleCopyAnswer}
            handleResetChat={handleResetChat}
            handleExportChat={handleExportChat}
            chatEndRef={chatEndRef}
          />
        </div>
      </div>
    </div>
  );
}