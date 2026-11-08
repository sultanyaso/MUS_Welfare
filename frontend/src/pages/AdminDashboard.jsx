import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminAPI, paymentAPI, announcementAPI } from '../api';
import FamilyTreePage from './FamilyTreePage';

/* ═══════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════ */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600&display=swap');

.ad {
  --bg: #050506; --panel: #0e0e10; --panel2: #161619;
  --line: rgba(255,255,255,0.08); --line2: rgba(255,255,255,0.14);
  --text: #c4c5cb; --dim: #7b7c85; --hi: #f3f3f5;
  --accent: #39ffb0; --accent-rgb: 57, 255, 176; --accent-ink: #04110b;
  --warn: #f5c26b; --warn-rgb: 245, 194, 107;
  --ok: #7fe3b0; --danger: #ff7a7a;
  display: flex; min-height: 100vh; background: var(--bg); color: var(--text);
  font-family: Sora, sans-serif; -webkit-font-smoothing: antialiased; color-scheme: dark;
}
.ad * { box-sizing: border-box; }
.ad { text-align: left; }
.ad button { font-family: inherit; }
.ad ::-webkit-scrollbar { width: 5px; height: 5px; }
.ad ::-webkit-scrollbar-track { background: transparent; }
.ad ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 3px; }
.ad :focus-visible { outline: 1px solid var(--accent); outline-offset: 2px; }

@keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
@keyframes grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes modalIn { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes toastIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes breathe { 0%,100% { opacity: .55; } 50% { opacity: 1; } }

/* mobile top bar helpers */
.sb-name { font-size: .95rem; color: var(--hi); line-height: 1.1; white-space: nowrap; }
.sb-sub { font-size: .55rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-top: 4px; white-space: nowrap; }
.topbar { display: none; }
.scrim { display: none; }

/* ───────── Floating Sidebar ───────── */
.nv-w {
  --tint: rgba(255,255,255,.04); --tint2: rgba(255,255,255,.08);
  position: fixed; left: 0; top: 0; height: 100vh; height: 100dvh; width: 304px; padding: 14px;
  z-index: 60;
  transition: width .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1);
}
.nv-w.collapsed { width: 104px; }
/* Fixed (not sticky): immune to any parent overflow rule. The spacer reserves the sidebar's width in the layout. */
.nv-spacer { width: 304px; flex-shrink: 0; transition: width .6s cubic-bezier(.22,1,.36,1); }
.nv-spacer.collapsed { width: 104px; }
.nv {
  --nv-top: #0e0e10; --nv-bot: #0a0a0c;
  position: relative; height: 100%; display: flex; flex-direction: column; overflow: hidden;
  border-radius: 28px; border: 1px solid var(--line2);
  background: linear-gradient(180deg, var(--nv-top), var(--nv-bot));
  box-shadow: 0 30px 80px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.05) inset, 0 0 0 1px rgba(0,0,0,.5);
}
.nv-glow { position: absolute; top: -130px; left: -70px; width: 340px; height: 340px; pointer-events: none; background: radial-gradient(circle, rgba(var(--accent-rgb), .11), transparent 65%); }

.nv-head { position: relative; display: flex; align-items: center; gap: 12px; padding: 20px 16px 12px 20px; flex-shrink: 0; }
.nv-logo { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; flex-shrink: 0; border: 1px solid var(--line2); box-shadow: 0 0 22px rgba(var(--accent-rgb), .16); }
.nv-brand { flex: 1; min-width: 0; }
.nv-name { font-size: .95rem; color: var(--hi); line-height: 1.2; white-space: nowrap; }
.nv-sub { font-size: .72rem; color: var(--dim); margin-top: 3px; font-weight: 300; white-space: nowrap; }
.nv-sq { padding: 0; width: 34px; height: 34px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid var(--line); border-radius: 11px; background: var(--tint); color: var(--dim); cursor: pointer; transition: color .4s, border-color .5s, background .4s; }
.nv-sq:hover { color: var(--accent); border-color: rgba(var(--accent-rgb), .4); }

.nv-search { position: relative; margin: 6px 18px 8px; flex-shrink: 0; }
.nv-search > svg { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: var(--dim); pointer-events: none; }
.nv-search input { width: 100%; height: 46px; padding: 0 66px 0 42px; background: var(--tint); border: 1px solid var(--line); border-radius: 14px; color: var(--hi); font: inherit; font-size: .85rem; font-weight: 300; outline: none; transition: border-color .5s, box-shadow .5s; }
.nv-search input:focus-visible { outline: none; border-color: rgba(var(--accent-rgb), .5); box-shadow: 0 0 0 3px rgba(var(--accent-rgb), .08); }
.nv-search input::placeholder { color: var(--dim); }
.nv-kbd { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); padding: 3px 8px; border: 1px solid var(--line2); border-radius: 8px; background: var(--tint); color: var(--dim); font-size: .65rem; letter-spacing: .5px; pointer-events: none; }
.nv-sbtn { display: none; }

.nv-scroll { position: relative; flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 4px 14px 8px; }
.nv-label { padding: 18px 14px 8px; font-size: .62rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); white-space: nowrap; }
.nv-gap { height: 1px; margin: 14px 14px 12px; background: var(--line); }
.nv-none { padding: 28px 14px; text-align: center; color: var(--dim); font-size: .8rem; font-weight: 300; }

.nv-row { position: relative; }
.nv-item { position: relative; display: flex; align-items: center; gap: 14px; width: 100%; height: 46px; padding: 0 14px; margin-bottom: 4px; border: none; border-radius: 14px; background: transparent; color: var(--dim); font-size: .86rem; font-weight: 300; text-align: left; white-space: nowrap; cursor: pointer; transition: background .45s ease, color .45s ease, box-shadow .5s ease; }
.nv-item:hover { background: var(--tint); color: var(--hi); }
.nv-item.active { background: rgba(var(--accent-rgb), .09); color: var(--hi); box-shadow: inset 0 0 0 1px rgba(var(--accent-rgb), .16); }
.nv-item.has-kids { padding-right: 46px; }
.nv-ic { display: flex; flex-shrink: 0; transition: color .4s, transform .5s cubic-bezier(.22,1,.36,1); }
.nv-item:hover .nv-ic { transform: translateX(1px); }
.nv-item.active .nv-ic { color: var(--accent); }
.nv-text { flex: 1; overflow: hidden; text-overflow: ellipsis; }
.nv-badge { min-width: 22px; height: 22px; padding: 0 7px; display: flex; align-items: center; justify-content: center; border-radius: 99px; background: var(--accent); color: var(--accent-ink); font-size: .66rem; font-weight: 600; }
.nv-chev { padding: 0; position: absolute; right: 8px; top: 8px; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: none; border-radius: 9px; background: transparent; color: var(--dim); cursor: pointer; transition: background .4s, color .4s, transform .5s cubic-bezier(.22,1,.36,1); }
.nv-chev:hover { background: var(--tint2); color: var(--hi); }
.nv-chev.open { transform: rotate(180deg); }

.nv-subw { display: grid; grid-template-rows: 0fr; visibility: hidden; transition: grid-template-rows .55s cubic-bezier(.22,1,.36,1), visibility 0s linear .55s; }
.nv-subw.open { grid-template-rows: 1fr; visibility: visible; transition: grid-template-rows .55s cubic-bezier(.22,1,.36,1), visibility 0s; }
.nv-clip { min-height: 0; overflow: hidden; }
.nv-subl { position: relative; margin: 2px 0 8px 27px; padding-left: 16px; }
.nv-subl::before { content: ''; position: absolute; left: 0; top: 4px; bottom: 4px; width: 1px; background: var(--line2); }
.nv-si { display: flex; align-items: center; gap: 12px; width: 100%; height: 38px; padding: 0 12px; margin-bottom: 2px; border: none; border-radius: 11px; background: transparent; color: var(--dim); font-size: .82rem; font-weight: 300; text-align: left; cursor: pointer; transition: background .4s, color .4s; }
.nv-si:hover { background: var(--tint); color: var(--hi); }
.nv-si.active { background: var(--tint); color: var(--hi); }
.nv-si span { flex: 1; }
.nv-si em { font-style: normal; font-size: .68rem; color: var(--dim); }
.nv-dot { width: 8px; height: 8px; flex-shrink: 0; border-radius: 50%; background: var(--c); transition: box-shadow .5s; }
.nv-si:hover .nv-dot, .nv-si.active .nv-dot { box-shadow: 0 0 10px var(--c); }

