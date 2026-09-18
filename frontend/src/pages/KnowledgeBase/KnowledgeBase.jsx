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
  Globe
} from 'lucide-react';
import styles from './knowledgeBase.module.css';

export default function KnowledgeBase() {

  // ==========================================
  // Document State
  // ==========================================
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null); // null means "All Documents" or cross-search mode
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

  // ==========================================
  // Chat / AI State (Streaming & Multi-turn)
  // ==========================================
  const [chatMessages, setChatMessages] = useState([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [highlightedChunk, setHighlightedChunk] = useState(null);

  // ==========================================
  // New Features State (Notes & Highlights)
  // ==========================================
  const [userNotes, setUserNotes] = useState({});
  const [activeNoteText, setActiveNoteText] = useState('');

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAskingAI]);

  // ==========================================
  // Fetch Documents From Backend
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
  // Select PDF File
  // ==========================================
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (
        file.type !== 'application/pdf' &&
        !file.name.toLowerCase().endsWith('.pdf')
      ) {
        alert('Please select a PDF file.');
        return;
      }

      setSelectedFile(file);
    }
  };

  // ==========================================
  // Upload PDF
  // ==========================================
  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setIsUploading(true);
      setErrorMessage('');

      await apiClient.post('/api/rag/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSelectedFile(null);
      await fetchDocuments();

    } catch (err) {
      console.error('Upload Error:', err);
      const message = err.response?.data?.msg || 'Failed to upload PDF.';
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
    const confirmed = window.confirm('Are you sure you want to delete this document?');
    if (!confirmed) return;

    try {
      await apiClient.delete(`/api/rag/documents/${docId}`);

      if (selectedDoc?.document_id === docId) {
        setSelectedDoc(null);
        setSearchQuery('');
        setSearchResults([]);
        setSearchError('');
        setChatMessages([]);
        setAiQuestion('');
        setAiError('');
      }

      setDocuments((prev) => prev.filter((doc) => doc.document_id !== docId));

    } catch (err) {
      console.error('Delete Error:', err);
      const message = err.response?.data?.msg || 'Failed to delete document.';
      alert(message);
    }
  };

  // ==========================================
  // Select Document (or All Documents Mode)
  // ==========================================
  const handleSelectDoc = (doc) => {
    setSelectedDoc(doc);
    setSearchQuery('');
    setSearchResults([]);
    setSearchError('');
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
  // Semantic Search (Supports Single & Cross-Doc)
  // ==========================================
  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setSearchError('');
      setSearchResults([]);

      const payload = {
        query: searchQuery.trim()
      };

      if (selectedDoc) {
        payload.documentId = selectedDoc.document_id;
      }

      const res = await apiClient.post('/api/rag/search', payload);
      setSearchResults(res.data?.results || []);

    } catch (err) {
      console.error('Semantic Search Error:', err);
      setSearchError(err.response?.data?.msg || 'Failed to perform semantic search.');
    } finally {
      setIsSearching(false);
    }
  };

  // ==========================================
  // Ask Document AI with Streaming Effect
  // ==========================================
  const handleAskAI = async (e) => {
    e?.preventDefault();
    if (!aiQuestion.trim() || isAskingAI) return;

    const userQuestion = aiQuestion.trim();
    setAiQuestion('');
    setAiError('');

    const newHistory = [...chatMessages, { role: 'user', content: userQuestion }];
    setChatMessages(newHistory);
    setIsAskingAI(true);

    try {
      const payload = {
        question: userQuestion,
        history: chatMessages
      };

      if (selectedDoc) {
        payload.documentId = selectedDoc.document_id;
      }

      const res = await apiClient.post('/api/rag/ask', payload);

      const fullAnswer = res.data?.answer || 'No answer generated.';
      const sources = res.data?.sources || [];

      setChatMessages([...newHistory, { role: 'assistant', content: '', sources }]);

      let currentText = '';
      const words = fullAnswer.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        currentText += (i === 0 ? '' : ' ') + words[i];
        setChatMessages([...newHistory, { role: 'assistant', content: currentText, sources }]);
        await new Promise((resolve) => setTimeout(resolve, 25));
      }

    } catch (err) {
      console.error('Ask Document AI Error:', err);
      setAiError(err.response?.data?.msg || 'Failed to generate AI answer.');
    } finally {
      setIsAskingAI(false);
    }
  };

  // ==========================================
  // Copy Answer Function
  // ==========================================
  const handleCopyAnswer = (textToCopy, index) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // ==========================================
  // Reset Chat Conversation
  // ==========================================
  const handleResetChat = () => {
    setChatMessages([]);
    setAiError('');
  };

  // ==========================================
  // Feature 3: Export Chat History as .md file
  // ==========================================
  const handleExportChat = () => {
    if (chatMessages.length === 0) return;
    
    let markdownContent = `# Knowledge Base AI Chat Export\n\n`;
    chatMessages.forEach((msg) => {
      markdownContent += `### ${msg.role === 'user' ? 'You' : 'AI Assistant'}\n${msg.content}\n\n`;
    });

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chat-export-${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // Feature 1: Save Note for Chunk
  // ==========================================
  const handleSaveNote = (chunkKey) => {
    if (!activeNoteText.trim()) return;
    setUserNotes((prev) => ({
      ...prev,
      [chunkKey]: activeNoteText.trim()
    }));
    setActiveNoteText('');
    alert('Note saved successfully for this chunk!');
  };

  return (
    <div className={styles.contentArea}>

      {/* Top Banner Card */}
      <div className={styles.bannerCard}>
        <span className={styles.bannerTag}>KNOWLEDGE BASE & AI RAG</span>
        <h1 className={styles.bannerTitle}>Private PDF library</h1>
        <p className={styles.bannerDesc}>
          Upload study or reference PDFs. Run semantic search across single or all documents, chat with streaming AI, take notes, and export sessions.
        </p>
      </div>

      {errorMessage && (
        <div className={styles.errorBanner}>{errorMessage}</div>
      )}

      <div className={styles.splitGrid}>

        {/* Left Column: Upload & Library */}
        <div className={styles.leftColumn}>
          <div className={styles.libraryCard}>
            <h3 className={styles.cardTitle}>Library</h3>
            <p className={styles.cardSubtitle}>Add and manage your reference PDFs.</p>

            {/* Feature 2: All Documents / Cross-Search Toggle */}
            <div
              onClick={() => handleSelectDoc(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                marginBottom: '14px',
                backgroundColor: selectedDoc === null ? '#eff6ff' : '#f8fafc',
                border: `1px solid ${selectedDoc === null ? '#3b82f6' : '#e2e8f0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                color: selectedDoc === null ? '#1d4ed8' : '#475569'
              }}
            >
              <Globe size={16} />
              <span>All Documents (Cross-Search & Chat)</span>
            </div>

            <div className={styles.uploadDashedBox}>
              <p className={styles.uploadInstruction}>Accepted format: PDF.</p>

              <div className={styles.uploadControls}>
                <label className={styles.chooseFileBtn}>
                  <FileText size={15} />
                  Choose file
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>

                <button
                  className={styles.uploadBtn}
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                >
                  <Upload size={15} />
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>

              <span className={styles.fileNameDisplay}>
                {selectedFile ? selectedFile.name : 'No file selected.'}
              </span>
            </div>

            {isLoading ? (
              <p className={styles.statusText}>Loading your library...</p>
            ) : documents.length === 0 ? (
              <p className={styles.emptyListText}>Your library is empty. Upload a PDF to begin.</p>
            ) : (
              <div className={styles.documentsList}>
                {documents.map((doc) => (
                  <div
                    key={doc.document_id}
                    className={`${styles.documentItem} ${
                      selectedDoc?.document_id === doc.document_id ? styles.selectedItem : ''
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
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reader, Semantic Search & AI Chat */}
        <div className={styles.rightColumn}>
          {selectedDoc ? (
            <div className={styles.activeReaderContainer}>
              
              {/* Reader Section */}
              <div className={styles.readerSection}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 className={styles.sectionTitle}>Reader ({selectedDoc.filename})</h3>
                    <p className={styles.sectionSubtitle}>Interactive PDF Viewer</p>
                  </div>
                  {highlightedChunk !== null && (
                    <button
                      onClick={() => setHighlightedChunk(null)}
                      style={{ fontSize: '11px', padding: '3px 8px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Clear Chunk Highlight
                    </button>
                  )}
                </div>

                {isPreviewLoading ? (
                  <div className={styles.readerBoxPlaceholder}>Loading document preview...</div>
                ) : (
                  <div className={styles.pdfViewerContainer}>
                    <iframe
                      src={`http://localhost:5000/${selectedDoc.file_path}`}
                      title="PDF Preview"
                      className={styles.pdfIframe}
                    />
                  </div>
                )}
              </div>

              <div className={styles.sectionDivider} />
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px 16px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0', 
              marginBottom: '20px', 
              fontSize: '13px', 
              color: '#475569' 
            }}>
              <Sparkles size={16} color="#2563eb" />
              <span>
                <strong>All Documents Mode Active:</strong> You are currently searching and chatting across your entire library collection.
              </span>
            </div>
          )}

          {/* Semantic Search Section */}
          <div className={styles.featureSection}>
            <h3 className={styles.sectionTitle}>Semantic search</h3>
            <p className={styles.sectionSubtitle}>Find passages by contextual meaning.</p>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Search query</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="Enter keywords or concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              className={styles.actionOrangeBtn}
              onClick={handleSemanticSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              <Search size={14} />
              {isSearching ? 'Searching...' : 'Search'}
            </button>

            {searchError && <div className={styles.errorBanner} style={{ marginTop: '16px' }}>{searchError}</div>}

            {searchResults.length > 0 && (
              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {searchResults.map((result, index) => {
                  const score = result.relevance ?? result.similarity;
                  const chunkIdx = result.chunkIndex ?? index;
                  const chunkKey = `${result.documentId || 'doc'}-${chunkIdx}`;
                  return (
                    <div
                      key={result.chunkId ?? chunkKey}
                      onClick={() => setHighlightedChunk(chunkIdx)}
                      style={{
                        backgroundColor: highlightedChunk === chunkIdx ? '#eff6ff' : '#f8f9fa',
                        padding: '18px 20px',
                        borderRadius: '10px',
                        border: `1px solid ${highlightedChunk === chunkIdx ? '#3b82f6' : '#e9ecef'}`,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #edf2f7', paddingBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#495057' }}>
                          Chunk {chunkIdx} {score !== undefined && `• relevance ${score}`}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Click to inspect</span>
                      </div>
                      
                      <div style={{ margin: 0, fontSize: '13px', color: '#343a40', lineHeight: '1.6', wordBreak: 'break-word' }}>
                        <ReactMarkdown>{result.content}</ReactMarkdown>
                      </div>

                      {/* Feature 1: Note display / addition per chunk */}
                      {userNotes[chunkKey] && (
                        <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: '#fef3c7', borderRadius: '6px', fontSize: '12px', color: '#92400e' }}>
                          <strong>My Note: </strong> {userNotes[chunkKey]}
                        </div>
                      )}

                      <div style={{ marginTop: '10px', display: 'flex', gap: '6px', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          placeholder="Add private note for this chunk..."
                          value={activeNoteText}
                          onChange={(e) => setActiveNoteText(e.target.value)}
                          style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNote(chunkKey)}
                          style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', padding: '4px 8px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <BookmarkPlus size={12} /> Save Note
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chat & AI Q&A Section */}
          <div className={styles.sectionDivider} />
          <div className={styles.featureSection} style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <h3 className={styles.sectionTitle}>Interactive AI Chat</h3>
                <p className={styles.sectionSubtitle}>Ask follow-up questions with streaming answers grounded in library.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {chatMessages.length > 0 && (
                  <>
                    <button
                      onClick={handleExportChat}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '5px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '6px', cursor: 'pointer' }}
                      title="Export Chat as Markdown"
                    >
                      <Download size={12} /> Export
                    </button>
                    <button
                      onClick={handleResetChat}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '5px 10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer' }}
                    >
                      <RotateCcw size={12} /> Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Chat Message History Window */}
            {chatMessages.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    style={{
                      backgroundColor: msg.role === 'user' ? '#f0fdf4' : '#ffffff',
                      padding: '18px 20px',
                      borderRadius: '12px',
                      border: msg.role === 'user' ? '1px solid #bbf7d0' : '2px solid #e2e8f0',
                      boxShadow: msg.role === 'assistant' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: msg.role === 'user' ? '#15803d' : '#64748b', textTransform: 'uppercase' }}>
                        {msg.role === 'user' ? 'You' : 'AI Assistant Response'}
                      </span>

                      {msg.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={() => handleCopyAnswer(msg.content, index)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backgroundColor: copiedIndex === index ? '#f0fdf4' : '#f8fafc',
                            color: copiedIndex === index ? '#16a34a' : '#334155',
                            border: `1px solid ${copiedIndex === index ? '#bbf7d0' : '#cbd5e1'}`,
                            borderRadius: '6px',
                            padding: '5px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {copiedIndex === index ? (
                            <>
                              <Check size={13} color="#16a34a" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} color="#64748b" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div style={{ wordBreak: 'break-word', fontSize: '14px', lineHeight: '1.6', color: '#1e293b' }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>

                    {msg.sources && msg.sources.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '12px', color: '#64748b' }}>
                        <strong>Source references: </strong>
                        {msg.sources.map((source, sIdx) => {
                          const sChunkIdx = source.chunkIndex ?? sIdx;
                          return (
                            <span
                              key={source.chunkId || sIdx}
                              onClick={() => setHighlightedChunk(sChunkIdx)}
                              style={{ color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', marginRight: '6px' }}
                              title="Click to highlight chunk"
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

            {/* Question Input Form */}
            <form onSubmit={handleAskAI} style={{ marginTop: '16px', position: 'relative', zIndex: 10 }}>
              <div className={styles.inputGroup} style={{ marginBottom: '12px' }}>
                <label className={styles.inputLabel}>Follow-up or Question</label>
                <textarea
                  rows={3}
                  className={styles.textareaInput}
                  placeholder="Ask a question or request a follow-up across your library..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  style={{ pointerEvents: 'auto', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className={styles.actionOrangeBtn}
                disabled={isAskingAI || !aiQuestion.trim()}
                style={{ pointerEvents: 'auto', cursor: (isAskingAI || !aiQuestion.trim()) ? 'not-allowed' : 'pointer' }}
              >
                {isAskingAI ? <Sparkles size={14} className={styles.spin} /> : <Send size={14} />}
                {isAskingAI ? 'Thinking & Streaming...' : 'Ask AI'}
              </button>
            </form>

            {aiError && (
              <div className={styles.errorBanner} style={{ marginTop: '16px' }}>
                {aiError}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}