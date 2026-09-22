import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link as LinkIcon } from "lucide-react";
import { CheckCircle2 } from "lucide-react";
// Import the two API-calling functions from the service layer
// createQuestion -> sends POST /api/questions
// generateQuestionDraftCoach -> sends POST /api/questions/draft-coach
import {
  createQuestion,
  generateQuestionDraftCoach,
} from "../../services/question.service";

import styles from "./PostQuestion.module.css";

// Main page component for the "Post Question" screen
export default function PostQuestion() {
  // Function used to redirect the user to another route (e.g. after submit)
  const navigate = useNavigate();

  // Holds both form fields together in one state object
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  // True while the "Post Question" request is in progress
  const [isSubmitting, setIsSubmitting] = useState(false);

  // True while the AI draft-coach request is in progress
  const [isCoaching, setIsCoaching] = useState(false);

  // Holds the AI's feedback response once it arrives; null = nothing to show yet
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [createdQuestionHash, setCreatedQuestionHash] = useState(null);

  // Holds the current error message to display (empty string = no error)
  const [error, setError] = useState("");
  // Holds the current success message to display (empty string = no message)
  const [success, setSuccess] = useState("");

  // Runs on every keystroke in the title input or content textarea
  // Update formData  copy old values, overwrite only the changed field
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // Full validation used right before actually submitting the question
  // Trim whitespace so blank/space-only input doesn't pass length checks
  // Reject if title is missing or too short
  const validateForm = () => {
    const title = formData.title.trim();
    const content = formData.content.trim();

    if (title.length < 5) {
      setError("Title must be at least 5 characters long.");
      return false;
    }

    if (title.length > 255) {
      setError("Title cannot be longer than 255 characters.");
      return false;
    }

    if (content.length < 10) {
      setError("Question content must be at least 10 characters long.");
      return false;
    }

    // All checks passed
    return true;
  };

  // Runs when the "AI suggestions" button is clicked
  // Reset messages and clear any previous AI feedback before a new request
  const handleGetFeedback = async () => {
    setError("");
    setSuccess("");
    setCoachFeedback(null);

    const title = formData.title.trim();
    const content = formData.content.trim();

    if (title.length > 0 && title.length < 5) {
      setError("Title must be at least 5 characters long.");
      return;
    }

    if (title.length > 255) {
      setError("Title cannot be longer than 255 characters.");
      return;
    }

    if (content.length < 10) {
      setError("Question content must be at least 10 characters long.");
      return;
    }
    // Turn on loading state -> disables button, shows "Getting suggestions..."
    try {
      setIsCoaching(true);

      const response = await generateQuestionDraftCoach({
        title,
        content,
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

  const handleApplySuggestions = () => {
    if (!coachFeedback) {
      return;
    }

    setFormData((previousData) => ({
      title: coachFeedback.improvedTitle || previousData.title,
      content: coachFeedback.improvedContent || previousData.content,
    }));

    setSuccess("AI suggestions applied to your draft.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await createQuestion({
        title: formData.title.trim(),
        content: formData.content.trim(),
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

  const handleCancel = () => {
    navigate("/dashboard");
  };

  const suggestions = Array.isArray(coachFeedback?.tips)
    ? coachFeedback.tips
    : Array.isArray(coachFeedback?.suggestions)
      ? coachFeedback.suggestions
      : [];
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

                  setCoachFeedback(null);
                  setError("");
                  setSuccess("");
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

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        {/* PAGE HEADER */}
        <header className={styles.header}>
          <p className={styles.eyebrow}>ASK THE COHORT</p>

          <h1>Publish to the forum</h1>

          <p className={styles.headerDescription}>
            Public threads help the whole cohort. Write as if a classmate will
            debug your issue tomorrow. They only know what you put on the page.
          </p>
        </header>

        {/* QUESTION GUIDELINES */}
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
              tech stack (e.g., “React 19: state resets after navigation”).
            </li>

            <li>
              <strong>Repro steps</strong> numbered, with environment (OS,
              browser, Node version) when it matters.
            </li>

            <li>
              <strong>Minimal code</strong> in fenced markdown blocks; trim
              unrelated lines so readers can scan faster.
            </li>

            <li>
              <strong>Exact errors</strong> copied verbatim, including stack
              trace snippets when debugging backend routes.
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
              characters detailing your problem.
            </li>

            <li>
              <strong>Single topic:</strong> Split unrelated bugs into separate
              threads so search and embeddings stay precise.
            </li>
          </ul>
        </section>

        {/* QUESTION FORM */}
        <section className={styles.formCard}>
          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            {/* ERROR MESSAGE */}
            {error && (
              <div className={styles.error} role="alert">
                {error}
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <div className={styles.success} role="status">
                {success}
              </div>
            )}

            {/* TITLE */}
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
                className={styles.input}
                placeholder="e.g. How do I handle state management using Context API in React?"
              />
            </div>

            {/* QUESTION CONTENT */}
            <div className={styles.formGroup}>
              <label htmlFor="content">
                What are the details of your problem?
              </label>

              <p className={styles.helperText}>
                Introduce the problem and expand on what you put in the title.
                Minimum 10 characters.
              </p>

              <div className={styles.editor}>
                {/* TOOLBAR */}
                <div className={styles.editorHeader}>
                  <div className={styles.toolbar}>
                    <button type="button" aria-label="Bold" title="Bold">
                      <strong>B</strong>
                    </button>

                    <button type="button" aria-label="Italic" title="Italic">
                      <em>I</em>
                    </button>

                    <button type="button" aria-label="Code" title="Code">
                      <span>&lt;/&gt;</span>
                    </button>

                    <button type="button" aria-label="Link" title="Link">
                      <LinkIcon size={15} strokeWidth={2} />
                    </button>
                  </div>

                  <span className={styles.characterCount}>
                    {formData.content.length} characters
                  </span>
                </div>

                {/* CONTENT */}
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className={styles.textarea}
                  placeholder="Include all the information someone would need to answer your question... You can use Markdown to format your code!"
                />
              </div>

              {/* AI COACH BUTTON */}
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

            {/* AI COACH PANEL */}
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

            {/* FORM ACTIONS */}
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
                {isSubmitting ? "Posting..." : <>Post Question</>}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
