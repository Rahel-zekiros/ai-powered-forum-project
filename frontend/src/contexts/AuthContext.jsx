import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth/auth.service.js';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  // Runs once on mount: was there already a session saved from a previous
  // visit? If so, confirm it against the backend rather than trusting
  // whatever is cached in localStorage.
  useEffect(() => {
    const initializeAuthStatus = async () => {
      const savedToken = authService.retrieveAuthToken();

      if (savedToken) {
        try {
          const verifiedUser = await authService.verifyActiveSession();
          setCurrentUser(verifiedUser);
        } catch (error) {
          authService.clearSessionData();
          setCurrentUser(null);
        }
      }
      setIsAuthenticating(false);
    };

    initializeAuthStatus();
  }, []);

  const clearAuthError = () => setAuthError(null);

  const signup = async data => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await authService.registerAccount(data);
      return { success: true, user: result.user };
    } catch (err) {
      const errorMsg = err.message || 'Registration failed. Please try again.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const signin = async credentials => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const { user } = await authService.loginAccount(credentials);
      setCurrentUser(user);
      return { success: true, user };
    } catch (err) {
      const errorMsg = err.message || 'Invalid email or password.';
      setAuthError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logoutUser = () => {
    authService.clearSessionData();
    setCurrentUser(null);
    setAuthError(null);
    navigate('/auth');
  };

  const updateUserProfile = updatedFields => {
    setCurrentUser(prev => (prev ? { ...prev, ...updatedFields } : null));
  };

  const contextValue = {
    currentUser,
    isAuthenticating,
    loading: isAuthenticating,
    authError,
    signup,
    signin,
    logoutUser,
    updateUserProfile,
    clearAuthError,
    isLoggedIn: !!currentUser,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/** Reads the auth context. Throws if called outside <AuthProvider>. */
export function useAuth() {
  const authVal = useContext(AuthContext);
  if (!authVal) {
    throw new Error('useAuth must be wrapped inside AuthProvider');
  }
  return authVal;
}
