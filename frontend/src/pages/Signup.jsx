import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    if (pull >= 16) { onToggle(); setPull(0); }
    else if (moved < 5) { onToggle(); nudge(); }
    else setPull(0);
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

      <rect x="129" y="0" width="2" height="108" fill="#3a3b42" />
      <rect x="120" y="104" width="20" height="16" rx="3" fill="url(#shadeGrad)" />

      <path d="M104 120 L156 120 L206 204 Q130 222 54 204 Z" fill="url(#shadeGrad)" />
      <path d="M104 120 L54 204" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
      <ellipse className={`lamp-rim ${lit ? 'on' : ''}`} cx="130" cy="205" rx="76" ry="10" />
      <ellipse className={`lamp-bulb ${lit ? 'on' : ''}`} cx="130" cy="210" rx="20" ry="8" />

      <g
        role="switch"
        aria-checked={lit}
        aria-label="Pull the lamp cord to show or hide the sign-up form"
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

/* ── Step progress bar ── */
function StepBar({ current, total }) {
  return (
    <div className="stepbar">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="stepbar-seg">
          <div className="stepbar-fill" style={{ transform: i < current ? 'scaleX(1)' : 'scaleX(0)' }} />
        </div>
      ))}
    </div>
  );
}

/* ── Membership type card ── */
function TypeCard({ value, selected, onChange, icon, title, subtitle, min }) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      aria-pressed={selected}
      className={`type ${selected ? 'sel' : ''}`}
    >
      {selected && (
        <span className="type-check">
          <svg width="10" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="#04110b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <div className="type-icon">{icon}</div>
      <div className="type-title">{title}</div>
      <div className="type-sub">{subtitle}</div>
      <span className="type-pill">Min PKR {min}/mo</span>
    </button>
  );
}

/* ── Input field ── */
function Field({ id, label, type = 'text', value, onChange, placeholder, rightEl, error, hint, delay = 0, autoFocus }) {
  return (
    <div className={`field-wrap rise ${error ? 'has-error' : ''}`} style={{ animationDelay: `${delay}s` }}>
      <label htmlFor={id} className="field-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoFocus={autoFocus}
          className="field" style={rightEl ? { paddingRight: 56 } : undefined}
        />
        {rightEl}
      </div>
      {error && <p className="field-msg err">{error}</p>}
      {hint && <p className="field-msg">{hint}</p>}
    </div>
  );
}

function ShowToggle({ visible, onClick }) {
  return (
    <button type="button" className="toggle" onClick={onClick}>
      {visible ? 'Hide' : 'Show'}
    </button>
  );
}

/* ── Password strength ── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const score = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : 1;
  const colors = { 1: '#ff7a7a', 2: '#ffc857', 3: '#7be0b0', 4: '#39ffb0' };
  const labels = { 1: 'Too short', 2: 'Acceptable', 3: 'Good password', 4: 'Strong  💪' };
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            flex: 1, height: 2,
            background: i <= score ? colors[score] : 'rgba(255,255,255,0.1)',
            transition: 'background .5s ease',
          }} />
        ))}
      </div>
      <span style={{ fontSize: '.72rem', color: colors[score], fontWeight: 400 }}>{labels[score]}</span>
    </div>
  );
}

/* ─── Styles (shared by form + success screen) ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600&display=swap');

.su {
  --bg-off: #202126; --bg-on: #050506;
  --accent: #39ffb0; --accent-rgb: 57, 255, 176;
  --line: rgba(255,255,255,0.1);
  --text: #c4c5cb; --dim: #7b7c85; --hi: #f3f3f5; --danger: #ff7a7a;
  position: relative; overflow: hidden; min-height: 100vh;
  display: grid; grid-template-columns: 1fr 1fr;
  background: var(--bg-off); color: var(--text);
  font-family: Sora, sans-serif; -webkit-font-smoothing: antialiased;
  transition: background 1.4s ease;
}
.su.on { background: var(--bg-on); }
.su * { box-sizing: border-box; }
.su button { font-family: inherit; }

.rise { animation: rise .9s cubic-bezier(.22,1,.36,1) both; }
@keyframes rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes flicker { 0% { opacity: 0; } 10% { opacity: .85; } 16% { opacity: .25; } 26% { opacity: 1; } 34% { opacity: .65; } 100% { opacity: 1; } }
@keyframes spin { to { transform: rotate(360deg); } }

/* brand */
.brand { position: absolute; top: 28px; left: 6vw; z-index: 5; display: flex; align-items: center; gap: 12px; text-decoration: none; }
.brand img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.14); }
.brand-name { font-size: .95rem; color: var(--hi); line-height: 1.1; }
.brand-sub { font-size: .55rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-top: 3px; }