.nv-foot { position: relative; flex-shrink: 0; padding: 0 14px 14px; }
.nv-div { height: 1px; margin: 6px 14px 12px; background: var(--line); }
.nv-sw { position: relative; width: 38px; height: 22px; flex-shrink: 0; border-radius: 99px; border: 1px solid var(--line2); background: var(--tint2); transition: background .5s, border-color .5s; }
.nv-sw i { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: var(--dim); transition: transform .5s cubic-bezier(.34,1.4,.64,1), background .4s, box-shadow .5s; }
.nv-sw.on { background: rgba(var(--accent-rgb), .18); border-color: rgba(var(--accent-rgb), .5); }
.nv-sw.on i { transform: translateX(16px); background: var(--accent); box-shadow: 0 0 10px rgba(var(--accent-rgb), .7); }
.nv-prof-wrap { position: relative; margin-top: 6px; }
.nv-prof { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: 16px; background: var(--tint); color: var(--text); text-align: left; cursor: pointer; transition: border-color .5s, background .4s; }
.nv-prof:hover { border-color: rgba(var(--accent-rgb), .35); }
.nv-av { position: relative; width: 38px; height: 38px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(var(--accent-rgb), .1); border: 1px solid rgba(var(--accent-rgb), .3); color: var(--accent); font-size: .9rem; }
.nv-online { position: absolute; right: -2px; bottom: -2px; width: 11px; height: 11px; border-radius: 50%; background: var(--ok); border: 2px solid var(--nv-bot); box-shadow: 0 0 8px var(--ok); }
.nv-ptext { flex: 1; min-width: 0; }
.nv-ptext b { display: block; font-weight: 400; font-size: .82rem; color: var(--hi); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nv-ptext small { display: block; margin-top: 2px; font-size: .7rem; font-weight: 300; color: var(--dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nv-pchev { display: flex; color: var(--dim); transition: transform .4s; }
.nv-pchev.open { transform: rotate(180deg); }
.nv-menu { position: absolute; left: 0; right: 0; bottom: calc(100% + 8px); padding: 6px; border: 1px solid var(--line2); border-radius: 14px; background: var(--panel2); box-shadow: 0 20px 50px rgba(0,0,0,.5); animation: rise .4s cubic-bezier(.22,1,.36,1) both; }
.nv-menu button { display: flex; align-items: center; gap: 12px; width: 100%; height: 42px; padding: 0 12px; border: none; border-radius: 10px; background: transparent; color: var(--text); font-size: .82rem; font-weight: 300; cursor: pointer; transition: background .4s, color .4s; }
.nv-menu button:hover { background: rgba(255,122,122,.1); color: var(--danger); }

/* collapsed icon rail */
.nv-w.collapsed .nv-head { flex-direction: column; padding: 20px 0 6px; gap: 14px; }
.nv-w.collapsed .nv-brand, .nv-w.collapsed .nv-search, .nv-w.collapsed .nv-text, .nv-w.collapsed .nv-chev,
.nv-w.collapsed .nv-subw, .nv-w.collapsed .nv-sw, .nv-w.collapsed .nv-ptext, .nv-w.collapsed .nv-pchev, .nv-w.collapsed .nv-label span { display: none; }
.nv-w.collapsed .nv-sbtn { display: flex; width: 46px; height: 46px; margin: 6px auto 8px; border-radius: 14px; }
.nv-w.collapsed .nv-label { height: 1px; margin: 14px 20px; padding: 0; background: var(--line); }
.nv-w.collapsed .nv-item { justify-content: center; padding: 0; gap: 0; }
.nv-w.collapsed .nv-badge { position: absolute; top: 9px; right: 12px; min-width: 0; width: 8px; height: 8px; padding: 0; font-size: 0; box-shadow: 0 0 0 2px var(--nv-bot); }
.nv-w.collapsed .nv-prof { justify-content: center; padding: 8px; border-color: transparent; background: transparent; }

/* ───────── Main ───────── */
.main { flex: 1; min-width: 0; padding: 48px 5vw 80px; overflow-y: auto; }
.page { max-width: 1240px; margin: 0 auto; animation: rise 1s cubic-bezier(.22,1,.36,1) both; }
.page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 40px; }
.eyebrow { display: inline-flex; align-items: center; gap: 12px; font-size: .62rem; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-bottom: 18px; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 12px var(--accent); animation: breathe 4s ease infinite; }
.h1 { font-size: clamp(1.7rem, 2.8vw, 2.4rem); font-weight: 200; letter-spacing: -0.02em; line-height: 1.15; color: var(--hi); margin: 0 0 10px; }
.lead { font-size: .85rem; color: var(--dim); font-weight: 300; margin: 0; }
.h3 { font-size: 1rem; font-weight: 300; color: var(--hi); margin: 0 0 4px; letter-spacing: -0.01em; }
.muted { color: var(--dim); font-size: .75rem; font-weight: 300; }
.emo { filter: grayscale(1) brightness(1.3); opacity: .85; }

.card { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; transition: border-color .6s ease, box-shadow .6s ease, transform .6s cubic-bezier(.22,1,.36,1); }
.card-pad { padding: 26px; }
.card-head { padding: 20px 24px; border-bottom: 1px solid var(--line); }
.empty { padding: 64px 24px; text-align: center; color: var(--dim); font-size: .85rem; font-weight: 300; }
.empty-ic { font-size: 2rem; margin-bottom: 12px; }
.empty strong { display: block; color: var(--hi); font-weight: 400; font-size: .95rem; margin-bottom: 6px; }

/* grids */
.kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 20px; }
.g-aside { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
.g-aside-l { display: grid; grid-template-columns: 300px 1fr; gap: 20px; }
.kpi { position: relative; padding: 24px; overflow: hidden; }
.kpi.click { cursor: pointer; }
.kpi.click:hover { transform: translateY(-3px); border-color: rgba(var(--accent-rgb), .4); box-shadow: 0 0 44px rgba(var(--accent-rgb), .08); }
.kpi-ic { font-size: 1.2rem; margin-bottom: 22px; }
.kpi-val { font-size: clamp(1.5rem, 2.2vw, 2rem); font-weight: 200; color: var(--hi); letter-spacing: -0.01em; line-height: 1; }
.kpi-label { font-size: .6rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); margin-top: 12px; }
.kpi-link { font-size: .6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-top: 10px; }

/* chart */
.chart-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 28px; }
.bars { display: flex; gap: 8px; height: 200px; }
.bar-col { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.bar-val { font-size: .58rem; color: var(--dim); height: 12px; white-space: nowrap; }
.bar-track { flex: 1; width: 100%; display: flex; align-items: flex-end; }
.bar { width: 100%; border-radius: 3px 3px 0 0; background: rgba(255,255,255,.22); transform-origin: bottom; animation: grow 1.4s cubic-bezier(.22,1,.36,1) both; transition: background .5s, box-shadow .5s; }
.bar.zero { background: rgba(255,255,255,.05); }
.bar.cur { background: var(--accent); box-shadow: 0 0 24px rgba(var(--accent-rgb), .55); }
.bar-col:hover .bar:not(.zero) { background: rgba(var(--accent-rgb), .7); }
.bar-lbl { font-size: .58rem; letter-spacing: 1px; color: var(--dim); }
.bar-lbl.cur { color: var(--accent); }
.total-row { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--line); display: flex; justify-content: space-between; align-items: baseline; }
.total-row strong { font-size: 1.15rem; font-weight: 300; color: var(--hi); }

/* breakdown */
.brk { margin-bottom: 18px; }
.brk-top { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: .72rem; }
.brk-top span:first-child { color: var(--dim); letter-spacing: 1.5px; text-transform: uppercase; font-size: .6rem; }
.brk-top span:last-child { color: var(--hi); }
.brk-track { height: 2px; background: rgba(255,255,255,.08); }
.brk-fill { height: 100%; transition: width 1.2s cubic-bezier(.22,1,.36,1); }
.fund { position: relative; overflow: hidden; border-color: rgba(var(--accent-rgb), .25); box-shadow: 0 0 60px rgba(var(--accent-rgb), .07); }
.fund::before { content: ''; position: absolute; top: -90px; right: -90px; width: 260px; height: 260px; background: radial-gradient(circle, rgba(var(--accent-rgb), .18), transparent 65%); pointer-events: none; }
.fund-val { position: relative; font-size: 1.7rem; font-weight: 200; color: var(--hi); letter-spacing: -0.01em; }
.fund-sub { position: relative; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--line); }
.fund-sub strong { display: block; font-weight: 300; font-size: 1.05rem; color: var(--accent); margin-top: 4px; }

/* tabs / filters */
.tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }
.tab { padding: 9px 20px; border-radius: 99px; background: transparent; border: 1px solid var(--line2); color: var(--dim); font-size: .78rem; font-weight: 400; cursor: pointer; transition: color .5s, border-color .5s, background .5s, box-shadow .6s; }
.tab:hover { color: var(--hi); border-color: rgba(255,255,255,.3); }
.tab.on { color: var(--accent); border-color: rgba(var(--accent-rgb), .6); background: rgba(var(--accent-rgb), .06); box-shadow: 0 0 28px rgba(var(--accent-rgb), .12); }
.search { margin-left: auto; position: relative; }
.search svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--dim); pointer-events: none; }

