import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

/* ── Animated background particles ── */
function Particles() {
  return (
    <div style={{ position:'absolute',inset:0,overflow:'hidden',pointerEvents:'none',zIndex:0 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          position:'absolute',
          width: `${[80,120,60,100,90,70][i]}px`,
          height: `${[80,120,60,100,90,70][i]}px`,
          borderRadius:'50%',
          background:`radial-gradient(circle, ${['rgba(201,151,58,0.15)','rgba(45,106,63,0.2)','rgba(143,188,143,0.12)','rgba(201,151,58,0.1)','rgba(61,139,82,0.15)','rgba(255,255,255,0.05)'][i]} 0%, transparent 70%)`,
          top: `${[5,25,55,70,40,80][i]}%`,
          left: `${[70,10,80,20,55,40][i]}%`,
          animation: `floatP${i} ${[9,11,7,13,8,10][i]}s ease-in-out infinite`,
          animationDelay: `${i * 1.5}s`,
        }}/>
      ))}
      <style>{`
        @keyframes floatP0 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-15px,20px)} }
        @keyframes floatP1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(20px,-18px)} }
        @keyframes floatP2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-10px,-20px)} }
        @keyframes floatP3 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,12px)} }
        @keyframes floatP4 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-12px,15px)} }
        @keyframes floatP5 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(8px,-14px)} }
      `}</style>
    </div>
  );
}

/* ── Step progress bar ── */
function StepBar({ current, total }) {
  return (
    <div style={{ display:'flex', gap:'6px', marginBottom:'32px' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex:1, height:'4px', borderRadius:'3px', overflow:'hidden',
          background:'rgba(26,74,36,0.1)',
          position:'relative',
        }}>
          <div style={{
            position:'absolute', inset:0, borderRadius:'3px',
            background: i < current
              ? 'linear-gradient(90deg, #1a4a24, #3d8b52)'
              : 'transparent',
            transform: i === current - 1 ? 'scaleX(1)' : i < current - 1 ? 'scaleX(1)' : 'scaleX(0)',
            transformOrigin:'left',
            transition:'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
          }}/>
        </div>
      ))}
    </div>
  );
}

/* ── Membership type card ── */
function TypeCard({ value, selected, onChange, icon, title, subtitle, min }) {
  return (
    <button
      type="button" onClick={() => onChange(value)}
      style={{
        flex:1, padding:'22px 18px', borderRadius:'16px',
        background: selected
          ? 'linear-gradient(135deg, #f0f9f2, #e8f5eb)'
          : 'white',
        border: selected ? '2px solid #2d6a3f' : '1.5px solid rgba(26,74,36,0.14)',
        cursor:'pointer', textAlign:'left',
        transition:'all 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: selected
          ? '0 6px 24px rgba(26,74,36,0.14), inset 0 1px 0 rgba(255,255,255,0.6)'
          : '0 2px 8px rgba(0,0,0,0.04)',
        fontFamily:'Sora, sans-serif',
        transform: selected ? 'translateY(-2px)' : 'translateY(0)',
        position:'relative', overflow:'hidden',
      }}
    >
      {selected && (
        <div style={{
          position:'absolute', top:'10px', right:'10px',
          width:'20px', height:'20px', borderRadius:'50%',
          background:'#2d6a3f', display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="10" height="10" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      <div style={{ fontSize:'1.8rem', marginBottom:'10px', lineHeight:1 }}>{icon}</div>
      <div style={{ fontWeight:700, fontSize:'0.92rem', color:'#0f1a10', marginBottom:'4px' }}>{title}</div>
      <div style={{ fontSize:'0.76rem', color:'#6b7c6d', marginBottom:'14px', lineHeight:1.5 }}>{subtitle}</div>
      <div style={{
        display:'inline-block', padding:'4px 12px', borderRadius:'50px',
        background: selected ? '#2d6a3f' : 'rgba(26,74,36,0.08)',
        color: selected ? 'white' : '#2d6a3f',
        fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.5px',
        transition:'all 0.25s',
      }}>
        Min PKR {min}/mo
      </div>
    </button>
  );
}

/* ── Input field with animation ── */
function Field({ id, label, type = 'text', value, onChange, placeholder, icon, rightEl, error, hint, delay = 0, autoFocus }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom:'18px', opacity:0, animation:`fadeUp 0.5s ease ${delay}s both` }}>
      <label htmlFor={id} style={{
        display:'block', marginBottom:'7px',
        fontSize:'0.76rem', fontWeight:600, letterSpacing:'0.8px',
        color: error ? '#c0522a' : focused ? '#2d6a3f' : '#52695a',
        textTransform:'uppercase', transition:'color 0.2s',
      }}>{label}</label>
      <div style={{ position:'relative' }}>
        {icon && (
          <span style={{
            position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)',
            color: focused ? '#2d6a3f' : '#8fbc8f', transition:'color 0.2s',
            display:'flex', pointerEvents:'none',
          }}>{icon}</span>
        )}
        <input
          id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:'100%', boxSizing:'border-box',
            padding:'13px 16px',
            paddingLeft: icon ? '44px' : '16px',
            paddingRight: rightEl ? '48px' : '16px',
            border: error ? '1.5px solid #e07a3a' : focused ? '1.5px solid #2d6a3f' : '1.5px solid rgba(26,74,36,0.16)',
            borderRadius:'11px',
            background: focused ? '#fafff8' : '#f8faf6',
            fontSize:'0.9rem', color:'#0f1a10',
            outline:'none',
            transition:'all 0.25s ease',
            boxShadow: focused ? '0 0 0 4px rgba(45,106,63,0.07)' : 'none',
            fontFamily:'Sora, sans-serif',
          }}
        />
        {rightEl && (
          <div style={{ position:'absolute', right:'6px', top:'50%', transform:'translateY(-50%)' }}>
            {rightEl}
          </div>
        )}
      </div>
      {error && <p style={{ margin:'6px 0 0', fontSize:'0.73rem', color:'#c0522a' }}>{error}</p>}
      {hint  && <p style={{ margin:'6px 0 0', fontSize:'0.73rem', color:'#8a9e8c' }}>{hint}</p>}
    </div>
  );
}

