import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2, Truck } from 'lucide-react';
import { passwordReset } from '../services/api.js';

export default function PasswordRecovery({ mode }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const isReset = mode === 'reset';
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (isReset && !token) {
      setError('This reset link is invalid or incomplete. Request a new one.');
      return;
    }
    if (isReset && newPassword !== confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      if (isReset) {
        await passwordReset.reset(token, newPassword);
        setMessage('Your password has been reset. You can now sign in.');
      } else {
        const response = await passwordReset.request(email.trim());
        setMessage(response.message || 'If an account matches that email, a reset link will be sent.');
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete the password reset request.');
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
            <div style={{ fontSize: 12, color: '#64748b' }}>Transport &amp; Logistics Management</div>
          </div>
        </div>
        <p className="subtitle">{isReset ? 'Choose a new password' : 'Reset your account password'}</p>
        {error && <div className="alert alert-error">{error}</div>}
        {message && <div className="alert alert-success">{message}</div>}

        {!message && (
          <form onSubmit={handleSubmit}>
            {isReset ? (
              <>
                <div className="form-group">
                  <label htmlFor="new-password">New password</label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={submitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm new password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    disabled={submitting}
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="reset-email">Email address</label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={submitting}
                />
              </div>
            )}
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting || (isReset && !token)}>
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              {submitting ? 'Please wait…' : (isReset ? 'Reset Password' : 'Send Reset Link')}
            </button>
          </form>
        )}

        <p className="login-links">
          {message && isReset ? (
            <button type="button" className="link-button" onClick={() => navigate('/login')}>Return to sign in</button>
          ) : (
            <Link to="/login">Back to sign in</Link>
          )}
        </p>
      </div>
    </div>
  );
}