import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

/* ─── shared SVG logo mark ─── */
function LogoMark({ size = 44 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.38,
      background: 'linear-gradient(135deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06))',
      border: '1px solid rgba(255,255,255,0.22)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
      flexShrink: 0,
    }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 60 60">
        <path d="M10 42 Q7 25 22 14 Q30 8 40 13 L36 20 Q28 11 20 20 Q7 30 15 44Z" fill="white"/>
        <path d="M50 18 Q53 35 38 46 Q30 52 20 47 L24 40 Q32 49 40 40 Q53 30 45 16Z" fill="#8fbc8f"/>
        <ellipse cx="30" cy="32" rx="9" ry="6" fill="#c9973a"/>
      </svg>
    </div>
  );
}

/* ─── decorative left panel background ─── */
function PanelBg() {
  return (
    <>
      {/* grid */}
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.05,pointerEvents:'none' }}>
        <defs>
          <pattern id="lgrid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0L0 0 0 56" fill="none" stroke="white" strokeWidth="0.6"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lgrid)"/>
      </svg>
      {/* orbs */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden' }}>
        <div style={{ position:'absolute',width:360,height:360,borderRadius:'50%',top:-100,right:-100,background:'radial-gradient(circle,rgba(201,151,58,0.16) 0%,transparent 70%)',animation:'orb1 9s ease-in-out infinite' }}/>
        <div style={{ position:'absolute',width:280,height:280,borderRadius:'50%',bottom:60,left:-80,background:'radial-gradient(circle,rgba(61,139,82,0.22) 0%,transparent 70%)',animation:'orb2 11s ease-in-out infinite' }}/>
        <div style={{ position:'absolute',width:180,height:180,borderRadius:'50%',top:'42%',right:'18%',background:'radial-gradient(circle,rgba(143,188,143,0.12) 0%,transparent 70%)',animation:'orb3 7s ease-in-out infinite' }}/>
      </div>
    </>
  );
}

