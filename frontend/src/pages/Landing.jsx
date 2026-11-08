import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ─── Logo ─── */
function OrgLogo({ size = 34 }) {
  return (
    <img
      src="/mus.jpg"
      alt="MUS Welfare logo"
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.14)' }}
    />
  );
}

/* ─── Icons (thin outline) ─── */
const Ic = ({ children }) => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const ICONS = {
  home:    <Ic><path d="M3 11l9-8 9 8" /><path d="M5 10v10h5v-6h4v6h5V10" /></Ic>,
  about:   <Ic><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></Ic>,
  how:     <Ic><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" /></Ic>,
  contact: <Ic><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Ic>,
  account: <Ic><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></Ic>,
};

/* ─── Top bar (brand + auth only) ─── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`nav ${scrolled ? 'nav-solid' : ''}`}>
      <div className="nav-inner">
        <div className="brand">
          <OrgLogo size={34} />
          <div>
            <div className="brand-name">MUS Welfare</div>
            <div className="brand-sub">Organization</div>
          </div>
        </div>
        <div className="nav-auth">
          <Link to="/login" className="btn-text">Log In</Link>
          <Link to="/signup" className="btn btn-sm">Join Now</Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Floating dock with sliding light cone ─── */
const DOCK = [
  { id: 'home',    label: 'Home',         icon: ICONS.home },
  { id: 'about',   label: 'About',        icon: ICONS.about },
  { id: 'how',     label: 'How It Works', icon: ICONS.how },
  { id: 'contact', label: 'Contact',      icon: ICONS.contact },
];

function Dock({ activeSection }) {
  const idx = Math.max(0, DOCK.findIndex(d => d.id === activeSection));

  const go = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="dock-wrap">
      <nav className="dock" aria-label="Sections" style={{ '--i': idx }}>
        <div className="dock-cone" />
        <div className="dock-grid">
          {DOCK.map(({ id, label, icon }) => (
            <button
              key={id}
              className={`dock-item ${activeSection === id ? 'active' : ''}`}
              onClick={() => go(id)}
              aria-label={label}
              title={label}
              aria-current={activeSection === id ? 'true' : undefined}
            >
              <span className="dock-ic">{icon}</span>
            </button>
          ))}
          <Link to="/login" className="dock-item" aria-label="Log in" title="Log in">
            <span className="dock-ic">{ICONS.account}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({ id, children, alt = false }) {
  return (
    <section id={id} className={`section ${alt ? 'section-alt' : ''}`}>
      <div className="container reveal">{children}</div>
    </section>
  );
}

function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
}

