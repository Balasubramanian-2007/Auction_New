import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

export default function Login() {
  const { login, loginWithGoogle, completeOAuthSession, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userID, setUserID] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Handle: (a) redirect from a completed Google OAuth flow, or
  // (b) a "just registered / just verified" state, or (c) session-expired redirect.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userJson = params.get('user');
    const status = params.get('status');

    if (token && userJson && status === 'Verified') {
      const ok = completeOAuthSession(token, userJson);
      if (ok) {
        navigate('/auctions', { replace: true });
        return;
      }
      setError('Google sign-in failed to complete. Please try again.');
    }

    if (params.get('expired')) {
      setInfo('Your session expired. Please log in again.');
    } else if (location.state?.justVerified) {
      setInfo('Account verified - you can log in now.');
    }
  }, [location, completeOAuthSession, navigate]);

  useEffect(() => {
    if (isAuthenticated) navigate('/auctions', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await login(userID, userPassword);
      if (result.ok) {
        navigate('/auctions');
      } else {
        setError(result.message);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">BidPulse</Link>
        <h1 className="auth-card__title">Log in</h1>
        <p className="auth-card__subtitle">Welcome back to the floor.</p>

        {info && !error && <div className="auth-alert auth-alert--success">{info}</div>}
        {error && <div className="auth-alert auth-alert--error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="userID">User ID</label>
            <input id="userID" required value={userID} onChange={(e) => setUserID(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="userPassword">Password</label>
            <input id="userPassword" type="password" required value={userPassword} onChange={(e) => setUserPassword(e.target.value)} />
          </div>

          <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button type="button" className="btn btn--google" onClick={loginWithGoogle}>
          Continue with Google
        </button>

        <p className="auth-footer-link">
          New to BidPulse? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
