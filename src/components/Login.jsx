import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Truck, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Please enter both username and password'); return; }
    setSubmitting(true);
    try {
      await login(username, password);
      navigate('/bookings', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand">
          <div className="logo-box"><Truck size={22} /></div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18 }}>Reileo Logistics Services</h1>
            <div style={{ fontSize: 12, color: '#64748b' }}>Transport & Logistics Management</div>
          </div>
        </div>
        <p className="subtitle">Sign in to your account to continue</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username or Email</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              disabled={submitting}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={submitting}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
        <div className="hint">
          <strong>Default credentials</strong> (run <code>api/db_setup.sql</code> once):<br />
          <code>admin / password</code>, <code>employee / password</code>, <code>customer / password</code>
        </div>
      </div>
    </div>
  );
}
