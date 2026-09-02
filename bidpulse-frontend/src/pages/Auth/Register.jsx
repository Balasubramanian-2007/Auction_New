import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './auth.css';

const emptyForm = {
  userid: '',
  username: '',
  email_id: '',
  password: '',
  phone_number: '',
  address: '',
};

export default function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await register(form);
      if (result.ok) {
        navigate('/verify-otp', { state: { userid: form.userid } });
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.response?.data?.errMsg || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">BidPulse</Link>
        <h1 className="auth-card__title">Create your account</h1>
        <p className="auth-card__subtitle">One account lets you sell and bid, on different auctions.</p>

        {error && <div className="auth-alert auth-alert--error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-row">
            <div className="field">
              <label htmlFor="userid">User ID</label>
              <input id="userid" required value={form.userid} onChange={update('userid')} placeholder="Unique login ID" />
            </div>
            <div className="field">
              <label htmlFor="username">Display name</label>
              <input id="username" required value={form.username} onChange={update('username')} placeholder="Shown on your listings" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email_id">Email</label>
            <input id="email_id" type="email" required value={form.email_id} onChange={update('email_id')} placeholder="you@example.com" />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" required value={form.password} onChange={update('password')} placeholder="At least 8 characters" />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="phone_number">Phone number</label>
              <input id="phone_number" required value={form.phone_number} onChange={update('phone_number')} />
            </div>
            <div className="field">
              <label htmlFor="address">Address</label>
              <input id="address" required value={form.address} onChange={update('address')} />
            </div>
          </div>

          <button className="btn btn--primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <button type="button" className="btn btn--google" onClick={loginWithGoogle}>
          Continue with Google
        </button>

        <p className="auth-footer-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
