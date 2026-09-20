import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiClient } from "../../services/core/api.client.js";
import {
  Upload,
  FileText,
  Trash2,
  Search,
  Sparkles,
  Check,
  Copy,
  Send,
  RotateCcw,
  Download,
  BookmarkPlus,
  Globe,
  X,
  Database,
  BarChart3
} from 'lucide-react';
import styles from './knowledgeBase.module.css';

export default function KnowledgeBase() {

  // ==========================================
  // Document State
  // ==========================================
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // ==========================================
  // Search State
  // ==========================================
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchMessage, setSearchMessage] = useState('');

  // ==========================================
  // Selected Search Result
  // ==========================================
  const [selectedResult, setSelectedResult] = useState(null);

  // ==========================================
  // Chat / AI State
  // ==========================================
  const [chatMessages, setChatMessages] = useState([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [highlightedChunk, setHighlightedChunk] = useState(null);

  // ==========================================
  // Notes State
  // ==========================================
  const [userNotes, setUserNotes] = useState({});
  const [activeNoteText, setActiveNoteText] = useState('');

  const chatEndRef = useRef(null);

  // ==========================================
  // Auto-scroll Chat
  // ==========================================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [chatMessages, isAskingAI]);

  // ==========================================
  // Fetch Documents
  // ==========================================
  async function fetchDocuments() {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const res = await apiClient.get('/api/rag/library');

      setDocuments(res.data || []);

    } catch (err) {
      console.error('Error loading documents:', err);
      setErrorMessage('Could not load documents.');
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

  // ==========================================
  // Select File
  // ==========================================
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {

      const file = e.target.files[0];
      const fileName = file.name.toLowerCase();

      const isPdf =
        file.type === 'application/pdf' ||
        fileName.endsWith('.pdf');

      const isTxt =
        file.type === 'text/plain' ||
        fileName.endsWith('.txt');

      if (!isPdf && !isTxt) {
        alert('Please select a valid PDF or TXT file.');
        return;
      }

      setSelectedFile(file);
    }
  };

  // ==========================================
  // Upload Document
  // ==========================================
  const handleUpload = async () => {

    if (!selectedFile) return;

    const formData = new FormData();

    formData.append('file', selectedFile);

    try {

      setIsUploading(true);
      setErrorMessage('');

      await apiClient.post(
        '/api/rag/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSelectedFile(null);

      await fetchDocuments();

    } catch (err) {

      console.error('Upload Error:', err);

      const message =
        err.response?.data?.msg ||
        'Failed to upload document.';

      alert(message);

    } finally {

      setIsUploading(false);

    }
  };

  // ==========================================
  // Delete Document
  // ==========================================
  const handleDelete = async (docId, e) => {

    e.stopPropagation();

    const confirmed = window.confirm(
      'Are you sure you want to delete this document?'
    );

    if (!confirmed) return;

    try {

      await apiClient.delete(
        `/api/rag/documents/${docId}`
      );

      if (
        selectedDoc?.document_id === docId
      ) {

        setSelectedDoc(null);
        setSelectedResult(null);
        setSearchQuery('');
        setSearchResults([]);
        setSearchError('');
        setSearchMessage('');
        setChatMessages([]);
        setAiQuestion('');
        setAiError('');
        setHighlightedChunk(null);

      }

      setDocuments((prev) =>
        prev.filter(
          (doc) =>
            doc.document_id !== docId
        )
      );

    } catch (err) {

      console.error('Delete Error:', err);

      const message =
        err.response?.data?.msg ||
        'Failed to delete document.';

      alert(message);

    }
  };

  // ==========================================
  // Select Document
  // ==========================================
  const handleSelectDoc = (doc) => {

    setSelectedDoc(doc);

    setSearchQuery('');
    setSearchResults([]);
    setSelectedResult(null);

    setSearchError('');
    setSearchMessage('');

    setChatMessages([]);
    setAiQuestion('');
    setAiError('');

    setHighlightedChunk(null);

    if (doc) {

      setIsPreviewLoading(true);

      setTimeout(() => {
        setIsPreviewLoading(false);
      }, 600);

    }
  };

  // ==========================================
  // Select Search Result
  // ==========================================
  const handleSelectResult = (result) => {

    const chunkIdx =
      result.chunkIndex ?? null;

    setSelectedResult(result);

    setHighlightedChunk(chunkIdx);
  };

  // ==========================================
  // Semantic Search
  // ==========================================
  const handleSemanticSearch = async () => {

    if (!searchQuery.trim()) return;

    try {

      setIsSearching(true);

      setSearchError('');
      setSearchResults([]);
      setSelectedResult(null);
      setSearchMessage('');

      const payload = {
        query: searchQuery.trim()
      };

      if (selectedDoc) {

        payload.documentId =
          selectedDoc.document_id;

      }

      const res = await apiClient.post(
        '/api/rag/search',
        payload
      );

      if (res.data?.message) {

        setSearchMessage(
          res.data.message
        );

        setSearchResults([]);

      } else {

        const results =
          res.data?.results || [];

        setSearchResults(results);

        setSearchMessage('');

        // Automatically select first result
        // so the detail panel is immediately visible.
        if (results.length > 0) {
          setSelectedResult(results[0]);
          setHighlightedChunk(
            results[0].chunkIndex ?? 0
          );
        }
      }

    } catch (err) {

      console.error(
        'Semantic Search Error:',
        err
      );

      setSearchError(
        err.response?.data?.msg ||
        'Failed to perform semantic search.'
      );

    } finally {

      setIsSearching(false);

    }
  };

  // ==========================================
  // Ask Document AI
  // ==========================================
  const handleAskAI = async (e) => {

    e?.preventDefault();

    if (
      !aiQuestion.trim() ||
      isAskingAI
    ) {
      return;
    }

    const userQuestion =
      aiQuestion.trim();

    setAiQuestion('');
    setAiError('');

    const newHistory = [
      ...chatMessages,
      {
        role: 'user',
        content: userQuestion
      }
    ];

    setChatMessages(newHistory);
    setIsAskingAI(true);

    try {

      const payload = {
        question: userQuestion,
        history: chatMessages
      };

      if (selectedDoc) {

        payload.documentId =
          selectedDoc.document_id;

      }

      const res = await apiClient.post(
        '/api/rag/ask',
        payload
      );

      const fullAnswer =
        res.data?.answer ||
        'No answer generated.';

      const sources =
        res.data?.sources || [];

      setChatMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: '',
          sources
        }
      ]);

      let currentText = '';

      const words =
        fullAnswer.split(' ');

      for (
        let i = 0;
        i < words.length;
        i++
      ) {

        currentText +=
          (i === 0 ? '' : ' ') +
          words[i];

        setChatMessages([
          ...newHistory,
          {
            role: 'assistant',
            content: currentText,
            sources
          }
        ]);

        await new Promise(
          (resolve) =>
            setTimeout(resolve, 25)
        );
      }

    } catch (err) {

      console.error(
        'Ask Document AI Error:',
        err
      );

      setAiError(
        err.response?.data?.msg ||
        'Failed to generate AI answer.'
      );

    } finally {

      setIsAskingAI(false);

    }
  };

  // ==========================================
  // Copy Answer
  // ==========================================
  const handleCopyAnswer = (
    textToCopy,
    index
  ) => {

    navigator.clipboard.writeText(
      textToCopy
    );

    setCopiedIndex(index);

    setTimeout(
      () => setCopiedIndex(null),
      2000
    );
  };

  // ==========================================
  // Reset Chat
  // ==========================================
  const handleResetChat = () => {

    setChatMessages([]);
    setAiError('');

  };

  // ==========================================
  // Export Chat
  // ==========================================
  const handleExportChat = () => {

    if (chatMessages.length === 0)
      return;

    let markdownContent =
      `# Knowledge Base AI Chat Export\n\n`;

    chatMessages.forEach((msg) => {

      markdownContent +=
        `### ${
          msg.role === 'user'
            ? 'You'
            : 'AI Assistant'
        }\n${msg.content}\n\n`;

    });

    const blob = new Blob(
      [markdownContent],
      {
        type:
          'text/markdown;charset=utf-8;'
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    link.setAttribute(
      'download',
      `chat-export-${Date.now()}.md`
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ==========================================
  // Save Note
  // ==========================================
  const handleSaveNote = (
    chunkKey
  ) => {

    if (!activeNoteText.trim())
      return;

    setUserNotes((prev) => ({
      ...prev,
      [chunkKey]:
        activeNoteText.trim()
    }));

    setActiveNoteText('');

    alert(
      'Note saved successfully for this chunk!'
    );
  };

  // ==========================================
  // Calculate Result Information
  // ==========================================
  const getResultScore = (result) => {

    if (!result) return null;

    return (
      result.relevance ??
      result.similarity ??
      null
    );
  };

  return (
    <div className={styles.contentArea}>

      {/* ==========================================
          TOP BANNER
      ========================================== */}
      <div className={styles.bannerCard}>

        <span className={styles.bannerTag}>
          KNOWLEDGE BASE & AI RAG
        </span>

        <h1 className={styles.bannerTitle}>
          Private Document library
        </h1>

        <p className={styles.bannerDesc}>
          Upload study or reference PDFs and
          TXT files. Run semantic search across
          single or all documents, chat with
          streaming AI, take notes, and export
          sessions.
        </p>

      </div>

      {errorMessage && (
        <div className={styles.errorBanner}>
          {errorMessage}
        </div>
      )}

      <div className={styles.splitGrid}>

        {/* ==========================================
            LEFT COLUMN
        ========================================== */}
        <div className={styles.leftColumn}>

          <div className={styles.libraryCard}>

            <h3 className={styles.cardTitle}>
              Library
            </h3>

            <p className={styles.cardSubtitle}>
              Add and manage your reference files.
            </p>

            {/* All Documents */}
            <button
              type="button"
              onClick={() =>
                handleSelectDoc(null)
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 16px',
                marginBottom: '14px',
                backgroundColor:
                  selectedDoc === null
                    ? '#eff6ff'
                    : '#ffffff',
                border:
                  `2px solid ${
                    selectedDoc === null
                      ? '#3b82f6'
                      : '#cbd5e1'
                  }`,
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                color:
                  selectedDoc === null
                    ? '#1d4ed8'
                    : '#334155',
                boxShadow:
                  selectedDoc === null
                    ? '0 4px 6px -1px rgba(59, 130, 246, 0.15)'
                    : '0 1px 2px rgba(0, 0, 0, 0.05)',
                transition:
                  'all 0.2s ease-in-out',
                textAlign: 'left'
              }}
            >

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >

                <Globe
                  size={18}
                  color={
                    selectedDoc === null
                      ? '#2563eb'
                      : '#64748b'
                  }
                />

                <span>
                  All Documents
                  (Cross-Search & Chat)
                </span>

              </div>

              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  backgroundColor:
                    selectedDoc === null
                      ? '#dbeafe'
                      : '#f1f5f9',
                  color:
                    selectedDoc === null
                      ? '#1d4ed8'
                      : '#64748b'
                }}
              >
                {selectedDoc === null
                  ? 'Active'
                  : 'Click to select'}
              </span>

            </button>

            {/* Upload */}
            <div
              className={styles.uploadDashedBox}
            >

              <p
                className={
                  styles.uploadInstruction
                }
              >
                Accepted format: PDF, TXT.
              </p>

              <div
                className={styles.uploadControls}
              >

                <label
                  className={
                    styles.chooseFileBtn
                  }
                >

                  <FileText size={15} />

                  Choose file

                  <input
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    onChange={handleFileChange}
                    style={{
                      display: 'none'
                    }}
                  />

                </label>

                <button
                  className={
                    styles.uploadBtn
                  }
                  onClick={handleUpload}
                  disabled={
                    !selectedFile ||
                    isUploading
                  }
                >

                  <Upload size={15} />

                  {isUploading
                    ? 'Uploading...'
                    : 'Upload'}

                </button>

              </div>

              <span
                className={
                  styles.fileNameDisplay
                }
              >
                {selectedFile
                  ? selectedFile.name
                  : 'No file selected.'}
              </span>

            </div>

            {/* Documents */}
            {isLoading ? (

              <p
                className={
                  styles.statusText
                }
              >
                Loading your library...
              </p>

            ) : documents.length === 0 ? (

              <p
                className={
                  styles.emptyListText
                }
              >
                Your library is empty.
                Upload a file to begin.
              </p>

            ) : (

              <div
                className={
                  styles.documentsList
                }
              >

                {documents.map((doc) => (

                  <div
                    key={doc.document_id}
                    className={`${styles.documentItem} ${
                      selectedDoc?.document_id ===
                      doc.document_id
                        ? styles.selectedItem
                        : ''
                    }`}
                    onClick={() =>
                      handleSelectDoc(doc)
                    }
                  >

                    <div
                      className={styles.docInfo}
                    >

                      <span
                        className={
                          styles.docName
                        }
                      >
                        {doc.filename}
                      </span>

                      <span
                        className={
                          styles.readyBadge
                        }
                      >
                        READY
                      </span>

                    </div>

                    <button
                      className={
                        styles.deleteBtn
                      }
                      onClick={(e) =>
                        handleDelete(
                          doc.document_id,
                          e
                        )
                      }
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>

                  </div>

                ))}

              </div>

            )}

          </div>

        </div>

        {/* ==========================================
            RIGHT COLUMN
        ========================================== */}
        <div className={styles.rightColumn}>

          {/* ==========================================
              READER
          ========================================== */}
          {selectedDoc ? (

            <div
              className={
                styles.activeReaderContainer
              }
            >

              <div
                className={
                  styles.readerSection
                }
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center'
                  }}
                >

                  <div>

                    <h3
                      className={
                        styles.sectionTitle
                      }
                    >
                      Reader ({selectedDoc.filename})
                    </h3>

                    <p
                      className={
                        styles.sectionSubtitle
                      }
                    >
                      Interactive Viewer
                    </p>

                  </div>

                  {highlightedChunk !== null && (
                    <button
                      onClick={() =>
                        setHighlightedChunk(
                          null
                        )
                      }
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        backgroundColor:
                          '#e2e8f0',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Chunk Highlight
                    </button>
                  )}

                </div>

                {isPreviewLoading ? (

                  <div
                    className={
                      styles.readerBoxPlaceholder
                    }
                  >
                    Loading document preview...
                  </div>

                ) : (

                  <div
                    className={
                      styles.pdfViewerContainer
                    }
                  >

                    <iframe
                      src={`http://localhost:5000/${selectedDoc.file_path}`}
                      title="Document Preview"
                      className={
                        styles.pdfIframe
                      }
                    />

                  </div>

                )}

              </div>

              <div
                className={
                  styles.sectionDivider
                }
              />

            </div>

          ) : (

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                backgroundColor:
                  '#f8fafc',
                borderRadius: '8px',
                border:
                  '1px solid #e2e8f0',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#475569'
              }}
            >

              <Sparkles
                size={16}
                color="#2563eb"
              />

              <span>

                <strong>
                  All Documents Mode Active:
                </strong>{' '}

                You are currently searching
                and chatting across your
                entire library collection.

              </span>

            </div>

          )}

          {/* ==========================================
              SEMANTIC SEARCH
          ========================================== */}
          <div
            className={
              styles.featureSection
            }
          >

            <h3
              className={
                styles.sectionTitle
              }
            >
              Semantic search
            </h3>

            <p
              className={
                styles.sectionSubtitle
              }
            >
              Find passages by contextual meaning.
            </p>

            <div
              className={
                styles.inputGroup
              }
            >

              <label
                className={
                  styles.inputLabel
                }
              >
                Search query
              </label>

              <input
                type="text"
                className={
                  styles.textInput
                }
                placeholder="Enter keywords or concepts..."
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (
                    e.key === 'Enter' &&
                    !isSearching &&
                    searchQuery.trim()
                  ) {
                    handleSemanticSearch();
                  }
                }}
              />

            </div>

            <button
              className={
                styles.actionOrangeBtn
              }
              onClick={
                handleSemanticSearch
              }
              disabled={
                isSearching ||
                !searchQuery.trim()
              }
            >

              <Search size={14} />

              {isSearching
                ? 'Searching...'
                : 'Search'}

            </button>

            {/* Search Error */}
            {searchError && (
              <div
                className={
                  styles.errorBanner
                }
                style={{
                  marginTop: '16px'
                }}
              >
                {searchError}
              </div>
            )}

            {/* Search Message */}
            {searchMessage && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '14px 18px',
                  backgroundColor:
                    '#fff7ed',
                  border:
                    '1px solid #ffedd5',
                  borderRadius: '8px',
                  color: '#c2410c',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >

                <span>⚠️</span>

                <span>
                  {searchMessage}
                </span>

              </div>
            )}

            {/* ==========================================
                SEARCH RESULTS
            ========================================== */}
            {searchResults.length > 0 && (

              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}
              >

                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems: 'center',
                    paddingBottom: '8px',
                    borderBottom:
                      '1px solid #e2e8f0'
                  }}
                >

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px'
                    }}
                  >

                    <BarChart3
                      size={16}
                      color="#2563eb"
                    />

                    <strong
                      style={{
                        fontSize: '13px',
                        color: '#334155'
                      }}
                    >
                      Search Results
                    </strong>

                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      color: '#64748b'
                    }}
                  >
                    {searchResults.length} result
                    {searchResults.length !== 1
                      ? 's'
                      : ''}
                  </span>

                </div>

                {searchResults.map(
                  (result, index) => {

                    const score =
                      getResultScore(result);

                    const chunkIdx =
                      result.chunkIndex ??
                      index;

                    const chunkKey =
                      `${result.documentId || selectedDoc?.document_id || 'doc'}-${chunkIdx}`;

                    const isSelected =
                      selectedResult?.chunkId ===
                        result.chunkId ||
                      (
                        selectedResult === result
                      );

                    return (

                      <div
                        key={
                          result.chunkId ??
                          chunkKey
                        }
                        onClick={() =>
                          handleSelectResult(
                            result
                          )
                        }
                        style={{
                          backgroundColor:
                            isSelected
                              ? '#eff6ff'
                              : '#f8f9fa',
                          padding:
                            '18px 20px',
                          borderRadius:
                            '10px',
                          border:
                            `1px solid ${
                              isSelected
                                ? '#3b82f6'
                                : '#e9ecef'
                            }`,
                          cursor:
                            'pointer',
                          boxShadow:
                            isSelected
                              ? '0 4px 10px rgba(59,130,246,0.12)'
                              : '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >

                        {/* Result Header */}
                        <div
                          style={{
                            display:
                              'flex',
                            justifyContent:
                              'space-between',
                            alignItems:
                              'center',
                            marginBottom:
                              '8px',
                            borderBottom:
                              '1px solid #edf2f7',
                            paddingBottom:
                              '6px'
                          }}
                        >

                          <span
                            style={{
                              fontSize:
                                '13px',
                              fontWeight:
                                '600',
                              color:
                                '#495057'
                            }}
                          >
                            Chunk {chunkIdx}

                            {score !==
                              undefined &&
                              score !== null &&
                              ` • relevance ${score}`}
                          </span>

                          <span
                            style={{
                              fontSize:
                                '11px',
                              color:
                                isSelected
                                  ? '#2563eb'
                                  : '#64748b'
                            }}
                          >
                            {isSelected
                              ? 'Selected'
                              : 'Click to inspect'}
                          </span>

                        </div>

                        {/* Content */}
                        <div
                          style={{
                            margin: 0,
                            fontSize:
                              '13px',
                            color:
                              '#343a40',
                            lineHeight:
                              '1.6',
                            wordBreak:
                              'break-word'
                          }}
                        >

                          <ReactMarkdown>
                            {result.content}
                          </ReactMarkdown>

                        </div>

                        {/* Note */}
                        {userNotes[
                          chunkKey
                        ] && (

                          <div
                            style={{
                              marginTop:
                                '10px',
                              padding:
                                '8px 12px',
                              backgroundColor:
                                '#fef3c7',
                              borderRadius:
                                '6px',
                              fontSize:
                                '12px',
                              color:
                                '#92400e'
                            }}
                          >

                            <strong>
                              My Note:{' '}
                            </strong>

                            {
                              userNotes[
                                chunkKey
                              ]
                            }

                          </div>

                        )}

                        {/* Note Input */}
                        <div
                          style={{
                            marginTop:
                              '10px',
                            display:
                              'flex',
                            gap: '6px',
                            alignItems:
                              'center'
                          }}
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >

                          <input
                            type="text"
                            placeholder="Add private note for this chunk..."
                            value={
                              activeNoteText
                            }
                            onChange={(e) =>
                              setActiveNoteText(
                                e.target.value
                              )
                            }
                            style={{
                              fontSize:
                                '12px',
                              padding:
                                '4px 8px',
                              borderRadius:
                                '4px',
                              border:
                                '1px solid #cbd5e1',
                              flex: 1
                            }}
                          />

                          <button
                            type="button"
                            onClick={() =>
                              handleSaveNote(
                                chunkKey
                              )
                            }
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: '3px',
                              fontSize:
                                '11px',
                              padding:
                                '4px 8px',
                              backgroundColor:
                                '#0f172a',
                              color:
                                '#fff',
                              border:
                                'none',
                              borderRadius:
                                '4px',
                              cursor:
                                'pointer'
                            }}
                          >

                            <BookmarkPlus
                              size={12}
                            />

                            Save Note

                          </button>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            )}

            {/* ==========================================
                SELECTED RESULT DETAIL PANEL
            ========================================== */}
            {selectedResult && (

              <div
                style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor:
                    '#ffffff',
                  border:
                    '2px solid #3b82f6',
                  borderRadius:
                    '12px',
                  boxShadow:
                    '0 5px 15px rgba(0,0,0,0.08)'
                }}
              >

                {/* Detail Header */}
                <div
                  style={{
                    display:
                      'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'center',
                    marginBottom:
                      '18px'
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '9px'
                    }}
                  >

                    <Database
                      size={19}
                      color="#2563eb"
                    />

                    <div>

                      <h3
                        style={{
                          margin: 0,
                          fontSize:
                            '16px',
                          color:
                            '#1e293b'
                        }}
                      >
                        Selected Search Result
                      </h3>

                      <p
                        style={{
                          margin:
                            '4px 0 0',
                          fontSize:
                            '12px',
                          color:
                            '#64748b'
                        }}
                      >
                        Detailed semantic search information
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedResult(
                        null
                      );
                      setHighlightedChunk(
                        null
                      );
                    }}
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '4px',
                      border:
                        '1px solid #cbd5e1',
                      background:
                        '#f8fafc',
                      padding:
                        '6px 10px',
                      borderRadius:
                        '6px',
                      cursor:
                        'pointer',
                      fontSize:
                        '11px'
                    }}
                  >

                    <X size={13} />

                    Close

                  </button>

                </div>

                {/* Metadata Cards */}
                <div
                  style={{
                    display:
                      'grid',
                    gridTemplateColumns:
                      'repeat(3, minmax(0, 1fr))',
                    gap: '10px',
                    marginBottom:
                      '18px'
                  }}
                >

                  {/* Chunk */}
                  <div
                    style={{
                      padding:
                        '12px',
                      background:
                        '#f8fafc',
                      borderRadius:
                        '8px',
                      border:
                        '1px solid #e2e8f0'
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          '11px',
                        color:
                          '#64748b',
                        marginBottom:
                          '5px'
                      }}
                    >
                      CHUNK
                    </div>

                    <strong
                      style={{
                        fontSize:
                          '15px',
                        color:
                          '#1e293b'
                      }}
                    >
                      {selectedResult.chunkIndex ??
                        'N/A'}
                    </strong>

                  </div>

                  {/* Relevance */}
                  <div
                    style={{
                      padding:
                        '12px',
                      background:
                        '#f8fafc',
                      borderRadius:
                        '8px',
                      border:
                        '1px solid #e2e8f0'
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          '11px',
                        color:
                          '#64748b',
                        marginBottom:
                          '5px'
                      }}
                    >
                      RELEVANCE
                    </div>

                    <strong
                      style={{
                        fontSize:
                          '15px',
                        color:
                          '#2563eb'
                      }}
                    >
                      {getResultScore(
                        selectedResult
                      ) ?? 'N/A'}
                    </strong>

                  </div>

                  {/* Chunk ID */}
                  <div
                    style={{
                      padding:
                        '12px',
                      background:
                        '#f8fafc',
                      borderRadius:
                        '8px',
                      border:
                        '1px solid #e2e8f0'
                    }}
                  >

                    <div
                      style={{
                        fontSize:
                          '11px',
                        color:
                          '#64748b',
                        marginBottom:
                          '5px'
                      }}
                    >
                      CHUNK ID
                    </div>

                    <strong
                      style={{
                        fontSize:
                          '13px',
                        color:
                          '#1e293b',
                        wordBreak:
                          'break-word'
                      }}
                    >
                      {selectedResult.chunkId ??
                        'N/A'}
                    </strong>

                  </div>

                </div>

                {/* Document Information */}
                <div
                  style={{
                    marginBottom:
                      '18px',
                    padding:
                      '12px 14px',
                    background:
                      '#f8fafc',
                    borderRadius:
                      '8px',
                    border:
                      '1px solid #e2e8f0',
                    fontSize:
                      '12px',
                    color:
                      '#475569'
                  }}
                >

                  <strong>
                    Document:
                  </strong>{' '}

                  {selectedDoc?.filename ||
                    'All Documents'}

                </div>

                {/* Retrieved Content */}
                <div>

                  <h4
                    style={{
                      margin:
                        '0 0 8px',
                      fontSize:
                        '14px',
                      color:
                        '#334155'
                    }}
                  >
                    Retrieved Content
                  </h4>

                  <div
                    style={{
                      padding:
                        '16px',
                      background:
                        '#f8fafc',
                      borderRadius:
                        '8px',
                      border:
                        '1px solid #e2e8f0',
                      lineHeight:
                        '1.7',
                      fontSize:
                        '13px',
                      color:
                        '#334155',
                      wordBreak:
                        'break-word'
                    }}
                  >

                    <ReactMarkdown>
                      {selectedResult.content}
                    </ReactMarkdown>

                  </div>

                </div>

                {/* Similarity Calculation */}
                <div
                  style={{
                    marginTop:
                      '18px',
                    padding:
                      '15px',
                    background:
                      '#eff6ff',
                    border:
                      '1px solid #bfdbfe',
                    borderRadius:
                      '8px'
                  }}
                >

                  <div
                    style={{
                      display:
                        'flex',
                      alignItems:
                        'center',
                      gap: '7px',
                      marginBottom:
                        '9px'
                    }}
                  >

                    <BarChart3
                      size={16}
                      color="#2563eb"
                    />

                    <h4
                      style={{
                        margin: 0,
                        color:
                          '#1d4ed8',
                        fontSize:
                          '14px'
                      }}
                    >
                      Semantic Similarity
                    </h4>

                  </div>

                  <div
                    style={{
                      fontSize:
                        '13px',
                      color:
                        '#334155',
                      lineHeight:
                        '1.8'
                    }}
                  >

                    <div>
                      Query embedding
                      {' → '}
                      Chunk embedding
                    </div>

                    <div>
                      Cosine similarity
                      {' → '}
                      <strong>
                        {getResultScore(
                          selectedResult
                        )}
                      </strong>
                    </div>

                    <div>
                      Similarity threshold
                      {' → '}
                      <strong>
                        0.600
                      </strong>
                    </div>

                    <div
                      style={{
                        marginTop:
                          '7px',
                        paddingTop:
                          '7px',
                        borderTop:
                          '1px solid #bfdbfe'
                      }}
                    >

                      {getResultScore(
                        selectedResult
                      ) >= 0.6 ? (

                        <strong
                          style={{
                            color:
                              '#15803d'
                          }}
                        >
                          ✓ Relevant result accepted
                        </strong>

                      ) : (

                        <strong
                          style={{
                            color:
                              '#dc2626'
                          }}
                        >
                          ✕ Result below threshold
                        </strong>

                      )}

                    </div>

                  </div>

                </div>

              </div>

            )}

          </div>

          {/* ==========================================
              AI CHAT
          ========================================== */}
          <div
            className={
              styles.sectionDivider
            }
          />

          <div
            className={
              styles.featureSection
            }
            style={{
              paddingBottom: '40px'
            }}
          >

            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginBottom:
                  '12px'
              }}
            >

              <div>

                <h3
                  className={
                    styles.sectionTitle
                  }
                >
                  Interactive AI Chat
                </h3>

                <p
                  className={
                    styles.sectionSubtitle
                  }
                >
                  Ask follow-up questions with
                  streaming answers grounded in library.
                </p>

              </div>

              <div
                style={{
                  display:
                    'flex',
                  gap: '8px'
                }}
              >

                {chatMessages.length > 0 && (
                  <>
                    <button
                      onClick={
                        handleExportChat
                      }
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '4px',
                        fontSize:
                          '12px',
                        padding:
                          '5px 10px',
                        backgroundColor:
                          '#f0fdf4',
                        border:
                          '1px solid #bbf7d0',
                        color:
                          '#16a34a',
                        borderRadius:
                          '6px',
                        cursor:
                          'pointer'
                      }}
                      title="Export Chat as Markdown"
                    >

                      <Download size={12} />

                      Export

                    </button>

                    <button
                      onClick={
                        handleResetChat
                      }
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '4px',
                        fontSize:
                          '12px',
                        padding:
                          '5px 10px',
                        backgroundColor:
                          '#f1f5f9',
                        border:
                          '1px solid #cbd5e1',
                        borderRadius:
                          '6px',
                        cursor:
                          'pointer'
                      }}
                    >

                      <RotateCcw size={12} />

                      Clear

                    </button>
                  </>
                )}

              </div>

            </div>

            {/* Chat History */}
            {chatMessages.length > 0 && (

              <div
                style={{
                  display:
                    'flex',
                  flexDirection:
                    'column',
                  gap: '16px',
                  marginBottom:
                    '20px',
                  maxHeight:
                    '500px',
                  overflowY:
                    'auto',
                  paddingRight:
                    '4px'
                }}
              >

                {chatMessages.map(
                  (msg, index) => (

                    <div
                      key={index}
                      style={{
                        backgroundColor:
                          msg.role === 'user'
                            ? '#f0fdf4'
                            : '#ffffff',
                        padding:
                          '18px 20px',
                        borderRadius:
                          '12px',
                        border:
                          msg.role === 'user'
                            ? '1px solid #bbf7d0'
                            : '2px solid #e2e8f0',
                        boxShadow:
                          msg.role === 'assistant'
                            ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                            : 'none'
                      }}
                    >

                      <div
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          alignItems:
                            'center',
                          marginBottom:
                            '12px',
                          borderBottom:
                            '1px solid #f1f5f9',
                          paddingBottom:
                            '8px'
                        }}
                      >

                        <span
                          style={{
                            fontSize:
                              '12px',
                            fontWeight:
                              '700',
                            color:
                              msg.role ===
                              'user'
                                ? '#15803d'
                                : '#64748b',
                            textTransform:
                              'uppercase'
                          }}
                        >

                          {msg.role ===
                          'user'
                            ? 'You'
                            : 'AI Assistant Response'}

                        </span>

                        {msg.role ===
                          'assistant' && (

                          <button
                            type="button"
                            onClick={() =>
                              handleCopyAnswer(
                                msg.content,
                                index
                              )
                            }
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap:
                                '6px',
                              backgroundColor:
                                copiedIndex ===
                                index
                                  ? '#f0fdf4'
                                  : '#f8fafc',
                              color:
                                copiedIndex ===
                                index
                                  ? '#16a34a'
                                  : '#334155',
                              border:
                                `1px solid ${
                                  copiedIndex ===
                                  index
                                    ? '#bbf7d0'
                                    : '#cbd5e1'
                                }`,
                              borderRadius:
                                '6px',
                              padding:
                                '5px 12px',
                              fontSize:
                                '12px',
                              fontWeight:
                                '600',
                              cursor:
                                'pointer'
                            }}
                          >

                            {copiedIndex ===
                            index ? (
                              <>
                                <Check
                                  size={13}
                                  color="#16a34a"
                                />
                                <span>
                                  Copied!
                                </span>
                              </>
                            ) : (
                              <>
                                <Copy
                                  size={13}
                                  color="#64748b"
                                />
                                <span>
                                  Copy
                                </span>
                              </>
                            )}

                          </button>

                        )}

                      </div>

                      <div
                        style={{
                          wordBreak:
                            'break-word',
                          fontSize:
                            '14px',
                          lineHeight:
                            '1.6',
                          color:
                            '#1e293b'
                        }}
                      >

                        <ReactMarkdown>
                          {msg.content}
                        </ReactMarkdown>

                      </div>

                      {/* Sources */}
                      {msg.sources &&
                        msg.sources.length > 0 && (

                          <div
                            style={{
                              marginTop:
                                '12px',
                              paddingTop:
                                '8px',
                              borderTop:
                                '1px solid #e2e8f0',
                              fontSize:
                                '12px',
                              color:
                                '#64748b'
                            }}
                          >

                            <strong>
                              Source references:{' '}
                            </strong>

                            {msg.sources.map(
                              (
                                source,
                                sIdx
                              ) => {

                                const sChunkIdx =
                                  source.chunkIndex ??
                                  sIdx;

                                return (

                                  <span
                                    key={
                                      source.chunkId ||
                                      sIdx
                                    }
                                    onClick={() => {

                                      setHighlightedChunk(
                                        sChunkIdx
                                      );

                                      const matchingResult =
                                        searchResults.find(
                                          (result) =>
                                            result.chunkId ===
                                            source.chunkId
                                        );

                                      if (
                                        matchingResult
                                      ) {
                                        setSelectedResult(
                                          matchingResult
                                        );
                                      }

                                    }}
                                    style={{
                                      color:
                                        '#2563eb',
                                      cursor:
                                        'pointer',
                                      textDecoration:
                                        'underline',
                                      marginRight:
                                        '6px'
                                    }}
                                    title="Click to inspect source chunk"
                                  >

                                    [
                                    {sIdx + 1}
                                    ] (chunk{' '}
                                    {sChunkIdx})

                                  </span>

                                );

                              }
                            )}

                          </div>

                        )}

                    </div>

                  )
                )}

                <div
                  ref={chatEndRef}
                />

              </div>

            )}

            {/* Question Input */}
            <form
              onSubmit={handleAskAI}
              style={{
                marginTop:
                  '16px',
                position:
                  'relative',
                zIndex:
                  10
              }}
            >

              <div
                className={
                  styles.inputGroup
                }
                style={{
                  marginBottom:
                    '12px'
                }}
              >

                <label
                  className={
                    styles.inputLabel
                  }
                >
                  Follow-up or Question
                </label>

                <textarea
                  rows={3}
                  className={
                    styles.textareaInput
                  }
                  placeholder="Ask a question or request a follow-up across your library..."
                  value={aiQuestion}
                  onChange={(e) =>
                    setAiQuestion(
                      e.target.value
                    )
                  }
                  style={{
                    pointerEvents:
                      'auto',
                    resize:
                      'vertical'
                  }}
                />

              </div>

              <button
                type="submit"
                className={
                  styles.actionOrangeBtn
                }
                disabled={
                  isAskingAI ||
                  !aiQuestion.trim()
                }
                style={{
                  pointerEvents:
                    'auto',
                  cursor:
                    isAskingAI ||
                    !aiQuestion.trim()
                      ? 'not-allowed'
                      : 'pointer'
                }}
              >

                {isAskingAI ? (
                  <Sparkles
                    size={14}
                    className={
                      styles.spin
                    }
                  />
                ) : (
                  <Send size={14} />
                )}

                {isAskingAI
                  ? 'Thinking & Streaming...'
                  : 'Ask AI'}

              </button>

            </form>

            {aiError && (

              <div
                className={
                  styles.errorBanner
                }
                style={{
                  marginTop:
                    '16px'
                }}
              >
                {aiError}
              </div>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}