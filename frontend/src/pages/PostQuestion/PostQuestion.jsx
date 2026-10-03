import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Link as LinkIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";

import {
  createQuestion,
  generateQuestionDraftCoach,
  uploadImage,
} from "../../services/question.service";

import styles from "./PostQuestion.module.css";

export default function PostQuestion() {
  const navigate = useNavigate();

  // FORM STATE
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  const [characterCount, setCharacterCount] = useState(0);

  // SUBMIT / AI STATE
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);

  // PUBLISHED STATE
  const [isPublished, setIsPublished] = useState(false);
  const [createdQuestionHash, setCreatedQuestionHash] = useState(null);

  // ERROR / SUCCESS STATE
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // LINK POPUP STATE
  const [showLinkPopup, setShowLinkPopup] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  // IMAGE POPUP STATE
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const imageInputRef = useRef(null);

  // Remembers the real image markdown while the AI only sees placeholders
  const savedImagesRef = useRef({});

  // MARKDOWN EDITOR
  const textareaRef = useRef(null);

  const updateMarkdownContent = (content) => {
    setFormData((previousData) => ({
      ...previousData,
      content,
    }));

    setCharacterCount(content.length);
    setError("");
    setSuccess("");

    setFieldErrors((previous) => ({
      ...previous,
      content: "",
    }));
  };

  // INSERT MARKDOWN
  const insertMarkdown = (before, after = "") => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = formData.content.slice(start, end);

    const newText =
      formData.content.slice(0, start) +
      before +
      selectedText +
      after +
      formData.content.slice(end);

    updateMarkdownContent(newText);

    requestAnimationFrame(() => {
      textarea.focus();

      const newCursorPosition =
        selectedText.length > 0
          ? start + before.length + selectedText.length + after.length
          : start + before.length;

      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    });
  };

  // MARKDOWN LINK
  const handleMarkdownLink = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = formData.content.slice(start, end);

    setLinkUrl("");
    setShowLinkPopup(true);

    textarea.dataset.selectionStart = start;
    textarea.dataset.selectionEnd = end;
    textarea.dataset.selectedText = selectedText;
  };

  // ADD MARKDOWN LINK
  const handleAddMarkdownLink = () => {
    const textarea = textareaRef.current;

    if (!textarea || !linkUrl.trim()) {
      return;
    }

    const start = Number(textarea.dataset.selectionStart || 0);

    const end = Number(textarea.dataset.selectionEnd || 0);

    const selectedText =
      textarea.dataset.selectedText ||
      formData.content.slice(start, end) ||
      "link";

    const markdownLink = `[${selectedText}](${linkUrl.trim()})`;

    const newContent =
      formData.content.slice(0, start) +
      markdownLink +
      formData.content.slice(end);

    updateMarkdownContent(newContent);

    setShowLinkPopup(false);
    setLinkUrl("");

    requestAnimationFrame(() => {
      textarea.focus();

      const cursorPosition = start + markdownLink.length;

      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleCancelLink = () => {
    setShowLinkPopup(false);
    setLinkUrl("");
  };

  // NUMBERED LIST
  const handleMarkdownNumberedList = () => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const selectedText = formData.content.slice(start, end);

    if (!selectedText) {
      insertMarkdown("1. ");
      return;
    }

    const lines = selectedText.split("\n");

    const numberedLines = lines.map((line, index) => `${index + 1}. ${line}`);

    const replacement = numberedLines.join("\n");

    const newContent =
      formData.content.slice(0, start) +
      replacement +
      formData.content.slice(end);

    updateMarkdownContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();

      textarea.setSelectionRange(start, start + replacement.length);
    });
  };

  // HANDLE NORMAL INPUT CHANGES
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setSuccess("");

    setFieldErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // FORM VALIDATION
  const validateForm = () => {
    const title = formData.title.trim();
    const contentText = formData.content.trim();
    const nextFieldErrors = {};

    if (title.length < 5) {
      nextFieldErrors.title = "Title must be at least 5 characters long.";
    } else if (title.length > 255) {
      nextFieldErrors.title = "Title cannot be longer than 255 characters.";
    }

    if (contentText.length < 10) {
      nextFieldErrors.content =
        "Question content must be at least 10 characters long.";
    }

    setFieldErrors(nextFieldErrors);

    return Object.keys(nextFieldErrors).length === 0;
  };

  // GET AI FEEDBACK
  const handleGetFeedback = async () => {
    setError("");
    setSuccess("");
    setCoachFeedback(null);

    const title = formData.title.trim();
    const contentText = formData.content.trim();

    if (title.length > 0 && title.length < 5) {
      setError("Title must be at least 5 characters long.");
      return;
    }

    if (title.length > 255) {
      setError("Title cannot be longer than 255 characters.");
      return;
    }

    if (contentText.length < 10) {
      setError("Question content must be at least 10 characters long.");
      return;
    }

    try {
      setIsCoaching(true);

      // Replace image links with a short placeholder the AI can read.
      // The originals are kept in savedImagesRef and restored on "Apply".
      savedImagesRef.current = {};
      let imageCount = 0;

      const contentForAI = formData.content.replace(
        /!\[([^\]]*)\]\(([^)]*)\)/g,
        (fullMatch, name) => {
          imageCount += 1;
          const placeholder = `[Image ${imageCount}: ${name}]`;
          savedImagesRef.current[placeholder] = fullMatch;
          return placeholder;
        },
      );

      const response = await generateQuestionDraftCoach({
        title,
        content: contentForAI,
      });

      setCoachFeedback(response.data || response);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to get AI feedback. Please try again.";

      setError(message);
    } finally {
      setIsCoaching(false);
    }
  };

  // APPLY AI SUGGESTIONS
  const handleApplySuggestions = () => {
    if (!coachFeedback) {
      return;
    }

    let nextContent = coachFeedback.improvedContent || formData.content;

    // Put the real image links back in place of the placeholders
    Object.entries(savedImagesRef.current).forEach(
      ([placeholder, original]) => {
        nextContent = nextContent.split(placeholder).join(original);
      },
    );

    setFormData((previousData) => ({
      title: coachFeedback.improvedTitle || previousData.title,
      content: nextContent,
    }));

    setCharacterCount(nextContent.length);

    setSuccess("AI suggestions applied to your draft.");
  };

  // IMAGE VALIDATION
  const handleImageFile = (file) => {
    if (!file) {
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, and GIF images are supported.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Image size must be 2 MiB or smaller.");
      return;
    }

    setError("");
    setImageFile(file);

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  // SELECT IMAGE
  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];

    handleImageFile(file);

    event.target.value = "";
  };

  // DRAG AND DROP IMAGE
  const handleImageDrop = (event) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    handleImageFile(file);
  };

  // PASTE IMAGE
  const handleImagePaste = (event) => {
    const items = event.clipboardData?.items;

    if (!items) {
      return;
    }

    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();

        handleImageFile(file);

        event.preventDefault();

        return;
      }
    }
  };

  // INSERT IMAGE INTO MARKDOWN (uploads the file first)
  const handleInsertImage = async () => {
    if (!imageFile) {
      return;
    }

    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    // remember the cursor position BEFORE the upload starts
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    try {
      setIsUploadingImage(true);
      setError("");

      // 1. upload the file -> returns { url: "http://localhost:3888/uploads/..." }
      const { url } = await uploadImage(imageFile);

      // 2. put the REAL url (not the temporary blob link) into the markdown
      const imageMarkdown = `![${imageFile.name}](${url})`;

      const newContent =
        formData.content.slice(0, start) +
        imageMarkdown +
        formData.content.slice(end);

      updateMarkdownContent(newContent);

      setShowImagePopup(false);
      setImageFile(null);
      setImagePreview("");

      requestAnimationFrame(() => {
        textarea.focus();

        const cursorPosition = start + imageMarkdown.length;

        textarea.setSelectionRange(cursorPosition, cursorPosition);
      });
    } catch (err) {
      const message =
        err.response?.data?.message || "Image upload failed. Please try again.";

      setError(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // CLOSE IMAGE POPUP
  const handleCloseImagePopup = () => {
    setShowImagePopup(false);
    setImageFile(null);
    setImagePreview("");
  };

  // SUBMIT QUESTION
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

           // find the first image link in the markdown, e.g. ![name](http://...)
      const imageMatch = formData.content.match(/!\[[^\]]*\]\(([^)\s]+)\)/);
      const imageUrl = imageMatch ? imageMatch[1] : null;

      const response = await createQuestion({
        title: formData.title.trim(),
        content: formData.content,
        imageUrl,
      });

      console.log("CREATE QUESTION RESPONSE:", response);

      const hash =
        response?.data?.questionHash ??
        response?.questionHash ??
        response?.data?.hash;

      setCreatedQuestionHash(hash);
      setIsPublished(true);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to post question. Please try again.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // CANCEL POSTING
  const handleCancel = () => {
    navigate("/dashboard");
  };

  // AI SUGGESTIONS ARRAY
  const suggestions = Array.isArray(coachFeedback?.tips)
    ? coachFeedback.tips
    : Array.isArray(coachFeedback?.suggestions)
      ? coachFeedback.suggestions
      : [];

  // PUBLISHED SCREEN
  if (isPublished) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.publishedCard}>
            <div className={styles.publishedIcon}>
              <CheckCircle2 size={48} strokeWidth={2} />
            </div>

            <h1>Thread published</h1>

            <p>
              Your post is indexed for keyword search and embedding-based
              similarity. Share the link in study groups, or stay on the thread
              to answer follow-up questions from peers.
            </p>

            <div className={styles.publishedActions}>
              <button
                type="button"
                className={styles.backDashboardButton}
                onClick={() => navigate("/dashboard")}
              >
                Back to Dashboard
              </button>

              <button
                type="button"
                className={styles.viewQuestionButton}
                onClick={() => {
                  if (createdQuestionHash) {
                    navigate(`/question/${createdQuestionHash}`);
                  }
                }}
                disabled={!createdQuestionHash}
              >
                View Question
              </button>

              <button
                type="button"
                className={styles.askAnotherButton}
                onClick={() => {
                  setIsPublished(false);

                  setFormData({
                    title: "",
                    content: "",
                  });

                  setCharacterCount(0);
                  setCoachFeedback(null);
                  setError("");
                  setSuccess("");
                  setFieldErrors({});
                }}
              >
                Ask Another
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  // MAIN PAGE
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>ASK THE COHORT</p>

          <h1>Publish to the forum</h1>

          <p className={styles.headerDescription}>
            Public threads help the whole cohort. Write as if a classmate will
            debug your issue tomorrow. They only know what you put on the page.
          </p>
        </header>

        <section className={styles.guidelines}>
          <h2>Write questions people can answer in one pass</h2>

          <p>
            Mentors volunteer their time. Give them runnable context, expected
            vs actual behavior, and a tight scope so they can reproduce the
            issue without guessing your setup.
          </p>

          <h3>Checklist before you post</h3>

          <ul>
            <li>
              <strong>Title as a headline</strong> that states the symptom and
              tech stack.
            </li>

            <li>
              <strong>Repro steps</strong> numbered, with environment when it
              matters.
            </li>

            <li>
              <strong>Minimal code</strong> — use the code button to format
              snippets.
            </li>

            <li>
              <strong>Exact errors</strong> copied verbatim.
            </li>
          </ul>

          <h3>Validation rules</h3>

          <ul>
            <li>
              <strong>Title length:</strong> Must be between 5 and 255
              characters.
            </li>

            <li>
              <strong>Body length:</strong> Must contain a minimum of 10
              characters.
            </li>

            <li>
              <strong>Single topic:</strong> Split unrelated bugs into separate
              threads.
            </li>
          </ul>
        </section>

        <section className={styles.formCard}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className={styles.success} role="status">
                {success}
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>

              <p className={styles.helperText}>
                Be specific and imagine you're asking a question to another
                person.
              </p>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                maxLength={255}
                disabled={isSubmitting}
                className={
                  fieldErrors.title
                    ? `${styles.input} ${styles.inputError}`
                    : styles.input
                }
                placeholder="e.g. How do I handle state management using Context API in React?"
              />

              {fieldErrors.title && (
                <p className={styles.fieldError}>{fieldErrors.title}</p>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content">
                What are the details of your problem?
              </label>

              <p className={styles.helperText}>
                Introduce the problem and expand on what you put in the title.
                Minimum 10 characters.
              </p>

              <div
                className={
                  fieldErrors.content
                    ? `${styles.editor} ${styles.editorError}`
                    : styles.editor
                }
              >
                <div className={styles.editorHeader}>
                  <div className={styles.toolbar}>
                    {/* Bold */}
                    <button
                      type="button"
                      aria-label="Bold"
                      title="Bold"
                      onClick={() => insertMarkdown("**", "**")}
                    >
                      <strong>B</strong>
                    </button>

                    {/* Italic */}
                    <button
                      type="button"
                      aria-label="Italic"
                      title="Italic"
                      onClick={() => insertMarkdown("*", "*")}
                    >
                      <em>I</em>
                    </button>

                    {/* Inline Code */}
                    <button
                      type="button"
                      aria-label="Code"
                      title="Inline Code"
                      onClick={() => insertMarkdown("<", ">")}
                    >
                      <span>&lt;/&gt;</span>
                    </button>

                    {/* Link */}
                    <button
                      type="button"
                      aria-label="Link"
                      title="Link"
                      onClick={handleMarkdownLink}
                    >
                      <LinkIcon size={15} strokeWidth={2} />
                    </button>

                    {/* Numbered List */}
                    <button
                      type="button"
                      aria-label="Numbered List"
                      title="Numbered List"
                      onClick={handleMarkdownNumberedList}
                    >
                      <span className={styles.numberListIcon}>
                        <span>
                          <b>1.</b>
                          <i></i>
                        </span>

                        <span>
                          <b>2.</b>
                          <i></i>
                        </span>

                        <span>
                          <b>3.</b>
                          <i></i>
                        </span>
                      </span>
                    </button>

                    {/* Image */}
                    <button
                      type="button"
                      aria-label="Insert Image"
                      title="Insert Image"
                      onClick={() => setShowImagePopup(true)}
                    >
                      <span>🖼️</span>
                    </button>
                  </div>

                  <span className={styles.characterCount}>
                    {characterCount} characters
                  </span>
                </div>

                {/* MARKDOWN TEXTAREA */}
                <textarea
                  ref={textareaRef}
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={(event) =>
                    updateMarkdownContent(event.target.value)
                  }
                  className={styles.textarea}
                  placeholder="Introduce the problem and expand on what you put in the title. Minimum 10 characters."
                  disabled={isSubmitting}
                />

                {/* Link Popup */}
                {showLinkPopup && (
                  <div className={styles.linkPopup}>
                    <h3>Add Link</h3>

                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(event) => setLinkUrl(event.target.value)}
                      placeholder="https://example.com"
                      autoFocus
                    />

                    <div className={styles.linkPopupActions}>
                      <button
                        type="button"
                        className={styles.linkPopupCancel}
                        onClick={handleCancelLink}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className={styles.linkPopupConfirm}
                        onClick={handleAddMarkdownLink}
                      >
                        Add Link
                      </button>
                    </div>
                  </div>
                )}

                {/* Image Popup */}
                {showImagePopup && (
                  <div className={styles.imagePopup}>
                    <div className={styles.imagePopupHeader}>
                      <h3>Add image</h3>

                      <button
                        type="button"
                        className={styles.imagePopupClose}
                        onClick={handleCloseImagePopup}
                        aria-label="Close image popup"
                      >
                        ×
                      </button>
                    </div>

                    <p className={styles.imagePopupDescription}>
                      Images are useful in a post, but make sure the post is
                      still clear without them. If you post images of code or
                      error messages, copy and paste or type the actual code or
                      message into the post directly.
                    </p>

                    <div
                      className={styles.imageDropZone}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={handleImageDrop}
                      onPaste={handleImagePaste}
                      tabIndex={0}
                    >
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleImageSelect}
                        hidden
                      />

                      {!imagePreview ? (
                        <>
                          <div className={styles.imageUploadIcon}>↑</div>

                          <p className={styles.imageDropText}>
                            Browse, drag & drop, or paste an image.
                          </p>

                          <button
                            type="button"
                            className={styles.browseImageButton}
                            onClick={() => imageInputRef.current?.click()}
                          >
                            Browse
                          </button>

                          <p className={styles.imageSupportedText}>
                            Supported file types: jpeg, png, gif (Max size 2
                            MiB)
                          </p>
                        </>
                      ) : (
                        <>
                          <img
                            src={imagePreview}
                            alt="Selected preview"
                            className={styles.imagePreview}
                          />

                          <p className={styles.selectedImageName}>
                            {imageFile?.name}
                          </p>

                          <button
                            type="button"
                            className={styles.removeImageButton}
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview("");
                            }}
                          >
                            Remove image
                          </button>
                        </>
                      )}
                    </div>

                    <div className={styles.imagePopupActions}>
                      <button
                        type="button"
                        className={styles.imageCancelButton}
                        onClick={handleCloseImagePopup}
                        disabled={isUploadingImage}
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        className={styles.imageInsertButton}
                        onClick={handleInsertImage}
                        disabled={!imageFile || isUploadingImage}
                      >
                        {isUploadingImage ? "Uploading..." : "Insert image"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {fieldErrors.content && (
                <p className={styles.fieldError}>{fieldErrors.content}</p>
              )}

              <div className={styles.aiArea}>
                <button
                  type="button"
                  className={styles.aiButton}
                  onClick={handleGetFeedback}
                  disabled={isCoaching || isSubmitting}
                >
                  <span className={styles.aiIcon}>✣</span>

                  {isCoaching ? "Getting suggestions..." : "AI suggestions"}
                </button>

                <p className={styles.aiHint}>
                  Suggestions only. You still choose what to post.
                </p>
              </div>
            </div>

            {coachFeedback && (
              <div className={styles.coachPanel}>
                <div className={styles.coachHeader}>
                  <h2>AI Draft Coach</h2>

                  {(coachFeedback.improvedTitle ||
                    coachFeedback.improvedContent) && (
                    <button
                      type="button"
                      className={styles.applyButton}
                      onClick={handleApplySuggestions}
                      disabled={isSubmitting}
                    >
                      Apply suggestions
                    </button>
                  )}
                </div>

                {coachFeedback.feedback && (
                  <div className={styles.feedback}>
                    <h3>Feedback</h3>

                    <p>{coachFeedback.feedback}</p>
                  </div>
                )}

                {suggestions.length > 0 && (
                  <div className={styles.suggestions}>
                    <h3>Suggestions</h3>

                    <ul>
                      {suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {coachFeedback.improvedTitle && (
                  <div className={styles.improvedSection}>
                    <h3>Suggested title</h3>

                    <p>{coachFeedback.improvedTitle}</p>
                  </div>
                )}

                {coachFeedback.improvedContent && (
                  <div className={styles.improvedSection}>
                    <h3>Suggested content</h3>

                    <p>{coachFeedback.improvedContent}</p>
                  </div>
                )}
              </div>
            )}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Post Question"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
