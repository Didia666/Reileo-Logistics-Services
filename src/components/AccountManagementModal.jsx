import React, { useEffect, useState } from 'react';
import { KeyRound, Loader2, UserRound, X } from 'lucide-react';
import { account } from '../services/api.js';

export default function AccountManagementModal({ isOpen, onClose, onUpdated }) {
  const [accountData, setAccountData] = useState(null);
  const [mode, setMode] = useState('view');
  const [form, setForm] = useState({ username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;

    let cancelled = false;
    setMode('view');
    setError('');
    setMessage('');
    setLoading(true);

    account.get()
      .then((response) => {
        if (cancelled) return;
        const details = response.user;
        setAccountData(details);
        setForm({ username: details.username || '', email: details.email || '' });
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.message || 'Unable to load account details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const close = () => {
    if (!saving) onClose();
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const response = await account.update({
        username: form.username.trim(),
        email: form.email.trim(),
      });
      setAccountData(response.user);
      setForm({ username: response.user.username, email: response.user.email });
      setMode('view');
      setMessage('Profile updated.');
      await onUpdated?.();
    } catch (requestError) {
      setError(requestError.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError('The new passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      await account.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setMode('view');
      setMessage('Password changed.');
    } catch (requestError) {
      setError(requestError.message || 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  };

  const displayName = accountData?.display_name || accountData?.username || 'Account';

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-card account-modal" role="dialog" aria-modal="true" aria-labelledby="account-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3 id="account-modal-title">Account Management</h3>
          <button type="button" className="modal-close" onClick={close} disabled={saving} aria-label="Close account management">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert alert-error">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}

          {loading ? (
            <div className="loading" style={{ height: 160 }}><Loader2 className="animate-spin" size={20} /></div>
          ) : accountData && mode === 'view' ? (
            <>
              <div className="account-profile-heading">
                <div className="account-avatar"><UserRound size={42} /></div>
                <h4>{displayName.toUpperCase()}</h4>
              </div>
              <div className="account-details">
                <div className="account-detail-row"><span>Username</span><strong>{accountData.username}</strong></div>
                <div className="account-detail-row"><span>Email address</span><strong>{accountData.email}</strong></div>
                <div className="account-detail-row"><span>User type</span><strong>{accountData.user_type}</strong></div>
                <div className="account-detail-row"><span>Depot</span><strong>{accountData.depot_name || 'N/A'}</strong></div>
                <div className="account-detail-row"><span>Status</span><strong>{accountData.status}</strong></div>
              </div>
              <div className="account-actions">
                <button type="button" className="btn btn-primary" onClick={() => { setError(''); setMessage(''); setMode('profile'); }}>
                  Update Profile
                </button>
                <button type="button" className="btn btn-success" onClick={() => { setError(''); setMessage(''); setMode('password'); }}>
                  <KeyRound size={15} /> Change Password
                </button>
              </div>
            </>
          ) : mode === 'profile' ? (
            <form className="account-form" onSubmit={handleProfileSave}>
              <div className="form-group">
                <label htmlFor="account-username">Username</label>
                <input id="account-username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} autoComplete="username" required />
              </div>
              <div className="form-group">
                <label htmlFor="account-email">Email address</label>
                <input id="account-email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} autoComplete="email" required />
              </div>
              <div className="modal-footer" style={{ margin: '20px -20px -20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMode('view')} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <form className="account-form" onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="current-password">Current password</label>
                <input id="current-password" type="password" value={passwordForm.current_password} onChange={(event) => setPasswordForm({ ...passwordForm, current_password: event.target.value })} autoComplete="current-password" required />
              </div>
              <div className="form-group">
                <label htmlFor="new-password">New password</label>
                <input id="new-password" type="password" value={passwordForm.new_password} onChange={(event) => setPasswordForm({ ...passwordForm, new_password: event.target.value })} autoComplete="new-password" minLength={8} required />
              </div>
              <div className="form-group">
                <label htmlFor="confirm-password">Confirm new password</label>
                <input id="confirm-password" type="password" value={passwordForm.confirm_password} onChange={(event) => setPasswordForm({ ...passwordForm, confirm_password: event.target.value })} autoComplete="new-password" minLength={8} required />
              </div>
              <div className="modal-footer" style={{ margin: '20px -20px -20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setMode('view')} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? 'Saving…' : 'Change Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}