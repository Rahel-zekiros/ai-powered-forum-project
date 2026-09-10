import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createQuestion,
  generateQuestionDraftCoach,
} from "../../services/question.service";
import styles from "./PostQuestion.module.css";

export default function PostQuestion() {
  const navigate = useNavigate();

  // Form fields and UI state
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachFeedback, setCoachFeedback] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Update form fields as the user types, clearing old messages
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({ ...previousData, [name]: value }));
    setError("");
    setSuccess("");
  };

  // Full validation used before submitting the question
  const validateForm = () => {
    const title = formData.title.trim();
    const content = formData.content.trim();

    if (title.length < 5) {
      setError("Title must be at least 5 characters long.");
      return false;
    }

    if (content.length < 10) {
      setError("Question content must be at least 10 characters long.");
      return false;
    }

    return true;
  };

  // Sends the current draft to the AI Draft Coach (T-17)
  const handleGetFeedback = async () => {
    setError("");
    setSuccess("");
    setCoachFeedback(null);

    const title = formData.title.trim();
    const content = formData.content.trim();

    // Lighter validation here — title is optional for feedback
    if (title.length > 0 && title.length < 5) {
      setError("Title must be at least 5 characters long.");
      return;
    }

    if (content.length < 10) {
      setError("Question content must be at least 10 characters long.");
      return;
    }

    try {
      setIsCoaching(true);
      const response = await generateQuestionDraftCoach({ title, content });
      setCoachFeedback(response.data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to get AI feedback. Please try again.";
      setError(message);
    } finally {
      setIsCoaching(false);
    }
  };

  // Validates and submits the question (T-09), then redirects on success
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

      setSuccess(response.message || "Question posted successfully.");
      setFormData({ title: "", content: "" });
      setCoachFeedback(null);

      // Give the user a moment to see the success message before leaving
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to post your question. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Ask a Question</h1>
          <p>
            Ask a clear programming question and provide enough details so other
            developers can understand and help you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Question title */}
          <div className={styles.formGroup}>
            <label htmlFor="title">Question Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="What is your question?"
              disabled={isSubmitting || isCoaching}
            />
          </div>

          {/* Question details */}
          <div className={styles.formGroup}>
            <label htmlFor="content">Question Details</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Explain your problem in detail..."
              rows={10}
              disabled={isSubmitting || isCoaching}
            />
          </div>

          {error && (
            <div className={styles.error} role="alert">
              {error}
            </div>
          )}

          {success && <div className={styles.success}>{success}</div>}

          {/* Action buttons */}
          <div className={styles.actions}>
            <button
              type="button"
              onClick={handleGetFeedback}
              disabled={isSubmitting || isCoaching}
              className={styles.aiButton}
            >
              {isCoaching ? "Getting AI Feedback..." : "Get AI Feedback"}
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isCoaching}
              className={styles.submitButton}
            >
              {isSubmitting ? "Posting..." : "Submit Question"}
            </button>
          </div>
        </form>

        {/* AI Draft Coach results panel */}
        {coachFeedback && (
          <section className={styles.coachPanel}>
            <h2>AI Draft Coach</h2>

            {coachFeedback.feedback && (
              <div className={styles.feedback}>
                <h3>Feedback</h3>
                <p>{coachFeedback.feedback}</p>
              </div>
            )}

            {Array.isArray(coachFeedback.suggestions) &&
              coachFeedback.suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  <h3>Suggestions</h3>
                  <ul>
                    {coachFeedback.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
          </section>
        )}
      </div>
    </div>
  );
}
