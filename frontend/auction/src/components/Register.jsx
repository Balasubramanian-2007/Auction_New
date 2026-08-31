import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    userid: '',
    username: '',
    email_id: '',
    password: '',
    phone_number: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await API.post('/register', formData);
      if (response.data.Status === 200) {
        navigate('/verify-otp', { state: { userid: formData.userid } });
        return;
      }

      setError(response.data.message || response.data.Invalid || response.data.errMsg || 'Registration failed');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.Invalid || 'Error processing registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h2 className="title">Create Account</h2>
      <p className="subtitle">Register to participate in live auctions</p>
      {error && <div className="error-alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>User ID</label>
            <input type="text" name="userid" value={formData.userid} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email_id" value={formData.email_id} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="tel" name="phone_number" value={formData.phone_number} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} required />
          </div>
        </div>
        <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Submitting...' : 'Register'}
        </button>
      </form>
      <p className="footer-text">
        Already registered? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};

export default Register;