import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

/* ─── Lamp with pull cord ─── */
function Lamp({ lit, onToggle }) {
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef(0);
  const MAX_PULL = 46;
  const CORD_LEN = 100;

  const nudge = () => {
    setPull(20);
    setTimeout(() => setPull(0), 170);
  };

  const onDown = e => {
    startY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = e => {
    if (!dragging) return;
    setPull(Math.min(MAX_PULL, Math.max(0, e.clientY - startY.current)));
  };
  const onUp = e => {
    if (!dragging) return;
    setDragging(false);
    const moved = Math.abs(e.clientY - startY.current);
    if (pull >= 16) { onToggle(); setPull(0); }          // pulled far enough
    else if (moved < 5) { onToggle(); nudge(); }          // simple click
    else setPull(0);                                      // half-hearted drag
  };
  const onCancel = () => { setDragging(false); setPull(0); };
  const onKey = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
      nudge();
    }
  };

  const ease = dragging ? 'none' : 'transform .55s cubic-bezier(.34,1.56,.64,1)';

  return (
    <svg width="260" height="420" viewBox="0 0 260 420" className="lamp-svg">
      <defs>
        <linearGradient id="shadeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a4b53" />
          <stop offset="0.45" stopColor="#202126" />
          <stop offset="1" stopColor="#0a0a0c" />
        </linearGradient>
      </defs>

      {/* ceiling cable + cap */}
      <rect x="129" y="0" width="2" height="108" fill="#3a3b42" />
      <rect x="120" y="104" width="20" height="16" rx="3" fill="url(#shadeGrad)" />

      {/* shade */}
      <path d="M104 120 L156 120 L206 204 Q130 222 54 204 Z" fill="url(#shadeGrad)" />
      <path d="M104 120 L54 204" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
      <ellipse className={`lamp-rim ${lit ? 'on' : ''}`} cx="130" cy="205" rx="76" ry="10" />
      <ellipse className={`lamp-bulb ${lit ? 'on' : ''}`} cx="130" cy="210" rx="20" ry="8" />

      {/* pull cord */}
      <g
        role="switch"
        aria-checked={lit}
        aria-label="Pull the lamp cord to show or hide the sign-in form"
        tabIndex={0}
        className="cord"
        style={{ touchAction: 'none' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onKeyDown={onKey}
      >
        <rect x="174" y="200" width="44" height="190" fill="transparent" />
        <rect
          x="195.25" y="203" width="1.5" height={CORD_LEN}
          fill="#8a8b94"
          style={{
            transformBox: 'fill-box',
            transformOrigin: '50% 0%',
            transform: `scaleY(${(CORD_LEN + pull) / CORD_LEN})`,
            transition: ease,
          }}
        />
        <g style={{ transform: `translateY(${pull}px)`, transition: ease }}>
          <rect x="193.5" y="298" width="5" height="8" rx="1.5" fill="#8a8b94" />
          <circle className={`cord-bead ${lit ? 'on' : ''}`} cx="196" cy="314" r="7" />
        </g>
      </g>
    </svg>
  );
}

/* ─── Field ─── */
function Field({ id, label, type, value, onChange, placeholder, autoComplete, right, inputRef }) {
  return (
    <div className="field-wrap">
      <label htmlFor={id} className="field-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id} ref={inputRef} type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoComplete={autoComplete}
          className="field" style={right ? { paddingRight: 56 } : undefined}
        />
        {right}
      </div>
    </div>
  );
}

/* ═══════════════ LOGIN PAGE ═══════════════ */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cameVerified = searchParams.get('verified') === '1';
  const [verifiedBanner, setVerifiedBanner] = useState(cameVerified);
  const [lit, setLit] = useState(cameVerified); // lamp starts on after email verification
  const emailRef = useRef(null);

  useEffect(() => {
    if (!verifiedBanner) return;
    const t = setTimeout(() => setVerifiedBanner(false), 8000);
    return () => clearTimeout(t);
  }, [verifiedBanner]);

  // Focus the email field once the form has slid in (desktop only, so phones don't pop the keyboard)
  useEffect(() => {
    if (!lit) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const t = setTimeout(() => emailRef.current?.focus({ preventScroll: true }), 900);
    return () => clearTimeout(t);
  }, [lit]);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Both fields are required.'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authAPI.login({ email, password });
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      const status = err.response?.data?.status;
      if (status === 'unverified')
        setError('Your email is not verified. Please check your inbox and click the verification link. Only real Gmail accounts can log in.');
      else if (status === 'pending')
        setError('Your account is pending admin approval.');
      else if (status === 'rejected')
        setError('Your application was rejected. Contact the committee.');
      else
        setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className={`lg ${lit ? 'on' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600&display=swap');

        .lg {
          --bg-off: #202126;          /* lamp off: lighter room */
          --bg-on: #050506;           /* lamp on: darker room */
          --accent: #39ffb0;
          --accent-rgb: 57, 255, 176;
          --line: rgba(255,255,255,0.1);
          --text: #c4c5cb; --dim: #7b7c85; --hi: #f3f3f5; --danger: #ff7a7a;
          position: relative; overflow: hidden; min-height: 100vh;
          display: grid; grid-template-columns: 1fr 1fr;
          background: var(--bg-off); color: var(--text);
          font-family: Sora, sans-serif; -webkit-font-smoothing: antialiased;
          transition: background 1.4s ease;
        }
        .lg.on { background: var(--bg-on); }
        .lg * { box-sizing: border-box; }
        .lg button { font-family: inherit; }

        /* brand */
        .brand { position: absolute; top: 28px; left: 6vw; z-index: 5; display: flex; align-items: center; gap: 12px; text-decoration: none; }
        .brand img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.14); }
        .brand-name { font-size: .95rem; color: var(--hi); line-height: 1.1; }
        .brand-sub { font-size: .55rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-top: 3px; }

        /* stage (lamp) */
        .stage { position: relative; z-index: 1; min-height: 100vh; }
        .lamp-wrap { position: absolute; top: 0; left: 50%; width: 260px; height: 420px; transform: translateX(-50%); transform-origin: top center; }
        .lamp-svg { position: relative; z-index: 1; display: block; overflow: visible; }

        .glow, .cone-wrap { position: absolute; pointer-events: none; opacity: 0; transition: opacity 1.4s ease; }
        .lg.on .glow, .lg.on .cone-wrap { opacity: 1; animation: flicker .9s ease-out; }
        .glow {
          top: 210px; left: 50%; width: 1000px; height: 1000px; transform: translate(-50%, -35%);
          background: radial-gradient(circle at center, rgba(var(--accent-rgb), .16), rgba(var(--accent-rgb), .05) 40%, transparent 65%);
        }
        .cone-wrap { top: 210px; left: 50%; width: 620px; height: 900px; transform: translateX(-50%); filter: blur(12px); }
        .cone {
          width: 100%; height: 100%;
          background: linear-gradient(to bottom, rgba(var(--accent-rgb), .3), rgba(var(--accent-rgb), 0) 80%);
          clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%);
        }
        @keyframes flicker { 0% { opacity: 0; } 10% { opacity: .85; } 16% { opacity: .25; } 26% { opacity: 1; } 34% { opacity: .65; } 100% { opacity: 1; } }

        .lamp-rim { fill: #050506; transition: fill 1s ease; }
        .lamp-rim.on { fill: rgba(var(--accent-rgb), .55); }
        .lamp-bulb { fill: #2a2b30; transition: fill 1s ease, filter 1s ease; }
        .lamp-bulb.on { fill: var(--accent); filter: drop-shadow(0 0 14px var(--accent)); }
        .cord { cursor: grab; outline: none; }
        .cord:active { cursor: grabbing; }
        .cord-bead { fill: #c4c5cb; transition: fill .8s ease, filter .8s ease; }
        .cord-bead.on { fill: var(--accent); filter: drop-shadow(0 0 6px rgba(var(--accent-rgb), .7)); }
        .cord:focus-visible .cord-bead { stroke: var(--hi); stroke-width: 2; }

        .hint { position: absolute; bottom: 44px; left: 0; right: 0; text-align: center; font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); }

        /* form panel */
        .right { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; padding: 110px 6vw 64px; }
        .lg .panel {
          position: relative; width: 100%; max-width: 400px;
          opacity: 0; transform: translateX(48px); visibility: hidden;
          transition: opacity 1s ease, transform 1.1s cubic-bezier(.22,1,.36,1), visibility 0s linear 1.1s;
        }
        .lg.on .panel {
          opacity: 1; transform: none; visibility: visible;
          transition: opacity 1.2s ease .35s, transform 1.2s cubic-bezier(.22,1,.36,1) .35s, visibility 0s linear 0s;
        }
        .panel::before {
          content: ''; position: absolute; left: -40px; top: 0; bottom: 0; width: 1px;
          background: linear-gradient(to bottom, transparent, rgba(var(--accent-rgb), .5), transparent);
        }

        .eyebrow { display: inline-flex; align-items: center; gap: 12px; font-size: .68rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-bottom: 28px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
        .h2 { font-size: clamp(1.9rem, 3vw, 2.6rem); font-weight: 200; line-height: 1.15; letter-spacing: -0.02em; color: var(--hi); margin: 0 0 20px; }
        .sub { font-size: .85rem; color: var(--dim); font-weight: 300; margin: 0 0 48px; }
        .sub a { color: var(--hi); text-decoration: none; border-bottom: 1px solid rgba(var(--accent-rgb), .5); padding-bottom: 2px; transition: color .4s; }
        .sub a:hover { color: var(--accent); }

        .notice { padding: 14px 0 14px 16px; margin-bottom: 32px; border-left: 1px solid; font-size: .82rem; line-height: 1.7; font-weight: 300; }
        .notice-ok { border-color: var(--accent); color: var(--hi); }
        .notice-err { border-color: var(--danger); color: #ffb3b3; }

        .field-wrap { margin-bottom: 36px; }
        .field-label { display: block; font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 10px; transition: color .5s; }
        .field-wrap:focus-within .field-label { color: var(--accent); }
        .field { width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,.16); color: var(--hi); font-family: inherit; font-size: .95rem; font-weight: 300; padding: 10px 0 14px; outline: none; transition: border-color .6s; }
        .field:focus { border-bottom-color: var(--accent); }
        .field::placeholder { color: #4d4e55; }
        .field:-webkit-autofill { -webkit-text-fill-color: var(--hi); transition: background-color 99999s ease; }
        .toggle { position: absolute; right: 0; bottom: 12px; background: none; border: none; cursor: pointer; color: var(--dim); font-size: .62rem; letter-spacing: 2px; text-transform: uppercase; padding: 4px 0; transition: color .4s; }
        .toggle:hover { color: var(--hi); }

        .btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 15px 34px; background: var(--accent); color: #04110b; font-weight: 600; font-size: .85rem; letter-spacing: .5px; text-decoration: none; border: 1px solid var(--accent); border-radius: 999px; cursor: pointer; transition: box-shadow .6s ease, transform .6s ease, background .6s ease; }
        .btn:hover:not(:disabled) { box-shadow: 0 0 40px rgba(var(--accent-rgb), .35); transform: translateY(-1px); }
        .btn:disabled { opacity: .6; cursor: wait; }
        .btn-ghost { background: transparent; color: var(--hi); border-color: rgba(255,255,255,.2); font-weight: 400; }
        .btn-ghost:hover { background: rgba(255,255,255,.05); box-shadow: none !important; }
        .spin { width: 14px; height: 14px; border: 2px solid rgba(4,17,11,.3); border-top-color: #04110b; border-radius: 50%; animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .or { display: flex; align-items: center; gap: 16px; margin: 32px 0; color: var(--dim); font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; }
        .or::before, .or::after { content: ''; flex: 1; height: 1px; background: var(--line); }
        .foot { margin-top: 56px; text-align: center; font-size: .68rem; color: var(--dim); line-height: 1.8; }

        /* mobile: lamp on top, form below */
        @media (max-width: 860px) {
          .lg { grid-template-columns: 1fr; }
          .stage { min-height: 330px; }
          .lamp-wrap { transform: translateX(-50%) scale(.72); }
          .hint { bottom: 12px; }
          .right { align-items: flex-start; padding: 16px 7vw 64px; }
          .lg .panel { transform: translateY(32px); }
          .panel::before { display: none; }
        }

        @media (prefers-reduced-motion: reduce) {
          .lg, .lg * { transition-duration: .01s !important; transition-delay: 0s !important; animation: none !important; }
        }
      `}</style>

      <Link to="/" className="brand">
        <img src="/mus.jpg" alt="MUS Welfare logo" />
        <div>
          <div className="brand-name">MUS Welfare</div>
          <div className="brand-sub">Organization</div>
        </div>
      </Link>

      {/* ── Lamp stage ── */}
      <div className="stage">
        <div className="lamp-wrap">
          <div className="glow" />
          <div className="cone-wrap"><div className="cone" /></div>
          <Lamp lit={lit} onToggle={() => setLit(v => !v)} />
        </div>
        <div className="hint">{lit ? 'Pull again to switch off' : 'Pull the cord to sign in'}</div>
      </div>

      {/* ── Form panel ── */}
      <div className="right">
        <div className="panel">
          <div className="eyebrow"><span className="dot" /> Member portal</div>
          <h2 className="h2">Sign in to your account.</h2>
          <p className="sub">
            No account? <Link to="/signup">Create one</Link>
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {verifiedBanner && (
              <div className="notice notice-ok">
                <strong style={{ fontWeight: 600 }}>Email verified.</strong> Your account is confirmed. You can now sign in.
              </div>
            )}
            {error && <div className="notice notice-err" role="alert">{error}</div>}

            <Field
              id="email" label="Email address" type="email" inputRef={emailRef}
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="you@gmail.com" autoComplete="email"
            />

            <Field
              id="password" label="Password" type={showPwd ? 'text' : 'password'}
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Your password" autoComplete="current-password"
              right={
                <button type="button" className="toggle" onClick={() => setShowPwd(v => !v)}>
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              }
            />

            <button type="submit" disabled={loading} className="btn">
              {loading ? <><span className="spin" /> Signing in…</> : 'Sign in'}
            </button>

            <div className="or">New member?</div>

            <Link to="/signup" className="btn btn-ghost">Create an account</Link>
          </form>

          <p className="foot">
            MUS Welfare Organization · Executive Committee 2026–2027<br />
            Developed by Yasir Sultan
          </p>
        </div>
      </div>
    </div>
  );
}