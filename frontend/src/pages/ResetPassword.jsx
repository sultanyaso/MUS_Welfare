import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';
import { authCss } from './authStyles';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    if (pwd.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (pwd !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await authAPI.resetPassword(token, { password: pwd });
      setDone(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'This reset link is invalid or has expired.');
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
        <h1 className="au-h">Choose a new password.</h1>

        {done ? (
          <>
            <div className="au-notice au-ok">Your password has been changed. Redirecting you to sign in…</div>
            <Link to="/login" className="au-btn">Sign in now</Link>
          </>
        ) : (
          <>
            <p className="au-sub">Pick something you have not used before. At least 6 characters.</p>
            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div className="au-notice au-err" role="alert">
                  {error} {/expired|invalid/i.test(error) && <Link to="/forgot-password" style={{ color: '#fff' }}>Request a new link</Link>}
                </div>
              )}
              <div className="au-fw">
                <label htmlFor="rp-pwd">New password</label>
                <div className="au-in">
                  <input id="rp-pwd" type={show ? 'text' : 'password'} value={pwd} autoComplete="new-password" autoFocus
                    placeholder="New password" style={{ paddingRight: 56 }}
                    onChange={e => { setPwd(e.target.value); setError(''); }} />
                  <button type="button" className="au-tg" onClick={() => setShow(v => !v)}>{show ? 'Hide' : 'Show'}</button>
                </div>
              </div>
              <div className="au-fw">
                <label htmlFor="rp-confirm">Confirm password</label>
                <div className="au-in">
                  <input id="rp-confirm" type={show ? 'text' : 'password'} value={confirm} autoComplete="new-password"
                    placeholder="Re-enter your password"
                    onChange={e => { setConfirm(e.target.value); setError(''); }} />
                </div>
              </div>
              <button type="submit" className="au-btn" disabled={loading}>
                {loading ? <><span className="au-spin" /> Saving…</> : 'Reset password'}
              </button>
            </form>
            <p className="au-alt"><Link to="/login">Back to sign in</Link></p>
          </>
        )}
      </div>
    </div>
  );
}