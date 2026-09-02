import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

export default function VerifyOtp() {
  const { verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [userid, setUserid] = useState(location.state?.userid || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await verifyOtp(userid, otp);
      if (result.ok) {
        navigate('/login', { state: { justVerified: true } });
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
        <h1 className="auth-card__title">Check your email</h1>
        <p className="auth-card__subtitle">We sent a 6-digit code to the email on your account. Enter it below to activate.</p>

        {error && <div className="auth-alert auth-alert--error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="userid">User ID</label>
            <input id="userid" required value={userid} onChange={(e) => setUserid(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="otp">Verification code</label>
            <input
              id="otp"
              required
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit code"
            />
          </div>

          <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Verifying…' : 'Verify account'}
          </button>
        </form>

        <p className="auth-footer-link">
          Wrong details? <Link to="/register">Start over</Link>
        </p>
      </div>
    </div>
  );
}
