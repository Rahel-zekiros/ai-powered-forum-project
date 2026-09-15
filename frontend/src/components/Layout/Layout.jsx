import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Navbar from "../Navbar/Navbar.jsx";
import Sidebar from "../Sidebar/Sidebar.jsx";
import styles from "./Layout.module.css";

const PAGE_COPY = {
  "/dashboard": {
    title: "Home",
    subtitle:
      "Browse the feed, search by keyword, or run AI similarity search.",
  },
  "/my-questions": {
    title: "Your Topics",
    subtitle: "Questions you have posted. Open any thread to read replies.",
  },
  "/questions/ask": {
    title: "Ask a Question",
    subtitle:
      "A clear title and reproducible steps get faster, more accurate answers.",
  },
  "/rag-documents": {
    title: "Knowledge Base",
    subtitle: "Private PDF library with semantic search and AI answers.",
  },
};

function resolvePageCopy(pathname) {
  if (PAGE_COPY[pathname]) return PAGE_COPY[pathname];
  if (pathname.startsWith("/questions/")) {
    return {
      title: "Discussion",
      subtitle: "Read the thread and reply with markdown if you can help.",
    };
  }
  return { title: "Forum", subtitle: "" };
}

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); 
  const location = useLocation();
  const { currentUser, logoutUser } = useAuth();
  const { title, subtitle } = resolvePageCopy(location.pathname);

  return (
    <div className={styles.shell}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className={styles.main}>
        <Navbar
          title={title}
          subtitle={subtitle}
          user={currentUser}
          onLogout={logoutUser}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          searchQuery={searchQuery} 
          onSearchChange={setSearchQuery}
        />

        <main className={styles.content}>
          <Outlet context={{ searchQuery, setSearchQuery }} />
        </main>

        {/* Footer እዚህ ጋር ይገባል */}
        <footer className={styles.bottomFooter}>
          <div className={styles.footerInnerContent}>
            <div className={styles.footerInfoBlock}>
              <h4 className={styles.footerHeading}>Evangadi Forum</h4>
              <p className={styles.footerSubtext}>
                A practice space for technical Q&A, peer feedback, and
                AI-assisted search, built for Evangadi learners and mentors.
              </p>
              <p className={styles.copyrightText}>
                © 2026 Evangadi Forum. For educational use.
              </p>
            </div>
            <nav className={styles.footerNavigation}>
              <a href='#' className={styles.footerNavLink}>
                About
              </a>
              <a href='#' className={styles.footerNavLink}>
                Privacy
              </a>
              <a href='#' className={styles.footerNavLink}>
                Terms
              </a>
              <a href='#' className={styles.footerNavLink}>
                Contact
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}