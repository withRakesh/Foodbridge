import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, fetchCurrentUser } from '../api/authApi';

const AuthContext = createContext(null);

const TOKEN_KEY = 'fb_token';

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we restore a session on first load

  // On mount: if a token is already sitting in localStorage from a previous
  // session, verify it against /auth/me and restore the user. If it's
  // expired/invalid, silently clear it.
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    fetchCurrentUser()
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  // Any API call anywhere in the app can come back 401 (token expired,
  // token invalid, or an admin disabled this account mid-session) —
  // axiosInstance.js broadcasts a 'fb:unauthorized' event when that
  // happens instead of handling it itself, since that plain module can't
  // touch React state. This is the one place that actually reacts to it:
  // clear the stored token, reset `user` so every RoleRoute/PrivateRoute
  // guard immediately re-evaluates as logged-out, and send the person to
  // Login with an explanation.
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser((prevUser) => {
        if (!prevUser) {
          // Wasn't actually logged in (e.g. a stale leftover token failed
          // the initial /auth/me check above) — nothing to tear down, and
          // no "session expired" message to show for a session that never
          // really started.
          return prevUser;
        }
        localStorage.removeItem(TOKEN_KEY);
        if (window.location.pathname !== '/login') {
          navigate('/login', {
            state: { message: 'Your session has expired — please log in again.' },
          });
        }
        return null;
      });
    };

    window.addEventListener('fb:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('fb:unauthorized', handleUnauthorized);
  }, [navigate]);

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser({
      _id: data._id,
      name: data.name,
      email: data.email,
      role: data.role,
      approvalStatus: data.approvalStatus,
    });
    return data;
  };

  // Registration deliberately does NOT auto-authenticate the user, even
  // though the backend's /register response includes a token. Restaurant
  // and NGO accounts start out `approvalStatus: 'pending'` and can't do
  // anything role-gated until an admin approves them (and /login itself
  // blocks pending accounts) — so we just report success and send the
  // person to the login screen with a status message instead of logging
  // them into a half-usable session.
  const register = async (payload) => {
    const data = await registerUser(payload);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    role: user?.role ?? null,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
