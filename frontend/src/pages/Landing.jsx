import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ─── Real org logo ─── */
function OrgLogo({ size = 36, rounded = true }) {
  return (
    <img
      src="/mus.jpg"
      alt="MUS Welfare Logo"
      style={{
        width: size, height: size,
        borderRadius: rounded ? size * 0.28 : '50%',
        objectFit: 'cover',
        flexShrink: 0,
        border: '2px solid rgba(255,255,255,0.25)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }}
    />
  );
}

/* ─── Navbar ─── */
function Navbar({ activeSection }) {
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Home',    href: '#home'    },
    { label: 'About',   href: '#about'   },
    { label: 'How It Works', href: '#how' },
    { label: 'Contact', href: '#contact' },
  ];

  const scrollTo = (href) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const isLightNav = activeSection !== 'home' && !scrolled;
  const navBackground = scrolled
    ? 'rgba(8,26,12,0.97)'
    : activeSection === 'home'
      ? 'transparent'
      : 'rgba(255,255,255,0.98)';
  const navBorder = scrolled
    ? '1px solid rgba(255,255,255,0.07)'
    : activeSection === 'home'
      ? 'none'
      : '1px solid rgba(26,74,36,0.12)';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: navBackground,
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: navBorder,
      transition: 'all 0.3s ease',
      padding: '0 5vw',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <OrgLogo size={38} rounded={true}/>
          <div>
            <div style={{ fontFamily: 'Fraunces,serif', fontWeight: 900, fontSize: '1rem', color: isLightNav ? '#0f1a10' : 'white', lineHeight: 1.1 }}>MUS Welfare</div>
            <div style={{ fontSize: '0.55rem', color: isLightNav ? 'rgba(15,26,16,0.65)' : 'rgba(255,255,255,0.4)', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Organization</div>
          </div>
        </div>
        {/* Desktop nav links */}
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navLinks.map(({ label, href }) => {
            const isActive = activeSection === href.slice(1);
            const linkColor = isLightNav
              ? isActive ? '#0f1a10' : 'rgba(15,26,16,0.7)'
              : isActive ? 'white' : 'rgba(255,255,255,0.75)';
            const hoverColor = isLightNav ? '#0f1a10' : 'white';
            return (
              <button key={label} onClick={() => scrollTo(href)} style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px 16px', borderRadius: 8,
                color: linkColor,
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.88rem', fontFamily: 'Sora,sans-serif',
                transition: 'all 0.2s',
                borderBottom: isActive ? '2px solid #c9973a' : '2px solid transparent',
              }}
                onMouseEnter={e => e.currentTarget.style.color = hoverColor}
                onMouseLeave={e => e.currentTarget.style.color = linkColor}
              >{label}</button>
            );
          })}
        </div>

        {/* Auth buttons */}
        <div className="nav-auth" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link to="/login" style={{
            padding: '8px 20px', borderRadius: 8,
            color: isLightNav ? '#0f1a10' : 'rgba(255,255,255,0.8)', fontWeight: 600, fontSize: '0.88rem',
            textDecoration: 'none', fontFamily: 'Sora,sans-serif',
            border: isLightNav ? '1px solid rgba(26,74,36,0.18)' : '1px solid rgba(255,255,255,0.2)',
            background: isLightNav ? 'rgba(26,74,36,0.06)' : 'transparent',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = isLightNav ? 'rgba(26,74,36,0.12)' : 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = isLightNav ? '#0f1a10' : 'white';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = isLightNav ? 'rgba(26,74,36,0.06)' : 'transparent';
              e.currentTarget.style.color = isLightNav ? '#0f1a10' : 'rgba(255,255,255,0.8)';
            }}
          >Log In</Link>
          <Link to="/signup" style={{
            padding: '8px 20px', borderRadius: 8,
            background: 'linear-gradient(135deg,#c9973a,#e8b84b)',
            color: '#0f1a10', fontWeight: 700, fontSize: '0.88rem',
            textDecoration: 'none', fontFamily: 'Sora,sans-serif',
            boxShadow: '0 4px 14px rgba(201,151,58,0.4)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,151,58,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(201,151,58,0.4)'; }}
          >Join Now</Link>
        </div>

        {/* Hamburger */}
        <button className="hamburger" onClick={() => setMenuOpen(v => !v)} style={{
          display: 'none', background: 'none', border: 'none', cursor: 'pointer',
          color: 'white', padding: 6,
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {menuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: 'rgba(8,26,12,0.98)', backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 5vw 24px',
        }}>
          {navLinks.map(({ label, href }) => (
            <button key={label} onClick={() => scrollTo(href)} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '12px 0', color: 'rgba(255,255,255,0.8)',
              fontWeight: 600, fontSize: '1rem', fontFamily: 'Sora,sans-serif',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>{label}</button>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <Link to="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, padding: '11px', textAlign: 'center', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', fontWeight: 600, fontFamily: 'Sora,sans-serif', fontSize: '0.9rem' }}>Log In</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)} style={{ flex: 1, padding: '11px', textAlign: 'center', borderRadius: 10, background: 'linear-gradient(135deg,#c9973a,#e8b84b)', color: '#0f1a10', textDecoration: 'none', fontWeight: 700, fontFamily: 'Sora,sans-serif', fontSize: '0.9rem' }}>Join Now</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/* ─── Section wrapper ─── */
function Section({ id, children, bg = 'white', style = {} }) {
  return (
    <section id={id} className="fade-element" style={{ background: bg, padding: '96px 5vw', ...style }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

function SectionTag({ children }) {
  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(26,74,36,0.08)', border:'1px solid rgba(26,74,36,0.18)', color:'#1a4a24', padding:'5px 16px', borderRadius:50, fontSize:'0.65rem', fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:18 }}>
      {children}
    </div>
  );
}

/* ─── Hero Section ─── */
function Hero() {
  const [count, setCount] = useState({ members: 0, fund: 0, months: 0 });

  /* Animate counters once on mount */
  useEffect(() => {
    const targets = { members: 120, fund: 850, months: 18 };
    const duration = 1800;
    const steps = 60;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const p = step / steps;
      const ease = 1 - Math.pow(1 - p, 3);
      setCount({
        members: Math.round(targets.members * ease),
        fund:    Math.round(targets.fund    * ease),
        months:  Math.round(targets.months  * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" style={{
      minHeight: '100vh', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(158deg,#040e06 0%,#081a0c 25%,#0f2d15 55%,#1a4a24 80%,#2d6a3f 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ── Decorative layers ── */}

      {/* Fine dot grid */}
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.07,pointerEvents:'none' }}>
        <defs>
          <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="1.5" fill="white"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)"/>
      </svg>

      {/* Diagonal line accent */}
      <svg style={{ position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.04,pointerEvents:'none' }}>
        <line x1="0" y1="100%" x2="100%" y2="0" stroke="white" strokeWidth="1.5"/>
        <line x1="-10%" y1="100%" x2="90%" y2="0" stroke="white" strokeWidth="0.8"/>
        <line x1="10%" y1="100%" x2="110%" y2="0" stroke="white" strokeWidth="0.8"/>
      </svg>

      {/* Glowing orbs */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden' }}>
        <div style={{ position:'absolute',width:700,height:700,borderRadius:'50%',top:-250,right:-200,background:'radial-gradient(circle,rgba(201,151,58,0.1) 0%,transparent 65%)',animation:'orb1 12s ease-in-out infinite' }}/>
        <div style={{ position:'absolute',width:500,height:500,borderRadius:'50%',bottom:-150,left:-120,background:'radial-gradient(circle,rgba(45,106,63,0.2) 0%,transparent 65%)',animation:'orb2 15s ease-in-out infinite' }}/>
        <div style={{ position:'absolute',width:300,height:300,borderRadius:'50%',top:'35%',right:'8%',background:'radial-gradient(circle,rgba(143,188,143,0.08) 0%,transparent 65%)',animation:'orb3 9s ease-in-out infinite' }}/>
        <div style={{ position:'absolute',width:200,height:200,borderRadius:'50%',top:'60%',left:'30%',background:'radial-gradient(circle,rgba(201,151,58,0.07) 0%,transparent 65%)',animation:'orb1 11s ease-in-out 3s infinite' }}/>
      </div>

      {/* ── Main content ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', maxWidth:1200, margin:'0 auto', padding:'110px 5vw 60px', width:'100%', position:'relative', zIndex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center', width:'100%' }}>

          {/* ── LEFT: Text ── */}
          <div>
            {/* Badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(201,151,58,0.12)', border:'1px solid rgba(201,151,58,0.35)', color:'#c9973a', padding:'6px 18px', borderRadius:50, fontSize:'0.65rem', fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:28, animation:'fadeUp 0.7s ease 0.1s both', opacity:0 }}>
              <span style={{ width:7,height:7,borderRadius:'50%',background:'#c9973a',animation:'pulse 2s ease infinite',flexShrink:0 }}/>
              Trusted Since 2026 · Your Financial Safety Net
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'clamp(2.6rem,4.5vw,4rem)', fontWeight:900, color:'white', lineHeight:1.05, margin:'0 0 22px', animation:'fadeUp 0.7s ease 0.22s both', opacity:0 }}>
              Unite. Support.<br/>
              <em style={{ color:'#c9973a', fontStyle:'italic', position:'relative' }}>Prosper</em>
              <br/>as a Family.
            </h1>

            {/* Sub */}
            <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'1.05rem', lineHeight:2, maxWidth:480, margin:'0 0 28px', animation:'fadeUp 0.7s ease 0.36s both', opacity:0, fontWeight:500 }}>
              MUS Welfare Organization is Pakistan's trusted family welfare circle. We pool resources from job holders and students to create a transparent, community-managed fund that supports members in times of need — building financial security together.
            </p>

            {/* Why choose us - Quick highlight */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:40, animation:'fadeUp 0.7s ease 0.42s both', opacity:0 }}>
              {[
                { icon:'🛡️', text:'100% Transparent' },
                { icon:'🤝', text:'Community Driven' },
                { icon:'⚡', text:'Quick Support' },
                { icon:'📊', text:'Verified Members' },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'rgba(255,255,255,0.08)', borderRadius:10, border:'1px solid rgba(201,151,58,0.2)', backdropFilter:'blur(8px)' }}>
                  <span style={{ fontSize:'1.2rem' }}>{icon}</span>
                  <span style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.8)', fontWeight:600 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{ display:'flex', gap:14, flexWrap:'wrap', marginBottom:48, animation:'fadeUp 0.7s ease 0.5s both', opacity:0 }}>
              <a href="/signup" style={{ padding:'14px 32px', borderRadius:12, background:'linear-gradient(135deg,#c9973a,#e8b84b)', color:'#0f1a10', fontWeight:700, fontSize:'0.95rem', textDecoration:'none', fontFamily:'Sora,sans-serif', boxShadow:'0 6px 24px rgba(201,151,58,0.45)', transition:'all 0.22s', display:'inline-flex', alignItems:'center', gap:8 }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 32px rgba(201,151,58,0.55)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 6px 24px rgba(201,151,58,0.45)'; }}
              >
                Join as Member →
              </a>
              <button onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior:'smooth' })} style={{ padding:'14px 28px', borderRadius:12, background:'rgba(255,255,255,0.07)', color:'white', fontWeight:600, fontSize:'0.95rem', border:'1px solid rgba(255,255,255,0.18)', cursor:'pointer', fontFamily:'Sora,sans-serif', transition:'all 0.22s' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.14)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.18)'; }}
              >
                Learn More
              </button>
            </div>

            {/* Animated counters */}
            <div style={{ display:'flex', gap:0, animation:'fadeUp 0.7s ease 0.65s both', opacity:0 }}>
              {[
                { val: count.members, suffix:'+', label:'Active Members', icon:'👥' },
                { val: count.fund,    suffix:'k+', label:'PKR Fund', prefix:'PKR ', icon:'💰' },
                { val: count.months,  suffix:'',   label:'Months Active', icon:'📅' },
              ].map(({ val, suffix, label, prefix, icon }, i) => (
                <div key={label} style={{ flex:1, textAlign: i===1?'center':'left', paddingRight: i===0?24:0, paddingLeft: i===2?24:0, borderLeft: i>0?'1px solid rgba(255,255,255,0.1)':'' }}>
                  <div style={{ fontSize:'1.2rem', marginBottom:8 }}>{icon}</div>
                  <div style={{ fontFamily:'Fraunces,serif', fontSize:'clamp(1.6rem,2.5vw,2.2rem)', fontWeight:900, color:'white', lineHeight:1 }}>
                    {prefix}{val}{suffix}
                  </div>
                  <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.4)', marginTop:5, letterSpacing:'0.8px', textTransform:'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Logo + card ── */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:24, animation:'slideInRight 0.8s ease 0.4s both', opacity:0 }}>

            {/* Logo showcase */}
            <div style={{ position:'relative' }}>
              {/* Outer glow ring */}
              <div style={{ position:'absolute', inset:-16, borderRadius:'50%', background:'radial-gradient(circle,rgba(201,151,58,0.25) 0%,transparent 70%)', animation:'glow 3s ease-in-out infinite' }}/>
              {/* Dashed ring */}
              <svg style={{ position:'absolute', inset:-8, width:'calc(100% + 16px)', height:'calc(100% + 16px)', animation:'spin 20s linear infinite' }} viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(201,151,58,0.4)" strokeWidth="2" strokeDasharray="8 6"/>
              </svg>
              {/* Logo image */}
              <div style={{ width:200, height:200, borderRadius:'50%', overflow:'hidden', border:'4px solid rgba(201,151,58,0.6)', boxShadow:'0 0 0 8px rgba(201,151,58,0.12), 0 24px 64px rgba(0,0,0,0.5)', position:'relative', zIndex:1, transition:'transform 0.3s ease' }}>
                <img src="/mus.jpg" alt="MUS Welfare Organization" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              </div>
              {/* Verified badge */}
              <div style={{ position:'absolute', bottom:8, right:8, zIndex:2, width:40, height:40, borderRadius:'50%', background:'linear-gradient(135deg,#c9973a,#e8b84b)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(201,151,58,0.5)', border:'3px solid #081a0c', animation:'pulse 2s ease-in-out infinite' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
            </div>

            {/* Info card */}
            <div style={{ background:'rgba(255,255,255,0.06)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:20, padding:'28px 28px', width:'100%', maxWidth:360, boxShadow:'0 20px 60px rgba(0,0,0,0.3)', animation:'slideUp 0.7s ease 0.6s both', opacity:0, transition:'all 0.3s ease', cursor:'default' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
                <div style={{ fontSize:'1.2rem' }}>✨</div>
                <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.35)', letterSpacing:'2.5px', textTransform:'uppercase', fontWeight:700 }}>Why Choose MUS</div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { emoji:'🏦', title:'Fully Transparent', desc:'Every rupee tracked & visible' },
                  { emoji:'⚡', title:'Quick Disbursement', desc:'Support when you need it most' },
                  { emoji:'🛡️', title:'Verified Members', desc:'Screened & approved by committee' },
                  { emoji:'🤝', title:'Community Focus', desc:'Collective strength & support' },
                ].map(({ emoji, title, desc }) => (
                  <div key={title} style={{ padding:'12px 14px', background:'rgba(255,255,255,0.04)', borderRadius:10, border:'1px solid rgba(255,255,255,0.08)', transition:'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor='rgba(201,151,58,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                      <span style={{ fontSize:'1rem' }}>{emoji}</span>
                      <span style={{ fontSize:'0.8rem', color:'#c9973a', fontWeight:700 }}>{title}</span>
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.5)', paddingLeft:24 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, paddingBottom:28, position:'relative', zIndex:1, animation:'bounce 2.5s ease-in-out infinite', opacity:0.45 }}>
        <span style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.5)', letterSpacing:'2.5px', textTransform:'uppercase' }}>Scroll</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
      </div>
    </section>
  );
}

/* ─── About Section ─── */
function About() {
  const values = [
    { icon: '🤝', title: 'Community First',    desc: 'Every decision benefits the collective. Your voice matters in how we manage and distribute the fund.' },
    { icon: '🔍', title: 'Complete Transparency',  desc: 'Monthly fund reports, detailed expense tracking, and real-time member access. Nothing hidden.' },
    { icon: '🛡️', title: 'Verified Members',   desc: 'Every member undergoes committee review. We ensure trust and accountability at every level.' },
    { icon: '📈', title: 'Growing Stronger',   desc: 'As our community grows, so does our collective fund and ability to support each other in times of need.' },
  ];
  return (
    <Section id="about" bg="#f8faf5">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <div>
          <SectionTag>About MUS Welfare</SectionTag>
          <h2 style={{ fontFamily: "Fraunces,serif", fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 900, color: "#0f1a10", lineHeight: 1.1, margin: "0 0 20px" }}>
            Your financial safety net in <em style={{ color: "#1a4a24", fontStyle: "italic" }}>uncertain times.</em>
          </h2>
          <p style={{ color: "#52695a", fontSize: "0.95rem", lineHeight: 1.85, margin: "0 0 16px" }}>
            MUS Welfare Organization was founded to create a reliable, transparent fund managed by our community. Whether you're a working professional or a student, we believe everyone deserves access to genuine financial support backed by people who care.
          </p>
          <p style={{ color: "#52695a", fontSize: "0.95rem", lineHeight: 1.85, margin: "0 0 16px" }}>
            Our members contribute monthly — job holders from PKR 500, students from PKR 100 — and the pooled fund is disbursed to support members facing medical emergencies, education costs, or family hardships.
          </p>
          <p style={{ color: "#52695a", fontSize: "0.95rem", lineHeight: 1.85, margin: "0 0 32px" }}>
            With verified membership, transparent governance, and swift disbursement, MUS Welfare is changing how communities support each other.
          </p>
          <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 28px", borderRadius: 12, background: "linear-gradient(135deg,#1a4a24,#2d6a3f)", color: "white", fontWeight: 700, fontSize: "0.9rem", textDecoration: "none", fontFamily: "Sora,sans-serif", boxShadow: "0 4px 16px rgba(26,74,36,0.3)", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(26,74,36,0.4)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,74,36,0.3)"; }}
          >
            Become a Member Today →
          </a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {values.map(({ icon, title, desc }) => (
            <div key={title} style={{ background: "white", borderRadius: 16, padding: "22px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(26,74,36,0.08)", transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s cubic-bezier(0.22,1,0.36,1)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.12)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"; }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>{icon}</div>
              <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: "0.95rem", color: "#0f1a10", marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: "0.8rem", color: "#6b7c6d", lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── How It Works Section ─── */
function HowItWorks() {
  const steps = [
    { n: "01", title: "Apply for Membership",   desc: "Fill out a quick signup form with your details. Choose your membership type — Job Holder (PKR 500) or Student (PKR 100).", icon: "📝" },
    { n: "02", title: "Committee Review",       desc: "Our admin committee reviews your application to verify authenticity and eligibility. Approval usually takes 24-48 hours.", icon: "✅" },
    { n: "03", title: "Start Contributing",     desc: "Once approved, your membership is active. Record your monthly contribution through the member dashboard securely.", icon: "💳" },
    { n: "04", title: "Access Support",         desc: "Need help? Apply for disbursement with your request. Get transparent processing and community backing for your needs.", icon: "🤲" },
  ];
  return (
    <Section id="how" bg="white">
      <div style={{ textAlign: "center", marginBottom: 56 }}>
        <SectionTag>How It Works</SectionTag>
        <h2 style={{ fontFamily: "Fraunces,serif", fontSize: "clamp(2rem,3.5vw,2.8rem)", fontWeight: 900, color: "#0f1a10", lineHeight: 1.1, margin: "0 auto 16px", maxWidth: 560 }}>
          Simple steps to financial security.
        </h2>
        <p style={{ color: "#6b7c6d", fontSize: "0.95rem", maxWidth: 560, margin: "0 auto", lineHeight: 1.8 }}>
          From signup to your first contribution takes just 5 minutes. Join thousands of members already experiencing the peace of mind that comes with community support.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 24 }}>
        {steps.map(({ n, title, desc, icon }, i) => (
          <div key={n} style={{ position: "relative", background: "#f8faf5", borderRadius: 20, padding: "32px 24px", border: "1.5px solid rgba(26,74,36,0.12)", transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)", animation:`slideUp 0.6s ease ${0.1 + i * 0.1}s both` }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-8px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(26,74,36,0.15)"; e.currentTarget.style.borderColor = "rgba(26,74,36,0.25)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; e.currentTarget.style.borderColor = "rgba(26,74,36,0.12)"; }}
          >
            {i < steps.length - 1 && (
              <div style={{ position: "absolute", top: "50%", right: -16, transform: "translateY(-50%)", width: 32, height: 2, background: "linear-gradient(90deg,rgba(26,74,36,0.3) 0%,transparent 100%)", display: "none" }} className="step-arrow"/>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#e8f5eb,#c8e6c9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0, boxShadow: "0 4px 12px rgba(45,106,63,0.15)" }}>{icon}</div>
              <div style={{ fontFamily: "Fraunces,serif", fontSize: "2rem", fontWeight: 900, color: "rgba(26,74,36,0.15)", lineHeight: 1 }}>{n}</div>
            </div>
            <div style={{ fontFamily: "Fraunces,serif", fontWeight: 700, fontSize: "1.05rem", color: "#0f1a10", marginBottom: 12 }}>{title}</div>
            <div style={{ fontSize: "0.85rem", color: "#6b7c6d", lineHeight: 1.7, marginBottom: 16 }}>{desc}</div>
            {i === 0 && <div style={{ paddingTop: 16, borderTop: "1px solid rgba(26,74,36,0.08)" }}>⏱️ Takes ~2 minutes</div>}
            {i === 1 && <div style={{ paddingTop: 16, borderTop: "1px solid rgba(26,74,36,0.08)" }}>⏱️ Usually 24-48 hours</div>}
            {i === 2 && <div style={{ paddingTop: 16, borderTop: "1px solid rgba(26,74,36,0.08)" }}>💰 PKR 100–500 monthly</div>}
            {i === 3 && <div style={{ paddingTop: 16, borderTop: "1px solid rgba(26,74,36,0.08)" }}>✨ Community-backed</div>}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 56 }}>
        <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "16px 40px", borderRadius: 12, background: "linear-gradient(135deg,#1a4a24,#2d6a3f)", color: "white", fontWeight: 700, fontSize: "0.96rem", textDecoration: "none", fontFamily: "Sora,sans-serif", boxShadow: "0 4px 20px rgba(26,74,36,0.3)", transition: "all 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(26,74,36,0.4)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(26,74,36,0.3)"; }}
        >
          Start Your Journey Today →
        </a>
      </div>
    </Section>
  );
}

/* ─── Contact Section ─── */
function Contact() {
  const [form,    setForm]    = React.useState({ name: "", email: "", message: "" });
  const [sent,    setSent]    = React.useState(false);
  const [focused, setFocused] = React.useState("");

  const handleSubmit = e => {
    e.preventDefault();
    if (form.name && form.email && form.message) setSent(true);
  };

  const inputSt = (field) => ({
    width: "100%", padding: "12px 14px",
    border: "1.5px solid " + (focused === field ? "#1a4a24" : "rgba(26,74,36,0.18)"),
    borderRadius: 10, fontSize: "0.9rem", color: "#0f1a10",
    outline: "none", fontFamily: "Sora,sans-serif", background: focused === field ? "#fafff8" : "#f8faf6",
    boxShadow: focused === field ? "0 0 0 3px rgba(26,74,36,0.08)" : "none",
    transition: "all 0.2s", boxSizing: "border-box",
  });

  return (
    <Section id="contact" bg="#f8faf5">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
        {/* Left */}
        <div style={{ animation: 'slideUp 0.6s ease 0.2s both' }}>
          <SectionTag>Questions?</SectionTag>
          <h2 style={{ fontFamily: "Fraunces,serif", fontSize: "clamp(2rem,3.5vw,2.6rem)", fontWeight: 900, color: "#0f1a10", lineHeight: 1.1, margin: "0 0 20px" }}>
            Reach out to our committee.
          </h2>
          <p style={{ color: "#52695a", fontSize: "0.95rem", lineHeight: 1.85, margin: "0 0 36px" }}>
            Questions about membership, contribution amounts, fund management, or how to apply for support? Our executive committee is here to help and will respond within 24 hours.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Email */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "white", borderRadius: 12, border: "1px solid rgba(26,74,36,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,74,36,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#e8f5eb,#d1f0da)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>📧</div>
              <div>
                <div style={{ fontSize: "0.68rem", color: "#8a9e8c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Email</div>
                <a href="mailto:committee@muswelfare.org" style={{ fontSize: "0.88rem", color: "#1a4a24", fontWeight: 600, textDecoration: "none" }}>committee@muswelfare.org</a>
              </div>
            </div>

            {/* Location */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "white", borderRadius: 12, border: "1px solid rgba(26,74,36,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,74,36,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)"; }}
            >
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#e8f5eb,#d1f0da)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>📍</div>
              <div>
                <div style={{ fontSize: "0.68rem", color: "#8a9e8c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Location</div>
                <div style={{ fontSize: "0.88rem", color: "#0f1a10", fontWeight: 600 }}>Pakistan</div>
              </div>
            </div>

            {/* Response time */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "linear-gradient(135deg,rgba(26,74,36,0.05),rgba(45,106,63,0.05))", borderRadius: 12, border: "1.5px solid rgba(26,74,36,0.15)", transition: "all 0.2s" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#e8f5eb,#d1f0da)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>⚡</div>
              <div>
                <div style={{ fontSize: "0.68rem", color: "#8a9e8c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>Response Time</div>
                <div style={{ fontSize: "0.88rem", color: "#0f1a10", fontWeight: 600 }}>Within 24 hours</div>
              </div>
            </div>

            {/* Social icon row */}
            <div style={{ padding: "20px 20px", background: "white", borderRadius: 12, border: "1px solid rgba(26,74,36,0.1)", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: "0.68rem", color: "#8a9e8c", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 14 }}>Connect With Us</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>

                {/* WhatsApp */}
                <a href="https://chat.whatsapp.com/EJYpB826XNBKQ2ouxDnI4O" target="_blank" rel="noopener noreferrer" title="WhatsApp"
                  style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#25d366,#128c7e)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease", boxShadow: "0 10px 28px rgba(37,211,102,0.18)", willChange: "transform" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.08)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(37,211,102,0.35)"; e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 10px 28px rgba(37,211,102,0.18)"; e.currentTarget.style.opacity = "1"; }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </a>

                {/* Facebook */}
                <a href="https://www.facebook.com/share/g/1EdsUY4W7f/" target="_blank" rel="noopener noreferrer" title="Facebook"
                  style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#1877f2,#0d5dbf)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease", boxShadow: "0 10px 28px rgba(24,119,242,0.18)", willChange: "transform" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.08)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(24,119,242,0.35)"; e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 10px 28px rgba(24,119,242,0.18)"; e.currentTarget.style.opacity = "1"; }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* Phone */}
                <a href="tel:+923485185767" title="Call us"
                  style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg,#1a4a24,#2d6a3f)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", transition: "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease", boxShadow: "0 10px 28px rgba(26,74,36,0.18)", willChange: "transform" }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px) scale(1.08)"; e.currentTarget.style.boxShadow = "0 14px 36px rgba(26,74,36,0.35)"; e.currentTarget.style.opacity = "1"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 10px 28px rgba(26,74,36,0.18)"; e.currentTarget.style.opacity = "1"; }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                </a>

              </div>
            </div>

          </div>
        </div>

        {/* Right — form */}
        <div style={{ background: "white", borderRadius: 20, padding: "40px 36px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid rgba(26,74,36,0.08)", animation: 'slideUp 0.6s ease 0.3s both' }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "40px 0", animation: 'slideUp 0.6s ease both' }}>
              <div style={{ fontSize: "3.5rem", marginBottom: 16, animation: 'pulse 1s ease 0.5s infinite' }}>✅</div>
              <h3 style={{ fontFamily: "Fraunces,serif", fontSize: "1.3rem", fontWeight: 700, color: "#1a4a24", marginBottom: 8 }}>Thank You!</h3>
              <p style={{ color: "#6b7c6d", fontSize: "0.9rem", lineHeight: 1.6 }}>Your message has been received. Our committee will review it and get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h3 style={{ fontFamily: "Fraunces,serif", fontSize: "1.3rem", fontWeight: 700, color: "#0f1a10", margin: "0 0 28px" }}>Send us a Message</h3>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="contact-name" style={{ display: "block", marginBottom: 6, fontSize: "0.72rem", fontWeight: 700, color: "#52695a", textTransform: "uppercase", letterSpacing: "0.8px" }}>Full Name</label>
                  <input id="contact-name" name="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" required
                    style={inputSt("name")} onFocus={() => setFocused("name")} onBlur={() => setFocused("")}/>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="contact-email" style={{ display: "block", marginBottom: 6, fontSize: "0.72rem", fontWeight: 700, color: "#52695a", textTransform: "uppercase", letterSpacing: "0.8px" }}>Email Address</label>
                <input id="contact-email" name="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="sultanyasir990@@email.com" required
                  style={inputSt("email")} onFocus={() => setFocused("email")} onBlur={() => setFocused("")}/>
              </div>
              <div style={{ marginBottom: 28 }}>
                <label htmlFor="contact-message" style={{ display: "block", marginBottom: 6, fontSize: "0.72rem", fontWeight: 700, color: "#52695a", textTransform: "uppercase", letterSpacing: "0.8px" }}>Message</label>
                <textarea id="contact-message" name="message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us about your inquiry..." rows={4} required
                  style={{ ...inputSt("message"), resize: "vertical", minHeight: 110 }} onFocus={() => setFocused("message")} onBlur={() => setFocused("")}/>
              </div>
              <button type="submit" style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#1a4a24,#2d6a3f)", color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.94rem", cursor: "pointer", fontFamily: "Sora,sans-serif", boxShadow: "0 4px 16px rgba(26,74,36,0.28)", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 7px 22px rgba(26,74,36,0.38)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 16px rgba(26,74,36,0.28)"; }}
              >
                Send Message →
              </button>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer style={{ background: "linear-gradient(180deg,#081a0c,#0a1f0e)", padding: "48px 5vw 28px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 48, marginBottom: 40 }}>
          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 60 60">
                  <path d="M10 42 Q7 25 22 14 Q30 8 40 13 L36 20 Q28 11 20 20 Q7 30 15 44Z" fill="white"/>
                  <path d="M50 18 Q53 35 38 46 Q30 52 20 47 L24 40 Q32 49 40 40 Q53 30 45 16Z" fill="#8fbc8f"/>
                  <ellipse cx="30" cy="32" rx="9" ry="6" fill="#c9973a"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "Fraunces,serif", fontWeight: 900, fontSize: "1rem", color: "white" }}>MUS Welfare</div>
                <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.35)", letterSpacing: "2.5px", textTransform: "uppercase" }}>Organization</div>
              </div>
            </div>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", lineHeight: 1.8, maxWidth: 300 }}>
              A trusted family welfare circle — pooling resources, building futures, and strengthening our community together.
            </p>
          </div>
          {/* Quick links */}
          <div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>Quick Links</div>
            {["Home","About","How It Works","Contact"].map(l => (
              <button key={l} onClick={() => document.querySelector("#" + l.toLowerCase().replace(/ /g,"").replace("itworks","how"))?.scrollIntoView({ behavior: "smooth" })} style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", padding: "5px 0", fontFamily: "Sora,sans-serif", transition: "color 0.2s", textAlign: "left" }}
                onMouseEnter={e => e.currentTarget.style.color = "white"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >{l}</button>
            ))}
          </div>
          {/* Member */}
          <div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 700, marginBottom: 16 }}>Members</div>
            {[["Log In","/login"],["Sign Up","/signup"]].map(([l,h]) => (
              <a key={l} href={h} style={{ display: "block", color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", padding: "5px 0", textDecoration: "none", fontFamily: "Sora,sans-serif", transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "white"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >{l}</a>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", margin: 0 }}>
            © {new Date().getFullYear()} MUS Welfare Organization. All rights reserved.
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", margin: 0 }}>
            Executive Committee 2026–2027 • Developed by Yasir Sultan
          </p>
          {/* Social icons in footer */}
          <div style={{ display: "flex", gap: 10 }}>
            <a href="https://chat.whatsapp.com/EJYpB826XNBKQ2ouxDnI4O" target="_blank" rel="noopener noreferrer" title="WhatsApp" style={{ width: 34, height: 34, borderRadius: 12, background: "linear-gradient(135deg,#25d366,#128c7e)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease", opacity: 0.9, boxShadow: "0 8px 18px rgba(37,211,102,0.24)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.08)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(37,211,102,0.35)"; e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 18px rgba(37,211,102,0.24)"; e.currentTarget.style.opacity = "0.9"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </a>
            <a href="https://www.facebook.com/share/g/1EdsUY4W7f/" target="_blank" rel="noopener noreferrer" title="Facebook" style={{ width: 34, height: 34, borderRadius: 12, background: "linear-gradient(135deg,#1877f2,#0d5dbf)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease", opacity: 0.9, boxShadow: "0 8px 18px rgba(24,119,242,0.24)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.08)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(24,119,242,0.35)"; e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 18px rgba(24,119,242,0.24)"; e.currentTarget.style.opacity = "0.9"; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <a href="tel:+923485185767" title="Call us" style={{ width: 34, height: 34, borderRadius: 12, background: "linear-gradient(135deg,#1a4a24,#2d6a3f)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease", opacity: 0.9, boxShadow: "0 8px 18px rgba(26,74,36,0.24)" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px) scale(1.08)"; e.currentTarget.style.boxShadow = "0 14px 32px rgba(26,74,36,0.35)"; e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 18px rgba(26,74,36,0.24)"; e.currentTarget.style.opacity = "0.9"; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════
   MAIN LANDING PAGE EXPORT
═══════════════════════════════════════════ */
import React from "react";

export default function Landing() {
  const [activeSection, setActiveSection] = React.useState("home");

  React.useEffect(() => {
    const sections = ["home","about","how","contact"];
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); });
      },
      { threshold: 0.4 }
    );
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const fadeElements = Array.from(document.querySelectorAll('.fade-element'));
    const fadeObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          } else {
            entry.target.classList.remove('visible');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );
    fadeElements.forEach(el => fadeObserver.observe(el));
    return () => fadeObserver.disconnect();
  }, []);

  return (
    <div className="fade-element" style={{ fontFamily: "Sora,sans-serif" }}>
      <style>{`
        .fade-element {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.85s ease, transform 0.85s ease;
          will-change: opacity, transform;
        }
        .fade-element.visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes orb1 {
          0% { transform: translate(0, 0); }
          25% { transform: translate(20px, -30px); }
          50% { transform: translate(-20px, 0); }
          75% { transform: translate(30px, 20px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes orb2 {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-30px, 20px); }
          50% { transform: translate(20px, 30px); }
          75% { transform: translate(-20px, -30px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes orb3 {
          0% { transform: translate(0, 0); }
          25% { transform: translate(15px, 25px); }
          50% { transform: translate(-25px, 15px); }
          75% { transform: translate(25px, -20px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(201,151,58,0.4), 0 0 40px rgba(201,151,58,0.2); }
          50% { box-shadow: 0 0 30px rgba(201,151,58,0.6), 0 0 60px rgba(201,151,58,0.3); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <Navbar activeSection={activeSection}/>
      <Hero/>
      <About/>
      <HowItWorks/>
      <Contact/>
      <Footer/>
    </div>
  );
}