/* stage */
.stage { position: relative; z-index: 1; display: flex; flex-direction: column; padding: 0 6vw 64px; }
.lamp-space { position: relative; flex: none; height: 390px; }
.lamp-wrap { position: absolute; top: 0; left: 50%; width: 260px; height: 420px; transform: translateX(-50%) scale(.85); transform-origin: top center; }
.lamp-svg { position: relative; z-index: 1; display: block; overflow: visible; }

.glow, .cone-wrap { position: absolute; pointer-events: none; opacity: 0; transition: opacity 1.4s ease; }
.su.on .glow, .su.on .cone-wrap { opacity: 1; animation: flicker .9s ease-out; }
.glow { top: 210px; left: 50%; width: 1000px; height: 1000px; transform: translate(-50%, -35%); background: radial-gradient(circle at center, rgba(var(--accent-rgb), .16), rgba(var(--accent-rgb), .05) 40%, transparent 65%); }
.cone-wrap { top: 210px; left: 50%; width: 620px; height: 900px; transform: translateX(-50%); filter: blur(12px); }
.cone { width: 100%; height: 100%; background: linear-gradient(to bottom, rgba(var(--accent-rgb), .3), rgba(var(--accent-rgb), 0) 80%); clip-path: polygon(40% 0, 60% 0, 100% 100%, 0 100%); }