/* ─── Hero ─── */
function Hero() {
  const [count, setCount] = useState({ members: 0, fund: 0, months: 0 });

  useEffect(() => {
    const targets = { members: 120, fund: 850, months: 18 };
    const duration = 2600;
    const steps = 80;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 3);
      setCount({
        members: Math.round(targets.members * ease),
        fund: Math.round(targets.fund * ease),
        months: Math.round(targets.months * ease),
      });
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    { val: count.members, suffix: '+', label: 'Active members' },
    { val: count.fund, prefix: 'PKR ', suffix: 'k+', label: 'Pooled fund' },
    { val: count.months, suffix: '', label: 'Months active' },
  ];

  return (
    <section id="home" className="hero">
      <div className="hero-glow" />
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow rise" style={{ animationDelay: '0.2s' }}>
            <span className="dot" /> Family welfare circle · Est. 2026
          </div>

          <h1 className="hero-title rise" style={{ animationDelay: '0.45s' }}>
            Unite. Support.<br /><span className="accent">Prosper</span> as a family.
          </h1>

          <p className="hero-sub rise" style={{ animationDelay: '0.75s' }}>
            A transparent, community-managed fund. Job holders and students pool
            small monthly contributions, so help is there when a member needs it.
          </p>

          <div className="rise" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', animationDelay: '1s' }}>
            <a href="/signup" className="btn">Join as member</a>
            <button className="btn btn-ghost" onClick={() => document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn more
            </button>
          </div>

          <div className="stats rise" style={{ animationDelay: '1.3s' }}>
            {stats.map(({ val, suffix, label, prefix }) => (
              <div key={label} className="stat">
                <div className="stat-num">{prefix}{val}{suffix}</div>
                <div className="stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* One-side-lit logo render */}
        <div className="hero-visual rise" style={{ animationDelay: '0.6s', animationDuration: '2s' }}>
          <div className="render">
            <img src="/mus.jpg" alt="MUS Welfare Organization" />
            <div className="render-shade" />
            <div className="render-rim" />
          </div>
          <div className="render-floor" />
        </div>
      </div>
    </section>
  );
}

/* ─── About ─── */
function About() {
  const values = [
    { title: 'Community first', desc: 'Every decision benefits the collective. Members have a voice in how the fund is managed and used.' },
    { title: 'Complete transparency', desc: 'Monthly fund reports and detailed expense tracking, visible to every member.' },
    { title: 'Verified members', desc: 'Each member is reviewed by the committee, so trust and accountability hold at every level.' },
    { title: 'Growing stronger', desc: 'As the community grows, so does the fund and our ability to support one another.' },
  ];
  return (
    <Section id="about" alt>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div>
          <Eyebrow>About</Eyebrow>
          <h2 className="h2">A financial safety net, <span className="dim">built by the people it protects.</span></h2>
          <p className="body">
            MUS Welfare Organization was founded to create a reliable, transparent fund managed by
            its own community. Whether you are a working professional or a student, you contribute
            what you can and are backed by people who care.
          </p>
          <p className="body">
            Members contribute monthly — job holders from PKR 500, students from PKR 100 — and the
            pooled fund supports members facing medical emergencies, education costs, or family hardship.
          </p>
          <a href="/signup" className="btn" style={{ marginTop: 24 }}>Become a member</a>
        </div>

        <div className="list">
          {values.map(({ title, desc }, i) => (
            <div key={title} className="list-row">
              <div className="list-n">0{i + 1}</div>
              <div>
                <div className="list-title">{title}</div>
                <div className="list-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── How it works ─── */
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Apply', desc: 'Fill out the signup form and choose a membership type: Job Holder (PKR 500) or Student (PKR 100).', meta: 'About 2 minutes' },
    { n: '02', title: 'Review', desc: 'The committee verifies your application for authenticity and eligibility.', meta: 'Usually 24–48 hours' },
    { n: '03', title: 'Contribute', desc: 'Once approved, record your monthly contribution through the member dashboard.', meta: 'PKR 100–500 monthly' },
    { n: '04', title: 'Receive support', desc: 'Need help? Submit a disbursement request and get transparent processing with community backing.', meta: 'Community-backed' },
  ];
  return (
    <Section id="how">
      <div style={{ maxWidth: 640, marginBottom: 96 }}>
        <Eyebrow>How it works</Eyebrow>
        <h2 className="h2">Four quiet steps.</h2>
        <p className="body">From signup to your first contribution takes only a few minutes.</p>
      </div>
      <div className="steps">
        {steps.map(({ n, title, desc, meta }) => (
          <div key={n} className="step">
            <div className="step-n">{n}</div>
            <div className="list-title">{title}</div>
            <div className="list-desc">{desc}</div>
            <div className="step-meta">{meta}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 96 }}>
        <a href="/signup" className="btn">Start your journey</a>
      </div>
    </Section>
  );
}

/* ─── Contact ─── */
function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    if (form.name && form.email && form.message) setSent(true);
  };

  const rows = [
    { label: 'Email', node: <a href="mailto:committee@muswelfare.org">committee@muswelfare.org</a> },
    { label: 'Location', node: <span>Pakistan</span> },
    { label: 'Response time', node: <span>Within 24 hours</span> },
    {
      label: 'Connect',
      node: (
        <span className="links">
          <a href="https://chat.whatsapp.com/EJYpB826XNBKQ2ouxDnI4O" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a href="https://www.facebook.com/share/g/1EdsUY4W7f/" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="tel:+923485185767">Call</a>
        </span>
      ),
    },
  ];

  return (
    <Section id="contact" alt>
      <div className="grid2" style={{ alignItems: 'start' }}>
        <div>
          <Eyebrow>Contact</Eyebrow>
          <h2 className="h2">Reach out to the committee.</h2>
          <p className="body">
            Questions about membership, contribution amounts, fund management, or applying for support?
            We are happy to help.
          </p>
          <div className="list" style={{ marginTop: 48 }}>
            {rows.map(({ label, node }) => (
              <div key={label} className="contact-row">
                <div className="contact-label">{label}</div>
                <div className="contact-val">{node}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          {sent ? (
            <div style={{ padding: '40px 0' }}>
              <div className="eyebrow"><span className="dot" /> Received</div>
              <h3 className="h3">Thank you.</h3>
              <p className="body">Your message has been received. The committee will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <h3 className="h3" style={{ marginBottom: 40 }}>Send a message</h3>
              <label htmlFor="contact-name" className="field-label">Full name</label>
              <input id="contact-name" className="field" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Your name" required />

              <label htmlFor="contact-email" className="field-label">Email address</label>
              <input id="contact-email" type="email" className="field" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@email.com" required />

              <label htmlFor="contact-message" className="field-label">Message</label>
              <textarea id="contact-message" rows={4} className="field" value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Tell us about your inquiry" required />

              <button type="submit" className="btn" style={{ marginTop: 32 }}>Send message</button>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}

/* ─── Footer ─── */
function Footer() {
  const scrollMap = { Home: '#home', About: '#about', 'How It Works': '#how', Contact: '#contact' };
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 20 }}>
              <OrgLogo size={34} />
              <div>
                <div className="brand-name">MUS Welfare</div>
                <div className="brand-sub">Organization</div>
              </div>
            </div>
            <p className="footer-text" style={{ maxWidth: 320 }}>
              A trusted family welfare circle — pooling resources and strengthening our community together.
            </p>
          </div>
          <div>
            <div className="footer-head">Quick links</div>
            {Object.entries(scrollMap).map(([l, href]) => (
              <button key={l} className="footer-link" onClick={() => document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })}>{l}</button>
            ))}
          </div>
          <div>
            <div className="footer-head">Members</div>
            <a href="/login" className="footer-link">Log In</a>
            <a href="/signup" className="footer-link">Sign Up</a>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} MUS Welfare Organization</span>
          <span>Executive Committee 2026–2027 · Developed by Yasir Sultan</span>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════ MAIN EXPORT ═══════════════ */
export default function Landing() {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const ids = ['home', 'about', 'how', 'contact'];
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold: 0.4 }
    );
    ids.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mus">
      <style>{`
        .mus {
          --bg: #08080a; --bg2: #0d0d10; --line: rgba(255,255,255,0.08);
          --text: #c4c5cb; --dim: #7b7c85; --hi: #f3f3f5; --accent: #39ffb0; --accent-rgb: 57, 255, 176;
          font-family: Sora, sans-serif; background: var(--bg); color: var(--text);
          -webkit-font-smoothing: antialiased; overflow-x: hidden;
        }
        .mus * { box-sizing: border-box; }
        .mus button { font-family: inherit; }
        .mus a { color: inherit; }
        .container { max-width: 1200px; margin: 0 auto; width: 100%; }

        /* reveal */
        .reveal { opacity: 0; transform: translateY(24px); transition: opacity 1.4s cubic-bezier(.22,1,.36,1), transform 1.4s cubic-bezier(.22,1,.36,1); }
        .reveal.visible { opacity: 1; transform: none; }
        .rise { opacity: 0; animation: rise 1.4s cubic-bezier(.22,1,.36,1) forwards; }
        @keyframes rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: none; } }
        @keyframes breathe { 0%,100% { opacity: .55; } 50% { opacity: 1; } }

        /* type */
        .eyebrow { display: inline-flex; align-items: center; gap: 12px; font-size: .68rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-bottom: 32px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); animation: breathe 4s ease infinite; }
        .accent { color: var(--accent); }
        .dim { color: var(--dim); }
        .h2 { font-size: clamp(2rem, 3.6vw, 3.2rem); font-weight: 300; line-height: 1.15; letter-spacing: -0.02em; color: var(--hi); margin: 0 0 32px; }
        .h3 { font-size: 1.6rem; font-weight: 300; color: var(--hi); margin: 0 0 16px; letter-spacing: -0.01em; }
        .body { font-size: .98rem; line-height: 2; color: var(--text); margin: 0 0 20px; max-width: 520px; font-weight: 300; }

        /* buttons */
        .btn { display: inline-flex; align-items: center; justify-content: center; padding: 15px 34px; background: var(--accent); color: #04110b; font-weight: 600; font-size: .85rem; letter-spacing: .5px; text-decoration: none; border: 1px solid var(--accent); border-radius: 999px; cursor: pointer; transition: box-shadow .6s ease, transform .6s ease, background .6s ease; }
        .btn:hover { box-shadow: 0 0 40px rgba(57,255,176,.35); transform: translateY(-1px); }
        .btn-sm { padding: 9px 22px; }
        .btn-ghost { background: transparent; color: var(--hi); border-color: rgba(255,255,255,.2); }
        .btn-ghost:hover { background: rgba(255,255,255,.05); box-shadow: none; }
        .btn-text { color: var(--text); text-decoration: none; font-size: .85rem; padding: 8px 16px; transition: color .4s; }
        .btn-text:hover { color: var(--hi); }

        /* top bar */
        .nav { position: fixed; inset: 0 0 auto 0; z-index: 900; padding: 0 6vw; transition: background .8s ease, border-color .8s ease; border-bottom: 1px solid transparent; }
        .nav-solid { background: rgba(8,8,10,.8); backdrop-filter: blur(18px); border-bottom-color: var(--line); }
        .nav-inner { max-width: 1200px; margin: 0 auto; height: 76px; display: flex; align-items: center; justify-content: space-between; }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand-name { font-weight: 400; font-size: .95rem; color: var(--hi); line-height: 1.1; }
        .brand-sub { font-size: .55rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-top: 3px; }
        .nav-auth { display: flex; align-items: center; gap: 8px; }

        /* ───── floating dock ───── */
        .dock-wrap { position: fixed; left: 0; right: 0; bottom: 22px; z-index: 1000; display: flex; justify-content: center; padding: 0 16px; pointer-events: none; }
        .dock {
          position: relative; pointer-events: auto; width: min(520px, 100%); height: 74px; overflow: hidden;
          border-radius: 999px; border: 1px solid rgba(255,255,255,.16);
          background: linear-gradient(180deg, rgba(34,34,38,.72), rgba(16,16,19,.72));
          backdrop-filter: blur(22px) saturate(1.2); -webkit-backdrop-filter: blur(22px) saturate(1.2);
          box-shadow: 0 24px 60px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.08) inset;
        }
        .dock-grid { position: relative; z-index: 2; height: 100%; display: grid; grid-template-columns: repeat(5, 1fr); }
        .dock-item { display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; color: var(--dim); text-decoration: none; -webkit-tap-highlight-color: transparent; transition: color .5s ease; }
        .dock-item:hover { color: var(--hi); }
        .dock-ic { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1.5px solid transparent; transition: border-color .6s ease, background .6s ease, box-shadow .6s ease, transform .6s cubic-bezier(.22,1,.36,1); }
        .dock-item:hover .dock-ic { transform: translateY(-2px); }
        .dock-item.active { color: var(--hi); }
        .dock-item.active .dock-ic { border-color: rgba(255,255,255,.85); background: rgba(255,255,255,.05); box-shadow: 0 0 24px rgba(var(--accent-rgb), .25); }
        .dock-item:focus-visible .dock-ic { border-color: var(--accent); }

        .dock-cone { position: absolute; z-index: 1; top: 0; bottom: 0; left: 0; width: 20%; pointer-events: none; transform: translateX(calc(var(--i) * 100%)); transition: transform .9s cubic-bezier(.22,1,.36,1); }
        .dock-cone::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(var(--accent-rgb), .5), rgba(var(--accent-rgb), .12) 55%, rgba(var(--accent-rgb), 0) 100%); clip-path: polygon(36% 0, 64% 0, 100% 100%, 0 100%); filter: blur(3px); }
        .dock-cone::after { content: ''; position: absolute; top: 0; left: 50%; width: 28%; height: 4px; margin-left: -14%; border-radius: 0 0 6px 6px; background: var(--accent); box-shadow: 0 0 20px var(--accent), 0 0 44px rgba(var(--accent-rgb), .6); }

        /* sections */
        .section { padding: 180px 6vw; background: var(--bg); }
        .section-alt { background: var(--bg2); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 120px; }

        /* hero */
        .hero { min-height: 100vh; position: relative; display: flex; align-items: center; padding: 140px 6vw 140px; overflow: hidden; background: var(--bg); }
        .hero-glow { position: absolute; width: 900px; height: 900px; top: -200px; right: -150px; pointer-events: none; background: radial-gradient(circle at 30% 40%, rgba(255,255,255,.07), transparent 60%); }
        .hero-grid { display: grid; grid-template-columns: 1.05fr .95fr; gap: 80px; align-items: center; position: relative; z-index: 1; }
        .hero-title { font-size: clamp(2.8rem, 5.6vw, 5.2rem); font-weight: 200; line-height: 1.05; letter-spacing: -0.03em; color: var(--hi); margin: 0 0 40px; }
        .hero-sub { font-size: 1.02rem; line-height: 2; font-weight: 300; max-width: 470px; margin: 0 0 56px; color: var(--text); }
        .stats { display: flex; margin-top: 96px; border-top: 1px solid var(--line); padding-top: 36px; }
        .stat { flex: 1; padding-right: 24px; }
        .stat + .stat { padding-left: 32px; border-left: 1px solid var(--line); }
        .stat-num { font-size: clamp(1.4rem, 2.2vw, 2rem); font-weight: 200; color: var(--hi); letter-spacing: -0.01em; }
        .stat-label { font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); margin-top: 10px; }

        /* lit-from-the-left render */
        .hero-visual { display: flex; flex-direction: column; align-items: center; }
        .render { position: relative; width: min(440px, 80vw); aspect-ratio: 1; border-radius: 50%; overflow: hidden; box-shadow: -30px -10px 120px rgba(255,255,255,.07), 40px 50px 90px rgba(0,0,0,.9); }
        .render img { width: 100%; height: 100%; object-fit: cover; display: block; filter: contrast(1.05) saturate(.9); }
        .render-shade { position: absolute; inset: 0; background: linear-gradient(105deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.35) 40%, rgba(0,0,0,.92) 85%); pointer-events: none; }
        .render-rim { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; box-shadow: inset 3px 0 0 -1px rgba(57,255,176,.55), inset 14px 0 40px -18px rgba(57,255,176,.28); }
        .render-floor { width: 62%; height: 36px; margin-top: 36px; background: radial-gradient(ellipse at 35% 50%, rgba(0,0,0,.9), transparent 70%); filter: blur(10px); }

        /* about / lists */
        .list { border-top: 1px solid var(--line); }
        .list-row { display: flex; gap: 32px; padding: 36px 0; border-bottom: 1px solid var(--line); }
        .list-n { font-size: .7rem; letter-spacing: 2px; color: var(--accent); padding-top: 6px; min-width: 28px; }
        .list-title { font-size: 1.1rem; font-weight: 300; color: var(--hi); margin-bottom: 12px; }
        .list-desc { font-size: .88rem; line-height: 1.9; color: var(--dim); font-weight: 300; }

        /* steps */
        .steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 48px; }
        .step { border-top: 1px solid var(--line); padding-top: 32px; }
        .step-n { font-size: 3rem; font-weight: 100; color: rgba(255,255,255,.12); line-height: 1; margin-bottom: 32px; }
        .step-meta { margin-top: 28px; font-size: .62rem; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); }

        /* contact */
        .contact-row { display: flex; justify-content: space-between; align-items: baseline; padding: 26px 0; border-bottom: 1px solid var(--line); gap: 24px; }
        .contact-label { font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); }
        .contact-val { font-size: .92rem; color: var(--hi); font-weight: 300; text-align: right; }
        .contact-val a { text-decoration: none; transition: color .4s; }
        .contact-val a:hover { color: var(--accent); }
        .links { display: inline-flex; gap: 24px; }
        .field-label { display: block; font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 10px; }
        .field { width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,.14); color: var(--hi); font-family: inherit; font-size: .95rem; font-weight: 300; padding: 10px 0 14px; margin-bottom: 36px; outline: none; transition: border-color .6s; resize: vertical; }
        .field:focus { border-bottom-color: var(--accent); }
        .field::placeholder { color: #4d4e55; }

        /* footer (extra bottom room so the dock never covers it) */
        .footer { background: var(--bg); border-top: 1px solid var(--line); padding: 96px 6vw 140px; }
        .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 64px; margin-bottom: 80px; }
        .footer-head { font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 20px; }
        .footer-text { color: var(--dim); font-size: .85rem; line-height: 1.9; font-weight: 300; margin: 0; }
        .footer-link { display: block; background: none; border: none; cursor: pointer; padding: 6px 0; color: var(--text); font-size: .85rem; font-weight: 300; text-decoration: none; text-align: left; transition: color .4s; }
        .footer-link:hover { color: var(--accent); }
        .footer-bottom { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--line); padding-top: 28px; font-size: .72rem; color: var(--dim); }

        /* responsive */
        @media (max-width: 960px) {
          .section { padding: 112px 6vw; }
          .grid2, .hero-grid, .footer-grid { grid-template-columns: 1fr; gap: 72px; }
          .steps { grid-template-columns: 1fr 1fr; gap: 56px 32px; }
          .hero-visual { order: -1; }
          .stats { margin-top: 64px; }
        }
        @media (max-width: 560px) {
          .steps { grid-template-columns: 1fr; }
          .stats { flex-direction: column; gap: 28px; }
          .stat + .stat { padding-left: 0; border-left: none; }
          .nav-auth .btn-text { display: none; }
          .dock { height: 68px; }
          .dock-wrap { bottom: 16px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rise, .reveal, .dot { animation: none; transition: none; opacity: 1; transform: none; }
          .dock-cone, .dock-ic { transition-duration: .01s; }
        }
      `}</style>
      <Navbar />
      <Hero />
      <About />
      <HowItWorks />
      <Contact />
      <Footer />
      <Dock activeSection={activeSection} />
    </div>
  );
}