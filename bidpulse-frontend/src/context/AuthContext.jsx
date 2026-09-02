import { createContext, useContext, useState, useCallback } from 'react';
import { authApi, AUTH_BASE } from '../api/client';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('bidpulse_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('bidpulse_token'));
  const [user, setUser] = useState(readStoredUser);

  const persistSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem('bidpulse_token', nextToken);
    localStorage.setItem('bidpulse_user', JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  // Step 3 of manual auth: userID + userPassword (field names match AuthController exactly)
  const login = useCallback(async (userID, userPassword) => {
    const { data } = await authApi.post('/login', { userID, userPassword });
    if (data.Token && data.user) {
      persistSession(data.Token, data.user);
      return { ok: true };
    }
    // Backend returns 200 with a plain `message` for "doesn't exist" / "not verified"
    return { ok: false, message: data.message || 'Login failed' };
  }, [persistSession]);

  // Step 1 of manual auth: submits registration info, backend emails an OTP
  const register = useCallback(async (payload) => {
    const { data } = await authApi.post('/register', payload);
    if (data.Status === 200) return { ok: true };
    if (data.Invalid) return { ok: false, message: data.Invalid };
    return { ok: false, message: data.errMsg || 'Registration failed' };
  }, []);

  // Step 2 of manual auth: OTP confirmation, activates the account
  const verifyOtp = useCallback(async (userid, otp_received_from_user) => {
    const { data } = await authApi.post('/verify-signup', { userid, otp_received_from_user });
    if (data.Status === 200) return { ok: true };
    return { ok: false, message: data.message || data.error || 'Verification failed' };
  }, []);

  // Redirects the whole page to Google's consent screen; AuthService owns the callback
  const loginWithGoogle = useCallback(() => {
    window.location.href = `${AUTH_BASE}/auth/google`;
  }, []);

  // Called by the Login page when it detects ?token=&user=&status= from the
  // Google OAuth callback redirect (handleGoogleCallback sends users back here).
  const completeOAuthSession = useCallback((tokenFromUrl, userJsonFromUrl) => {
    try {
      const parsedUser = JSON.parse(userJsonFromUrl);
      persistSession(tokenFromUrl, parsedUser);
      return true;
    } catch {
      return false;
    }
  }, [persistSession]);

  const logout = useCallback(() => {
    localStorage.removeItem('bidpulse_token');
    localStorage.removeItem('bidpulse_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    isAdmin: user?.role === 'admin',
    login,
    register,
    verifyOtp,
    loginWithGoogle,
    completeOAuthSession,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
