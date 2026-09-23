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
