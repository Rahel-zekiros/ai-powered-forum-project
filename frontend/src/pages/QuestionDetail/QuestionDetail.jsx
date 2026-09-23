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

}