.lamp-rim { fill: #050506; transition: fill 1s ease; }
.lamp-rim.on { fill: rgba(var(--accent-rgb), .55); }
.lamp-bulb { fill: #2a2b30; transition: fill 1s ease, filter 1s ease; }
.lamp-bulb.on { fill: var(--accent); filter: drop-shadow(0 0 14px var(--accent)); }
.cord { cursor: grab; outline: none; }
.cord:active { cursor: grabbing; }
.cord-bead { fill: #c4c5cb; transition: fill .8s ease, filter .8s ease; }
.cord-bead.on { fill: var(--accent); filter: drop-shadow(0 0 6px rgba(var(--accent-rgb), .7)); }
.cord:focus-visible .cord-bead { stroke: var(--hi); stroke-width: 2; }
.hint { position: absolute; bottom: 0; left: 0; right: 0; text-align: center; font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); }

/* left copy */
.left-copy { position: relative; z-index: 2; max-width: 380px; opacity: .3; transition: opacity 1.4s ease; }
.su.on .left-copy { opacity: 1; }
.badge { display: inline-flex; align-items: center; gap: 12px; font-size: .68rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-bottom: 24px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
.h1 { font-size: clamp(1.9rem, 2.8vw, 2.5rem); font-weight: 200; line-height: 1.12; letter-spacing: -0.02em; color: var(--hi); margin: 0 0 20px; }
.accent { color: var(--accent); }
.lead { font-size: .88rem; line-height: 1.9; font-weight: 300; color: var(--text); margin: 0 0 28px; max-width: 320px; }
.points { border-top: 1px solid var(--line); margin-bottom: 36px; }
.point { padding: 13px 0; border-bottom: 1px solid var(--line); font-size: .8rem; font-weight: 300; color: var(--text); }
.side-step { border-top: 1px solid var(--line); padding-top: 24px; }
.side-dots { display: flex; gap: 8px; margin-bottom: 14px; }
.side-dot { height: 2px; background: rgba(255,255,255,.18); transition: all .6s ease; }
.side-step-n { font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 8px; }
.side-step-l { font-size: 1rem; font-weight: 300; color: var(--hi); }

/* form panel */
.right { position: relative; z-index: 2; display: flex; align-items: center; justify-content: center; padding: 110px 6vw 64px; }
.su .panel {
  position: relative; width: 100%; max-width: 440px;
  opacity: 0; transform: translateX(48px); visibility: hidden;
  transition: opacity 1s ease, transform 1.1s cubic-bezier(.22,1,.36,1), visibility 0s linear 1.1s;
}
.su.on .panel {
  opacity: 1; transform: none; visibility: visible;
  transition: opacity 1.2s ease .35s, transform 1.2s cubic-bezier(.22,1,.36,1) .35s, visibility 0s linear 0s;
}
.panel::before { content: ''; position: absolute; left: -40px; top: 0; bottom: 0; width: 1px; background: linear-gradient(to bottom, transparent, rgba(var(--accent-rgb), .5), transparent); }

.stepbar { display: flex; gap: 6px; margin-bottom: 40px; }
.stepbar-seg { flex: 1; height: 2px; background: rgba(255,255,255,.1); position: relative; overflow: hidden; }
.stepbar-fill { position: absolute; inset: 0; background: var(--accent); transform-origin: left; transition: transform .8s cubic-bezier(.22,1,.36,1); }

.eyebrow { display: inline-flex; align-items: center; gap: 12px; font-size: .68rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-bottom: 20px; }
.h2 { font-size: clamp(1.7rem, 2.6vw, 2.2rem); font-weight: 200; line-height: 1.15; letter-spacing: -0.02em; color: var(--hi); margin: 0 0 14px; }
.sub { font-size: .85rem; color: var(--dim); font-weight: 300; margin: 0 0 40px; }

.notice { padding: 14px 0 14px 16px; margin-bottom: 28px; border-left: 1px solid; font-size: .82rem; line-height: 1.7; font-weight: 300; }
.notice-ok { border-color: var(--accent); color: var(--text); }
.notice-ok strong { color: var(--hi); font-weight: 600; }
.notice-err { border-color: var(--danger); color: #ffb3b3; }

/* type cards */
.types { display: flex; gap: 14px; margin-bottom: 14px; }
.type { position: relative; flex: 1; text-align: left; padding: 24px 20px; background: transparent; border: 1px solid rgba(255,255,255,.14); border-radius: 4px; color: var(--text); cursor: pointer; transition: border-color .6s ease, background .6s ease, box-shadow .6s ease; }
.type:hover { border-color: rgba(255,255,255,.3); }
.type.sel { border-color: var(--accent); background: rgba(var(--accent-rgb), .05); box-shadow: 0 0 40px rgba(var(--accent-rgb), .08); }
.type-check { position: absolute; top: 12px; right: 12px; width: 18px; height: 18px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; }
.type-icon { font-size: 1.6rem; line-height: 1; margin-bottom: 18px; }
.type-title { font-size: 1rem; font-weight: 400; color: var(--hi); margin-bottom: 6px; }
.type-sub { font-size: .76rem; font-weight: 300; color: var(--dim); line-height: 1.6; margin-bottom: 18px; }
.type-pill { display: inline-block; font-size: .6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); }

/* fields */
.field-wrap { margin-bottom: 32px; }
.field-label { display: block; font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 10px; transition: color .5s; }
.field-wrap:focus-within .field-label { color: var(--accent); }
.field-wrap.has-error .field-label { color: var(--danger); }
.field { width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,.16); color: var(--hi); font-family: inherit; font-size: .95rem; font-weight: 300; padding: 10px 0 14px; outline: none; transition: border-color .6s; }
.field:focus { border-bottom-color: var(--accent); }
.has-error .field { border-bottom-color: var(--danger); }
.field::placeholder { color: #4d4e55; }
.field:-webkit-autofill { -webkit-text-fill-color: var(--hi); transition: background-color 99999s ease; }
.field-msg { margin: 8px 0 0; font-size: .73rem; color: var(--dim); font-weight: 300; }
.field-msg.err { color: var(--danger); }
.toggle { position: absolute; right: 0; bottom: 12px; background: none; border: none; cursor: pointer; color: var(--dim); font-size: .62rem; letter-spacing: 2px; text-transform: uppercase; padding: 4px 0; transition: color .4s; }
.toggle:hover { color: var(--hi); }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

/* summary */
.summary { border-top: 1px solid var(--line); margin-top: 8px; }
.summary-title { font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--accent); padding: 20px 0 8px; }
.summary-row { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding: 14px 0; border-bottom: 1px solid var(--line); font-size: .82rem; }
.summary-row span { color: var(--dim); font-weight: 300; }
.summary-row strong { color: var(--hi); font-weight: 400; text-align: right; max-width: 60%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 15px 34px; background: var(--accent); color: #04110b; font-weight: 600; font-size: .85rem; letter-spacing: .5px; text-decoration: none; border: 1px solid var(--accent); border-radius: 999px; cursor: pointer; transition: box-shadow .6s ease, transform .6s ease, background .6s ease; }
.btn:hover:not(:disabled) { box-shadow: 0 0 40px rgba(var(--accent-rgb), .35); transform: translateY(-1px); }
.btn:disabled { opacity: .6; cursor: wait; }
.btn-ghost { background: transparent; color: var(--hi); border-color: rgba(255,255,255,.2); font-weight: 400; }
.btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,.05); box-shadow: none; }
.btn-grow { flex: 1; }
.nav-row { display: flex; gap: 12px; margin-top: 40px; }
.spin { width: 14px; height: 14px; border: 2px solid rgba(4,17,11,.3); border-top-color: #04110b; border-radius: 50%; animation: spin .8s linear infinite; }
.alt { text-align: center; margin-top: 28px; font-size: .83rem; color: var(--dim); font-weight: 300; }
.alt a { color: var(--hi); text-decoration: none; border-bottom: 1px solid rgba(var(--accent-rgb), .5); padding-bottom: 2px; transition: color .4s; }
.alt a:hover { color: var(--accent); }
.foot { margin-top: 20px; text-align: center; font-size: .72rem; color: var(--dim); }

/* success */
.success { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 48px 24px; background: var(--bg-on); }
.success-card { max-width: 460px; width: 100%; text-align: center; }
.success-ring { width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 36px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--accent); box-shadow: 0 0 60px rgba(var(--accent-rgb), .25); }
.success-card .h2 { margin-bottom: 20px; }
.success-card p { font-size: .92rem; line-height: 1.9; font-weight: 300; color: var(--text); margin: 0 0 36px; }
.success-card p strong { color: var(--hi); font-weight: 400; }
.next { text-align: left; border-top: 1px solid var(--line); margin-bottom: 40px; }
.next-title { font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--accent); padding: 20px 0 10px; }
.next-row { padding: 12px 0; border-bottom: 1px solid var(--line); font-size: .84rem; font-weight: 300; color: var(--text); }