/* inputs */
.inp { width: 100%; padding: 12px 14px; background: rgba(255,255,255,.03); border: 1px solid var(--line2); border-radius: 10px; color: var(--hi); font-family: inherit; font-size: .88rem; font-weight: 300; outline: none; transition: border-color .5s, box-shadow .5s, background .5s; }
.inp:focus { border-color: var(--accent); background: rgba(var(--accent-rgb), .03); box-shadow: 0 0 0 3px rgba(var(--accent-rgb), .08); }
.inp::placeholder { color: #4d4e55; }
.inp.auto { width: auto; padding: 9px 14px; font-size: .82rem; }
.inp.search-in { width: 220px; padding: 9px 14px 9px 38px; border-radius: 99px; }
.ad select.inp option { background: #111114; color: var(--hi); }
.ad textarea.inp { resize: vertical; line-height: 1.7; }
.ff { margin-bottom: 20px; }
.ff-label { display: block; font-size: .6rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); margin-bottom: 10px; }
.ff-err { margin: 6px 0 0; font-size: .73rem; color: var(--danger); }
.checks { display: flex; gap: 22px; margin-bottom: 22px; flex-wrap: wrap; }
.check { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: .82rem; font-weight: 300; color: var(--text); }
.check input { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
.meet-box { padding: 18px; margin-bottom: 20px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,.015); }
.meet-title { font-size: .6rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--accent); margin-bottom: 16px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; padding: 12px 26px; background: var(--accent); color: var(--accent-ink); border: 1px solid var(--accent); border-radius: 99px; font-size: .82rem; font-weight: 600; letter-spacing: .4px; cursor: pointer; transition: box-shadow .6s ease, transform .6s ease, opacity .4s; }
.btn:hover:not(:disabled) { box-shadow: 0 0 40px rgba(var(--accent-rgb), .4); transform: translateY(-1px); }
.btn:disabled { opacity: .55; cursor: wait; }
.btn-ghost { background: transparent; color: var(--hi); border-color: var(--line2); font-weight: 400; }
.btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,.05); box-shadow: none; }
.btn-danger { background: transparent; color: var(--danger); border-color: rgba(255,122,122,.5); font-weight: 400; }
.btn-danger:hover:not(:disabled) { background: rgba(255,122,122,.08); box-shadow: 0 0 30px rgba(255,122,122,.12); }
.btn-solid-danger { background: var(--danger); border-color: var(--danger); color: #1a0505; }
.btn-solid-danger:hover:not(:disabled) { box-shadow: 0 0 36px rgba(255,122,122,.35); }
.btn-sm { padding: 8px 18px; font-size: .75rem; }
.btn-row { display: flex; gap: 10px; margin-top: 8px; }
.btn-row .f1 { flex: 1; } .btn-row .f2 { flex: 2; }
.sbtn { padding: 6px 13px; background: transparent; border: 1px solid var(--line2); border-radius: 99px; color: var(--dim); font-size: .68rem; letter-spacing: .5px; cursor: pointer; white-space: nowrap; transition: color .4s, border-color .4s, box-shadow .5s, background .4s; }
.sbtn:disabled { opacity: .5; cursor: wait; }
.sbtn:hover:not(:disabled) { color: var(--hi); border-color: rgba(255,255,255,.35); }
.sbtn.ok { color: var(--ok); border-color: rgba(127,227,176,.35); }
.sbtn.ok:hover:not(:disabled) { background: rgba(127,227,176,.08); border-color: var(--ok); color: var(--ok); box-shadow: 0 0 20px rgba(127,227,176,.12); }
.sbtn.accent { color: var(--accent); border-color: rgba(var(--accent-rgb), .35); }
.sbtn.accent:hover:not(:disabled) { background: rgba(var(--accent-rgb), .08); border-color: var(--accent); color: var(--accent); box-shadow: 0 0 20px rgba(var(--accent-rgb), .14); }
.sbtn.warn { color: var(--warn); border-color: rgba(var(--warn-rgb), .35); }
.sbtn.warn:hover:not(:disabled) { background: rgba(var(--warn-rgb), .08); border-color: var(--warn); color: var(--warn); box-shadow: 0 0 20px rgba(var(--warn-rgb), .14); }
.sbtn.danger { color: var(--danger); border-color: rgba(255,122,122,.35); }
.sbtn.danger:hover:not(:disabled) { background: rgba(255,122,122,.08); border-color: var(--danger); color: var(--danger); }
.icon-btn { background: none; border: none; cursor: pointer; color: var(--dim); font-size: 1rem; padding: 6px; transition: color .4s; }
.icon-btn:hover { color: var(--danger); }

/* badge / avatar */
.badge { display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 99px; border: 1px solid; font-size: .62rem; letter-spacing: 1.5px; text-transform: uppercase; }
.badge i { width: 5px; height: 5px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; }
.b-pending  { color: var(--warn); border-color: rgba(var(--warn-rgb), .4); }
.b-active   { color: var(--ok); border-color: rgba(127,227,176,.4); }
.b-inactive { color: var(--dim); border-color: var(--line2); }
.b-rejected { color: var(--danger); border-color: rgba(255,122,122,.4); }
.avatar { flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(var(--accent-rgb), .08); border: 1px solid rgba(var(--accent-rgb), .3); color: var(--accent); font-weight: 400; }

/* tables */
.tbl-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; }
.tbl th { padding: 14px 18px; text-align: left; font-size: .58rem; font-weight: 400; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); border-bottom: 1px solid var(--line); white-space: nowrap; background: var(--panel); }
.tbl td { padding: 15px 18px; font-size: .8rem; font-weight: 300; color: var(--text); border-bottom: 1px solid var(--line); }
.tbl tbody tr { transition: background .4s; }
.tbl tbody tr:hover { background: rgba(var(--accent-rgb), .03); }
.tbl tbody tr:last-child td { border-bottom: none; }
.cell-person { display: flex; align-items: center; gap: 12px; }
.cell-name { color: var(--hi); font-weight: 400; font-size: .85rem; }
.cell-sub { font-size: .7rem; color: var(--dim); margin-top: 2px; }
.scroll-y { max-height: 540px; overflow-y: auto; }
.scroll-y .tbl th { position: sticky; top: 0; z-index: 1; }
.pay-amt { color: var(--accent); font-size: .95rem; font-weight: 300; }
.list-row { display: flex; align-items: center; gap: 12px; padding: 14px 22px; border-bottom: 1px solid var(--line); }
.list-row:last-child { border-bottom: none; }
.grand { margin-left: auto; padding: 10px 22px; border: 1px solid rgba(var(--accent-rgb), .3); border-radius: 99px; box-shadow: 0 0 30px rgba(var(--accent-rgb), .08); font-size: .6rem; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); }
.grand strong { margin-left: 8px; color: var(--accent); font-size: .95rem; font-weight: 300; letter-spacing: 0; text-transform: none; }
.filters { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; align-items: center; }

/* verify payments */
.pcard { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; padding: 22px 26px; margin-bottom: 14px; }
.pcard:hover { border-color: rgba(var(--accent-rgb), .3); box-shadow: 0 0 40px rgba(var(--accent-rgb), .05); }
.pcard-who { flex: 1; min-width: 190px; display: flex; align-items: center; gap: 14px; }
.pcard-col { text-align: center; min-width: 100px; }
.pcard-amt { font-size: 1.15rem; font-weight: 200; color: var(--accent); }
.link { color: var(--accent); font-size: .7rem; text-decoration: none; border-bottom: 1px solid rgba(var(--accent-rgb), .4); }
.link:hover { color: var(--hi); }
.review-box { padding: 18px; margin-bottom: 22px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255,255,255,.02); }
.kv-label { font-size: .56rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--dim); }
.kv-val { font-size: .85rem; color: var(--hi); margin-top: 4px; font-weight: 300; }

/* announcements */
.ann { padding: 24px 26px; margin-bottom: 14px; border-left: 2px solid var(--line2); display: flex; gap: 20px; flex-wrap: wrap; }
.ann:hover { border-color: rgba(var(--accent-rgb), .25); box-shadow: 0 0 40px rgba(var(--accent-rgb), .04); }
.ann.pinned { border-left-color: var(--accent); }
.ann.urgent { border-left-color: var(--danger); }
.ann-main { flex: 1; min-width: 220px; }
.ann-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.tag { padding: 3px 11px; border-radius: 99px; border: 1px solid var(--line2); font-size: .58rem; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); }
.tag.hot { color: var(--accent); border-color: rgba(var(--accent-rgb), .4); }
.tag.red { color: var(--danger); border-color: rgba(255,122,122,.4); }
.tag.ok { color: var(--ok); border-color: rgba(127,227,176,.4); }
.ann h3 { font-size: 1.05rem; font-weight: 300; color: var(--hi); margin: 0 0 8px; }
.ann p { font-size: .83rem; line-height: 1.8; font-weight: 300; color: var(--text); margin: 0 0 8px; white-space: pre-wrap; }
.ann-side { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; flex-shrink: 0; }
.ann-acts { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.meet { display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-top: 12px; border: 1px solid rgba(var(--accent-rgb), .22); border-radius: 10px; background: rgba(var(--accent-rgb), .03); }
.cat-chip { padding: 8px 16px; border-radius: 99px; background: transparent; border: 1px solid var(--line2); color: var(--dim); font-size: .75rem; cursor: pointer; transition: all .5s ease; }
.cat-chip:hover { color: var(--hi); }
.cat-chip.on { color: var(--accent); border-color: rgba(var(--accent-rgb), .6); background: rgba(var(--accent-rgb), .06); box-shadow: 0 0 24px rgba(var(--accent-rgb), .1); }

/* modal + toast */
.overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,.72); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; }
.modal { width: 100%; background: var(--panel); border: 1px solid var(--line2); border-radius: 18px; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,.7), 0 0 80px rgba(var(--accent-rgb), .06); animation: modalIn .5s cubic-bezier(.22,1,.36,1) both; color: var(--text); font-family: Sora, sans-serif; color-scheme: dark; }
.modal * { box-sizing: border-box; }
.modal-head { display: flex; align-items: center; justify-content: space-between; padding: 20px 26px; border-bottom: 1px solid var(--line); }
.modal-head h3 { margin: 0; font-size: 1.05rem; font-weight: 300; color: var(--hi); }
.modal-x { padding: 0; width: 32px; height: 32px; border-radius: 50%; background: transparent; border: 1px solid var(--line2); color: var(--dim); font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color .4s, border-color .4s; }
.modal-x:hover { color: var(--accent); border-color: rgba(var(--accent-rgb), .5); }
.modal-body { padding: 26px; }
.modal select.inp option { background: #111114; color: var(--hi); }
.modal .check input { accent-color: var(--accent); }
.modal-text { font-size: .88rem; line-height: 1.8; font-weight: 300; margin: 0 0 22px; color: var(--text); }
.modal-text strong { color: var(--hi); font-weight: 400; }
.toast { position: fixed; bottom: 28px; right: 28px; z-index: 9999; max-width: 380px; display: flex; align-items: center; gap: 12px; padding: 14px 18px; background: var(--panel2); border: 1px solid var(--line2); border-left: 2px solid var(--accent); border-radius: 12px; color: var(--hi); font-size: .83rem; font-weight: 300; font-family: Sora, sans-serif; box-shadow: 0 20px 60px rgba(0,0,0,.6), 0 0 40px rgba(var(--accent-rgb), .08); animation: toastIn .5s cubic-bezier(.22,1,.36,1) both; }
.toast.error { border-left-color: var(--danger); box-shadow: 0 20px 60px rgba(0,0,0,.6), 0 0 40px rgba(255,122,122,.08); }
.toast-ic { color: var(--accent); }
.toast.error .toast-ic { color: var(--danger); }
.toast button { margin-left: auto; background: none; border: none; color: var(--dim); cursor: pointer; font-size: 1.1rem; padding: 0 0 0 6px; }

/* ───────── Responsive ───────── */
@media (max-width: 1100px) {
  .g-aside, .g-aside-l { grid-template-columns: 1fr; }
}
/* Mobile layout is driven by the JS-set .is-mobile class (not only media queries),
   so CSS and React state can never disagree. Covers phones in portrait AND landscape. */
.ad.is-mobile { flex-direction: column; }
.ad.is-mobile .nv-spacer { display: none; }
.ad.is-mobile .nv-w, .ad.is-mobile .nv-w.collapsed {
  position: fixed; left: 0; top: 0; bottom: 0; height: 100vh; height: 100dvh; box-sizing: border-box;
  width: min(304px, 88vw) !important; min-width: min(304px, 88vw) !important; max-width: none !important; flex: none !important;
  padding: 10px; padding-top: calc(10px + env(safe-area-inset-top)); padding-bottom: calc(10px + env(safe-area-inset-bottom));
  transform: translateX(-110%); visibility: hidden;
  transition: transform .5s cubic-bezier(.22,1,.36,1), visibility 0s linear .5s;
}
.ad.is-mobile .nv-w.mobile-open { transform: none; visibility: visible; transition: transform .5s cubic-bezier(.22,1,.36,1), visibility 0s; }
.ad.is-mobile .nv { width: 100% !important; min-width: 0; max-width: none !important; }
.ad.is-mobile .nv-head, .ad.is-mobile .nv-search, .ad.is-mobile .nv-scroll, .ad.is-mobile .nv-foot { max-width: none !important; }
.ad.is-mobile .nv .nv-item, .ad.is-mobile .nv .nv-prof, .ad.is-mobile .nv .nv-search input { max-width: none !important; }
.ad.is-mobile .nv-scroll { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
.ad.is-mobile .scrim { display: block; position: fixed; inset: 0; z-index: 55; background: rgba(0,0,0,.65); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); opacity: 0; pointer-events: none; transition: opacity .5s ease; }
.ad.is-mobile .scrim.show { opacity: 1; pointer-events: auto; }
.ad.is-mobile .topbar { display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 40; height: 64px; padding: 0 5vw; padding-top: env(safe-area-inset-top); background: rgba(5,5,6,.9); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); border-bottom: 1px solid var(--line); }
.ad.is-mobile .topbar .brand { display: flex; align-items: center; gap: 12px; }
.ad.is-mobile .topbar img { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; border: 1px solid var(--line2); }
.ad.is-mobile .topbar button { padding: 0; background: none; border: 1px solid var(--line2); border-radius: 10px; width: 40px; height: 40px; color: var(--hi); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: border-color .4s, box-shadow .5s; }
.ad.is-mobile .topbar button:hover { border-color: rgba(var(--accent-rgb), .5); box-shadow: 0 0 24px rgba(var(--accent-rgb), .12); }
.ad.is-mobile .main { padding: 32px 5vw 80px; width: 100%; }
.ad.is-mobile .search { margin-left: 0; width: 100%; }
.ad.is-mobile .inp.search-in { width: 100%; }
.ad.is-mobile .grand { margin-left: 0; }
.ad.is-mobile .overlay { align-items: flex-end; padding: 0; }
.ad.is-mobile .modal { max-width: none !important; border-radius: 18px 18px 0 0; max-height: 94vh; max-height: 94dvh; overflow-y: auto; }
@media (max-height: 520px) and (orientation: landscape) {
  .ad.is-mobile .nv-head { padding: 12px 14px 6px 16px; }
  .ad.is-mobile .nv-item { height: 40px; }
  .ad.is-mobile .nv-label { padding: 10px 14px 6px; }
}
@media (max-width: 560px) {
  .two { grid-template-columns: 1fr; }
  .toast { left: 16px; right: 16px; bottom: 16px; max-width: none; }
  .pcard { gap: 16px; }
}
@media (prefers-reduced-motion: reduce) {
  .ad *, .modal, .toast { animation-duration: .01s !important; animation-delay: 0s !important; transition-duration: .01s !important; }
}

