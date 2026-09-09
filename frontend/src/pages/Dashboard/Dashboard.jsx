import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Edit, List, BookOpen, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getQuestions, searchQuestionsSemantic } from '../../services/question.service';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams(location.search);
        const q = params.get('q');
        const semantic = params.get('semantic');

        let data = [];
        if (semantic) {
          const result = await searchQuestionsSemantic({ query: semantic });
          data = result.data;
        } else if (q) {
          const result = await getQuestions({ search: q });
          data = result.data;
        } else {
          const result = await getQuestions();
          data = result.data;
        }
        setQuestions(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load questions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [location.search]);

  const firstName = user?.firstName?.trim();
  const welcomeLine = firstName
    ? `Good to see you, ${firstName}.`
    : 'Welcome to the forum.';

  // Stats calculation
  const totalQuestions = questions.length;
  const totalReplies = questions.reduce((sum, q) => sum + (q.answerCount || 0), 0);
  const unanswered = questions.filter(q => !q.answerCount || q.answerCount === 0).length;
  const yours = questions.filter(q => q.author?.id === user?.id).length;

  return (
    <div className={styles.dashboard}>
      <div className={styles.topCard}>
        <p className={styles.sectionLabel}>FORUM HOME</p>
        <h2 className={styles.welcomeTitle}>{welcomeLine}</h2>
        <p className={styles.subtitle}>
          Start a topic, revisit your own threads, or skim the live feed. Search above works from any page once you are back on Home.
        </p>

        <div className={styles.actionCards}>
          <div className={styles.actionCard} onClick={() => navigate('/questions/ask')}>
            <div className={styles.iconWrapper} style={{ color: '#f59e0b', backgroundColor: '#fef3c7' }}>
              <Edit size={20} />
            </div>
            <div className={styles.actionCardContent}>
              <h4>New question</h4>
              <p>Share context, errors, and what you already tried</p>
            </div>
          </div>
          <div className={styles.actionCard} onClick={() => navigate('/my-questions')}>
            <div className={styles.iconWrapper} style={{ color: '#f97316', backgroundColor: '#ffedd5' }}>
              <List size={20} />
            </div>
            <div className={styles.actionCardContent}>
              <h4>Your topics</h4>
              <p>Filtered list of threads you authored</p>
            </div>
          </div>
          <div className={styles.actionCard} onClick={() => navigate('/rag-documents')}>
            <div className={styles.iconWrapper} style={{ color: '#f97316', backgroundColor: '#ffedd5' }}>
              <BookOpen size={20} />
            </div>
            <div className={styles.actionCardContent}>
              <h4>Knowledge base</h4>
              <p>Course library, uploads, and retrieval-backed context for threads</p>
            </div>
          </div>
        </div>

        {!isLoading && !error && (
          <>
            <p className={styles.statsDisclaimer}>
              Figures below describe the newest threads in this feed (up to 100 from the API).
            </p>

            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <p>Questions</p>
                <h3>{totalQuestions}</h3>
              </div>
              <div className={styles.statBox}>
                <p>Replies</p>
                <h3>{totalReplies}</h3>
              </div>
              <div className={styles.statBox}>
                <p>Unanswered</p>
                <h3>{unanswered}</h3>
              </div>
              <div className={styles.statBox}>
                <p>Yours</p>
                <h3>{yours}</h3>
              </div>
            </div>
          </>
        )}
        
        {(isLoading || error) && (
          <p className={styles.statsDisclaimer}>
            Loading snapshot for the list below...
          </p>
        )}
      </div>

      <div className={styles.feedCard}>
        <div className={styles.feedHeader}>
          <div>
            <h3>Discussion feed</h3>
            <p>Your threads use a slim left accent in this list.</p>
          </div>
          <span className={styles.newestBadge}>NEWEST THREADS</span>
        </div>

        <div className={styles.feedContainer}>
          {isLoading ? (
            <div className={styles.stateWrapper}>
              <div className={styles.loadingState}>Loading recent questions...</div>
            </div>
          ) : error ? (
            <div className={styles.stateWrapper}>
              <div className={styles.errorState}>{error}</div>
            </div>
          ) : questions.length === 0 ? (
            <div className={styles.stateWrapper}>
              <div className={styles.emptyState}>
                No questions found. Be the first to ask!
              </div>
            </div>
          ) : (
            <div className={styles.questionList}>
              {questions.map((q) => {
                const isMine = q.author?.id === user?.id;
                const excerpt = q.content ? q.content.substring(0, 100) + '...' : '';
                return (
                  <div 
                    key={q.id} 
                    className={`${styles.questionCard} ${isMine ? styles.myQuestion : ''}`}
                    onClick={() => navigate(`/question/${q.questionHash}`)}
                  >
                    <div className={styles.avatar}>
                      {q.author?.firstName?.charAt(0) || 'U'}{q.author?.lastName?.charAt(0) || ''}
                    </div>
                    
                    <div className={styles.questionContent}>
                      <div className={styles.questionTitle}>{q.title}</div>
                      <div className={styles.questionExcerpt}>{excerpt}</div>
                      <div className={styles.questionMeta}>
                        <span>
                          <MessageSquare size={14} /> {q.answerCount || 0} replies
                        </span>
                        <span>
                          {new Date(q.createdAt).toLocaleDateString()} by {isMine ? 'you' : `${q.author?.firstName} ${q.author?.lastName}`}
                        </span>
                      </div>
                    </div>
                    
                    {isMine && <span className={styles.yoursBadge}>YOURS</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

