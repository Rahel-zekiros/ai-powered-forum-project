import React from "react";
import { CloudUpload, FilePlus2, Trash, LibraryBig } from "lucide-react";

import styles from "./knowledgeBase.module.css";

export default function LibrarySection({
  documents,
  selectedDoc,
  selectedFile,
  isLoading,
  isUploading,
  handleFileChange,
  handleUpload,
  handleDelete,
  handleSelectDoc,
}) {
  return (
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
        <p className={styles.uploadInstruction}>Accepted format: PDF, TXT.</p>

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
              key={doc.documentId}
              className={`${styles.documentItem} ${
                selectedDoc?.documentId === doc.documentId
                  ? styles.selectedItem
                  : ""
              }`}
              onClick={() => handleSelectDoc(doc)}
            >
              <div className={styles.docInfo}>
                <span className={styles.docName}>
                  {doc.filename ||
                    doc.file_name ||
                    doc.original_name ||
                    doc.title ||
                    "Untitled File"}
                </span>

                <span className={styles.readyBadge}>READY</span>
              </div>

              <button
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(doc.documentId, e)}
                title="Delete"
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
