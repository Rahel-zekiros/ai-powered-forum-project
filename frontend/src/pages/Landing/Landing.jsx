import { useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  MessageSquare,
  Search,
  PenSquare,
  Library,
  ArrowRight,
  CheckCircle2,
  Layers,
  FileText,
  Database,
  PlayCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Landing.module.css";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // useRef  Smooth Scrolling
  const howItWorksRef = useRef(null);
  const courseRagRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.navbar}>
        <div className={styles.navbarInner}>
          <button
            type="button"
            className={styles.brandLogo}
            onClick={() => navigate("/")}
            aria-label="Evangadi Forum home"
          >
            <span className={styles.brandIcon} aria-hidden>
              <MessageSquare size={20} strokeWidth={2} />
            </span>
            <span className={styles.brandMeta}>
              <span className={styles.brandTitle}>Evangadi Forum</span>
              <span className={styles.brandSubtitle}>
                Learn together. Ask with context.
              </span>
            </span>
          </button>

          <nav className={styles.navMenu} aria-label="Marketing">
            <button
              type="button"
              className={styles.navItem}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              Overview
            </button>
            <button
              type="button"
              className={styles.navItem}
              onClick={() => scrollToSection(courseRagRef)}
            >
              Course RAG
            </button>
            <button
              type="button"
              className={styles.navItem}
              onClick={() => scrollToSection(howItWorksRef)}
            >
              How it works
            </button>
          </nav>

          <div className={styles.authButtons}>
            {isAuthenticated ? (
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => navigate("/dashboard")}
              >
                Open forum
                <ArrowRight size={16} aria-hidden />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={() => navigate("/auth")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => navigate("/auth")}
                >
                  Create account
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className={styles.mainContent}>
        <section className={styles.heroSection}>
          <div className={styles.heroWrapper}>
            <div className={styles.heroTextContent}>
              <motion.p
                className={styles.badge}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Sparkles size={14} aria-hidden />
                Keyword search + embedding similarity
              </motion.p>
              <motion.h1
                className={styles.heroHeading}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
              >
                A calm place for{" "}
                <span className={styles.highlightText}>technical Q&A</span>
              </motion.h1>
              <motion.p
                className={styles.heroDescription}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Post with enough context for peers to help in one pass. Search
                the archive by phrase or by meaning, keep your threads in one
                place, and ground questions in{" "}
                <strong className={styles.strongText}>course documents</strong>{" "}
                with retrieval-augmented generation (RAG) so answers cite the
                right syllabus, readings, and handouts.
              </motion.p>
              <motion.div
                className={styles.actionGroup}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() =>
                    navigate(isAuthenticated ? "/dashboard" : "/auth")
                  }
                >
                  {isAuthenticated ? "Go to home" : "Get started"}
                  <ArrowRight size={16} aria-hidden />
                </button>
                {!isAuthenticated && (
                  <button
                    type="button"
                    className={styles.btnOutline}
                    onClick={() => scrollToSection(howItWorksRef)}
                  >
                    See how it works
                  </button>
                )}
              </motion.div>
            </div>

            <aside className={styles.sideOverview} aria-label="What you get">
              <p className={styles.overviewTitle}>At a glance</p>
              <ul className={styles.featureList}>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Markdown threads and replies
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Semantic search on question embeddings
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  Optional AI draft tips when you ask or answer
                </li>
                <li>
                  <CheckCircle2 size={16} aria-hidden />
                  <span>
                    <strong className={styles.strongText}>Course RAG:</strong>{" "}
                    upload or sync course materials, retrieve the best chunks
                    for each question, and answer with citations, not generic
                    web text.
                  </span>
                </li>
              </ul>
            </aside>
          </div>
        </section>

        {/* Live Showcase Section */}
        <section className={styles.showcaseSection}>
          <div className={styles.sectionContainer}>
            <div className={styles.showcaseHeader}>
              <p className={styles.badge}>
                <PlayCircle size={14} aria-hidden />
                Live Showcase
              </p>
              <h2 className={styles.sectionHeading}>
                See Evangadi Forum in Action
              </h2>
              <p className={styles.sectionSubheading}>
                Watch how seamlessly you can navigate topics, perform semantic
                search, and post answers with code support.
              </p>
            </div>

            <div className={styles.mediaFrame}>
              <video
                autoPlay
                loop
                muted
                playsInline
                className={styles.previewVideo}
              >
                <source src="/forum-demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </section>

        <section
          ref={courseRagRef}
          className={styles.ragSection}
          aria-labelledby="rag-heading"
        >
          <div className={styles.sectionContainer}>
            <p className={styles.subBadge}>Retrieval-augmented generation</p>
            <h2 className={styles.sectionHeading} id="rag-heading">
              How course RAG works with the forum
            </h2>
            <p className={styles.sectionSubheading}>
              Forum search already helps you find <em>similar questions</em>{" "}
              from peers. RAG goes further: it finds{" "}
              <em>evidence inside your own documents</em> (readings, rubrics,
              lab specs) and surfaces those snippets when you write or review an
              answer. That keeps AI assistance on-policy for Evangadi-style
              courses and reduces “confident but wrong” generic answers.
            </p>
            <div className={styles.pipelineGrid}>
              <div className={styles.pipelineCard}>
                <span className={styles.cardBadgeIcon} aria-hidden>
                  <FileText size={20} />
                </span>
                <h3 className={styles.cardHeading}>Ingest & chunk</h3>
                <p className={styles.cardParagraph}>
                  Upload or connect course files; split them into overlapping
                  chunks and store embeddings the same way we already embed
                  questions, so retrieval stays fast and auditable.
                </p>
              </div>
              <div className={styles.pipelineCard}>
                <span className={styles.cardBadgeIcon} aria-hidden>
                  <Database size={20} />
                </span>
                <h3 className={styles.cardHeading}>
                  Retrieve at question time
                </h3>
                <p className={styles.cardParagraph}>
                  When you open Ask or run a search, the app pulls the
                  top-matching chunks from the cohort corpus (with scores), not
                  just other threads. That is ideal for “what does the syllabus
                  say about…” style questions.
                </p>
              </div>
              <div className={styles.pipelineCard}>
                <span className={styles.cardBadgeIcon} aria-hidden>
                  <Sparkles size={20} />
                </span>
                <h3 className={styles.cardHeading}>Grounded responses</h3>
                <p className={styles.cardParagraph}>
                  Downstream prompts quote or summarize only from retrieved
                  spans, with room for instructors to review sources. The UI
                  makes it obvious when an answer drew on RAG versus peer
                  replies alone.
                </p>
              </div>
            </div>
            <p className={styles.infoBox}>
              Live forum threads, semantic question search, draft/fit AI
              helpers, and this RAG pipeline work together: uploads and access
              control live in the Knowledge base per cohort, and RAG-backed
              context shows up in the same thread view you already use.
            </p>
          </div>
        </section>

        {!isAuthenticated && (
          <>
            <section className={styles.featuresSection}>
              <div className={styles.sectionContainer}>
                <h2 className={styles.sectionHeading}>
                  Built for cohort coursework
                </h2>
                <p className={styles.sectionSubheading}>
                  Same patterns you use after sign-in, without a separate
                  “marketing product.”
                </p>
                <div className={styles.gridContainer}>
                  <article className={styles.infoCard}>
                    <div className={styles.iconContainer} aria-hidden>
                      <Search size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.cardTitleText}>Find related work</h3>
                    <p className={styles.cardBodyText}>
                      Keyword filters for exact matches, plus similarity search
                      when you are still shaping the right vocabulary.
                    </p>
                  </article>
                  <article className={styles.infoCard}>
                    <div className={styles.iconContainer} aria-hidden>
                      <MessageSquare size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.cardTitleText}>Readable threads</h3>
                    <p className={styles.cardBodyText}>
                      Questions and answers stay structured so the group can
                      reuse explanations before exams and interviews.
                    </p>
                  </article>
                  <article className={styles.infoCard}>
                    <div className={styles.iconContainer} aria-hidden>
                      <Sparkles size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.cardTitleText}>
                      Lightweight AI help
                    </h3>
                    <p className={styles.cardBodyText}>
                      Suggestions on your question draft and a quick relevance
                      check on answer drafts. Always your choice to apply or
                      post.
                    </p>
                  </article>
                  <article className={styles.infoCard}>
                    <div className={styles.iconContainer} aria-hidden>
                      <Layers size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className={styles.cardTitleText}>
                      RAG over your course library
                    </h3>
                    <p className={styles.cardBodyText}>
                      Instructors and cohorts add PDFs, syllabi, and notes into
                      a controlled corpus. When you ask, the system retrieves
                      the most relevant passages and attaches them to the
                      prompt, so explanations stay tied to your class materials,
                      not the open web.
                    </p>
                  </article>
                </div>
              </div>
            </section>

            <section
              ref={howItWorksRef}
              className={styles.workflowSection}
              aria-labelledby="how-heading"
            >
              <div className={styles.sectionContainer}>
                <h2 className={styles.sectionHeading} id="how-heading">
                  How it works
                </h2>
                <p className={styles.sectionSubheading}>
                  Four steps from question to searchable knowledge for the next
                  person.
                </p>
                <ol className={styles.stepList}>
                  <li className={styles.stepItem}>
                    <span className={styles.stepBadgeIcon} aria-hidden>
                      <PenSquare size={18} />
                    </span>
                    <div>
                      <h3 className={styles.stepTitle}>Ask with context</h3>
                      <p className={styles.stepDesc}>
                        Title, environment, errors, and what you tried, so peers
                        reproduce before they teach.
                      </p>
                    </div>
                  </li>
                  <li className={styles.stepItem}>
                    <span className={styles.stepBadgeIcon} aria-hidden>
                      <MessageSquare size={18} />
                    </span>
                    <div>
                      <h3 className={styles.stepTitle}>Get answers</h3>
                      <p className={styles.stepDesc}>
                        Replies live in one thread with markdown and code
                        blocks, visible to everyone in the cohort.
                      </p>
                    </div>
                  </li>
                  <li className={styles.stepItem}>
                    <span className={styles.stepBadgeIcon} aria-hidden>
                      <Search size={18} />
                    </span>
                    <div>
                      <h3 className={styles.stepTitle}>Search two ways</h3>
                      <p className={styles.stepDesc}>
                        Classic text search on the feed, or semantic search when
                        you want “questions like this one.”
                      </p>
                    </div>
                  </li>
                  <li className={styles.stepItem}>
                    <span className={styles.stepBadgeIcon} aria-hidden>
                      <Library size={18} />
                    </span>
                    <div>
                      <h3 className={styles.stepTitle}>Own your trail</h3>
                      <p className={styles.stepDesc}>
                        Your topics list keeps authorship clear. The Knowledge
                        base hosts uploads and RAG retrieval so answers can cite
                        your materials. See <strong>Course RAG</strong> above
                        for the full pipeline.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            </section>

            <section className={styles.ctaContainer}>
              <div className={styles.ctaBox}>
                <h2 className={styles.ctaHeading}>Ready when you are</h2>
                <p className={styles.ctaDesc}>
                  Create a free learner account to post, reply, and search the
                  forum index.
                </p>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  onClick={() => navigate("/auth")}
                >
                  Create free account
                  <ArrowRight size={16} aria-hidden />
                </button>
              </div>
            </section>
          </>
        )}

        {isAuthenticated && (
          <section className={styles.signedInBanner}>
            <div className={styles.sectionContainer}>
              <p className={styles.badge}>Signed in</p>
              <h2 className={styles.sectionHeading}>Back to your workspace</h2>
              <p className={styles.sectionSubheading}>
                Home has the live feed, shortcuts, and search. Your topics lists
                only threads you started. Course-document RAG (ingest, retrieve,
                cite) ties the Knowledge base to threads. Scroll to{" "}
                <strong>Course RAG</strong> on this page for the full picture.
              </p>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={() => navigate("/dashboard")}
              >
                Open forum home
                <ArrowRight size={16} aria-hidden />
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className={styles.footerSection}>
        <div className={styles.footerWrapper}>
          <div>
            <p className={styles.footerTitle}>Evangadi Forum</p>
            <p className={styles.footerCopyright}>
              © {new Date().getFullYear()} · Learner-led Q&A
            </p>
          </div>
          <div className={styles.footerNav}>
            <button
              type="button"
              className={styles.footerBtn}
              onClick={() => navigate("/auth")}
            >
              Sign in
            </button>
            <span className={styles.bulletSeparator} aria-hidden>
              ·
            </span>
            <a href="#" className={styles.footerLink}>
              Privacy
            </a>
            <span className={styles.bulletSeparator} aria-hidden>
              ·
            </span>
            <a href="#" className={styles.footerLink}>
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
