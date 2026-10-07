import React, { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";

import { apiClient } from "../../services/core/api.client.js";

import LibrarySection from "./LibrarySection";
import RagFeaturesSection from "./RagFeaturesSection";

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
    if (e) e.stopPropagation();

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

const res = await apiClient.get("/api/rag/documents");
      setDocuments(res.data.data || []);
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

                  if (selectedDoc?.documentId === docId) {
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
                    setExpandedChunks({});
                  }

                  setDocuments((prev) =>
                    prev.filter((doc) => doc.documentId !== docId),
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

      if (!isTxt) {
        setTextContent("");
        return;
      }

      try {
        setIsLoadingText(true);

        const response = await apiClient.get(`/${selectedDoc.file_path}`);

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

  const handleSelectResult = (result) => {
    const chunkIdx = result.chunkIndex ?? null;

    const chunkKey = `${
      result.documentId || selectedDoc?.documentId|| "doc"
    }-${chunkIdx}`;

    setSelectedResult(result);

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
        query: searchQuery.trim(),
      };

      if (selectedDoc) {
        payload.documentId = selectedDoc.documentId;
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

          const firstChunkKey = `${
            results[0].documentId || selectedDoc?.documentId || "doc"
          }-${results[0].chunkIndex ?? 0}`;

          setExpandedChunks({
            [firstChunkKey]: true,
          });

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
      console.error("Search Error:", err);
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
    {
      /* <a href="blob:http://localhost:5173/abc123"></a> */
    }
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
  // RENDER
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
          across single or all documents, chat with streaming AI, and export
          sessions.
        </p>
      </div>

      {/* ERROR */}

      {errorMessage && <div className={styles.errorBanner}>{errorMessage}</div>}

      <div className={styles.splitGrid}>
        {/* ========================================
            LEFT COLUMN
        ======================================== */}

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

        {/* ========================================
            RIGHT COLUMN
        ======================================== */}

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
