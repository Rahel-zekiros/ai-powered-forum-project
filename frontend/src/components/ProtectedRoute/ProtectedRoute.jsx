import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './ProtectedRoute.module.css';

/**
 * Auth gate for a single page. Wrap the element passed to a <Route>:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isAuthenticating } = useAuth();
  const location = useLocation();

  if (isAuthenticating) {
    return (
      <div className={styles.loadingScreen} role="status">
        <div className={styles.spinner} aria-hidden />
        <span>Checking your session…</span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}