const ICONS = {
  user:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  mail:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>,
  phone: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  lock:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  tree:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 14h.01"/><path d="M7 7h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7l-4-4V9a2 2 0 0 1 2-2z"/></svg>,
};

function EyeBtn({ visible, onClick }) {
  return (
    <button
      type="button" onClick={onClick}
      style={{
        background:'none', border:'none', color:'#8fbc8f', cursor:'pointer',
        padding:'10px', display:'flex', transition:'color 0.2s',
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {visible
          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
        }
      </svg>
    </button>
  );
}

/* ── Password strength ── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const score = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : 1;
  const colors = { 1:'#e74c3c', 2:'#e8a020', 3:'#3d8b52', 4:'#1a4a24' };
  const labels = { 1:'Too short', 2:'Acceptable', 3:'Good password', 4:'Strong  💪' };
  return (
    <div style={{ marginBottom:'16px' }}>
      <div style={{ display:'flex', gap:'4px', marginBottom:'5px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex:1, height:'3px', borderRadius:'2px',
            background: i <= score ? colors[score] : 'rgba(26,74,36,0.1)',
            transition:'background 0.3s ease',
          }}/>
        ))}
      </div>
      <span style={{ fontSize:'0.72rem', color: colors[score], fontWeight:600 }}>{labels[score]}</span>
    </div>
  );
}

export default function Signup() {
  const navigate   = useNavigate();

  const [step,    setStep]    = useState(1);
  const TOTAL = 3;

  const [form, setForm] = useState({
    memberType:'', fullName:'', email:'',
    phone:'', castFamily:'', password:'', confirmPassword:'',
  });
  const [showPwd,  setShowPwd]  = useState(false);
  const [showCPwd, setShowCPwd] = useState(false);
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);

  const set = field => e => {
    setForm(f => ({ ...f, [field]: typeof e === 'string' ? e : e.target.value }));
    setErrors(er => ({ ...er, [field]:'' }));
    setApiError('');
  };

  const validateStep = () => {
    const e = {};
    if (step === 1 && !form.memberType) e.memberType = 'Please select your membership type.';
    if (step === 2) {
      if (!form.fullName.trim())               e.fullName = 'Full name is required.';
      if (!form.email.trim())                  e.email    = 'Email is required.';
      else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    }
    if (step === 3) {
      if (!form.password)                      e.password = 'Password is required.';
      else if (form.password.length < 6)       e.password = 'Minimum 6 characters.';
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
    const e2 = validateStep();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true); setApiError('');
    try {
      await authAPI.register({
        fullName:form.fullName, email:form.email,
        password:form.password, phone:form.phone,
        memberType:form.memberType, castFamily:form.castFamily,
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
      <div style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(135deg, #f0f9f2, #fdfaf5)',
        fontFamily:'Sora, sans-serif',
        padding: '24px',
      }}>
        <style>{`@keyframes successPop { 0%{opacity:0;transform:scale(0.8) translateY(20px)} 60%{transform:scale(1.05) translateY(-4px)} 100%{opacity:1;transform:scale(1) translateY(0)} }`}</style>
        <div style={{ textAlign:'center', animation:'successPop 0.7s cubic-bezier(0.34,1.56,0.64,1) both', maxWidth: '440px' }}>
          <div style={{
            width:'80px', height:'80px', borderRadius:'50%',
            background:'linear-gradient(135deg, #c9973a, #e8b84b)',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 24px',
            boxShadow:'0 12px 40px rgba(201,151,58,0.35)',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M18 8v10M18 26v2" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 style={{ fontFamily:'Fraunces,serif', fontSize:'2rem', color:'#1a4a24', marginBottom:'12px', fontWeight:900 }}>
            Application Submitted!
          </h2>
          <p style={{ color:'#6b7c6d', fontSize:'0.92rem', lineHeight: 1.7, marginBottom: '28px' }}>
            Your membership application has been received.<br/>
            <strong style={{ color: '#1a4a24' }}>An admin will review and approve your account.</strong><br/>
            You'll be able to log in once approved.
          </p>
          <div style={{
            background: 'white', border: '1.5px solid rgba(26,74,36,0.12)',
            borderRadius: '14px', padding: '16px 20px',
            fontSize: '0.82rem', color: '#52695a', lineHeight: 1.7,
            marginBottom: '28px', textAlign: 'left',
          }}>
            <div style={{ fontWeight: 700, color: '#1a4a24', marginBottom: '8px' }}>📋 What happens next?</div>
            <div>1. Admin reviews your application</div>
            <div>2. You receive approval</div>
            <div>3. Log in and start contributing</div>
          </div>
          <a href="/login" style={{
            display: 'inline-block', padding: '12px 32px',
            background: 'linear-gradient(135deg, #1a4a24, #2d6a3f)',
            color: 'white', borderRadius: '50px', textDecoration: 'none',
            fontWeight: 600, fontSize: '0.9rem', fontFamily: 'Sora, sans-serif',
          }}>
            Back to Login →
          </a>
        </div>
      </div>
    );
  }

  const stepLabels = ['Choose Type', 'Personal Info', 'Create Password'];

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'Sora, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap');
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-10px)} to{opacity:1;transform:translateX(0)} }
        .nav-btn-back:hover { background: rgba(26,74,36,0.07) !important; }
        .nav-btn-next:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(26,74,36,0.3) !important; }
        .nav-btn-next:active:not(:disabled) { transform: translateY(0); }
        @media (max-width: 860px) {
          .signup-left { display: none !important; }
          .signup-right { padding: 32px 24px !important; }
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="signup-left" style={{
        flex:'0 0 40%', minWidth:'360px',
        background:'linear-gradient(158deg, #081a0c 0%, #0f2d15 35%, #1a4a24 68%, #2a5c35 100%)',
        position:'relative', overflow:'hidden',
        display:'flex', flexDirection:'column',
        padding:'48px 52px',
      }}>
        <Particles />

        {/* Subtle diagonal accent */}
        <div style={{
          position:'absolute', top:'-40%', right:'-30%',
          width:'600px', height:'600px', borderRadius:'50%',
          background:'radial-gradient(circle, rgba(45,106,63,0.15) 0%, transparent 60%)',
          pointerEvents:'none',
        }}/>

        {/* Logo */}
        <div style={{
          display:'flex', alignItems:'center', gap:'14px', zIndex:1,
          opacity:0, animation:'fadeUp 0.6s ease 0.1s both',
        }}>
          <div style={{
            width:48, height:48, borderRadius:'16px',
            background:'rgba(255,255,255,0.1)',
            border:'1px solid rgba(255,255,255,0.18)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 60 60">
              <path d="M10 42 Q7 25 22 14 Q30 8 40 13 L36 20 Q28 11 20 20 Q7 30 15 44Z" fill="white"/>
              <path d="M50 18 Q53 35 38 46 Q30 52 20 47 L24 40 Q32 49 40 40 Q53 30 45 16Z" fill="#8fbc8f"/>
              <ellipse cx="30" cy="32" rx="9" ry="6" fill="#c9973a"/>
            </svg>
          </div>
          <div>
            <div style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'1.2rem', color:'white', lineHeight:1.1 }}>MUS Welfare</div>
            <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.38)', letterSpacing:'3px', textTransform:'uppercase' }}>Organization</div>
          </div>
        </div>

        {/* Hero */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', paddingTop:'36px', paddingBottom:'28px', zIndex:1 }}>
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'8px',
            background:'rgba(201,151,58,0.12)', border:'1px solid rgba(201,151,58,0.28)',
            color:'#c9973a', padding:'5px 14px', borderRadius:'50px',
            fontSize:'0.67rem', fontWeight:600, letterSpacing:'2.5px', textTransform:'uppercase',
            marginBottom:'24px', width:'fit-content',
            opacity:0, animation:'fadeUp 0.6s ease 0.3s both',
          }}>
            New Member
          </div>

          <h1 style={{
            fontFamily:'Fraunces,serif',
            fontSize:'clamp(2rem, 3.2vw, 2.8rem)',
            fontWeight:900, color:'white', lineHeight:1.08, margin:'0 0 20px',
            opacity:0, animation:'fadeUp 0.6s ease 0.45s both',
          }}>
            Join our<br/>family welfare<br/>
            <em style={{ color:'#c9973a', fontStyle:'italic' }}>circle.</em>
          </h1>

          <p style={{
            color:'rgba(255,255,255,0.48)', fontSize:'0.87rem', lineHeight:1.9,
            maxWidth:'310px', margin:'0 0 32px',
            opacity:0, animation:'fadeUp 0.6s ease 0.6s both',
          }}>
            Sign up in under 2 minutes. Every contribution strengthens our community for every family member.
          </p>

          <div style={{
            display:'flex', flexDirection:'column', gap:'10px',
            opacity:0, animation:'fadeUp 0.6s ease 0.75s both',
          }}>
            {[
              '✓  Job holders from PKR 500/month',
              '✓  Students from PKR 100/month',
              '✓  No upper limit on giving',
              '✓  Transparent fund management',
            ].map(t => (
              <div key={t} style={{
                fontSize:'0.8rem', color:'rgba(255,255,255,0.58)',
                display:'flex', alignItems:'center', gap:'8px',
              }}>{t}</div>
            ))}
          </div>
        </div>

        {/* Step indicator */}
        <div style={{
          zIndex:1,
          borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:'24px',
          opacity:0, animation:'fadeUp 0.6s ease 0.9s both',
        }}>
          {/* Step dots */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <div key={i} style={{
                height:'4px', borderRadius:'3px',
                width: i < step ? '28px' : '14px',
                background: i < step ? '#c9973a' : 'rgba(255,255,255,0.2)',
                transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)',
              }}/>
            ))}
          </div>
          <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.38)', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'5px' }}>
            Step {step} of {TOTAL}
          </div>
          <div style={{ fontFamily:'Fraunces,serif', fontSize:'0.95rem', fontWeight:700, color:'white' }}>
            {stepLabels[step - 1]}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="signup-right" style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        background:'#f8faf5', padding:'48px 40px', overflowY:'auto',
        position:'relative',
      }}>
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:`radial-gradient(circle at 20% 10%, rgba(45,106,63,0.04) 0%, transparent 60%),
            radial-gradient(circle at 90% 90%, rgba(201,151,58,0.03) 0%, transparent 60%)`,
        }}/>

        <div style={{ width:'100%', maxWidth:'460px', position:'relative' }}>
          <StepBar current={step} total={TOTAL} />

          {/* Step header */}
          <div key={step} style={{
            marginBottom:'28px',
            opacity:0, animation:'fadeUp 0.45s ease both',
          }}>
            <div style={{
              fontSize:'0.68rem', color:'#7a9a7d', fontWeight:700,
              letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:'8px',
            }}>
              Step {step} — {stepLabels[step - 1]}
            </div>
            <h2 style={{
              fontFamily:'Fraunces,serif', fontSize:'1.85rem', fontWeight:900,
              color:'#0f1a10', margin:'0 0 8px', lineHeight:1.1,
            }}>
              {step === 1 ? 'How will you contribute?' : step === 2 ? 'Tell us about yourself' : 'Secure your account'}
            </h2>
            <p style={{ fontSize:'0.86rem', color:'#6b7c6d', margin:0 }}>
              {step === 1
                ? 'Choose the membership tier that best describes you.'
                : step === 2
                ? 'Your basic details for the member profile.'
                : 'Choose a strong password to protect your account.'}
            </p>
          </div>

          {apiError && (
            <div style={{
              padding:'13px 16px', marginBottom:'20px',
              background:'#fef4f0', border:'1.5px solid #f0c0a8',
              borderRadius:'12px', display:'flex', alignItems:'center', gap:'10px',
              fontSize:'0.84rem', color:'#c0522a',
              animation:'slideRight 0.4s ease both',
            }}>
              <span style={{ fontSize:'1rem' }}>⚠️</span>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div key="step1" style={{ opacity:0, animation:'fadeUp 0.45s ease 0.1s both' }}>
                <div style={{ display:'flex', gap:'12px', marginBottom:'10px' }}>
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
                {errors.memberType && (
                  <p style={{ margin:'0 0 12px', fontSize:'0.73rem', color:'#c0522a' }}>{errors.memberType}</p>
                )}
                <div style={{
                  background:'linear-gradient(135deg, #f0f7f2, #eaf4ec)',
                  border:'1px solid rgba(45,106,63,0.2)',
                  borderRadius:'12px', padding:'15px 18px',
                  fontSize:'0.82rem', color:'#2d6a3f', lineHeight:1.7,
                  marginTop:'8px',
                }}>
                  <strong style={{ fontWeight:700 }}>💡 No upper limit.</strong> You can always contribute more than the minimum — every extra rupee strengthens our community fund.
                </div>
              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div key="step2" style={{ opacity:0, animation:'fadeUp 0.45s ease 0.1s both' }}>
                <Field
                  id="fullName" label="Full Name *" icon={ICONS.user}
                  value={form.fullName} onChange={set('fullName')}
                  placeholder="e.g. Yasir Sultan" error={errors.fullName}
                  delay={0.1} autoFocus
                />
                <Field
                  id="email" label="Email Address *" type="email" icon={ICONS.mail}
                  value={form.email} onChange={set('email')}
                  placeholder="yasirsultan990@example.com" error={errors.email} delay={0.2}
                />
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                  <Field
                    id="phone" label="Phone" icon={ICONS.phone}
                    value={form.phone} onChange={set('phone')}
                    placeholder="+92 355 5744874" delay={0.3}
                  />
                  <Field
                    id="castFamily" label="Cast / Family" icon={ICONS.tree}
                    value={form.castFamily} onChange={set('castFamily')}
                    placeholder="e.g. Yousafzai" delay={0.35}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div key="step3" style={{ opacity:0, animation:'fadeUp 0.45s ease 0.1s both' }}>
                <Field
                  id="password" label="Password *"
                  type={showPwd ? 'text' : 'password'}
                  icon={ICONS.lock} error={errors.password}
                  hint="At least 6 characters"
                  value={form.password} onChange={set('password')}
                  placeholder="Create a strong password" delay={0.1} autoFocus
                  rightEl={<EyeBtn visible={showPwd} onClick={() => setShowPwd(v=>!v)} />}
                />
                <PasswordStrength password={form.password} />
                <Field
                  id="confirmPassword" label="Confirm Password *"
                  type={showCPwd ? 'text' : 'password'}
                  icon={ICONS.lock} error={errors.confirmPassword}
                  value={form.confirmPassword} onChange={set('confirmPassword')}
                  placeholder="Re-enter your password" delay={0.2}
                  rightEl={<EyeBtn visible={showCPwd} onClick={() => setShowCPwd(v=>!v)} />}
                />

                {/* Account summary */}
                <div style={{
                  background:'linear-gradient(135deg, #f0f7f2, #eaf4ec)',
                  border:'1px solid rgba(45,106,63,0.18)',
                  borderRadius:'14px', padding:'18px 20px', marginTop:'8px',
                  opacity:0, animation:'fadeUp 0.5s ease 0.3s both',
                }}>
                  <div style={{
                    fontSize:'0.7rem', fontWeight:700, color:'#1a4a24',
                    letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'12px',
                  }}>Account Summary</div>
                  {[
                    { l:'Name',  v: form.fullName },
                    { l:'Email', v: form.email },
                    { l:'Type',  v: form.memberType === 'job_holder' ? '💼 Job Holder (min PKR 500)' : '🎓 Student (min PKR 100)' },
                  ].map(({ l, v }) => (
                    <div key={l} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'7px 0', borderBottom:'1px solid rgba(26,74,36,0.08)',
                      fontSize:'0.82rem',
                    }}>
                      <span style={{ color:'#6b7c6d' }}>{l}</span>
                      <strong style={{ color:'#0f1a10', fontWeight:600, textAlign:'right', maxWidth:'60%', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Nav buttons ── */}
            <div style={{
              display:'flex', gap:'10px', marginTop:'28px',
              opacity:0, animation:'fadeUp 0.5s ease 0.45s both',
            }}>
              {step > 1 && (
                <button
                  type="button" onClick={() => setStep(s => s - 1)}
                  className="nav-btn-back"
                  style={{
                    flex:'0 0 auto', padding:'13px 22px',
                    background:'transparent',
                    border:'1.5px solid rgba(45,106,63,0.25)',
                    borderRadius:'12px', color:'#2d6a3f',
                    fontSize:'0.9rem', fontWeight:600, cursor:'pointer',
                    fontFamily:'Sora, sans-serif',
                    transition:'background 0.2s',
                  }}
                >
                  ← Back
                </button>
              )}

              {step < TOTAL ? (
                <button
                  type="button" onClick={nextStep}
                  className="nav-btn-next"
                  style={{
                    flex:1, padding:'14px',
                    background:'linear-gradient(135deg, #1a4a24 0%, #2d6a3f 50%, #3d8b52 100%)',
                    color:'white', border:'none', borderRadius:'12px',
                    fontSize:'0.95rem', fontWeight:600, cursor:'pointer',
                    fontFamily:'Sora, sans-serif',
                    boxShadow:'0 4px 16px rgba(26,74,36,0.22)',
                    transition:'all 0.25s ease',
                    letterSpacing:'0.2px',
                  }}
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit" disabled={loading}
                  className="nav-btn-next"
                  style={{
                    flex:1, padding:'14px',
                    background: loading
                      ? '#6b9a70'
                      : 'linear-gradient(135deg, #1a4a24 0%, #2d6a3f 50%, #3d8b52 100%)',
                    color:'white', border:'none', borderRadius:'12px',
                    fontSize:'0.95rem', fontWeight:600,
                    cursor: loading ? 'wait' : 'pointer',
                    fontFamily:'Sora, sans-serif',
                    boxShadow:'0 4px 16px rgba(26,74,36,0.22)',
                    transition:'all 0.25s ease',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                  }}
                >
                  {loading ? 'Creating account…' : '✓ Create My Account'}
                </button>
              )}
            </div>

            <p style={{
              textAlign:'center', marginTop:'22px',
              fontSize:'0.83rem', color:'#6b7c6d',
              opacity:0, animation:'fadeUp 0.5s ease 0.55s both',
            }}>
              Already a member?{' '}
              <Link to="/login" style={{ color:'#2d6a3f', fontWeight:600, textDecoration:'none' }}>
                Sign in
              </Link>
            </p>
          </form>
          <p style={{ marginTop:18, textAlign:'center', fontSize:'0.78rem', color:'#8a9e8c' }}>
            Developed by Yasir Sultan
          </p>
        </div>
      </div>
    </div>
  );
}