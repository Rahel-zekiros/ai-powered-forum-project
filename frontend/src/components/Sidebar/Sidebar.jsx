import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, MessageSquare, FileText, PlusCircle, MessageSquareCode, UserCog } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/my-questions', label: 'Your Topics', icon: MessageSquare },
  { path: '/rag-documents', label: 'Knowledge Base', icon: FileText },
];

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { currentUser, logoutUser } = useAuth();

  const firstName = currentUser?.firstName || currentUser?.first_name || 'User';
  const lastName = currentUser?.lastName || currentUser?.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'U';

  function handleBrandClick() {
    onClose?.();
  }

  function handleAskQuestion() {
    onClose?.();
    navigate('/questions/ask');
  }

  return (
    <>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        {/* 1. Header with Logo (Clickable -> Home Page) */}
        <Link to="/" onClick={handleBrandClick} className={styles.brandHeaderLink}>
          <div className={styles.brandHeader}>
            <div className={styles.logoBox}>
              <MessageSquareCode size={24} color="#ffffff" />
            </div>
            <div className={styles.brandText}>
              <h2 className={styles.brandTitle}>Evangadi Forum</h2>
              <p className={styles.brandSubtitle}>Learn together. Ask with context.</p>
            </div>
          </div>
        </Link>

        {/* 2. Navigation List */}
        <div className={styles.navSection}>
          <span className={styles.navLabel}>NAVIGATE</span>
          <nav aria-label="Main navigation" className={styles.nav}>
            {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                onClick={onClose}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.linkActive : ''}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 3. Action Button & Profile Footer */}
        <div className={styles.footer}>
          <button type="button" className={styles.askButton} onClick={handleAskQuestion}>
            <PlusCircle size={18} />
            <span>New Question</span>
          </button>

          {/* Profile & Logout Section */}
          <div className={styles.profileWrapper}>
            <Link to="/profile/update" onClick={onClose} className={styles.profileLinkSection}>
              <div className={styles.avatar}>{initials}</div>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{fullName}</span>
               
              </div>
            </Link>

            <button
              type="button"
              className={styles.logoutIconBtn}
              onClick={logoutUser}
              title="Logout"
            >
               <span className={styles.logoutText}>Log Out</span>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}