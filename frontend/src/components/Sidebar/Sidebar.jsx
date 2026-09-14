import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, MessageSquare, FileText, PlusCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './Sidebar.module.css';

/**
 * Primary navigation: paths must match App.jsx's routes.
 */
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/my-questions', label: 'Your Topics', icon: MessageSquare },
  { path: '/rag-documents', label: 'Knowledge Base', icon: FileText },
];

/**
 * Off-canvas on mobile (toggled by Navbar's menu button), always visible on
 * desktop — see the min-width media query in Sidebar.module.css. Reads the
 * signed-in user and logout straight from AuthContext, matching the team's
 * shared convention.
 */
export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { currentUser, logoutUser } = useAuth();

  const firstName = currentUser?.firstName || 'User';
  const lastName = currentUser?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();

  function handleAskQuestion() {
    onClose();
    navigate('/questions/ask');
  }

  return (
    <>
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <p className={styles.brand}>Evangadi Forum</p>

        <button type="button" className={styles.askButton} onClick={handleAskQuestion}>
          <PlusCircle size={18} />
          <span>Ask a Question</span>
        </button>

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

        <div className={styles.profile}>
          <span className={styles.profileName}>{fullName}</span>
          <button
            type="button"
            className={styles.profileLogout}
            onClick={logoutUser}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
