import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";

import {
  WandSparkles,
  ScanSearch,
  BadgeCheck,
  CopyCheck,
  MessageCircle,
  RefreshCw,
  FileDown,
  DatabaseZap,
  ChartNoAxesCombined,
  TriangleAlert,
  ChevronDown,
  ChevronUp,
  CircleX,
} from "lucide-react";

import styles from "./knowledgeBase.module.css";

export default function RagFeaturesSection({
  selectedDoc,

  textContent,
  isLoadingText,

  searchQuery,
  setSearchQuery,
  searchResults = [],
  isSearching,
  searchError,
  searchMessage,
  selectedResult,
  setSelectedResult,

  expandedChunks = {},
  setExpandedChunks,

  handleSelectResult,
  toggleChunkExpand,
  handleSemanticSearch,

  chatMessages = [],
  aiQuestion,
  setAiQuestion,
  isAskingAI,
  aiError,
  copiedIndex,

  handleAskAI,
  handleCopyAnswer,
  handleResetChat,
  handleExportChat,

  chatEndRef,
}) {
  // MARKDOWN RENDERER
  const renderMarkdown = (content) => {
    return (
      <div className={styles.markdownContent}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          rehypePlugins={[rehypeRaw]}
        >
          {content || "No text available for this chunk."}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <>
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
            </div>

            {/* PDF / TXT READER */}
            <div className={styles.pdfViewerContainer}>
              {selectedDoc.filename?.toLowerCase().endsWith(".txt") ? (
                isLoadingText ? (
                  <div className={styles.txtLoading}>Loading document...</div>
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
        </div>

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
                <ChartNoAxesCombined size={16} className={styles.blueIcon} />
                <strong>Search Results</strong>
              </div>
              <span className={styles.resultCount}>
                {searchResults.length} result
                {searchResults.length !== 1 ? "s" : ""}
              </span>
            </div>

            {searchResults.map((result, index) => {
              const chunkIdx = result.chunkIndex ?? index;
              const chunkKey = `${result.documentId || selectedDoc?.document_id || "doc"}-${chunkIdx}`;
              const isSelected =
                selectedResult?.chunkId === result.chunkId ||
                selectedResult === result;
              const isExpanded = expandedChunks[chunkKey] ?? true; // Default expanded for search visibility

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
                      Result {index + 1}
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

                  {/* ACCORDION CONTENT (SHOW CONTENT HERE DIRECTLY) */}
                  {isExpanded && (
                    <div className={styles.searchResultContent}>
                      {renderMarkdown(result.content)}
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
                onClick={() => setSelectedResult(null)}
                className={styles.closeButton}
              >
                <CircleX size={13} />
                Close
              </button>
            </div>

            {/* DOCUMENT INFORMATION */}
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
                            const matchingResult = searchResults.find(
                              (result) => result.chunkId === source.chunkId,
                            );

                            if (matchingResult) {
                              setSelectedResult(matchingResult);

                              const matchKey = `${matchingResult.documentId || selectedDoc?.document_id || "doc"}-${sChunkIdx}`;

                              setExpandedChunks((prev) => ({
                                ...prev,
                                [matchKey]: true,
                              }));
                            }
                          }}
                          className={styles.sourceLink}
                          title="Click to inspect source"
                        >
                          [{sIdx + 1}]
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
            <label className={styles.inputLabel}>Follow-up or Question</label>
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
    </>
  );
}
