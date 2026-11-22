export const authCss = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600&display=swap');

.au {
  --accent: #39ffb0; --accent-rgb: 57, 255, 176;
  --line: rgba(255,255,255,.1); --text: #c4c5cb; --dim: #7b7c85; --hi: #f3f3f5; --danger: #ff7a7a;
  min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px;
  background: radial-gradient(900px circle at 50% -10%, rgba(var(--accent-rgb), .1), transparent 60%), #050506;
  color: var(--text); font-family: Sora, sans-serif; -webkit-font-smoothing: antialiased;
}
.au * { box-sizing: border-box; }
.au-card { width: 100%; max-width: 420px; animation: auRise .9s cubic-bezier(.22,1,.36,1) both; }
@keyframes auRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
@keyframes auSpin { to { transform: rotate(360deg); } }

.au-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 44px; text-decoration: none; }
.au-brand img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,.14); }
.au-brand b { display: block; font-weight: 400; font-size: .95rem; color: var(--hi); line-height: 1.1; }
.au-brand small { display: block; margin-top: 3px; font-size: .55rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); }

.au-eyebrow { display: inline-flex; align-items: center; gap: 12px; font-size: .68rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-bottom: 24px; }
.au-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); }
.au-h { font-size: clamp(1.8rem, 5vw, 2.3rem); font-weight: 200; line-height: 1.15; letter-spacing: -0.02em; color: var(--hi); margin: 0 0 16px; }
.au-sub { font-size: .88rem; line-height: 1.8; font-weight: 300; color: var(--dim); margin: 0 0 40px; }

.au-notice { padding: 14px 0 14px 16px; margin-bottom: 32px; border-left: 1px solid; font-size: .82rem; line-height: 1.7; font-weight: 300; }
.au-ok  { border-color: var(--accent); color: var(--hi); }
.au-err { border-color: var(--danger); color: #ffb3b3; }

.au-fw { margin-bottom: 34px; }
.au-fw label { display: block; font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 10px; transition: color .5s; }
.au-fw:focus-within label { color: var(--accent); }
.au-in { position: relative; }
.au-in input { width: 100%; background: transparent; border: none; border-bottom: 1px solid rgba(255,255,255,.16); color: var(--hi); font: inherit; font-size: .95rem; font-weight: 300; padding: 10px 0 14px; outline: none; transition: border-color .6s; }
.au-in input:focus { border-bottom-color: var(--accent); }
.au-in input::placeholder { color: #4d4e55; }
.au-in input:-webkit-autofill { -webkit-text-fill-color: var(--hi); transition: background-color 99999s ease; }
.au-tg { position: absolute; right: 0; bottom: 12px; background: none; border: none; cursor: pointer; color: var(--dim); font: inherit; font-size: .62rem; letter-spacing: 2px; text-transform: uppercase; padding: 4px 0; }
.au-tg:hover { color: var(--hi); }

.au-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 15px 34px; background: var(--accent); color: #04110b; font: inherit; font-weight: 600; font-size: .85rem; letter-spacing: .5px; text-decoration: none; border: 1px solid var(--accent); border-radius: 999px; cursor: pointer; transition: box-shadow .6s ease, transform .6s ease; }
.au-btn:hover:not(:disabled) { box-shadow: 0 0 40px rgba(var(--accent-rgb), .35); transform: translateY(-1px); }
.au-btn:disabled { opacity: .6; cursor: wait; }
.au-spin { width: 14px; height: 14px; border: 2px solid rgba(4,17,11,.3); border-top-color: #04110b; border-radius: 50%; animation: auSpin .8s linear infinite; }
.au-alt { margin-top: 32px; text-align: center; font-size: .83rem; font-weight: 300; color: var(--dim); }
.au-alt a { color: var(--hi); text-decoration: none; border-bottom: 1px solid rgba(var(--accent-rgb), .5); padding-bottom: 2px; transition: color .4s; }
.au-alt a:hover { color: var(--accent); }
@media (prefers-reduced-motion: reduce) { .au-card { animation: none; } }
`;