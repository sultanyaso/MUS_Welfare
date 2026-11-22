import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import { authCss } from './authStyles';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="au">
      <style>{authCss}</style>
      <div className="au-card">
        <Link to="/" className="au-brand">
          <img src="/mus.jpg" alt="MUS Welfare logo" />
          <div><b>MUS Welfare</b><small>Organization</small></div>
        </Link>

        <div className="au-eyebrow"><span className="au-dot" /> Account recovery</div>
        <h1 className="au-h">Forgot your password?</h1>

        {sent ? (
          <>
            <div className="au-notice au-ok">
              If an account exists for <b>{email}</b>, a reset link is on its way. It stays valid for 1 hour. Check your spam folder too.
            </div>
            <Link to="/login" className="au-btn">Back to sign in</Link>
          </>
        ) : (
          <>
            <p className="au-sub">Enter the email you signed up with and we will send you a link to choose a new password.</p>
            <form onSubmit={handleSubmit} noValidate>
              {error && <div className="au-notice au-err" role="alert">{error}</div>}
              <div className="au-fw">
                <label htmlFor="fp-email">Email address</label>
                <div className="au-in">
                  <input id="fp-email" type="email" value={email} autoComplete="email" autoFocus
                    placeholder="you@gmail.com"
                    onChange={e => { setEmail(e.target.value); setError(''); }} />
                </div>
              </div>
              <button type="submit" className="au-btn" disabled={loading}>
                {loading ? <><span className="au-spin" /> Sending…</> : 'Send reset link'}
              </button>
            </form>
            <p className="au-alt">Remembered it? <Link to="/login">Sign in</Link></p>
          </>
        )}
      </div>
    </div>
  );
}