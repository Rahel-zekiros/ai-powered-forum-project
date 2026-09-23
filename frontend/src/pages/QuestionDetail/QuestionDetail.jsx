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