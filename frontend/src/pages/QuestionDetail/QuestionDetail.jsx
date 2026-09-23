import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  getSingleQuestion,
  getSimilarQuestions,
  assessAnswerFit,
  createAnswer,
} from "../../services/questionDetail.service.js";
import styles from "./QuestionDetail.module.css";
import ReactMarkdown from "react-markdown";

function formatDate(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  });
}

function initials(firstName, lastName) {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "??";
}

export default function QuestionDetail() {
  const { questionHash } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [related, setRelated] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [draftAnswer, setDraftAnswer] = useState("");
  const [fitResult, setFitResult] = useState(null);
  const [isCheckingFit, setIsCheckingFit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [copied, setCopied] = useState(false);
  const answerRef = useRef(null);

  const fetchQuestion = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getSingleQuestion(questionHash);
      setQuestion(data.question);
      setAnswers(data.answers ?? []);

      // Related questions — best effort, don't block the page if it fails.
      try {
        const similar = await getSimilarQuestions(questionHash, 5);
        setRelated(similar.data ?? []);
      } catch (e) {
        setRelated([]);
      }
    } catch (err) {
      setError(
        err.response?.status === 404
          ? "Failed to load question details."
          : "Failed to load question details.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [questionHash]);

  useEffect(() => {
    fetchQuestion();
  }, [fetchQuestion]);

  const isOwnQuestion =
    !!currentUser && !!question && question.author?.id === currentUser.id;

    const insertMarkdown = (before, after = "", placeholder = "text") => {
      const textarea = answerRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      const selected = value.slice(start, end) || placeholder;

      const newValue =
        value.slice(0, start) + before + selected + after + value.slice(end);
      setDraftAnswer(newValue);
      setFitResult(null);

      requestAnimationFrame(() => {
        textarea.focus();
        const selStart = start + before.length;
        const selEnd = selStart + selected.length;
        textarea.setSelectionRange(selStart, selEnd);
      });
    };

    const handleCheckFit = async () => {
      if (draftAnswer.trim().length < 20) {
        setSubmitError("Write at least 20 characters before checking fit.");
        return;
      }
      try {
        setIsCheckingFit(true);
        setSubmitError(null);
        const result = await assessAnswerFit(questionHash, draftAnswer.trim());
        setFitResult(result.data);
      } catch (err) {
        setSubmitError(
          "Couldn't get AI feedback right now. You can still submit.",
        );
      } finally {
        setIsCheckingFit(false);
      }
    };

    const handleSubmitAnswer = async (e) => {
      e.preventDefault();
      if (draftAnswer.trim().length < 20) {
        setSubmitError("Answer must be at least 20 characters.");
        return;
      }
      try {
        setIsSubmitting(true);
        setSubmitError(null);

        // 1. Send request to backend with questionHash
        const res = await createAnswer(questionHash, draftAnswer.trim());

        // 2. Extract answer object (backend returns { success, message, data })
        const newAnswer = res.data;

        // 3. Append new answer to the state list immediately
        setAnswers((prevAnswers) => [...prevAnswers, newAnswer]);

        // 4. Clear state
        setDraftAnswer("");
        setFitResult(null);
      } catch (err) {
        setSubmitError(
          err.response?.data?.message ||
            "Failed to post answer. Please try again.",
        );
      } finally {
        setIsSubmitting(false);
      }
    };
    if (isLoading) {
      return (
        <div className={styles.page}>
          <p className={styles.statusText}>Loading question details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className={styles.page}>
          <div className={styles.errorState}>
            <p className={styles.errorText}>{error}</p>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    const authorName =
      `${question.author?.firstName ?? ""} ${question.author?.lastName ?? ""}`.trim() ||
      "Unknown";

  return (
    <div className={styles.page}>
      <button
        className={styles.backLink}
        onClick={() => navigate("/dashboard")}
      >
        ← Back to feed
      </button>

      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.avatar}>
                {initials(
                  question.author?.firstName,
                  question.author?.lastName,
                )}
              </span>
              <div>
                <p className={styles.authorName}>{authorName}</p>
                <p className={styles.postedDate}>
                  Posted {formatDate(question.createdAt)}
                </p>
              </div>
            </div>

            <h1 className={styles.questionTitle}>{question.title}</h1>
            <div className={styles.questionContent}>
              <ReactMarkdown>{question.content}</ReactMarkdown>
            </div>

            <div className={styles.questionFooter}>
              <button
                className={styles.pillButton}
                onClick={async () => {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "✓ Copied!" : "⇄ Share"}
              </button>
              <span className={styles.pillButton}>
                💬 {answers.length}{" "}
                {answers.length === 1 ? "Answer" : "Answers"}
              </span>
            </div>
          </section>
}