/* mobile: lamp on top, form below */
@media (max-width: 860px) {
  .su { grid-template-columns: 1fr; }
  .stage { padding-bottom: 0; }
  .lamp-space { height: 330px; }
  .lamp-wrap { transform: translateX(-50%) scale(.72); }
  .hint { bottom: 12px; }
  .left-copy { display: none; }
  .right { align-items: flex-start; padding: 16px 7vw 64px; }
  .su .panel { transform: translateY(32px); }
  .panel::before { display: none; }
}
@media (max-width: 480px) {
  .types { flex-direction: column; }
  .two-col { grid-template-columns: 1fr; gap: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .su, .su * { transition-duration: .01s !important; transition-delay: 0s !important; animation: none !important; }
}
`;

/* ═══════════════ SIGNUP PAGE ═══════════════ */
export default function Signup() {
  const navigate = useNavigate();

  const [lit, setLit] = useState(false);
  const [step, setStep] = useState(1);
  const TOTAL = 3;

  const [form, setForm] = useState({
    memberType: '', fullName: '', email: '',
    phone: '', castFamily: '', password: '', confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = field => e => {
    setForm(f => ({ ...f, [field]: typeof e === 'string' ? e : e.target.value }));
    setErrors(er => ({ ...er, [field]: '' }));
    setApiError('');
  };

  const validateStep = () => {
    const e = {};
    if (step === 1 && !form.memberType) e.memberType = 'Please select your membership type.';
    if (step === 2) {
      if (!form.fullName.trim()) e.fullName = 'Full name is required.';
      if (!form.email.trim()) e.email = 'Email is required.';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    }
    if (step === 3) {
      if (!form.password) e.password = 'Password is required.';
      else if (form.password.length < 6) e.password = 'Minimum 6 characters.';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    }
    return e;
  };

  const nextStep = () => {
    const e = validateStep();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Pressing Enter on step 1 or 2 should move forward, not submit the registration
    if (step < TOTAL) { nextStep(); return; }
    const e2 = validateStep();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true); setApiError('');
    try {
      await authAPI.register({
        fullName: form.fullName, email: form.email,
        password: form.password, phone: form.phone,
        memberType: form.memberType, castFamily: form.castFamily,
      });
      // Don't auto-login — account needs admin approval first
      setSuccess(true);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="su on" style={{ display: 'block' }}>
        <style>{css}</style>
        <div className="success">
          <div className="success-card rise">
            <div className="success-ring">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#39ffb0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="h2">Application Submitted!</h2>
            <p>
              Your membership application has been received.<br />
              <strong>An admin will review and approve your account.</strong><br />
              You'll be able to log in once approved.
            </p>
            <div className="next">
              <div className="next-title">📋 What happens next?</div>
              <div className="next-row">1. Admin reviews your application</div>
              <div className="next-row">2. You receive approval</div>
              <div className="next-row">3. Log in and start contributing</div>
            </div>
            <a href="/login" className="btn">Back to Login →</a>
          </div>
        </div>
      </div>
    );
  }

  const stepLabels = ['Choose Type', 'Personal Info', 'Create Password'];

  return (
    <div className={`su ${lit ? 'on' : ''}`}>
      <style>{css}</style>

      <Link to="/" className="brand">
        <img src="/mus.jpg" alt="MUS Welfare logo" />
        <div>
          <div className="brand-name">MUS Welfare</div>
          <div className="brand-sub">Organization</div>
        </div>
      </Link>

      {/* ── Lamp stage + intro copy ── */}
      <div className="stage">
        <div className="lamp-space">
          <div className="lamp-wrap">
            <div className="glow" />
            <div className="cone-wrap"><div className="cone" /></div>
            <Lamp lit={lit} onToggle={() => setLit(v => !v)} />
          </div>
          <div className="hint">{lit ? 'Pull again to switch off' : 'Pull the cord to sign up'}</div>
        </div>

        <div className="left-copy">
          <div className="badge"><span className="dot" /> New Member</div>
          <h1 className="h1">
            Join our<br />family welfare<br /><span className="accent">circle.</span>
          </h1>
          <p className="lead">
            Sign up in under 2 minutes. Every contribution strengthens our community for every family member.
          </p>
          <div className="points">
            {[
              '✓  Job holders from PKR 500/month',
              '✓  Students from PKR 100/month',
              '✓  No upper limit on giving',
              '✓  Transparent fund management',
            ].map(t => <div key={t} className="point">{t}</div>)}
          </div>
          <div className="side-step">
            <div className="side-dots">
              {Array.from({ length: TOTAL }).map((_, i) => (
                <div key={i} className="side-dot" style={{
                  width: i < step ? 28 : 14,
                  background: i < step ? '#39ffb0' : undefined,
                }} />
              ))}
            </div>
            <div className="side-step-n">Step {step} of {TOTAL}</div>
            <div className="side-step-l">{stepLabels[step - 1]}</div>
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="right">
        <div className="panel">
          <StepBar current={step} total={TOTAL} />

          <div key={step} className="rise">
            <div className="eyebrow">Step {step} — {stepLabels[step - 1]}</div>
            <h2 className="h2">
              {step === 1 ? 'How will you contribute?' : step === 2 ? 'Tell us about yourself' : 'Secure your account'}
            </h2>
            <p className="sub">
              {step === 1
                ? 'Choose the membership tier that best describes you.'
                : step === 2
                ? 'Your basic details for the member profile.'
                : 'Choose a strong password to protect your account.'}
            </p>
          </div>

          {apiError && <div className="notice notice-err" role="alert">⚠️ {apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div key="step1" className="rise" style={{ animationDelay: '.1s' }}>
                <div className="types">
                  <TypeCard
                    value="job_holder" selected={form.memberType === 'job_holder'}
                    onChange={v => set('memberType')(v)}
                    icon="💼" title="Job Holder" subtitle="Employed or self-employed member" min="500"
                  />
                  <TypeCard
                    value="student" selected={form.memberType === 'student'}
                    onChange={v => set('memberType')(v)}
                    icon="🎓" title="Student" subtitle="Currently enrolled student" min="100"
                  />
                </div>
                {errors.memberType && <p className="field-msg err" style={{ marginBottom: 12 }}>{errors.memberType}</p>}
                <div className="notice notice-ok" style={{ marginTop: 24, marginBottom: 0 }}>
                  <strong>💡 No upper limit.</strong> You can always contribute more than the minimum — every extra rupee strengthens our community fund.
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div key="step2">
                <Field
                  id="fullName" label="Full Name *"
                  value={form.fullName} onChange={set('fullName')}
                  placeholder="e.g. Yasir Sultan" error={errors.fullName}
                  delay={0.1} autoFocus
                />
                <Field
                  id="email" label="Email Address *" type="email"
                  value={form.email} onChange={set('email')}
                  placeholder="yasirsultan990@example.com" error={errors.email} delay={0.2}
                />
                <div className="two-col">
                  <Field
                    id="phone" label="Phone"
                    value={form.phone} onChange={set('phone')}
                    placeholder="+92 355 5744874" delay={0.3}
                  />
                  <Field
                    id="castFamily" label="Cast / Family"
                    value={form.castFamily} onChange={set('castFamily')}
                    placeholder="e.g. Yousafzai" delay={0.35}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div key="step3">
                <Field
                  id="password" label="Password *"
                  type={showPwd ? 'text' : 'password'}
                  error={errors.password}
                  hint="At least 6 characters"
                  value={form.password} onChange={set('password')}
                  placeholder="Create a strong password" delay={0.1} autoFocus
                  rightEl={<ShowToggle visible={showPwd} onClick={() => setShowPwd(v => !v)} />}
                />
                <PasswordStrength password={form.password} />
                <Field
                  id="confirmPassword" label="Confirm Password *"
                  type={showCPwd ? 'text' : 'password'}
                  error={errors.confirmPassword}
                  value={form.confirmPassword} onChange={set('confirmPassword')}
                  placeholder="Re-enter your password" delay={0.2}
                  rightEl={<ShowToggle visible={showCPwd} onClick={() => setShowCPwd(v => !v)} />}
                />

                <div className="summary rise" style={{ animationDelay: '.3s' }}>
                  <div className="summary-title">Account Summary</div>
                  {[
                    { l: 'Name', v: form.fullName },
                    { l: 'Email', v: form.email },
                    { l: 'Type', v: form.memberType === 'job_holder' ? '💼 Job Holder (min PKR 500)' : '🎓 Student (min PKR 100)' },
                  ].map(({ l, v }) => (
                    <div key={l} className="summary-row">
                      <span>{l}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Nav buttons ── */}
            <div className="nav-row">
              {step > 1 && (
                <button type="button" className="btn btn-ghost" onClick={() => setStep(s => s - 1)}>
                  ← Back
                </button>
              )}

              {step < TOTAL ? (
                <button type="button" className="btn btn-grow" onClick={nextStep}>
                  Continue →
                </button>
              ) : (
                <button type="submit" disabled={loading} className="btn btn-grow">
                  {loading ? <><span className="spin" /> Creating account…</> : '✓ Create My Account'}
                </button>
              )}
            </div>

            <p className="alt">
              Already a member? <Link to="/login">Sign in</Link>
            </p>
          </form>
          <p className="foot">Developed by Yasir Sultan</p>
        </div>
      </div>
    </div>
  );
}