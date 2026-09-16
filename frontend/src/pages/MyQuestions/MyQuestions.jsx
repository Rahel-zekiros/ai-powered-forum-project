import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Plus } from "lucide-react";
import { getQuestions } from "../../services/question.service";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./MyQuestions.module.css";

export default function MyQuestions() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [myQuestions, setMyQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyQuestions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getQuestions({ mine: true });
        setMyQuestions(result.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load your questions.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyQuestions();
  }, []);

  const getInitials = () => {
    const firstName = currentUser?.firstName || "";
    const lastName = currentUser?.lastName || "";

    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";
  };

  return (
    <div className={styles.page}>
      <section className={styles.workspaceCard}>
        <div className={styles.headerContent}>
          <p className={styles.eyebrow}>YOUR WORKSPACE</p>

          <h2 className={styles.pageTitle}>Your topics</h2>

          <p className={styles.description}>
            Only questions you created. Open one to read answers or add
            follow-ups. Rows use the same left accent as your threads on Home.
          </p>
        </div>

        <button
          type="button"
          className={styles.newQuestionButton}
          onClick={() => navigate("/questions/ask")}
        >
          <Plus size={18} />
          New question
        </button>
      </section>

      <section className={styles.questionSection}>
        {isLoading ? (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <p>Loading your questions...</p>
          </div>
        ) : error ? (
          <div className={styles.errorBox}>
            <p>{error}</p>
          </div>
        ) : myQuestions.length === 0 ? (
          <div className={styles.emptyBox}>
            <h3>You haven't asked any questions yet</h3>
            <p>
              Ask your first question and start a discussion with the Evangadi
              community.
            </p>

            <button
              type="button"
              className={styles.emptyButton}
              onClick={() => navigate("/questions/ask")}
            >
              Ask your first question
            </button>
          </div>
        ) : (
          <div className={styles.questionList}>
            {myQuestions.map((question) => (
              <article
                key={question.id}
                className={styles.questionCard}
                // onClick={() => navigate(`/question/${question.questionHash}`)}
                onClick={() => navigate(`/question/${question.id}`)}
              >
                <div className={styles.leftAccent} />

                <div className={styles.avatar}>{getInitials()}</div>

                <div className={styles.questionContent}>
                  <h3 className={styles.questionTitle}>{question.title}</h3>

                  <p className={styles.questionExcerpt}>{question.content}</p>

                  <div className={styles.questionMeta}>
                    <span>
                      <MessageSquare size={14} />
                      {question.answerCount || 0} replies
                    </span>

                    <span>
                      {new Date(question.createdAt).toLocaleDateString()}
                    </span>

                    <span>by You</span>
                  </div>
                </div>

                <span className={styles.yoursBadge}>YOURS</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
