import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({ userID: '', userPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginState } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const rawUser = params.get('user');

    if (token && rawUser) {
      try {
        const user = JSON.parse(rawUser);
        loginState(user, token);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError('Google sign-in failed. Please try again.');
      }
    }
  }, [location.search, loginState, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await API.post('/login', formData);
      const status = response.data.Status;
      const token = response.data.Token;
      const user = response.data.user;

      if (status === 'Verified' || status === 200 || token) {
        loginState(user, token);
        navigate('/dashboard');
        return;
      }

      setError(response.data.Message || response.data.message || 'Login failed');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.Message || 'Invalid credentials or connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:4000/auth/google';
  };

  return (
    <div className="auth-card">
      <h2 className="title">Welcome Back</h2>
      <p className="subtitle">Sign in to your auction dashboard</p>
      {error && <div className="error-alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>User ID</label>
          <input
            type="text"
            name="userID"
            value={formData.userID}
            onChange={handleChange}
            required
            placeholder="Enter User ID (e.g., bidder123)"
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="userPassword"
            value={formData.userPassword}
            onChange={handleChange}
            required
            placeholder="••••••••"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className="divider"><span>OR</span></div>

      <button onClick={handleGoogleLogin} className="btn btn-google">
        Sign in with Google (Demo)
      </button>

      <p className="footer-text">
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
};

export default Login;