/* ─── input ─── */
function Input({ id, label, type, value, onChange, placeholder, icon, right, error }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={{
        display:'block', marginBottom:7,
        fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.9px',
        textTransform:'uppercase',
        color: error ? '#d9534f' : focused ? 'var(--green-mid)' : 'var(--text-secondary)',
        transition:'color 0.2s',
      }}>{label}</label>
      <div style={{ position:'relative' }}>
        {icon && (
          <span style={{
            position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
            color: focused ? 'var(--green-mid)' : 'var(--green-pale)',
            display:'flex', pointerEvents:'none', transition:'color 0.2s',
          }}>{icon}</span>
        )}
        <input id={id} type={type} value={value} onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width:'100%', padding:'13px 14px',
            paddingLeft: icon ? 42 : 14,
            paddingRight: right ? 46 : 14,
            border: `1.5px solid ${error ? '#d9534f' : focused ? 'var(--green-mid)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            background: focused ? '#fafff8' : 'var(--bg-input)',
            fontSize:'0.9rem', color:'var(--text-primary)',
            outline:'none', transition:'all 0.22s',
            boxShadow: focused ? '0 0 0 3px rgba(45,106,63,0.09)' : 'none',
          }}
        />
        {right && (
          <div style={{ position:'absolute', right:4, top:'50%', transform:'translateY(-50%)' }}>{right}</div>
        )}
      </div>
      {error && <p style={{ margin:'5px 0 0', fontSize:'0.72rem', color:'#d9534f' }}>{error}</p>}
    </div>
  );
}

/* ─── eye toggle ─── */
function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle} aria-label="Toggle password"
      style={{ background:'none', border:'none', cursor:'pointer', padding:10, color:'var(--green-pale)', display:'flex', transition:'color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.color='var(--green-mid)'}
      onMouseLeave={e => e.currentTarget.style.color='var(--green-pale)'}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {show
          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
        }
      </svg>
    </button>
  );
}

/* ─── spinner ─── */
function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ animation:'spin 0.75s linear infinite', flexShrink:0 }}>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeOpacity="0.3"/>
      <path d="M12 2v4"/>
    </svg>
  );
}

/* ═══════════════════════════════════════════
   LOGIN PAGE
═══════════════════════════════════════════ */
export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [searchParams] = useSearchParams();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  // ── Show verified=1 success banner when redirected from email link ──
  const [verifiedBanner, setVerifiedBanner] = useState(
    searchParams.get('verified') === '1'
  );

  useEffect(() => {
    if (verifiedBanner) {
      const t = setTimeout(() => setVerifiedBanner(false), 8000);
      return () => clearTimeout(t);
    }
  }, [verifiedBanner]);

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
        setError('📧 Your email is not verified. Please check your inbox and click the verification link. Only real Gmail accounts can log in.');
      else if (status === 'pending')
        setError('⏳ Your account is pending admin approval.');
      else if (status === 'rejected')
        setError('❌ Your application was rejected. Contact the committee.');
      else
        setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally { setLoading(false); }
  };

  const emailIcon = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>;
  const lockIcon  = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'Sora,sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,700;0,9..144,900;1,9..144,700;1,9..144,900&display=swap');
        @keyframes orb1{0%,100%{transform:translate(0,0)}50%{transform:translate(-18px,22px)}}
        @keyframes orb2{0%,100%{transform:translate(0,0)}50%{transform:translate(16px,-20px)}}
        @keyframes orb3{0%,100%{transform:translate(0,0)}50%{transform:translate(10px,14px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:0.6}50%{opacity:1}}
        .login-left{flex:0 0 46%;min-width:0;display:flex;flex-direction:column;padding:48px 56px;position:relative;overflow:hidden;background:linear-gradient(158deg,#081a0c 0%,#0f2d15 30%,#1a4a24 65%,#2d6a3f 100%)}
        .login-right{flex:1;display:flex;align-items:center;justify-content:center;padding:48px 40px;background:#f8faf5;overflow-y:auto;position:relative}
        .login-card{width:100%;max-width:420px;position:relative;animation:fadeUp 0.5s ease both}
        .pri-btn{width:100%;padding:14px;background:linear-gradient(135deg,#1a4a24,#2d6a3f,#3d8b52);color:white;border:none;border-radius:var(--radius-md);font-size:0.93rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all 0.22s;box-shadow:0 4px 16px rgba(26,74,36,0.28);letter-spacing:0.3px;font-family:Sora,sans-serif}
        .pri-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 7px 24px rgba(26,74,36,0.38)}
        .pri-btn:active:not(:disabled){transform:translateY(0)}
        .pri-btn:disabled{opacity:0.65;cursor:wait}
        .sec-btn{width:100%;padding:13px;background:transparent;color:var(--green-mid);border:1.5px solid rgba(45,106,63,0.28);border-radius:var(--radius-md);font-size:0.9rem;font-weight:600;cursor:pointer;transition:all 0.2s;font-family:Sora,sans-serif}
        .sec-btn:hover{background:rgba(45,106,63,0.06);border-color:rgba(45,106,63,0.45)}
        .mobile-logo{display:none;align-items:center;gap:12px;margin-bottom:32px}
        @media(max-width:860px){
          .login-left{display:none!important}
          .login-right{padding:32px 20px}
          .mobile-logo{display:flex!important}
        }
        @media(max-width:480px){
          .login-right{padding:24px 16px}
          .login-card{max-width:100%}
        }
      `}</style>

      {/* ── LEFT PANEL ── */}
      <div className="login-left">
        <PanelBg/>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:14, zIndex:1, animation:'fadeUp 0.5s ease 0.05s both', opacity:0 }}>
          <LogoMark size={46}/>
          <div>
            <div style={{ fontFamily:'Fraunces,serif', fontWeight:900, fontSize:'1.2rem', color:'white', lineHeight:1.1 }}>MUS Welfare</div>
            <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.38)', letterSpacing:'3px', textTransform:'uppercase', marginTop:2 }}>Organization</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', paddingTop:40, paddingBottom:32, zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(201,151,58,0.12)', border:'1px solid rgba(201,151,58,0.3)', color:'#c9973a', padding:'5px 14px', borderRadius:50, fontSize:'0.65rem', fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:24, width:'fit-content', animation:'fadeUp 0.5s ease 0.2s both', opacity:0 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#c9973a', animation:'pulse 2s ease infinite' }}/>
            Member Portal
          </div>

          <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'clamp(2.4rem,3.8vw,3.4rem)', fontWeight:900, color:'white', lineHeight:1.06, margin:'0 0 20px', animation:'fadeUp 0.5s ease 0.32s both', opacity:0 }}>
            Every<br/>contribution<br/><em style={{ color:'#c9973a', fontStyle:'italic' }}>matters.</em>
          </h1>

          <p style={{ color:'rgba(255,255,255,0.48)', fontSize:'0.88rem', lineHeight:1.85, maxWidth:300, margin:'0 0 36px', animation:'fadeUp 0.5s ease 0.44s both', opacity:0 }}>
            A trusted family welfare circle — pooling resources, building futures, and strengthening our community together.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:10, animation:'fadeUp 0.5s ease 0.56s both', opacity:0 }}>
            {[['🏦','Transparent fund management'],['🛡️','Secure & verified members'],['🤝','Community-first mission']].map(([icon,text]) => (
              <div key={text} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 15px', background:'rgba(255,255,255,0.05)', borderRadius:10, border:'1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ fontSize:'0.95rem' }}>{icon}</span>
                <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.62)', fontWeight:500 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats footer */}
        <div style={{ display:'flex', borderTop:'1px solid rgba(255,255,255,0.1)', paddingTop:24, zIndex:1, animation:'fadeUp 0.5s ease 0.68s both', opacity:0 }}>
          {[['PKR 500','Job Holder Min'],['PKR 100','Student Min'],['2026–27','Active Term']].map(([n,l],i) => (
            <div key={l} style={{ flex:1, textAlign: i===1?'center':i===2?'right':'left' }}>
              <div style={{ fontFamily:'Fraunces,serif', fontSize:'1rem', fontWeight:700, color:'#c9973a' }}>{n}</div>
              <div style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.35)', marginTop:3, letterSpacing:'0.8px', textTransform:'uppercase' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login-right">
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', backgroundImage:'radial-gradient(circle at 25% 15%,rgba(45,106,63,0.05) 0%,transparent 55%),radial-gradient(circle at 80% 85%,rgba(201,151,58,0.04) 0%,transparent 55%)'}}/>

        <div className="login-card">
          {/* Mobile logo */}
          <div className="mobile-logo">
            <div style={{ width:36, height:36, borderRadius:10, background:'var(--green-base)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="20" height="20" viewBox="0 0 60 60"><path d="M10 42 Q7 25 22 14 Q30 8 40 13 L36 20 Q28 11 20 20 Q7 30 15 44Z" fill="white"/><path d="M50 18 Q53 35 38 46 Q30 52 20 47 L24 40 Q32 49 40 40 Q53 30 45 16Z" fill="#8fbc8f"/><ellipse cx="30" cy="32" rx="9" ry="6" fill="#c9973a"/></svg>
            </div>
            <span style={{ fontFamily:'Fraunces,serif', fontWeight:900, fontSize:'1.05rem', color:'var(--green-base)' }}>MUS Welfare</span>
          </div>

          {/* Header */}
          <div style={{ marginBottom:32 }}>
            <div style={{ fontSize:'0.65rem', fontWeight:700, letterSpacing:'3px', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:8 }}>Welcome back</div>
            <h2 style={{ fontFamily:'Fraunces,serif', fontSize:'2rem', fontWeight:900, color:'var(--text-primary)', margin:'0 0 10px', lineHeight:1.1 }}>
              Sign in to your<br/>account
            </h2>
            <p style={{ fontSize:'0.85rem', color:'var(--text-muted)' }}>
              No account?{' '}
              <Link to="/signup" style={{ color:'var(--green-mid)', fontWeight:700, textDecoration:'none' }}
                onMouseEnter={e => e.target.style.color='var(--green-base)'}
                onMouseLeave={e => e.target.style.color='var(--green-mid)'}
              >Create one →</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate>

            {/* ── Email verified success banner ── */}
            {verifiedBanner && (
              <div style={{ padding:'13px 15px', marginBottom:18, background:'#f0faf4', border:'1.5px solid #6dbf8b', borderRadius:'var(--radius-md)', display:'flex', alignItems:'flex-start', gap:10, fontSize:'0.85rem', color:'#1a5c34' }}>
                <span style={{ flexShrink:0 }}>✅</span>
                <span><strong>Email verified!</strong> Your account is confirmed. You can now sign in.</span>
              </div>
            )}

            {error && (
              <div style={{ padding:'12px 15px', marginBottom:18, background:'#fef4f0', border:'1.5px solid #f5c6b0', borderRadius:'var(--radius-md)', display:'flex', alignItems:'flex-start', gap:10, fontSize:'0.83rem', color:'#b94a2c' }}>
                <span style={{ flexShrink:0, marginTop:1 }}>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <Input id="email" label="Email address" type="email"
              value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="sultanyasir990@gmail.com" icon={emailIcon}
            />

            <Input id="password" label="Password"
              type={showPwd ? 'text' : 'password'}
              value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Your password" icon={lockIcon}
              right={<EyeToggle show={showPwd} onToggle={() => setShowPwd(v => !v)}/>}
            />

            <div style={{ marginBottom:20 }}>
              <button type="submit" disabled={loading} className="pri-btn">
                {loading ? <><Spinner/> Signing in…</> : 'Sign In →'}
              </button>
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
              <span style={{ flex:1, height:1, background:'var(--border)' }}/>
              <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:500, whiteSpace:'nowrap' }}>New member?</span>
              <span style={{ flex:1, height:1, background:'var(--border)' }}/>
            </div>

            <Link to="/signup" style={{ textDecoration:'none', display:'block' }}>
              <button type="button" className="sec-btn">Create an Account</button>
            </Link>
          </form>

          <p style={{ marginTop:36, textAlign:'center', fontSize:'0.68rem', color:'var(--text-muted)', letterSpacing:'0.3px' }}>
            MUS Welfare Organization · Executive Committee 2026–2027
            • Developed by Yasir Sultan
          </p>
        </div>
      </div>
    </div>
  );
}