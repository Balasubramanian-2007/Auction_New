import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../services/api';

const OtpVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userid, setUserid] = useState(location.state?.userid || 'DEMO_USER');
  const [otp, setOtp] = useState('123456');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await API.post('/verify-signup', {
        userid,
        otp_received_from_user: otp
      });
      if (response.data.Status === 200) {
        setMessage('Account verified successfully! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setError(response.data.message || 'OTP Verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="title">Verify OTP</h2>
      <p className="subtitle">Enter any 6-digit code (e.g. 123456) to verify</p>
      {message && <div className="success-alert">{message}</div>}
      {error && <div className="error-alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>User ID</label>
          <input
            type="text"
            value={userid}
            onChange={(e) => setUserid(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>OTP Code</label>
          <input
            type="text"
            maxLength="6"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="123456"
            required
            className="otp-input"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Verifying...' : 'Verify Account'}
        </button>
      </form>
    </div>
  );
};

export default OtpVerification;