/* ───────── Light theme (Night Mode off) ───────── */
.ad[data-theme="light"] {
  --bg: #ebe8e2; --panel: #fbfaf7; --panel2: #ffffff;
  --line: rgba(0,0,0,.08); --line2: rgba(0,0,0,.14);
  --text: #4a4a52; --dim: #85858f; --hi: #131316;
  --accent: #0fa86d; --accent-rgb: 15, 168, 109; --accent-ink: #04110b;
  --warn: #946410; --warn-rgb: 200, 140, 30;
  --ok: #1c7a45; --danger: #d14343;
  color-scheme: light;
}
.ad[data-theme="light"] .nv-w { --tint: rgba(0,0,0,.04); --tint2: rgba(0,0,0,.08); }
.ad[data-theme="light"] .nv { --nv-top: #ffffff; --nv-bot: #f5f2ec; box-shadow: 0 24px 60px rgba(40,30,10,.14), 0 1px 0 #fff inset; }
.ad[data-theme="light"] .nv-menu { box-shadow: 0 16px 40px rgba(40,30,10,.18); }
.ad[data-theme="light"] .bar { background: rgba(0,0,0,.2); }
.ad[data-theme="light"] .bar.zero { background: rgba(0,0,0,.06); }
.ad[data-theme="light"] .brk-track { background: rgba(0,0,0,.08); }
.ad[data-theme="light"] .inp { background: rgba(0,0,0,.03); }
.ad[data-theme="light"] .inp::placeholder { color: #a5a5ad; }
.ad[data-theme="light"] select.inp option,
.ad[data-theme="light"] .modal select.inp option { background: #fff; color: #131316; }
.ad[data-theme="light"] .tab:hover,
.ad[data-theme="light"] .btn-ghost:hover:not(:disabled) { background: rgba(0,0,0,.04); }
.ad[data-theme="light"] .overlay { background: rgba(20,20,24,.45); }
.ad[data-theme="light"] .modal { box-shadow: 0 30px 80px rgba(40,30,10,.2); }
.ad[data-theme="light"] .toast { box-shadow: 0 16px 40px rgba(40,30,10,.18); }
.ad[data-theme="light"].is-mobile .topbar { background: rgba(251,250,247,.92); }
.ad[data-theme="light"] .check input,
.ad[data-theme="light"] .modal .check input { accent-color: #0fa86d; }
.ad[data-theme="light"] ::-webkit-scrollbar-thumb { background: rgba(0,0,0,.18); }
`;

/* ═══════════════════════════════════════════════
   HOOKS
═══════════════════════════════════════════════ */
function useMedia(query) {
  const get = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false);
  const [m, setM] = useState(get);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const h = e => setM(e.matches);
    setM(mq.matches);
    mq.addEventListener ? mq.addEventListener('change', h) : mq.addListener(h);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', h) : mq.removeListener(h); };
  }, [query]);
  return m;
}
/* phones in portrait + landscape, small tablets; desktop-class widths keep the rail/full sidebar */
const MOBILE_QUERY = '(max-width: 900px), (pointer: coarse) and (max-height: 520px)';

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
const Svg = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const I = {
  overview: <Svg><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></Svg>,
  payments: <Svg><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></Svg>,
  verify: <Svg><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>,
  announcements: <Svg><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a9 9 0 0 1 0 12"/></Svg>,
  members: <Svg><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
  tree: <Svg><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="6" x2="6" y2="12"/><line x1="12" y1="6" x2="18" y2="12"/><circle cx="12" cy="2" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/></Svg>,
  globe: <Svg><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"/></Svg>,
  logout: <Svg><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></Svg>,
  search: <Svg size={16}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></Svg>,
  panel: <Svg><rect x="3" y="4" width="18" height="16" rx="3"/><line x1="9" y1="4" x2="9" y2="20"/></Svg>,
  close: <Svg><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  chev: <Svg size={16}><polyline points="6 9 12 15 18 9"/></Svg>,
  sun: <Svg><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Svg>,
  moon: <Svg><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Svg>,
};

const MEMBER_FILTERS = [
  { key: 'pending',  label: 'Pending',  color: 'var(--warn)',   stat: 'pending'  },
  { key: 'active',   label: 'Active',   color: 'var(--ok)',     stat: 'active'   },
  { key: 'inactive', label: 'Inactive', color: '#8b8c96',       stat: 'inactive' },
  { key: 'rejected', label: 'Rejected', color: 'var(--danger)', stat: 'rejected' },
  { key: 'all',      label: 'All',      color: 'var(--hi)',     stat: 'total'    },
];

function AdminSidebar({
  page, pageParams = {}, onNavigate, stats, user, onLogout,
  collapsed, onToggleCollapse, mobileOpen, onCloseMobile, theme, onToggleTheme, mobile,
}) {
  const [open, setOpen] = useState({});
  const [q, setQ] = useState('');
  const [menu, setMenu] = useState(false);
  const inputRef = useRef(null);
  const profRef = useRef(null);

  const c = collapsed && !mobile;
  const dark = theme === 'dark';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || '');

  useEffect(() => { if (page === 'members') setOpen(o => ({ ...o, members: true })); }, [page]);

  useEffect(() => {
    if (!menu) return;
    const h = e => { if (!profRef.current?.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  const focusSearch = () => {
    if (c) onToggleCollapse();
    setTimeout(() => inputRef.current?.focus(), c ? 400 : 0);
  };

  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); focusSearch(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  });

  const sections = [
    { label: 'Main', items: [
      { key: 'overview',         label: 'Overview',        icon: I.overview },
      { key: 'payments',         label: 'Payments',        icon: I.payments },
      { key: 'pending-payments', label: 'Verify Payments', icon: I.verify, badge: stats?.pendingPayments },
      { key: 'announcements',    label: 'Announcements',   icon: I.announcements },
    ]},
    { label: 'Workspace', items: [
      { key: 'members',     label: 'Members',     icon: I.members, badge: stats?.pending, children: MEMBER_FILTERS },
      { key: 'family-tree', label: 'Family Tree', icon: I.tree },
    ]},
    { label: null, items: [
      { key: 'site',   label: 'Public Site', icon: I.globe,  href: '/' },
      { key: 'logout', label: 'Log Out',     icon: I.logout, action: onLogout },
    ]},
  ];

  const s = q.trim().toLowerCase();
  const visible = sections.map(sec => ({
    ...sec,
    entries: sec.items.map(item => {
      if (!s || item.label.toLowerCase().includes(s)) return { item, kids: item.children };
      const kids = item.children?.filter(k => k.label.toLowerCase().includes(s));
      return kids?.length ? { item, kids, force: true } : null;
    }).filter(Boolean),
  })).filter(sec => sec.entries.length);

  const activate = (item, kid) => {
    if (kid) {
      onNavigate(item.key, { filter: kid.key });
      setOpen(o => ({ ...o, [item.key]: true }));
    } else if (item.children) {
      if (page === item.key) setOpen(o => ({ ...o, [item.key]: !o[item.key] }));
      else { onNavigate(item.key, { filter: 'pending' }); setOpen(o => ({ ...o, [item.key]: true })); }
    } else if (item.href) {
      window.location.href = item.href;
    } else if (item.action) {
      item.action();
    } else {
      onNavigate(item.key);
    }
    if (q) setQ('');
  };

  const onSearchKey = e => {
    if (e.key === 'Escape') { setQ(''); e.currentTarget.blur(); }
    if (e.key === 'Enter' && s && visible[0]) {
      const { item, kids, force } = visible[0].entries[0];
      activate(item, force ? kids[0] : undefined);
      e.currentTarget.blur();
    }
  };

  return (
    <>
    <div className={`nv-spacer ${c ? 'collapsed' : ''}`} aria-hidden="true" />
    <div className={`nv-w ${c ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      style={mobile ? { width: 'min(304px, 88vw)', minWidth: 'min(304px, 88vw)', maxWidth: 'none', flex: 'none' } : undefined}>
      <aside className="nv" aria-label="Admin navigation" style={mobile ? { width: '100%', minWidth: 0, maxWidth: 'none' } : undefined}>
        <div className="nv-glow" />

        <div className="nv-head">
          <img className="nv-logo" src="/mus.jpg" alt="MUS Welfare logo" />
          <div className="nv-brand">
            <div className="nv-name">MUS Welfare</div>
            <div className="nv-sub">Admin Panel</div>
          </div>
          {mobile ? (
            <button className="nv-sq" onClick={onCloseMobile} aria-label="Close menu">{I.close}</button>
          ) : (
            <button className="nv-sq" onClick={onToggleCollapse} aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'} title={c ? 'Expand' : 'Collapse'}>{I.panel}</button>
          )}
        </div>

        <div className="nv-search">
          {I.search}
          <input
            ref={inputRef} value={q} placeholder="Search…" aria-label="Search navigation"
            onChange={e => setQ(e.target.value)} onKeyDown={onSearchKey}
          />
          {!q && <span className="nv-kbd">{isMac ? '⌘K' : 'Ctrl K'}</span>}
        </div>
        <button className="nv-sq nv-sbtn" onClick={focusSearch} aria-label="Search">{I.search}</button>

        <nav className="nv-scroll">
          {visible.length === 0 && <div className="nv-none">No matches</div>}
          {visible.map((sec, si) => (
            <div key={sec.label || si}>
              {sec.label ? <div className="nv-label"><span>{sec.label}</span></div> : <div className="nv-gap" />}
              {sec.entries.map(({ item, kids, force }) => {
                const active = !item.href && !item.action && page === item.key;
                const isOpen = !!item.children && (force || !!open[item.key]);
                return (
                  <div className="nv-row" key={item.key}>
                    <button
                      className={`nv-item ${active ? 'active' : ''} ${item.children ? 'has-kids' : ''}`}
                      onClick={() => activate(item)}
                      title={c ? item.label : undefined}
                      aria-current={active ? 'page' : undefined}
                    >
                      <span className="nv-ic">{item.icon}</span>
                      <span className="nv-text">{item.label}</span>
                      {item.badge > 0 && <span className="nv-badge">{item.badge}</span>}
                    </button>

                    {item.children && (
                      <>
                        <button
                          className={`nv-chev ${isOpen ? 'open' : ''}`}
                          aria-expanded={isOpen} aria-label={`Toggle ${item.label}`}
                          onClick={() => setOpen(o => ({ ...o, [item.key]: !o[item.key] }))}
                        >{I.chev}</button>

                        <div className={`nv-subw ${isOpen ? 'open' : ''}`}>
                          <div className="nv-clip">
                            <div className="nv-subl">
                              {kids.map(k => {
                                const on = page === item.key && (pageParams.filter || 'pending') === k.key;
                                return (
                                  <button key={k.key} className={`nv-si ${on ? 'active' : ''}`} style={{ '--c': k.color }} onClick={() => activate(item, k)}>
                                    <i className="nv-dot" />
                                    <span>{k.label}</span>
                                    {stats?.[k.stat] != null && <em>{stats[k.stat]}</em>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="nv-foot">
          <div className="nv-div" />

          <button className="nv-item" role="switch" aria-checked={dark} onClick={onToggleTheme} title={c ? 'Night Mode' : undefined}>
            <span className="nv-ic">{dark ? I.moon : I.sun}</span>
            <span className="nv-text">Night Mode</span>
            <span className={`nv-sw ${dark ? 'on' : ''}`}><i /></span>
          </button>

          <div className="nv-prof-wrap" ref={profRef}>
            {menu && !c && (
              <div className="nv-menu" role="menu">
                <button role="menuitem" onClick={onLogout}>{I.logout}<span>Log Out</span></button>
              </div>
            )}
            <button
              className="nv-prof"
              onClick={() => (c ? onToggleCollapse() : setMenu(v => !v))}
              aria-haspopup="menu" aria-expanded={menu}
            >
              <span className="nv-av">
                {user?.fullName?.charAt(0).toUpperCase() || '?'}
                <i className="nv-online" title="Online" />
              </span>
              <span className="nv-ptext">
                <b>{user?.fullName}</b>
                <small>{user?.email}</small>
              </span>
              <span className={`nv-pchev ${menu ? 'open' : ''}`}>{I.chev}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
    </>
  );
}

/* ═══════════════════════════════════════════════
   TINY SHARED COMPONENTS
═══════════════════════════════════════════════ */
function Badge({ status }) {
  const known = ['pending','active','inactive','rejected'];
  const s = known.includes(status) ? status : 'inactive';
  return (
    <span className={`badge b-${s}`}>
      <i />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Avatar({ name, size = 36 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast ${type === 'success' ? '' : 'error'}`} role="status">
      <span className="toast-ic">{type === 'success' ? '✓' : '✕'}</span>
      {message}
      <button onClick={onClose} aria-label="Close">×</button>
    </div>
  );
}

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: width }}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, error }) {
  return (
    <div className="ff">
      <label className="ff-label">{label}</label>
      {children}
      {error && <p className="ff-err">{error}</p>}
    </div>
  );
}

function Btn({ label, tone = 'neutral', onClick, disabled }) {
  return <button className={`sbtn ${tone}`} onClick={onClick} disabled={disabled}>{label}</button>;
}

/* ═══════════════════════════════════════════════
   OVERVIEW PAGE
═══════════════════════════════════════════════ */
function OverviewPage({ stats, onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [selYear, setSelYear] = useState(CURRENT_YEAR);

  useEffect(() => {
    paymentAPI.getSummary(selYear)
      .then(r => setSummary(r.data))
      .catch(() => {});
  }, [selYear]);

  const maxBar = summary ? Math.max(...summary.months.map(m => m.total), 1) : 1;

  const kpiCards = [
    { label:'Active Members',   value: stats?.active  ?? '—', icon:'👥' },
    { label:'Pending Approval', value: stats?.pending ?? '—', icon:'⏳', action: () => onNavigate('members', { filter:'pending' }) },
    { label:'Total Fund (PKR)', value: stats?.totalFund != null ? `${stats.totalFund.toLocaleString()}` : '—', icon:'🏦' },
    { label:'This Month (PKR)', value: stats?.thisMonthFund != null ? `${stats.thisMonthFund.toLocaleString()}` : '—', icon:'📅' },
  ];

  const breakdown = [
    { label:'Active',   val: stats?.active,   color:'var(--ok)' },
    { label:'Pending',  val: stats?.pending,  color:'var(--warn)' },
    { label:'Inactive', val: stats?.inactive, color:'#5c5d66' },
    { label:'Rejected', val: stats?.rejected, color:'var(--danger)' },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow"><span className="dot" /> Admin panel</div>
          <h1 className="h1">Dashboard Overview</h1>
          <p className="lead">
            {new Date().toLocaleDateString('en-PK',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
      </div>

      <div className="kpis">
        {kpiCards.map(({ label, value, icon, action }) => (
          <div key={label} className={`card kpi ${action ? 'click' : ''}`} onClick={action}>
            <div className="kpi-ic emo">{icon}</div>
            <div className="kpi-val">{value}</div>
            <div className="kpi-label">{label}</div>
            {action && <div className="kpi-link">View →</div>}
          </div>
        ))}
      </div>

      <div className="g-aside">
        <div className="card card-pad">
          <div className="chart-top">
            <div>
              <h3 className="h3">Monthly Collections</h3>
              <p className="muted" style={{ margin: 0 }}>PKR collected per month</p>
            </div>
            <select className="inp auto" value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {summary ? (
            <div>
              <div className="bars" key={selYear}>
                {summary.months.map((m, i) => {
                  const pct = (m.total / maxBar) * 100;
                  const isCurrent = m.month === CURRENT_MONTH && selYear === CURRENT_YEAR;
                  return (
                    <div key={m.month} className="bar-col">
                      <div className="bar-val">
                        {m.total > 0 ? (m.total >= 1000 ? `${(m.total/1000).toFixed(1)}k` : m.total) : ''}
                      </div>
                      <div className="bar-track">
                        <div
                          className={`bar ${m.total === 0 ? 'zero' : ''} ${isCurrent ? 'cur' : ''}`}
                          style={{ height: m.total > 0 ? `${Math.max(pct, 3)}%` : '2px', animationDelay: `${i * 60}ms` }}
                        />
                      </div>
                      <div className={`bar-lbl ${isCurrent ? 'cur' : ''}`}>{m.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="total-row">
                <span className="muted">Total {selYear}</span>
                <strong>PKR {summary.grandTotal.toLocaleString()}</strong>
              </div>
            </div>
          ) : (
            <div className="empty" style={{ padding: '70px 0' }}>Loading chart…</div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div className="card card-pad" style={{ flex: 1 }}>
            <h3 className="h3" style={{ marginBottom: 22 }}>Member Breakdown</h3>
            {breakdown.map(({ label, val, color }) => {
              const pct = stats?.total ? Math.round((val / stats.total) * 100) : 0;
              return (
                <div key={label} className="brk">
                  <div className="brk-top"><span>{label}</span><span>{val ?? 0}</span></div>
                  <div className="brk-track"><div className="brk-fill" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}` }} /></div>
                </div>
              );
            })}
          </div>

          <div className="card card-pad fund">
            <div className="kv-label" style={{ position:'relative', marginBottom: 12 }}>Total Fund Collected</div>
            <div className="fund-val">PKR {(stats?.totalFund || 0).toLocaleString()}</div>
            <div className="fund-sub">
              <div className="kv-label">This month</div>
              <strong>PKR {(stats?.thisMonthFund || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MEMBERS PAGE
═══════════════════════════════════════════════ */
function MembersPage({ initialFilter = 'pending', showToast, onRefreshStats }) {
  const [filter,        setFilter]        = useState(initialFilter);
  const [members,       setMembers]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [search,        setSearch]        = useState('');
  const [confirmDel,    setConfirmDel]    = useState(null);

  const load = useCallback(async (f) => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getMembers(f);
      setMembers(data.members);
    } catch { showToast('Failed to load members.','error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(filter); }, [filter, load]);

  const doAction = async (id, action) => {
    setActionLoading(id);
    try {
      let res;
      if (action === 'approve')         res = await adminAPI.approve(id);
      else if (action === 'reject')     res = await adminAPI.reject(id);
      else if (action === 'deactivate') res = await adminAPI.deactivate(id);
      else if (action === 'delete')     res = await adminAPI.deleteMember(id);
      showToast(res.data.message, 'success');
      load(filter);
      onRefreshStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
    } finally { setActionLoading(null); }
  };

  const tabs = [
    { key:'pending',  label:'Pending'  },
    { key:'active',   label:'Active'   },
    { key:'inactive', label:'Inactive' },
    { key:'rejected', label:'Rejected' },
    { key:'all',      label:'All'      },
  ];

  const filtered = members.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.fullName?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.castFamily?.toLowerCase().includes(q);
  });

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow"><span className="dot" /> Directory</div>
          <h1 className="h1">Members</h1>
          <p className="lead">Manage membership applications and active members.</p>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} className={`tab ${filter === t.key ? 'on' : ''}`}>{t.label}</button>
        ))}
        <div className="search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input className="inp search-in" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" />
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div className="empty"><div className="empty-ic emo">⏳</div>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-ic emo">{filter === 'pending' ? '🎉' : '📭'}</div>
            <strong>{filter === 'pending' ? 'No pending approvals!' : 'No members found.'}</strong>
          </div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  {['Member','Type','Cast / Family','Phone','Joined','Status','Actions'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <MemberRow key={m._id} member={m}
                    isLoading={actionLoading === m._id}
                    onAction={(id, action) => {
                      if (action === 'delete') { setConfirmDel(m); return; }
                      doAction(id, action);
                    }}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDel && (
        <Modal title="Delete Member" onClose={() => setConfirmDel(null)} width={400}>
          <p className="modal-text">
            Are you sure you want to permanently delete <strong>{confirmDel.fullName}</strong>? This cannot be undone.
          </p>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button className="btn btn-ghost f1" onClick={() => setConfirmDel(null)}>Cancel</button>
            <button className="btn btn-solid-danger f1" onClick={() => { doAction(confirmDel._id, 'delete'); setConfirmDel(null); }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MemberRow({ member: m, isLoading, onAction }) {
  return (
    <tr>
      <td>
        <div className="cell-person">
          <Avatar name={m.fullName} size={34} />
          <div>
            <div className="cell-name">{m.fullName}</div>
            <div className="cell-sub">{m.email}</div>
          </div>
        </div>
      </td>
      <td style={{ whiteSpace:'nowrap' }}>{m.memberType === 'job_holder' ? '💼 Job Holder' : '🎓 Student'}</td>
      <td>{m.castFamily || '—'}</td>
      <td>{m.phone || '—'}</td>
      <td style={{ whiteSpace:'nowrap', color:'var(--dim)' }}>
        {new Date(m.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}
      </td>
      <td><Badge status={m.status} /></td>
      <td>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {m.status === 'pending' && <>
            <Btn label="Approve" tone="ok" disabled={isLoading} onClick={() => onAction(m._id,'approve')} />
            <Btn label="Reject" tone="danger" disabled={isLoading} onClick={() => onAction(m._id,'reject')} />
          </>}
          {m.status === 'active' && <Btn label="Deactivate" tone="warn" disabled={isLoading} onClick={() => onAction(m._id,'deactivate')} />}
          {(m.status === 'inactive' || m.status === 'rejected') && <Btn label="Approve" tone="ok" disabled={isLoading} onClick={() => onAction(m._id,'approve')} />}
          {m.role !== 'admin' && <Btn label="Delete" disabled={isLoading} onClick={() => onAction(m._id,'delete')} />}
          {isLoading && <span className="muted" style={{ alignSelf:'center' }}>…</span>}
        </div>
      </td>
    </tr>
  );
}

/* ═══════════════════════════════════════════════
   PAYMENTS PAGE
═══════════════════════════════════════════════ */
function PaymentsPage({ showToast }) {
  const [payments,    setPayments]    = useState([]);
  const [members,     setMembers]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filterYear,  setFilterYear]  = useState(CURRENT_YEAR);
  const [filterMonth, setFilterMonth] = useState('');
  const [showForm,    setShowForm]    = useState(false);
  const [delConfirm,  setDelConfirm]  = useState(null);

  const [form, setForm] = useState({ memberId:'', amount:'', month: CURRENT_MONTH, year: CURRENT_YEAR, note:'' });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const loadPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { year: filterYear };
      if (filterMonth) params.month = filterMonth;
      const { data } = await paymentAPI.getAll(params);
      setPayments(data.payments);
    } catch { showToast('Failed to load payments.','error'); }
    finally { setLoading(false); }
  }, [filterYear, filterMonth, showToast]);

  const loadMembers = useCallback(async () => {
    try {
      const { data } = await adminAPI.getMembers('active');
      setMembers(data.members);
    } catch {}
  }, []);

  useEffect(() => { loadPayments(); }, [loadPayments]);
  useEffect(() => { loadMembers(); }, [loadMembers]);

  const validateForm = () => {
    const e = {};
    if (!form.memberId) e.memberId = 'Select a member.';
    if (!form.amount || Number(form.amount) <= 0) e.amount = 'Enter a valid amount.';
    if (!form.month)  e.month  = 'Select a month.';
    if (!form.year)   e.year   = 'Enter a year.';
    return e;
  };

  const handleSubmit = async ev => {
    ev.preventDefault();
    const e = validateForm();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setSubmitting(true);
    try {
      await paymentAPI.record({ memberId: form.memberId, amount: Number(form.amount), month: Number(form.month), year: Number(form.year), note: form.note });
      showToast('Payment recorded successfully.', 'success');
      setShowForm(false);
      setForm({ memberId:'', amount:'', month: CURRENT_MONTH, year: CURRENT_YEAR, note:'' });
      setFormErrors({});
      loadPayments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to record payment.', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    try {
      await paymentAPI.deletePayment(id);
      showToast('Payment deleted.', 'success');
      loadPayments();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete.', 'error');
    } finally { setDelConfirm(null); }
  };

  const memberTotals = payments.reduce((acc, p) => {
    const id = p.member?._id;
    if (!id) return acc;
    if (!acc[id]) acc[id] = { member: p.member, total: 0, count: 0 };
    acc[id].total += p.amount;
    acc[id].count += 1;
    return acc;
  }, {});

  const grandTotal = payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow"><span className="dot" /> Ledger</div>
          <h1 className="h1">Payments</h1>
          <p className="lead">Record and track monthly contributions from members.</p>
        </div>
        <button className="btn" onClick={() => setShowForm(true)}><span style={{ fontSize:'1.1rem', lineHeight:1 }}>+</span> Record Payment</button>
      </div>

      <div className="filters">
        <select className="inp auto" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
          {[CURRENT_YEAR, CURRENT_YEAR-1, CURRENT_YEAR-2].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="inp auto" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <div className="grand">Total Shown:<strong>PKR {grandTotal.toLocaleString()}</strong></div>
      </div>

      <div className="g-aside-l">
        <div className="card" style={{ overflow:'hidden', alignSelf:'start' }}>
          <div className="card-head"><h3 className="h3" style={{ margin:0 }}>By Member</h3></div>
          <div className="scroll-y">
            {Object.values(memberTotals).length === 0 ? (
              <div className="empty" style={{ padding: 36 }}>No data</div>
            ) : (
              Object.values(memberTotals)
                .sort((a,b) => b.total - a.total)
                .map(({ member: mem, total, count }) => (
                  <div key={mem._id} className="list-row">
                    <Avatar name={mem.fullName} size={32} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div className="cell-name" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'.82rem' }}>{mem.fullName}</div>
                      <div className="cell-sub">{count} payment{count !== 1 ? 's' : ''}</div>
                    </div>
                    <div className="pay-amt" style={{ whiteSpace:'nowrap', fontSize:'.85rem' }}>PKR {total.toLocaleString()}</div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="card" style={{ overflow:'hidden' }}>
          <div className="card-head">
            <h3 className="h3" style={{ margin:0 }}>
              Payment Records <span className="muted">({payments.length})</span>
            </h3>
          </div>
          {loading ? (
            <div className="empty">Loading…</div>
          ) : payments.length === 0 ? (
            <div className="empty"><div className="empty-ic emo">💳</div>No payments recorded yet.</div>
          ) : (
            <div className="tbl-wrap scroll-y">
              <table className="tbl">
                <thead>
                  <tr>{['Member','Month / Year','Amount (PKR)','Note','Recorded',''].map((h, i) => <th key={i}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id}>
                      <td>
                        <div className="cell-person">
                          <Avatar name={p.member?.fullName} size={28} />
                          <div>
                            <div className="cell-name" style={{ fontSize:'.82rem' }}>{p.member?.fullName}</div>
                            <div className="cell-sub">{p.member?.memberType === 'job_holder' ? '💼' : '🎓'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color:'var(--hi)', whiteSpace:'nowrap' }}>{MONTHS[p.month-1]} {p.year}</td>
                      <td><span className="pay-amt">{p.amount.toLocaleString()}</span></td>
                      <td style={{ maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--dim)' }}>
                        {p.note || '—'}
                      </td>
                      <td style={{ whiteSpace:'nowrap', color:'var(--dim)', fontSize:'.72rem' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}
                      </td>
                      <td>
                        <button className="icon-btn" onClick={() => setDelConfirm(p)} title="Delete payment" aria-label="Delete payment">🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <Modal title="Record Monthly Payment" onClose={() => { setShowForm(false); setFormErrors({}); }}>
          <form onSubmit={handleSubmit} noValidate>
            <FormField label="Member *" error={formErrors.memberId}>
              <select className="inp" value={form.memberId} onChange={e => { setForm(f=>({...f,memberId:e.target.value})); setFormErrors(er=>({...er,memberId:''})); }}>
                <option value="">— Select active member —</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.fullName} ({m.memberType === 'job_holder' ? 'Job Holder' : 'Student'})</option>
                ))}
              </select>
            </FormField>

            <div className="two">
              <FormField label="Month *" error={formErrors.month}>
                <select className="inp" value={form.month} onChange={e => { setForm(f=>({...f,month:e.target.value})); setFormErrors(er=>({...er,month:''})); }}>
                  {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Year *" error={formErrors.year}>
                <select className="inp" value={form.year} onChange={e => { setForm(f=>({...f,year:e.target.value})); setFormErrors(er=>({...er,year:''})); }}>
                  {[CURRENT_YEAR, CURRENT_YEAR-1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Amount (PKR) *" error={formErrors.amount}>
              <input className="inp" type="number" min="1" value={form.amount}
                onChange={e => { setForm(f=>({...f,amount:e.target.value})); setFormErrors(er=>({...er,amount:''})); }}
                placeholder="e.g. 500" />
            </FormField>

            <FormField label="Note (optional)">
              <input className="inp" type="text" value={form.note}
                onChange={e => setForm(f=>({...f,note:e.target.value}))}
                placeholder="e.g. Cash payment" />
            </FormField>

            <div className="btn-row">
              <button type="button" className="btn btn-ghost f1" onClick={() => { setShowForm(false); setFormErrors({}); }}>Cancel</button>
              <button type="submit" className="btn f2" disabled={submitting}>{submitting ? 'Saving…' : 'Record Payment'}</button>
            </div>
          </form>
        </Modal>
      )}

      {delConfirm && (
        <Modal title="Delete Payment" onClose={() => setDelConfirm(null)} width={400}>
          <p className="modal-text">
            Delete <strong>PKR {delConfirm.amount.toLocaleString()}</strong> payment for <strong>{delConfirm.member?.fullName}</strong> ({MONTHS[delConfirm.month-1]} {delConfirm.year})?
          </p>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button className="btn btn-ghost f1" onClick={() => setDelConfirm(null)}>Cancel</button>
            <button className="btn btn-solid-danger f1" onClick={() => handleDelete(delConfirm._id)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PENDING PAYMENTS PAGE
═══════════════════════════════════════════════ */
function PendingPaymentsPage({ showToast, onRefreshStats }) {
  const [payments,      setPayments]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [adminNote,     setAdminNote]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.getPendingPayments();
      setPayments(data.payments);
    } catch { showToast('Failed to load pending payments.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (id, action) => {
    setActionLoading(id + action);
    try {
      let res;
      if (action === 'approve') res = await adminAPI.approvePayment(id, adminNote);
      else                      res = await adminAPI.rejectPayment(id, adminNote);
      showToast(res.data.message, 'success');
      setSelected(null);
      setAdminNote('');
      load();
      onRefreshStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
    } finally { setActionLoading(null); }
  };

  const methodLabel = m => m === 'account' ? '🏦 Bank Transfer' : '📱 QR Code';

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow"><span className="dot" /> Review queue</div>
          <h1 className="h1">Verify Payments</h1>
          <p className="lead">Review and approve member-submitted payment proofs.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="empty-ic emo">⏳</div>Loading pending payments…</div>
      ) : payments.length === 0 ? (
        <div className="card empty">
          <div className="empty-ic emo" style={{ fontSize:'2.6rem' }}>🎉</div>
          <strong>No pending payments to review!</strong>
          All submissions have been processed.
        </div>
      ) : (
        <div>
          {payments.map(p => (
            <div key={p._id} className="card pcard">
              <div className="pcard-who">
                <Avatar name={p.member?.fullName} size={42} />
                <div>
                  <div className="cell-name">{p.member?.fullName}</div>
                  <div className="cell-sub">{p.member?.email}</div>
                  <div className="cell-sub" style={{ marginTop: 4 }}>
                    {p.member?.memberType === 'job_holder' ? '💼 Job Holder' : '🎓 Student'} · {p.member?.castFamily || '—'}
                  </div>
                </div>
              </div>

              <div className="pcard-col">
                <div className="pcard-amt">PKR {p.amount?.toLocaleString()}</div>
                <div className="cell-sub">{MONTHS[(p.month || 1) - 1]} {p.year}</div>
              </div>

              <div className="pcard-col" style={{ minWidth: 120 }}>
                <div style={{ fontSize:'.78rem', color:'var(--text)' }}>{methodLabel(p.paymentMethod)}</div>
                {p.screenshotFullUrl && (
                  <a className="link" href={p.screenshotFullUrl} target="_blank" rel="noopener noreferrer" style={{ display:'inline-block', marginTop: 6 }}>
                    View Screenshot ↗
                  </a>
                )}
                {p.note && <div className="cell-sub" style={{ marginTop: 6, fontStyle:'italic' }}>"{p.note}"</div>}
              </div>

              <div className="pcard-col" style={{ minWidth: 90 }}>
                <div className="kv-label">Submitted</div>
                <div className="kv-val">{new Date(p.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short' })}</div>
              </div>

              <button className="btn btn-sm" onClick={() => { setSelected(p); setAdminNote(''); }}>Review</button>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <Modal title="Review Payment Submission" onClose={() => { setSelected(null); setAdminNote(''); }} width={520}>
          <div className="review-box">
            <div className="cell-person" style={{ marginBottom: 18 }}>
              <Avatar name={selected.member?.fullName} size={36} />
              <div>
                <div className="cell-name">{selected.member?.fullName}</div>
                <div className="cell-sub">{selected.member?.email}</div>
              </div>
            </div>
            <div className="two">
              {[
                ['Amount', `PKR ${selected.amount?.toLocaleString()}`],
                ['Period', `${MONTHS[(selected.month||1)-1]} ${selected.year}`],
                ['Method', methodLabel(selected.paymentMethod)],
                ['Note',   selected.note || '—'],
              ].map(([k,v]) => (
                <div key={k}>
                  <div className="kv-label">{k}</div>
                  <div className="kv-val">{v}</div>
                </div>
              ))}
            </div>
            {selected.screenshotFullUrl && (
              <div style={{ marginTop: 18 }}>
                <div className="kv-label" style={{ marginBottom: 8 }}>Payment Screenshot</div>
                <a href={selected.screenshotFullUrl} target="_blank" rel="noopener noreferrer">
                  <img src={selected.screenshotFullUrl} alt="Payment proof"
                    style={{ width:'100%', maxHeight:200, objectFit:'contain', borderRadius:8, border:'1px solid var(--line2)', background:'#050506' }}
                    onError={e => { e.target.style.display='none'; }} />
                </a>
              </div>
            )}
          </div>

          <FormField label="Admin Note (optional)">
            <input className="inp" type="text" value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="e.g. Verified via bank statement" />
          </FormField>

          <div className="btn-row">
            <button className="btn btn-ghost f1" onClick={() => { setSelected(null); setAdminNote(''); }}>Cancel</button>
            <button className="btn btn-danger f1" onClick={() => doAction(selected._id, 'reject')} disabled={!!actionLoading}>
              {actionLoading === selected._id + 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
            <button className="btn f2" onClick={() => doAction(selected._id, 'approve')} disabled={!!actionLoading}>
              {actionLoading === selected._id + 'approve' ? 'Approving…' : '✓ Approve Payment'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ANNOUNCEMENTS PAGE (Admin)
═══════════════════════════════════════════════ */
const CATEGORY_META = {
  general: { label:'General', icon:'📢', tone:'' },
  meeting: { label:'Meeting', icon:'📅', tone:'' },
  urgent:  { label:'Urgent',  icon:'🚨', tone:'red' },
  event:   { label:'Event',   icon:'🎉', tone:'' },
};

function AnnouncementsPage({ showToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [delConfirm,    setDelConfirm]    = useState(null);
  const [resending,     setResending]     = useState(null);

  const emptyForm = { title:'', body:'', category:'general', meetingLink:'', meetingDate:'', meetingNote:'', pinned:false, sendEmail:true };
  const [form,       setForm]       = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await announcementAPI.getAll();
      setAnnouncements(data.announcements);
    } catch { showToast('Failed to load announcements.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setForm(emptyForm); setFormErrors({}); setShowForm(true); };
  const openEdit   = a => {
    setEditItem(a);
    setForm({
      title: a.title, body: a.body, category: a.category,
      meetingLink: a.meetingLink || '', meetingDate: a.meetingDate ? a.meetingDate.slice(0,16) : '',
      meetingNote: a.meetingNote || '', pinned: a.pinned || false, sendEmail: false,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.body.trim())  e.body  = 'Body is required.';
    if (form.meetingLink && !/^https?:\/\//i.test(form.meetingLink)) e.meetingLink = 'Must be a valid URL (https://…)';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setFormErrors(e); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, meetingDate: form.meetingDate || null };
      let msg;
      if (editItem) {
        const { data } = await announcementAPI.update(editItem._id, payload);
        msg = data.message;
      } else {
        const { data } = await announcementAPI.create(payload);
        msg = data.message;
      }
      showToast(msg, 'success');
      setShowForm(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save.', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async id => {
    try {
      const { data } = await announcementAPI.delete(id);
      showToast(data.message, 'success');
      setDelConfirm(null);
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Delete failed.', 'error'); }
  };

  const handleResend = async id => {
    setResending(id);
    try {
      const { data } = await announcementAPI.resendEmail(id);
      showToast(data.message, 'success');
      load();
    } catch (err) { showToast(err.response?.data?.message || 'Resend failed.', 'error'); }
    finally { setResending(null); }
  };

  const fld = (key, val) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="eyebrow"><span className="dot" /> Notices</div>
          <h1 className="h1">Announcements</h1>
          <p className="lead">Post notices, meeting links, and updates to all members.</p>
        </div>
        <button className="btn" onClick={openCreate}><span style={{ fontSize:'1.1rem', lineHeight:1 }}>+</span> New Announcement</button>
      </div>

      {loading ? (
        <div className="empty"><div className="empty-ic emo">📢</div>Loading…</div>
      ) : announcements.length === 0 ? (
        <div className="card empty">
          <div className="empty-ic emo" style={{ fontSize:'2.6rem' }}>📭</div>
          <strong>No announcements yet.</strong>
          Click "New Announcement" to post one.
        </div>
      ) : (
        <div>
          {announcements.map(a => {
            const meta = CATEGORY_META[a.category] || CATEGORY_META.general;
            return (
              <div key={a._id} className={`card ann ${a.pinned ? 'pinned' : ''} ${a.category === 'urgent' ? 'urgent' : ''}`}>
                <div className="ann-main">
                  <div className="ann-tags">
                    {a.pinned && <span className="tag hot">📌 Pinned</span>}
                    <span className={`tag ${meta.tone}`}>{meta.icon} {meta.label}</span>
                    {a.emailSent && <span className="tag ok">✉ Emailed {a.emailCount}</span>}
                  </div>
                  <h3>{a.title}</h3>
                  <p>{a.body.length > 200 ? a.body.slice(0, 200) + '…' : a.body}</p>
                  {a.meetingLink && (
                    <div className="meet">
                      <span>📅</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        {a.meetingDate && (
                          <div className="cell-sub" style={{ color:'var(--text)', marginTop: 0 }}>
                            {new Date(a.meetingDate).toLocaleString('en-PK', { dateStyle:'medium', timeStyle:'short' })}
                          </div>
                        )}
                        <a className="link" href={a.meetingLink} target="_blank" rel="noopener noreferrer"
                          style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', borderBottom:'none' }}>
                          {a.meetingLink}
                        </a>
                      </div>
                      <a className="btn btn-sm" href={a.meetingLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>Join ↗</a>
                    </div>
                  )}
                </div>
                <div className="ann-side">
                  <div className="cell-sub">
                    {new Date(a.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}
                  </div>
                  <div className="ann-acts">
                    <Btn label="Edit" onClick={() => openEdit(a)} />
                    {!a.emailSent
                      ? <Btn label={resending===a._id ? '…' : '✉ Send Email'} tone="accent" disabled={resending===a._id} onClick={() => handleResend(a._id)} />
                      : <Btn label={resending===a._id ? '…' : '↺ Resend'} disabled={resending===a._id} onClick={() => handleResend(a._id)} />
                    }
                    <Btn label="Delete" onClick={() => setDelConfirm(a)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={editItem ? 'Edit Announcement' : 'New Announcement'} onClose={() => setShowForm(false)} width={580}>
          <div style={{ maxHeight:'72vh', overflowY:'auto', paddingRight:6 }}>
            <FormField label="Category">
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {Object.entries(CATEGORY_META).map(([key, m]) => (
                  <button key={key} type="button" onClick={() => fld('category', key)}
                    className={`cat-chip ${form.category === key ? 'on' : ''}`}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Title *" error={formErrors.title}>
              <input className="inp" value={form.title}
                onChange={e => { fld('title', e.target.value); setFormErrors(er => ({...er, title:''})); }}
                placeholder="e.g. Monthly Meeting — June 2026" />
            </FormField>

            <FormField label="Message *" error={formErrors.body}>
              <textarea className="inp" value={form.body} rows={5}
                onChange={e => { fld('body', e.target.value); setFormErrors(er => ({...er, body:''})); }}
                placeholder="Write your announcement here…" />
            </FormField>

            <div className="meet-box">
              <div className="meet-title">📅 Google Meet (optional)</div>
              <FormField label="Google Meet Link" error={formErrors.meetingLink}>
                <input className="inp" value={form.meetingLink}
                  onChange={e => { fld('meetingLink', e.target.value); setFormErrors(er => ({...er, meetingLink:''})); }}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx" />
              </FormField>
              {form.meetingLink && (
                <>
                  <FormField label="Meeting Date & Time">
                    <input className="inp" type="datetime-local" value={form.meetingDate} onChange={e => fld('meetingDate', e.target.value)} />
                  </FormField>
                  <FormField label="Meeting Agenda / Note">
                    <input className="inp" value={form.meetingNote} onChange={e => fld('meetingNote', e.target.value)} placeholder="e.g. Monthly budget review" />
                  </FormField>
                </>
              )}
            </div>

            <div className="checks">
              {[
                { key:'pinned',    icon:'📌', label:'Pin to top' },
                { key:'sendEmail', icon:'✉',  label: editItem ? 'Resend email to all members' : 'Email all active members' },
              ].map(({ key, icon, label }) => (
                <label key={key} className="check">
                  <input type="checkbox" checked={form[key]} onChange={e => fld(key, e.target.checked)} />
                  {icon} {label}
                </label>
              ))}
            </div>

            <div className="btn-row" style={{ marginTop: 0 }}>
              <button type="button" className="btn btn-ghost f1" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="button" className="btn f2" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving…' : editItem ? 'Save Changes' : form.sendEmail ? 'Post & Send Email' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {delConfirm && (
        <Modal title="Delete Announcement" onClose={() => setDelConfirm(null)} width={400}>
          <p className="modal-text">
            Permanently delete <strong>"{delConfirm.title}"</strong>? This cannot be undone.
          </p>
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button className="btn btn-ghost f1" onClick={() => setDelConfirm(null)}>Cancel</button>
            <button className="btn btn-solid-danger f1" onClick={() => handleDelete(delConfirm._id)}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN SHELL
═══════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [page,       setPage]       = useState('overview');
  const [pageParams, setPageParams] = useState({});
  const [stats,      setStats]      = useState(null);
  const [toast,      setToast]      = useState(null);
  const [collapsed,  setCollapsed]  = useState(() => typeof window !== 'undefined' && window.innerWidth < 1100);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMedia(MOBILE_QUERY);
  const [theme,      setTheme]      = useState(() => {
    try { return localStorage.getItem('mus-admin-theme') || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    try { localStorage.setItem('mus-admin-theme', theme); } catch {}
  }, [theme]);

  const showToast  = useCallback((message, type = 'success') => setToast({ message, type }), []);
  const closeToast = useCallback(() => setToast(null), []);

  const fetchStats = useCallback(async () => {
    try { const { data } = await adminAPI.getStats(); setStats(data); } catch {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* page needs a viewport meta tag, otherwise phones render the desktop layout */
  useEffect(() => {
    if (!document.querySelector('meta[name="viewport"]')) {
      const m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      document.head.appendChild(m);
    }
  }, []);

  /* leaving mobile layout closes the drawer; while open: Esc closes, page scroll locks */
  useEffect(() => { if (!isMobile) setMobileOpen(false); }, [isMobile]);
  useEffect(() => {
    if (!mobileOpen) return;
    const h = e => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const navigate = (p, params = {}) => { setPage(p); setPageParams(params); setMobileOpen(false); };

  return (
    <div className={`ad${isMobile ? ' is-mobile' : ''}`} data-theme={theme}>
      <style>{css}</style>

      {/* Mobile top bar */}
      <header className="topbar">
        <div className="brand">
          <img src="/mus.jpg" alt="MUS Welfare logo" />
          <div>
            <div className="sb-name">MUS Welfare</div>
            <div className="sb-sub">Admin Panel</div>
          </div>
        </div>
        <button onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="3" y1="8" x2="21" y2="8"/><line x1="3" y1="16" x2="21" y2="16"/></svg>
        </button>
      </header>
      <div className={`scrim ${mobileOpen ? 'show' : ''}`} onClick={() => setMobileOpen(false)} />

      <AdminSidebar
        page={page} pageParams={pageParams} onNavigate={navigate}
        stats={stats} user={user} onLogout={logout}
        collapsed={collapsed} onToggleCollapse={() => setCollapsed(v => !v)}
        mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} mobile={isMobile}
        theme={theme} onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      />

      <main className="main">
        {page === 'overview'         && <OverviewPage        stats={stats} onNavigate={navigate} />}
        {page === 'members'          && <MembersPage         key={pageParams.filter || 'pending'} initialFilter={pageParams.filter || 'pending'} showToast={showToast} onRefreshStats={fetchStats} />}
        {page === 'payments'         && <PaymentsPage        showToast={showToast} />}
        {page === 'pending-payments' && <PendingPaymentsPage showToast={showToast} onRefreshStats={fetchStats} />}
        {page === 'announcements'    && <AnnouncementsPage   showToast={showToast} />}
        {page === 'family-tree'      && <FamilyTreePage isAdmin={true} showToast={showToast} />}
      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast} />}
    </div>
  );
}