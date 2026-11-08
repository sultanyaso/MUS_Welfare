import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { memberAPI, announcementAPI } from '../api';
import FamilyTreePage from './FamilyTreePage';

const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CUR_YEAR  = new Date().getFullYear();
const CUR_MONTH = new Date().getMonth() + 1;

/* ══════════════════════════════════════════════════════
   THEME + GLOBAL STYLES
   Dark (default) = near-black, light-grey text, hairline borders,
   mint accent #39ffb0. "Night Mode" toggle switches to a light variant.
══════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,800&display=swap');

.md-root{
  --bg:#050506; --panel:#0e0e10; --panel2:#0a0a0c; --raise:#161619;
  --line:rgba(255,255,255,.08); --line2:rgba(255,255,255,.16); --hover:rgba(255,255,255,.05);
  --text:#ececee; --muted:#9a9aa2; --dim:#62626a;
  --accent:#39ffb0; --accent-rgb:57,255,176; --accent-text:#39ffb0; --accent-ink:#04110b;
  --ok:#7fe3b0; --ok-bg:rgba(127,227,176,.12);
  --warn:#f5c26b; --warn-rgb:245,194,107;
  --bad:#ff8f86; --bad-bg:rgba(255,143,134,.12);
  --shadow:0 24px 60px -24px rgba(0,0,0,.85);
  --font:'Sora',system-ui,-apple-system,sans-serif; --display:'Fraunces',Georgia,serif;
  display:flex; min-height:100vh; min-height:100dvh; color:var(--text); font-family:var(--font);
  background:var(--bg);
  background-image:radial-gradient(900px 520px at 88% -8%, rgba(var(--accent-rgb),.07), transparent 62%);
  background-attachment:fixed;
  -webkit-font-smoothing:antialiased;
}
.md-root[data-theme="light"]{
  --bg:#efede8; --panel:#ffffff; --panel2:#faf9f6; --raise:#f4f2ed;
  --line:rgba(20,20,20,.09); --line2:rgba(20,20,20,.17); --hover:rgba(20,20,20,.045);
  --text:#19191b; --muted:#66666d; --dim:#9b9ba2;
  --accent:#1fd890; --accent-rgb:31,216,144; --accent-text:#0a7a50; --accent-ink:#04110b;
  --ok:#1c7a45; --ok-bg:rgba(28,122,69,.1);
  --warn:#946410; --warn-rgb:200,140,30;
  --bad:#c0392b; --bad-bg:rgba(192,57,43,.09);
  --shadow:0 20px 50px -26px rgba(40,30,10,.3);
}
.md-root{text-align:left}
.md-root *{box-sizing:border-box}
.md-root button{font-family:inherit}
.md-root select,.md-root input{font-family:var(--font)}
.md-root ::-webkit-scrollbar{width:6px;height:6px}
.md-root ::-webkit-scrollbar-thumb{background:var(--line2);border-radius:6px}
.md-root ::-webkit-scrollbar-track{background:transparent}

/* ───────── Sidebar ───────── */
/* Fixed (not sticky): immune to any parent overflow rule. The spacer reserves the sidebar's width in the layout. */
.md-spacer{width:292px;flex-shrink:0;transition:width .28s cubic-bezier(.4,0,.2,1)}
.md-spacer.collapsed{width:106px}
.md-side-wrap{width:292px;padding:14px;position:fixed;left:0;top:0;z-index:60;height:100vh;height:100dvh;transition:width .28s cubic-bezier(.4,0,.2,1)}
.md-side-wrap.collapsed{width:106px}
.md-side{height:100%;display:flex;flex-direction:column;overflow:hidden;position:relative;
  background:linear-gradient(180deg,var(--panel),var(--panel2));
  border:1px solid var(--line);border-radius:26px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.04), var(--shadow)}
.md-side-head{display:flex;align-items:center;gap:12px;padding:18px 16px 12px}
.brand-logo{width:40px;height:40px;border-radius:50%;flex-shrink:0;display:grid;place-items:center;
  background:radial-gradient(circle at 30% 25%, rgba(var(--accent-rgb),.35), rgba(var(--accent-rgb),.08));
  border:1px solid rgba(var(--accent-rgb),.4)}
.brand-txt{min-width:0;flex:1}
.brand-name{font-family:var(--display);font-weight:800;font-size:.98rem;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.brand-sub{font-size:.68rem;color:var(--muted);margin-top:3px;white-space:nowrap}
.icon-btn{padding:0;width:32px;height:32px;border-radius:10px;border:1px solid var(--line);background:transparent;color:var(--muted);
  display:grid;place-items:center;cursor:pointer;flex-shrink:0;transition:all .18s}
.icon-btn:hover{background:var(--hover);color:var(--text);border-color:var(--line2)}
.md-side-search{padding:4px 16px 10px}
.search{display:flex;align-items:center;gap:10px;padding:0 10px 0 12px;height:42px;border-radius:13px;background:var(--raise);
  border:1px solid var(--line);color:var(--muted);transition:border-color .18s, box-shadow .18s}
.search:focus-within{border-color:rgba(var(--accent-rgb),.55);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.1)}
.search input{flex:1;min-width:0;background:none;border:none;outline:none;color:var(--text);font-size:.84rem}
.search input::placeholder{color:var(--dim)}
.kbd{font-size:.64rem;font-weight:600;color:var(--muted);border:1px solid var(--line2);border-radius:6px;padding:2px 6px;white-space:nowrap;background:var(--panel)}
.md-side-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;padding:4px 12px 12px}
.sec-label{font-size:.62rem;font-weight:700;letter-spacing:.16em;color:var(--dim);padding:16px 12px 8px;text-transform:uppercase}
.nav-row{position:relative}
.nav-item{position:relative;display:flex;align-items:center;gap:12px;width:100%;padding:0 12px;height:44px;margin:2px 0;
  border-radius:13px;border:1px solid transparent;background:transparent;color:var(--muted);
  font-size:.86rem;font-weight:500;cursor:pointer;text-align:left;transition:background .18s,color .18s,border-color .18s,transform .18s}
.nav-item:hover{background:var(--hover);color:var(--text)}
.nav-item.active{background:rgba(var(--accent-rgb),.1);color:var(--accent-text);border-color:rgba(var(--accent-rgb),.22);font-weight:600}
.nav-item.accent{color:var(--accent-text);background:rgba(var(--accent-rgb),.06);border-color:rgba(var(--accent-rgb),.2);font-weight:600}
.nav-item.accent:hover{background:rgba(var(--accent-rgb),.14)}
.nav-item.has-exp{padding-right:44px}
.ico{display:grid;place-items:center;width:20px;flex-shrink:0}
.lbl{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.badge{min-width:20px;height:20px;padding:0 6px;border-radius:20px;display:grid;place-items:center;font-size:.66rem;font-weight:700;
  background:var(--accent);color:var(--accent-ink);margin-left:auto}
.ndot{width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.18);margin-left:auto;margin-right:4px}
.expander{padding:0;position:absolute;right:8px;top:50%;transform:translateY(-50%);width:28px;height:28px;border-radius:9px;border:none;background:transparent;
  color:var(--muted);display:grid;place-items:center;cursor:pointer;transition:background .18s,color .18s}
.expander:hover{background:var(--hover);color:var(--text)}
.expander svg{transition:transform .25s}
.expander.open svg{transform:rotate(180deg)}
.sub-wrap{display:grid;grid-template-rows:0fr;transition:grid-template-rows .26s ease}
.sub-wrap.open{grid-template-rows:1fr}
.sub-wrap>div{overflow:hidden;min-height:0}
.sub-in{margin:2px 0 6px 21px;padding-left:12px;border-left:1px solid var(--line2);display:flex;flex-direction:column;gap:2px}
.sub-item{display:flex;align-items:center;gap:11px;height:38px;padding:0 12px;border-radius:11px;border:none;background:transparent;
  color:var(--muted);font-size:.82rem;font-weight:500;cursor:pointer;text-align:left;transition:background .18s,color .18s}
.sub-item:hover{background:var(--hover);color:var(--text)}
.sub-item.active{background:rgba(var(--accent-rgb),.08);color:var(--accent-text);font-weight:600}
.pdot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.no-match{padding:18px 12px;font-size:.8rem;color:var(--dim);text-align:center}
.md-side-foot{padding:10px 12px 12px;border-top:1px solid var(--line)}
.switch{width:36px;height:20px;border-radius:20px;background:var(--line2);position:relative;transition:background .2s;flex-shrink:0;margin-left:auto}
.switch::after{content:'';position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--muted);transition:transform .2s,background .2s}
.switch.on{background:rgba(var(--accent-rgb),.4)}
.switch.on::after{transform:translateX(16px);background:var(--accent)}
.profile-wrap{position:relative;margin-top:8px}
.profile{display:flex;align-items:center;gap:11px;width:100%;padding:10px;border-radius:16px;background:var(--raise);
  border:1px solid var(--line);color:var(--text);cursor:pointer;text-align:left;transition:border-color .18s,background .18s}
.profile:hover{border-color:var(--line2)}
.av-wrap{position:relative;flex-shrink:0}
.online{position:absolute;right:-1px;bottom:-1px;width:11px;height:11px;border-radius:50%;background:var(--ok);border:2px solid var(--raise)}
.p-name{font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.p-mail{font-size:.68rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}
.p-menu{position:absolute;left:0;right:0;bottom:calc(100% + 8px);background:var(--panel);border:1px solid var(--line2);border-radius:14px;padding:6px;
  box-shadow:var(--shadow);animation:pop .16s ease both;z-index:5}
.p-menu button{display:flex;align-items:center;gap:10px;width:100%;height:38px;padding:0 10px;border-radius:9px;border:none;background:transparent;
  color:var(--muted);font-size:.82rem;cursor:pointer;text-align:left}
.p-menu button:hover{background:var(--bad-bg);color:var(--bad)}
.md-side.collapsed .brand-txt,.md-side.collapsed .lbl,.md-side.collapsed .p-info,.md-side.collapsed .p-caret,.md-side.collapsed .switch,
.md-side.collapsed .expander,.md-side.collapsed .sub-wrap,.md-side.collapsed .md-side-search .search{display:none}
.md-side.collapsed .md-side-head{flex-direction:column;padding:18px 0 10px}
.md-side.collapsed .sec-label{font-size:0;padding:0;height:1px;background:var(--line);margin:12px 10px}
.md-side.collapsed .nav-item,.md-side.collapsed .profile{justify-content:center;padding:0}
.md-side.collapsed .profile{padding:8px 0}
.md-side.collapsed .nav-item.has-exp{padding-right:0}
.md-side.collapsed .badge{position:absolute;top:6px;right:10px;min-width:9px;width:9px;height:9px;padding:0;font-size:0}
.md-side.collapsed .ndot{position:absolute;top:8px;right:12px;margin:0}
.md-side.collapsed .md-side-search,.md-side.collapsed .md-side-scroll,.md-side.collapsed .md-side-foot{padding-left:10px;padding-right:10px}
.md-side-search .search-btn{display:none}
.md-side.collapsed .md-side-search .search-btn{display:flex}
.md-overlay{display:none}
.md-topbar{display:none}

/* ───────── Layout ───────── */
.md-main{flex:1;min-width:0;padding:clamp(16px,3vw,34px) clamp(14px,3vw,36px) 48px}
.page-head{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:26px}
.page-title{font-family:var(--display);font-size:clamp(1.45rem,3.2vw,1.9rem);font-weight:800;letter-spacing:-.01em;margin:0 0 4px}
.page-sub{color:var(--muted);font-size:.84rem;margin:0}
.card{background:var(--panel);border:1px solid var(--line);border-radius:20px;overflow:hidden}
.card-pad{padding:clamp(16px,2.4vw,24px)}
.card-head{padding:16px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:10px}
.card-title{font-family:var(--display);font-size:.98rem;font-weight:700;margin:0}
.link-btn{background:none;border:none;color:var(--accent-text);font-size:.78rem;font-weight:600;cursor:pointer;padding:4px 0}
.link-btn:hover{text-decoration:underline}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:22px}
.kpi{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:18px 20px;position:relative;overflow:hidden;transition:border-color .18s,transform .18s}
.kpi.click{cursor:pointer}
.kpi.click:hover{border-color:rgba(var(--accent-rgb),.4);transform:translateY(-2px)}
.kpi-ico{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;margin-bottom:14px;background:rgba(var(--accent-rgb),.1);color:var(--accent-text);border:1px solid rgba(var(--accent-rgb),.2)}
.kpi-val{font-family:var(--display);font-size:clamp(1.15rem,2.2vw,1.45rem);font-weight:800;line-height:1.1;word-break:break-word}
.kpi-lbl{font-size:.72rem;color:var(--muted);margin-top:6px;font-weight:500}
.grid-aside{display:grid;grid-template-columns:minmax(0,1fr) 300px;gap:18px;margin-bottom:18px}
.stack{display:flex;flex-direction:column;gap:14px}
.notice{display:flex;align-items:flex-start;gap:10px;padding:12px 16px;border-radius:14px;margin-bottom:20px;font-size:.84rem;
  background:rgba(var(--warn-rgb),.09);border:1px solid rgba(var(--warn-rgb),.28);color:var(--warn)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 20px;border-radius:12px;font-size:.84rem;font-weight:600;
  cursor:pointer;border:1px solid transparent;transition:all .18s;white-space:nowrap}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btn-accent{background:var(--accent);color:var(--accent-ink);box-shadow:0 8px 24px -10px rgba(var(--accent-rgb),.7)}
.btn-accent:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 12px 28px -10px rgba(var(--accent-rgb),.85)}
.btn-ghost{background:transparent;color:var(--muted);border-color:var(--line2)}
.btn-ghost:hover:not(:disabled){color:var(--text);background:var(--hover)}
.sel,.inp{width:100%;height:42px;padding:0 14px;border-radius:12px;background:var(--raise);border:1px solid var(--line);color:var(--text);font-size:.86rem;outline:none;transition:border-color .18s,box-shadow .18s}
.sel:focus,.inp:focus{border-color:rgba(var(--accent-rgb),.55);box-shadow:0 0 0 3px rgba(var(--accent-rgb),.1)}
.sel{width:auto;min-width:92px}
.md-root .sel option{background:var(--panel);color:var(--text)}
.field-lbl{display:block;margin-bottom:7px;font-size:.66rem;font-weight:700;color:var(--muted);letter-spacing:.12em;text-transform:uppercase}
.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}
.tbl{width:100%;border-collapse:collapse;min-width:560px}
.tbl th{padding:13px 20px;text-align:left;font-size:.64rem;font-weight:700;color:var(--dim);letter-spacing:.14em;text-transform:uppercase;border-bottom:1px solid var(--line);white-space:nowrap}
.tbl td{padding:13px 20px;font-size:.84rem;color:var(--muted);border-bottom:1px solid var(--line);vertical-align:middle}
.tbl tr:last-child td{border-bottom:none}
.tbl tbody tr{transition:background .15s}
.tbl tbody tr:hover{background:var(--hover)}
.nw{white-space:nowrap}
.t-strong{color:var(--text);font-weight:600}
.num{font-family:var(--display);font-weight:800;color:var(--text)}
.chip{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:50px;font-size:.7rem;font-weight:700;white-space:nowrap}
.chip.ok{background:var(--ok-bg);color:var(--ok)}
.chip.warn{background:rgba(var(--warn-rgb),.12);color:var(--warn)}
.chip.bad{background:var(--bad-bg);color:var(--bad)}
.chip.plain{background:var(--hover);color:var(--muted)}
.seg{display:inline-flex;gap:4px;padding:4px;border-radius:14px;background:var(--panel);border:1px solid var(--line);margin-bottom:20px;max-width:100%}
.seg button{height:36px;padding:0 20px;border-radius:10px;border:none;background:transparent;color:var(--muted);font-weight:600;font-size:.82rem;cursor:pointer;transition:all .18s}
.seg button.on{background:rgba(var(--accent-rgb),.12);color:var(--accent-text)}
.pill-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:20px}
.pill{height:36px;padding:0 16px;border-radius:50px;border:1px solid var(--line);background:var(--panel);color:var(--muted);font-weight:600;font-size:.78rem;cursor:pointer;transition:all .18s}
.pill:hover{color:var(--text);border-color:var(--line2)}
.pill.on{background:rgba(var(--accent-rgb),.12);color:var(--accent-text);border-color:rgba(var(--accent-rgb),.35)}
.empty{padding:48px 20px;text-align:center;color:var(--dim);font-size:.85rem}
.empty-ico{font-size:1.9rem;margin-bottom:8px}
.hero{border-radius:20px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;
  background:linear-gradient(135deg,rgba(var(--accent-rgb),.14),rgba(var(--accent-rgb),.03));border:1px solid rgba(var(--accent-rgb),.25)}
.eyebrow{font-size:.62rem;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);font-weight:600}
.month-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(116px,1fr));gap:10px;margin-bottom:20px}
.month-cell{border-radius:14px;padding:14px 10px;text-align:center;background:var(--panel);border:1px solid var(--line);transition:transform .15s}
.month-cell:hover{transform:translateY(-1px)}
.month-cell.ok{background:var(--ok-bg);border-color:rgba(134,217,164,.28)}
.month-cell.warn{background:rgba(var(--warn-rgb),.08);border-color:rgba(var(--warn-rgb),.3)}
.stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:20px}
.list-row{padding:13px 20px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:12px}
.list-row:last-child{border-bottom:none}
.li-ico{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;font-size:.95rem;background:var(--raise);border:1px solid var(--line);flex-shrink:0}
.ann{border-radius:20px;background:var(--panel);border:1px solid var(--line);border-left-width:3px;padding:clamp(16px,2.4vw,24px)}
.meet{margin-top:16px;padding:14px 18px;border-radius:14px;background:rgba(var(--accent-rgb),.06);border:1px solid rgba(var(--accent-rgb),.22)}
.bar-org{background:linear-gradient(180deg,var(--muted),var(--dim))}
.bar-cur{background:linear-gradient(180deg,var(--accent),rgba(var(--accent-rgb),.4))}
.bar-my{background:rgba(var(--accent-rgb),.3);border:1px solid rgba(var(--accent-rgb),.65)}
.bar-empty{background:var(--line)}
.legend{display:flex;gap:6px 16px;margin-top:12px;justify-content:flex-end;flex-wrap:wrap}

/* ───────── Pay Now modal ───────── */
.modal-overlay{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.66);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;animation:fade .2s ease both}
.modal-card{width:100%;max-width:520px;max-height:90vh;max-height:90dvh;display:flex;flex-direction:column;overflow:hidden;background:var(--panel);
  border:1px solid var(--line2);border-radius:24px;box-shadow:0 40px 100px -30px rgba(0,0,0,.9);animation:modalIn .3s cubic-bezier(.34,1.4,.64,1) both;color:var(--text)}
.modal-head{padding:18px 20px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;border-bottom:1px solid var(--line);
  background:linear-gradient(180deg,rgba(var(--accent-rgb),.08),transparent)}
.steps{display:flex;flex-shrink:0;border-bottom:1px solid var(--line)}
.step{flex:1;padding:10px 4px;text-align:center;border-bottom:2px solid transparent;font-size:.58rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--dim);transition:all .2s}
.step.active{color:var(--accent-text);border-bottom-color:var(--accent);background:rgba(var(--accent-rgb),.05)}
.step.done{color:var(--ok)}
.modal-body{flex:1;overflow-y:auto;overflow-x:hidden;padding:20px 20px calc(24px + env(safe-area-inset-bottom));-webkit-overflow-scrolling:touch}
.modal-p{margin:0 0 16px;font-size:.86rem;color:var(--muted);line-height:1.65}
.modal-p strong{color:var(--text)}
.method-btn{display:flex;align-items:center;gap:14px;width:100%;padding:16px 18px;border-radius:16px;border:1px solid var(--line);background:var(--raise);color:var(--text);cursor:pointer;text-align:left;transition:all .18s}
.method-btn:hover{border-color:rgba(var(--accent-rgb),.5);background:rgba(var(--accent-rgb),.06)}
.method-ico{width:48px;height:48px;border-radius:13px;display:grid;place-items:center;flex-shrink:0;background:rgba(var(--accent-rgb),.1);border:1px solid rgba(var(--accent-rgb),.25);color:var(--accent-text)}
.two-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px}
.row-btns{display:flex;gap:10px}
.row-btns .btn:first-child{flex:1}
.row-btns .btn:last-child{flex:2}
.acct{background:var(--raise);border:1px solid var(--line);border-radius:16px;padding:16px 18px;margin-bottom:16px}
.acct-row{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;padding:9px 0;border-bottom:1px solid var(--line)}
.drop{border:1.5px dashed var(--line2);border-radius:14px;overflow:hidden;position:relative;transition:border-color .2s}
.drop.has{border-color:rgba(var(--accent-rgb),.6)}
.summary{background:var(--raise);border:1px solid var(--line);border-radius:16px;padding:6px 16px;margin-bottom:14px}
.summary-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)}
.summary-row:last-of-type{border-bottom:none}
.err{padding:10px 14px;background:var(--bad-bg);border-radius:12px;margin-bottom:14px;font-size:.82rem;color:var(--bad);font-weight:600}

/* ───────── Toast ───────── */
.toast{position:fixed;bottom:24px;right:24px;z-index:9999;max-width:380px;padding:13px 18px;border-radius:14px;display:flex;align-items:center;gap:10px;
  font-size:.85rem;font-weight:500;background:var(--panel);border:1px solid var(--line2);box-shadow:var(--shadow);animation:pop .3s ease both;color:var(--text)}
.toast.success .t-ico{color:var(--accent-text)}
.toast.error .t-ico{color:var(--bad)}

@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes modalIn{from{opacity:0;transform:scale(.95) translateY(12px)}to{opacity:1;transform:none}}
@keyframes sheetIn{from{transform:translateY(100%)}to{transform:none}}

/* ───────── Responsive ───────── */
@media (max-width:1100px){
  .grid-aside{grid-template-columns:1fr}
  .grid-aside .stack{flex-direction:row;flex-wrap:wrap}
  .grid-aside .stack>*{flex:1 1 260px}
}
/* Mobile layout is driven by the JS-set .is-mobile class (not only media queries),
   so CSS and the React state can never disagree. Covers phones in portrait AND landscape. */
.md-root.is-mobile{flex-direction:column}
.md-root.is-mobile .md-spacer{display:none}
.md-root.is-mobile .md-topbar{display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:50;padding:10px 14px;padding-top:calc(10px + env(safe-area-inset-top));
  background:rgba(5,5,6,.82);background:color-mix(in srgb,var(--bg) 82%,transparent);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid var(--line)}
.md-root.is-mobile .md-side-wrap,.md-root.is-mobile .md-side-wrap.collapsed{position:fixed;left:0;top:0;bottom:0;height:100vh;height:100dvh;width:min(312px,88vw)!important;min-width:min(312px,88vw)!important;max-width:none!important;flex:none!important;box-sizing:border-box;z-index:8000;
  transform:translateX(-110%);visibility:hidden;transition:transform .3s cubic-bezier(.4,0,.2,1),visibility 0s linear .3s;
  padding:10px;padding-top:calc(10px + env(safe-area-inset-top));padding-bottom:calc(10px + env(safe-area-inset-bottom))}
.md-root.is-mobile .md-side-wrap.mopen{transform:none;visibility:visible;transition:transform .3s cubic-bezier(.4,0,.2,1),visibility 0s}
.md-root.is-mobile .md-side{width:100%!important;min-width:0;max-width:none!important}
.md-root.is-mobile .md-side-head,.md-root.is-mobile .md-side-search,.md-root.is-mobile .md-side-scroll,.md-root.is-mobile .md-side-foot{width:100%!important;max-width:none!important}
.md-root.is-mobile .md-side .nav-item,.md-root.is-mobile .md-side .profile,.md-root.is-mobile .md-side .search{max-width:none!important}
.md-root.is-mobile .md-side-scroll{overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.md-root.is-mobile .md-overlay{display:block;position:fixed;inset:0;z-index:7999;background:rgba(0,0,0,.6);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);animation:fade .2s ease both}
.md-root.is-mobile .md-main{padding:18px 14px 40px;width:100%}
.md-root.is-mobile .toast{left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));max-width:none}
.md-root.is-mobile .modal-overlay{align-items:flex-end;padding:0}
.md-root.is-mobile .modal-card{max-width:none;border-radius:24px 24px 0 0;max-height:94vh;max-height:94dvh;animation:sheetIn .32s cubic-bezier(.2,.9,.3,1) both}
.md-root.is-mobile .hide-md{display:none}
@media (max-height:520px) and (orientation:landscape){
  .md-root.is-mobile .md-side-head{padding:12px 14px 8px}
  .md-root.is-mobile .nav-item{height:40px}
  .md-root.is-mobile .sec-label{padding:10px 12px 6px}
}
@media (max-width:560px){
  .hide-sm{display:none}
  .two-col{grid-template-columns:1fr}
  .step{font-size:.5rem;letter-spacing:0}
  .page-head .btn{width:100%}
  .kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .kpi{padding:14px}
  .month-grid{grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px}
  .tbl th,.tbl td{padding:12px 14px}
  .legend{justify-content:flex-start}
  .search-w{width:100%!important}
  .search-w input{width:100%!important}
}
@media (max-width:380px){
  .kpi-grid{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){
  .md-root *{animation-duration:.01ms!important;transition-duration:.01ms!important}
}
`;

/* ─── Icons (thin outline, consistent 1.6 stroke) ─── */
const PATHS = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  users:     <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  bell:      <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
  tree:      <><circle cx="12" cy="4" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><path d="M12 6v5M12 11l-6 6M12 11l6 6"/></>,
  card:      <><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/></>,
  plus:      <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
  search:    <><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>,
  chevDown:  <path d="m6 9 6 6 6-6"/>,
  chevUp:    <path d="m18 15-6-6-6 6"/>,
  panelL:    <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/><path d="m15 10-2 2 2 2"/></>,
  panelR:    <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/><path d="m13 10 2 2-2 2"/></>,
  sun:       <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
  moon:      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>,
  logout:    <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>,
  menu:      <><path d="M4 7h16M4 12h16M4 17h16"/></>,
  close:     <path d="M18 6 6 18M6 6l12 12"/>,
  qr:        <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M20 20v.01M17 20h3"/></>,
  wallet:    <><path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2z"/><circle cx="17" cy="14.5" r="1"/></>,
  calendar:  <><rect x="3" y="4" width="18" height="17" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  check:     <path d="m5 12 5 5L20 7"/>,
  clock:     <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
};
function I({ n, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[n]}
    </svg>
  );
}

/* ─── hooks ─── */
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

/* ─── Avatar ─── */
function Avatar({ name, size = 36 }) {
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:'radial-gradient(circle at 30% 25%, rgba(var(--accent-rgb),.28), rgba(var(--accent-rgb),.06))',
      border:'1px solid rgba(var(--accent-rgb),.35)',
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'var(--accent-text)', fontWeight:700, fontSize:size*0.38 }}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`toast ${type}`} role="status">
      <span className="t-ico"><I n={type === 'success' ? 'check' : 'close'} size={16}/></span>
      <span style={{ flex:1 }}>{message}</span>
      <button onClick={onClose} aria-label="Dismiss" style={{ background:'none', border:'none', color:'var(--muted)', cursor:'pointer', padding:0, display:'grid' }}><I n="close" size={14}/></button>
    </div>
  );
}

/* ─── Bar Chart ─── */
function BarChart({ months, myPayments, year = CUR_YEAR, height = 180 }) {
  const [active, setActive] = useState(null);
  const maxVal = Math.max(...months.map(m => m.total), 1);
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', alignItems:'flex-end', gap:'clamp(3px,1vw,8px)', height }}>
        {months.map(m => {
          const orgPct = (m.total / maxVal) * 100;
          const myPay  = myPayments?.find(p => p.month === m.month && p.year === year && p.status === 'verified');
          const isCur  = m.month === CUR_MONTH && year === CUR_YEAR;
          return (
            <div key={m.month} style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', alignItems:'center', gap:3, position:'relative' }}>
              <div style={{ position:'absolute', bottom:'100%', left:'50%', transform:'translateX(-50%)',
                background:'var(--raise)', border:'1px solid var(--line2)', color:'var(--text)', borderRadius:8, padding:'4px 9px',
                fontSize:'0.65rem', fontWeight:600, whiteSpace:'nowrap', marginBottom:4,
                opacity: active === m.month ? 1 : 0, transition:'opacity .15s', pointerEvents:'none', zIndex:10 }}>
                {m.total > 0 ? `PKR ${m.total.toLocaleString()}` : 'No data'}
                {myPay ? ` · You: ${myPay.amount.toLocaleString()}` : ''}
              </div>
              <div style={{ width:'100%', display:'flex', alignItems:'flex-end', gap:1, height:height-24, cursor:'pointer' }}
                onMouseEnter={() => setActive(m.month)} onMouseLeave={() => setActive(null)}
                onClick={() => setActive(a => a === m.month ? null : m.month)}>
                <div className={isCur ? 'bar-cur' : m.total > 0 ? 'bar-org' : 'bar-empty'}
                  style={{ flex:1, borderRadius:'5px 5px 0 0', height:`${Math.max(orgPct, m.total>0?3:0)}%`, transition:'height .5s', minHeight:m.total>0?3:0 }}/>
                {myPay && (
                  <div className="bar-my" style={{ flex:1, borderRadius:'5px 5px 0 0', height:`${(myPay.amount/maxVal)*100}%`, transition:'height .5s', minHeight:3 }}/>
                )}
              </div>
              <div style={{ fontSize:'0.6rem', color:isCur?'var(--accent-text)':'var(--dim)', fontWeight:isCur?700:500, marginTop:2 }}>{m.label}</div>
            </div>
          );
        })}
      </div>
      <div className="legend">
        {[['bar-org','Org total'],['bar-my','My payment'],['bar-cur','Current month']].map(([cls,label]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.7rem', color: label==='Current month' ? 'var(--accent-text)' : 'var(--muted)' }}>
            <div className={cls} style={{ width:10, height:10, borderRadius:3 }}/>{label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Donut Chart ─── */
function DonutChart({ paid, total, size = 120 }) {
  const r=44, cx=60, cy=60, circ=2*Math.PI*r;
  const dash = (total>0 ? paid/total : 0) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" style={{ stroke:'var(--line2)' }} strokeWidth="9"/>
      <circle cx={cx} cy={cy} r={r} fill="none" style={{ stroke:'var(--accent)', transition:'stroke-dasharray .8s' }} strokeWidth="9"
        strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ/4} strokeLinecap="round"/>
      <text x={cx} y={cy-4} textAnchor="middle" fontSize="22" fontWeight="800" style={{ fill:'var(--text)' }} fontFamily="Fraunces,serif">{paid}</text>
      <text x={cx} y={cy+14} textAnchor="middle" fontSize="10" style={{ fill:'var(--muted)' }} fontFamily="Sora,sans-serif">of {total}</text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════════ */
function NavItem({ icon, label, active, onClick, badge, dot, accent, hasExp }) {
  return (
    <button className={`nav-item${active ? ' active' : ''}${accent ? ' accent' : ''}${hasExp ? ' has-exp' : ''}`} onClick={onClick} title={label} aria-current={active ? 'page' : undefined}>
      <span className="ico"><I n={icon}/></span>
      <span className="lbl">{label}</span>
      {badge > 0 && <span className="badge">{badge}</span>}
      {dot && <span className="ndot"/>}
    </button>
  );
}

function Sidebar({ page, setPage, payTab, setPayTab, stats, user, logout, collapsed, onToggle, isMobile, mobileOpen, closeMobile, onPayNow, theme, toggleTheme, annDot }) {
  const [q,        setQ]        = useState('');
  const [payOpen,  setPayOpen]  = useState(true);
  const [menu,     setMenu]     = useState(false);
  const inputRef = useRef(null);
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/i.test(navigator.platform || '');

  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (collapsed) onToggle();
        setTimeout(() => inputRef.current?.focus(), 60);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [collapsed, onToggle]);

  useEffect(() => {
    if (!menu) return;
    const h = e => { if (!e.target.closest('.profile-wrap')) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  const go = key => { setPage(key); if (isMobile) closeMobile(); };
  const match = s => !q.trim() || s.toLowerCase().includes(q.trim().toLowerCase());

  const main = [
    { key:'overview',      label:'Dashboard',     icon:'dashboard' },
    { key:'members',       label:'Members',       icon:'users' },
    { key:'announcements', label:'Announcements', icon:'bell', dot: annDot },
    { key:'family-tree',   label:'Family Tree',   icon:'tree' },
  ].filter(i => match(i.label));

  const showPayments = match('Payments') || match('My Payments') || match('Organisation');
  const showPayNow   = match('Pay Now');
  const nothing      = main.length === 0 && !showPayments && !showPayNow;

  const subs = [
    { key:'mine', label:'My Payments',  color:'#9db8ff' },
    { key:'org',  label:'Organisation', color:'var(--accent)' },
  ];

  return (
    <>
      {isMobile && mobileOpen && <div className="md-overlay" onClick={closeMobile}/>}
      <div className={`md-spacer${collapsed ? ' collapsed' : ''}`} aria-hidden="true"/>
      <div className={`md-side-wrap${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mopen' : ''}`}
        style={isMobile ? { width:'min(312px, 88vw)', minWidth:'min(312px, 88vw)', maxWidth:'none', flex:'none' } : undefined}>
        <aside className={`md-side${collapsed ? ' collapsed' : ''}`} aria-label="Main navigation" style={isMobile ? { width:'100%', minWidth:0, maxWidth:'none' } : undefined}>

          {/* Workspace header */}
          <div className="md-side-head">
            <div className="brand-logo">
              <svg width="20" height="20" viewBox="0 0 60 60"><path d="M10 42 Q7 25 22 14 Q30 8 40 13 L36 20 Q28 11 20 20 Q7 30 15 44Z" style={{ fill:'var(--text)' }}/><path d="M50 18 Q53 35 38 46 Q30 52 20 47 L24 40 Q32 49 40 40 Q53 30 45 16Z" style={{ fill:'var(--muted)' }}/><ellipse cx="30" cy="32" rx="9" ry="6" style={{ fill:'var(--accent)' }}/></svg>
            </div>
            <div className="brand-txt">
              <div className="brand-name">MUS Welfare</div>
              <div className="brand-sub">Member Portal</div>
            </div>
            {isMobile
              ? <button className="icon-btn" onClick={closeMobile} aria-label="Close menu"><I n="close" size={16}/></button>
              : <button className="icon-btn" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand' : 'Collapse'}><I n={collapsed ? 'panelR' : 'panelL'} size={16}/></button>}
          </div>

          {/* Search */}
          <div className="md-side-search">
            <label className="search">
              <I n="search" size={16}/>
              <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" aria-label="Search navigation"/>
              <span className="kbd">{isMac ? '⌘K' : 'Ctrl K'}</span>
            </label>
            <button className="nav-item search-btn" onClick={onToggle} title="Search" style={{ justifyContent:'center', padding:0 }}><I n="search"/></button>
          </div>

          {/* Scrollable nav */}
          <nav className="md-side-scroll">
            {main.length > 0 && <div className="sec-label">Main</div>}
            {main.map(i => (
              <NavItem key={i.key} icon={i.icon} label={i.label} dot={i.dot} active={page === i.key} onClick={() => go(i.key)}/>
            ))}

            {showPayments && (
              <>
                <div className="sec-label">Workspace</div>
                <div className="nav-row">
                  <NavItem icon="card" label="Payments" hasExp badge={stats?.myPending || 0}
                    active={page === 'payments'} onClick={() => { go('payments'); setPayOpen(true); }}/>
                  <button className={`expander${payOpen ? ' open' : ''}`} onClick={() => setPayOpen(v => !v)} aria-label="Toggle payments links" aria-expanded={payOpen}>
                    <I n="chevDown" size={16}/>
                  </button>
                </div>
                <div className={`sub-wrap${payOpen ? ' open' : ''}`}>
                  <div>
                    <div className="sub-in">
                      {subs.map(s => (
                        <button key={s.key} className={`sub-item${page === 'payments' && payTab === s.key ? ' active' : ''}`}
                          onClick={() => { setPayTab(s.key); go('payments'); }}>
                          <span className="pdot" style={{ background:s.color }}/>{s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {showPayNow && (
              <>
                <div className="sec-label">Quick action</div>
                <NavItem icon="plus" label="Pay Now" accent onClick={() => { onPayNow(); if (isMobile) closeMobile(); }}/>
              </>
            )}

            {nothing && <div className="no-match">No matches for “{q}”</div>}
          </nav>

          {/* Bottom — anchored */}
          <div className="md-side-foot">
            <button className="nav-item" onClick={toggleTheme} title="Night Mode" style={{ margin:0 }} role="switch" aria-checked={theme === 'dark'}>
              <span className="ico"><I n={theme === 'dark' ? 'moon' : 'sun'}/></span>
              <span className="lbl">Night Mode</span>
              <span className={`switch${theme === 'dark' ? ' on' : ''}`}/>
            </button>

            <div className="profile-wrap">
              {menu && (
                <div className="p-menu" role="menu">
                  <button onClick={logout} role="menuitem"><I n="logout" size={16}/>Log out</button>
                </div>
              )}
              <button className="profile" onClick={() => setMenu(v => !v)} aria-haspopup="menu" aria-expanded={menu} title={user?.fullName}>
                <span className="av-wrap"><Avatar name={user?.fullName} size={38}/><span className="online"/></span>
                <span className="p-info" style={{ flex:1, minWidth:0 }}>
                  <div className="p-name">{user?.fullName}</div>
                  <div className="p-mail">{user?.email || (user?.memberType === 'job_holder' ? 'Job Holder' : 'Student')}</div>
                </span>
                <span className="p-caret" style={{ color:'var(--muted)', display:'grid' }}><I n="chevUp" size={16}/></span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   BOTTOM DOCK (phones & tablets)
══════════════════════════════════════════════════════ */
const DOCK_ITEMS = [
  { key: 'overview',      label: 'Dashboard',     icon: 'dashboard' },
  { key: 'members',       label: 'Members',       icon: 'users' },
  { key: 'payments',      label: 'Payments',      icon: 'card', dot: 'pay' },
  { key: 'announcements', label: 'Announcements', icon: 'bell', dot: 'ann' },
  { key: 'family-tree',   label: 'Family Tree',   icon: 'tree' },
];

function Dock({ page, setPage, stats, annDot }) {
  const idx = Math.max(0, DOCK_ITEMS.findIndex(d => d.key === page));
  const showDot = d => (d === 'ann' ? annDot : d === 'pay' ? (stats?.myPending || 0) > 0 : false);
  return (
    <div className="dk-wrap">
      <nav className="dk" aria-label="Pages" style={{ '--i': idx, '--n': DOCK_ITEMS.length }}>
        <div className="dk-cone" />
        <div className="dk-grid" style={{ gridTemplateColumns: `repeat(${DOCK_ITEMS.length}, 1fr)` }}>
          {DOCK_ITEMS.map(({ key, label, icon, dot }) => (
            <button
              key={key}
              className={`dk-item${page === key ? ' active' : ''}`}
              onClick={() => setPage(key)}
              aria-label={label} title={label}
              aria-current={page === key ? 'page' : undefined}
            >
              <span className="dk-ic">
                <I n={icon} size={20} />
                {dot && showDot(dot) && <i className="dk-badge" />}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

const dockCss = `
.dk-wrap { display: none; }
.md-root.is-mobile .dk-wrap { position: fixed; left: 0; right: 0; bottom: 0; z-index: 1000; display: flex; justify-content: center; padding: 0 12px calc(14px + env(safe-area-inset-bottom)); pointer-events: none; }
.dk { position: relative; pointer-events: auto; width: min(520px, 100%); height: 70px; overflow: hidden; border-radius: 999px; border: 1px solid rgba(255,255,255,.16);
  background: linear-gradient(180deg, rgba(34,34,38,.78), rgba(16,16,19,.78)); -webkit-backdrop-filter: blur(22px) saturate(1.2); backdrop-filter: blur(22px) saturate(1.2);
  box-shadow: 0 24px 60px rgba(0,0,0,.6), 0 1px 0 rgba(255,255,255,.08) inset; }
.dk-grid { position: relative; z-index: 2; height: 100%; display: grid; }
.dk-item { padding: 0; display: flex; align-items: center; justify-content: center; background: none; border: none; cursor: pointer; color: var(--muted); -webkit-tap-highlight-color: transparent; transition: color .5s ease; }
.dk-item:hover, .dk-item.active { color: var(--text); }
.dk-ic { position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1.5px solid transparent; transition: border-color .6s ease, background .6s ease, box-shadow .6s ease; }
.dk-item.active .dk-ic { border-color: rgba(255,255,255,.85); background: rgba(255,255,255,.05); box-shadow: 0 0 24px rgba(var(--accent-rgb), .25); }
.dk-item:focus-visible .dk-ic { border-color: var(--accent); }
.dk-badge { position: absolute; top: 4px; right: 4px; width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px var(--accent); }
.dk-cone { position: absolute; z-index: 1; top: 0; bottom: 0; left: 0; width: calc(100% / var(--n)); pointer-events: none; transform: translateX(calc(var(--i) * 100%)); transition: transform .9s cubic-bezier(.22,1,.36,1); }
.dk-cone::before { content: ''; position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(var(--accent-rgb), .5), rgba(var(--accent-rgb), .12) 55%, rgba(var(--accent-rgb), 0) 100%); clip-path: polygon(34% 0, 66% 0, 100% 100%, 0 100%); filter: blur(3px); }
.dk-cone::after { content: ''; position: absolute; top: 0; left: 50%; width: 30%; height: 4px; margin-left: -15%; border-radius: 0 0 6px 6px; background: var(--accent); box-shadow: 0 0 20px var(--accent), 0 0 44px rgba(var(--accent-rgb), .6); }

/* mobile: dock replaces the drawer */
.md-root.is-mobile .md-side-wrap, .md-root.is-mobile .md-overlay { display: none !important; }
.md-root.is-mobile .md-main { padding-bottom: 120px; }
.md-root.is-mobile .toast { bottom: calc(96px + env(safe-area-inset-bottom)); }
.md-root.is-mobile .md-topbar .icon-btn { width: 36px; height: 36px; }

.md-root[data-theme="light"] .dk { background: linear-gradient(180deg, rgba(255,255,255,.88), rgba(245,242,236,.88)); border-color: rgba(0,0,0,.12); box-shadow: 0 20px 50px rgba(40,30,10,.18), 0 1px 0 #fff inset; }
.md-root[data-theme="light"] .dk-item.active .dk-ic { border-color: rgba(0,0,0,.55); background: rgba(0,0,0,.04); }
@media (prefers-reduced-motion: reduce) { .dk-cone { transition-duration: .01s; } }
`;

/* ══════════════════════════════════════════════════════
   PAY NOW MODAL — bottom sheet on phones, centered card elsewhere
══════════════════════════════════════════════════════ */
function PayNowModal({ user, myPayments, onClose, onSuccess }) {
  const minAmount = user?.memberType === 'student' ? 100 : 500;

  const [method,     setMethod]     = useState('');
  const [step,       setStep]       = useState(0);
  const [month,      setMonth]      = useState(CUR_MONTH);
  const [year,       setYear]       = useState(CUR_YEAR);
  const [amount,     setAmount]     = useState(minAmount);
  const [note,       setNote]       = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [preview,    setPreview]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const alreadyVerified = myPayments?.find(p => p.month === month && p.year === year && p.status === 'verified');
  const alreadyPending  = myPayments?.find(p => p.month === month && p.year === year && p.status === 'pending');
  const blocked = !!alreadyVerified || !!alreadyPending || Number(amount) < minAmount;

  const BANK = {
    name:    'Meezan Bank',
    title:   'MUS Welfare Organization',
    account: '0123-4567890123',
    iban:    'PK36MEZN0001234567890123',
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Screenshot must be under 5 MB.'); return; }
    setScreenshot(file);
    setError('');
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('month',         month);
      fd.append('year',          year);
      fd.append('amount',        amount);
      fd.append('note',          note);
      fd.append('paymentMethod', method);
      if (method === 'account' && screenshot) fd.append('screenshot', screenshot);
      await memberAPI.submitPayment(fd);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
    } finally { setLoading(false); }
  };

  const stepLabels = method === 'account'
    ? ['Select Month', 'Account Details', 'Upload Proof', 'Confirm']
    : ['Select Month', 'Scan QR', 'Confirm'];

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label="Pay now">

        <div className="modal-head">
          <div>
            <div style={{ fontFamily:'var(--display)', fontWeight:800, fontSize:'1.1rem', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ color:'var(--accent-text)', display:'grid' }}><I n="card" size={20}/></span> Pay Now
            </div>
            <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginTop:3 }}>
              {step === 0 ? 'Choose payment method' : stepLabels[step - 1]}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><I n="close" size={16}/></button>
        </div>

        {step > 0 && (
          <div className="steps">
            {stepLabels.map((label, i) => (
              <div key={label} className={`step${step > i+1 ? ' done' : step === i+1 ? ' active' : ''}`}>
                {step > i+1 ? '✓ ' : `${i+1}. `}{label}
              </div>
            ))}
          </div>
        )}

        <div className="modal-body">

          {/* STEP 0 */}
          {step === 0 && (
            <div>
              <p className="modal-p">How would you like to pay your monthly contribution?</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                <button className="method-btn" onClick={() => { setMethod('qr'); setStep(1); }}>
                  <div className="method-ico"><I n="qr" size={24}/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'.93rem', marginBottom:3 }}>Scan QR Code</div>
                    <div style={{ fontSize:'.76rem', color:'var(--muted)', lineHeight:1.5 }}>Scan with your banking app and pay directly.</div>
                  </div>
                  <span style={{ color:'var(--accent-text)' }}>→</span>
                </button>
                <button className="method-btn" onClick={() => { setMethod('account'); setStep(1); }}>
                  <div className="method-ico"><I n="wallet" size={24}/></div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'.93rem', marginBottom:3 }}>Bank Account Transfer</div>
                    <div style={{ fontSize:'.76rem', color:'var(--muted)', lineHeight:1.5 }}>Transfer to our account and upload a screenshot as proof.</div>
                  </div>
                  <span style={{ color:'var(--accent-text)' }}>→</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <p className="modal-p">Select the month you are paying for.</p>
              <div className="two-col">
                <div>
                  <label className="field-lbl">Month</label>
                  <select className="sel" style={{ width:'100%' }} value={month} onChange={e => setMonth(Number(e.target.value))}>
                    {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-lbl">Year</label>
                  <select className="sel" style={{ width:'100%' }} value={year} onChange={e => setYear(Number(e.target.value))}>
                    {[CUR_YEAR, CUR_YEAR-1].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <label className="field-lbl">Amount (PKR) — min PKR {minAmount}</label>
                <input className="inp" type="number" inputMode="numeric" value={amount} min={minAmount} onChange={e => setAmount(e.target.value)}/>
              </div>
              <div style={{ marginBottom:18 }}>
                <label className="field-lbl">Note (optional)</label>
                <input className="inp" value={note} onChange={e => setNote(e.target.value)}
                  placeholder={method === 'account' ? 'e.g. Transferred via Meezan Bank' : 'e.g. via JazzCash'}/>
              </div>
              {alreadyVerified && <div className="notice" style={{ background:'var(--ok-bg)', borderColor:'transparent', color:'var(--ok)' }}>✅ Already paid for {MONTHS[month-1]} {year}.</div>}
              {alreadyPending && !alreadyVerified && <div className="notice">⏳ Pending submission already exists for {MONTHS[month-1]} {year}.</div>}
              <div className="row-btns">
                <button className="btn btn-ghost" onClick={() => { setStep(0); setMethod(''); }}>← Back</button>
                <button className="btn btn-accent" disabled={blocked} onClick={() => setStep(2)}>
                  {method === 'account' ? 'View Account Details →' : 'Scan QR Code →'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — QR */}
          {step === 2 && method === 'qr' && (
            <div style={{ textAlign:'center' }}>
              <p className="modal-p">
                Scan the QR code and pay exactly <strong>PKR {Number(amount).toLocaleString()}</strong> for <strong>{MONTHS[month-1]} {year}</strong>.
              </p>
              <div style={{ display:'inline-block', padding:14, background:'#fff', borderRadius:18, border:'1px solid var(--line2)', marginBottom:14 }}>
                <img src="/qr-code.png" alt="Bank QR Code" style={{ width:'min(180px,52vw)', height:'min(180px,52vw)', objectFit:'contain', display:'block' }}
                  onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
                <div style={{ width:180, maxWidth:'52vw', height:180, display:'none', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, color:'#555' }}>
                  <I n="qr" size={54}/>
                  <p style={{ margin:0, fontSize:'.72rem', fontWeight:600 }}>Place qr-code.png in<br/>frontend/public/</p>
                </div>
              </div>
              <div style={{ display:'block' }}>
                <div style={{ display:'inline-block', background:'rgba(var(--accent-rgb),.08)', border:'1px solid rgba(var(--accent-rgb),.25)', borderRadius:14, padding:'12px 22px', marginBottom:14 }}>
                  <div className="eyebrow">Pay exactly</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:'1.5rem', fontWeight:800, color:'var(--accent-text)' }}>PKR {Number(amount).toLocaleString()}</div>
                  <div style={{ fontSize:'.75rem', color:'var(--muted)', marginTop:2 }}>{MONTHS[month-1]} {year}</div>
                </div>
              </div>
              <div className="notice" style={{ textAlign:'left', marginBottom:20 }}>
                ⚠️ <span>After paying, tap <strong>"I've Paid"</strong> to notify the admin for verification.</span>
              </div>
              <div className="row-btns">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-accent" onClick={() => setStep(3)}>I've Paid ✓</button>
              </div>
            </div>
          )}

          {/* STEP 2 — Account */}
          {step === 2 && method === 'account' && (
            <div>
              <p className="modal-p">
                Transfer <strong>PKR {Number(amount).toLocaleString()}</strong> to the account below, then upload your payment screenshot.
              </p>
              <div className="acct">
                <div className="eyebrow" style={{ marginBottom:6 }}>Bank Account Details</div>
                {[['Bank', BANK.name],['Account Title', BANK.title],['Account No.', BANK.account],['IBAN', BANK.iban]].map(([label, val]) => (
                  <div key={label} className="acct-row">
                    <span style={{ fontSize:'.66rem', color:'var(--dim)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em' }}>{label}</span>
                    <span style={{ fontSize:'.83rem', fontWeight:600, fontFamily:label==='Account No.'||label==='IBAN'?'ui-monospace,monospace':'inherit', wordBreak:'break-all', textAlign:'right' }}>{val}</span>
                  </div>
                ))}
                <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(var(--accent-rgb),.08)', borderRadius:12, border:'1px solid rgba(var(--accent-rgb),.25)' }}>
                  <div className="eyebrow">Amount to Transfer</div>
                  <div style={{ fontFamily:'var(--display)', fontSize:'1.35rem', fontWeight:800, color:'var(--accent-text)' }}>PKR {Number(amount).toLocaleString()}</div>
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <label className="field-lbl">Upload Payment Screenshot *</label>
                <div className={`drop${preview ? ' has' : ''}`}>
                  {preview ? (
                    <div style={{ position:'relative' }}>
                      <img src={preview} alt="proof" style={{ width:'100%', maxHeight:200, objectFit:'contain', display:'block' }}/>
                      <button onClick={() => { setScreenshot(null); setPreview(''); }} aria-label="Remove screenshot"
                        style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,.65)', border:'none', borderRadius:'50%', width:30, height:30, color:'#fff', cursor:'pointer', display:'grid', placeItems:'center' }}><I n="close" size={14}/></button>
                    </div>
                  ) : (
                    <>
                      <label htmlFor="ss-input" style={{ cursor:'pointer', display:'block', padding:'26px 16px', textAlign:'center', background:'var(--raise)' }}>
                        <div style={{ fontSize:'1.8rem', marginBottom:8 }}>📸</div>
                        <div style={{ fontWeight:700, fontSize:'.88rem', color:'var(--accent-text)', marginBottom:4 }}>Tap to upload screenshot</div>
                        <div style={{ fontSize:'.75rem', color:'var(--muted)' }}>JPG, PNG or WEBP — max 5 MB</div>
                      </label>
                      <input id="ss-input" type="file" accept="image/*" onChange={handleFileChange}
                        style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', width:'100%', height:'100%' }}/>
                    </>
                  )}
                </div>
              </div>

              {error && <div className="err">⚠️ {error}</div>}

              <div className="row-btns">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-accent" disabled={!screenshot} onClick={() => { setError(''); setStep(3); }}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <div style={{ textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:'2.1rem', marginBottom:6 }}>{method === 'account' ? '🏦' : '🎉'}</div>
                <p className="modal-p" style={{ margin:0 }}>Review your details and tap <strong>Submit</strong> to notify the admin.</p>
              </div>
              <div className="summary">
                {[
                  ['Month',  `${MONTHS[month-1]} ${year}`],
                  ['Amount', `PKR ${Number(amount).toLocaleString()}`],
                  ['Method', method === 'account' ? '🏦 Bank Transfer' : '📱 QR Code'],
                  ['Member', user?.fullName],
                  ['Type',   user?.memberType === 'student' ? '🎓 Student' : '💼 Job Holder'],
                  ['Note',   note || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="summary-row">
                    <span style={{ fontSize:'.7rem', color:'var(--dim)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.1em', flexShrink:0 }}>{label}</span>
                    <span style={{ fontSize:'.85rem', fontWeight:600, textAlign:'right', wordBreak:'break-word' }}>{val}</span>
                  </div>
                ))}
                {preview && (
                  <div style={{ padding:'10px 0 12px' }}>
                    <div className="field-lbl">Screenshot</div>
                    <img src={preview} alt="proof" style={{ width:'100%', maxHeight:120, objectFit:'contain', borderRadius:10, border:'1px solid var(--line)' }}/>
                  </div>
                )}
              </div>
              {error && <div className="err">⚠️ {error}</div>}
              <div className="notice" style={{ marginBottom:18 }}>
                ℹ️ <span>Shows as <strong>Pending</strong> until admin verifies — usually within a few hours.</span>
              </div>
              <div className="row-btns">
                <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={loading}>← Back</button>
                <button className="btn btn-accent" onClick={handleSubmit} disabled={loading}>{loading ? 'Submitting…' : 'Submit Payment ✓'}</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   OVERVIEW PAGE
══════════════════════════════════════════════════════ */
function OverviewPage({ stats, myPayments, onNavigate, onPayNow }) {
  const [summary, setSummary] = useState(null);
  const [selYear, setSelYear] = useState(CUR_YEAR);

  useEffect(() => {
    setSummary(null);
    memberAPI.getSummary(selYear).then(r => setSummary(r.data)).catch(() => {});
  }, [selYear]);

  const paidThisYear = myPayments?.filter(p => p.year === CUR_YEAR && p.status === 'verified').length || 0;

  const kpis = [
    { label:'My Total Contributed', value:`PKR ${(stats?.myTotal||0).toLocaleString()}`,     icon:'wallet' },
    { label:'This Month',           value:`PKR ${(stats?.myThisMonth||0).toLocaleString()}`, icon:'calendar' },
    { label:'Months Paid',          value: stats?.myPaidMonths ?? '—',                         icon:'check' },
    { label:'Active Members',       value: stats?.totalMembers ?? '—',                         icon:'users', action:() => onNavigate('members') },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="page-sub">{new Date().toLocaleDateString('en-PK',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <button className="btn btn-accent" onClick={onPayNow}><I n="card" size={16}/> Pay Now</button>
      </div>

      {stats?.myPending > 0 && (
        <div className="notice">
          <span>⏳</span>
          <span>You have <strong>{stats.myPending}</strong> pending payment{stats.myPending > 1 ? 's' : ''} awaiting admin approval.</span>
        </div>
      )}

      <div className="kpi-grid">
        {kpis.map(({ label, value, icon, action }) => (
          <div key={label} className={`kpi${action ? ' click' : ''}`} onClick={action} role={action ? 'button' : undefined} tabIndex={action ? 0 : undefined}
            onKeyDown={e => action && e.key === 'Enter' && action()}>
            <div className="kpi-ico"><I n={icon} size={18}/></div>
            <div className="kpi-val">{value}</div>
            <div className="kpi-lbl">{label}</div>
            {action && <div style={{ fontSize:'.68rem', color:'var(--accent-text)', marginTop:4, fontWeight:600 }}>View all →</div>}
          </div>
        ))}
      </div>

      <div className="grid-aside">
        <div className="card card-pad">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, marginBottom:18, flexWrap:'wrap' }}>
            <div>
              <h3 className="card-title" style={{ marginBottom:2 }}>Monthly Collections</h3>
              <p style={{ color:'var(--muted)', fontSize:'.73rem', margin:0 }}>Organisation vs my contributions</p>
            </div>
            <select className="sel" value={selYear} onChange={e => setSelYear(Number(e.target.value))}>
              {[CUR_YEAR, CUR_YEAR-1, CUR_YEAR-2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {summary
            ? <BarChart months={summary.months} myPayments={myPayments} year={selYear} height={190}/>
            : <div style={{ height:190, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--dim)', fontSize:'.85rem' }}>Loading…</div>}
          {summary && (
            <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--line)', display:'flex', justifyContent:'space-between', gap:10 }}>
              <span style={{ fontSize:'.78rem', color:'var(--muted)' }}>Org total {selYear}</span>
              <span className="num" style={{ color:'var(--accent-text)' }}>PKR {summary.grandTotal.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="stack">
          <div className="card card-pad" style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
            <h3 className="card-title" style={{ alignSelf:'flex-start', marginBottom:14 }}>Months Paid ({CUR_YEAR})</h3>
            <DonutChart paid={paidThisYear} total={CUR_MONTH}/>
            <p style={{ fontSize:'.75rem', color:'var(--muted)', marginTop:8, textAlign:'center' }}>{paidThisYear} of {CUR_MONTH} months paid</p>
          </div>
          <div className="hero" style={{ flexDirection:'column', alignItems:'flex-start', margin:0, justifyContent:'center' }}>
            <div className="eyebrow">Org Fund Total</div>
            <div style={{ fontFamily:'var(--display)', fontSize:'1.5rem', fontWeight:800 }}>PKR {(stats?.orgTotal||0).toLocaleString()}</div>
            <div style={{ marginTop:6, paddingTop:10, borderTop:'1px solid var(--line)', width:'100%' }}>
              <div style={{ fontSize:'.68rem', color:'var(--muted)', marginBottom:2 }}>This month</div>
              <div style={{ fontFamily:'var(--display)', fontSize:'1rem', fontWeight:700, color:'var(--accent-text)' }}>PKR {(stats?.orgThisMonth||0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3 className="card-title">My Recent Payments</h3>
          <button className="link-btn" onClick={() => onNavigate('payments')}>View all →</button>
        </div>
        {!myPayments || myPayments.length === 0 ? (
          <div className="empty">
            <div className="empty-ico">💳</div>
            <p style={{ margin:0 }}>No payments recorded yet.</p>
            <button className="btn btn-accent" style={{ marginTop:14 }} onClick={onPayNow}>Make your first payment →</button>
          </div>
        ) : (
          myPayments.slice(0,5).map(p => (
            <div key={p._id} className="list-row">
              <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                <div className="li-ico">{p.status === 'pending' ? '⏳' : p.status === 'rejected' ? '❌' : '💳'}</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:'.85rem' }}>{MONTHS[p.month-1]} {p.year}</div>
                  <div style={{ fontSize:'.72rem', color: p.status === 'pending' ? 'var(--warn)' : p.status === 'rejected' ? 'var(--bad)' : 'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {p.status === 'pending' ? 'Awaiting approval' : p.status === 'rejected' ? 'Rejected' : p.note || 'Monthly contribution'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div className="num" style={{ fontSize:'.95rem', color: p.status === 'pending' ? 'var(--warn)' : p.status === 'rejected' ? 'var(--bad)' : 'var(--text)' }}>
                  PKR {p.amount.toLocaleString()}
                </div>
                <div style={{ fontSize:'.68rem', color:'var(--dim)', marginTop:2 }}>
                  {p.status === 'pending' ? 'Pending' : p.status === 'rejected' ? 'Rejected' : 'Verified'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MEMBERS PAGE
══════════════════════════════════════════════════════ */
function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    memberAPI.getDirectory().then(r => setMembers(r.data.members)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    return (!q || m.fullName?.toLowerCase().includes(q) || m.castFamily?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q))
        && (filter === 'all' || m.memberType === filter);
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Members Directory</h1>
          <p className="page-sub">All active members of MUS Welfare Organization.</p>
        </div>
      </div>

      <div className="pill-row">
        {[['all',`All (${members.length})`],['job_holder',`💼 Job Holders (${members.filter(m=>m.memberType==='job_holder').length})`],['student',`🎓 Students (${members.filter(m=>m.memberType==='student').length})`]].map(([key,label])=>(
          <button key={key} className={`pill${filter===key?' on':''}`} onClick={() => setFilter(key)}>{label}</button>
        ))}
        <div className="search-w" style={{ marginLeft:'auto', position:'relative' }}>
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:'var(--dim)', display:'flex', pointerEvents:'none' }}><I n="search" size={15}/></span>
          <input className="inp" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members…" style={{ paddingLeft:38, width:240 }}/>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty"><div className="empty-ico">⏳</div><p style={{ margin:0 }}>Loading…</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty"><div className="empty-ico">📭</div><p style={{ margin:0, fontWeight:600 }}>No members found.</p></div>
        ) : (
          <div className="tbl-wrap">
            <table className="tbl" style={{ minWidth:620 }}>
              <thead>
                <tr>
                  <th>Member</th><th className="hide-sm">Type</th><th className="hide-md">Cast / Family</th>
                  <th className="hide-sm">Phone</th><th className="hide-md">Joined</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <Avatar name={m.fullName} size={36}/>
                        <div style={{ minWidth:0 }}>
                          <div className="t-strong">{m.fullName}</div>
                          <div style={{ fontSize:'.76rem', color:'var(--dim)' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="nw hide-sm">{m.memberType === 'job_holder' ? '💼 Job Holder' : '🎓 Student'}</td>
                    <td className="hide-md">{m.castFamily || '—'}</td>
                    <td className="nw hide-sm">{m.phone || '—'}</td>
                    <td className="nw hide-md">{new Date(m.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}</td>
                    <td>
                      <span className={`chip ${m.isActive === false ? 'bad' : 'ok'}`}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor' }}/>
                        {m.isActive === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PAYMENTS PAGE
══════════════════════════════════════════════════════ */
function PaymentsPage({ myPayments, loadingMine, showToast, onPayNow, tab, setTab }) {
  const [orgPayments, setOrgPayments] = useState([]);
  const [loadingOrg,  setLoadingOrg]  = useState(true);
  const [selYear,     setSelYear]     = useState(CUR_YEAR);
  const [summary,     setSummary]     = useState(null);

  useEffect(() => {
    setLoadingOrg(true);
    memberAPI.getOrgPayments(selYear).then(r=>setOrgPayments(r.data.payments)).catch(()=>showToast('Failed to load.','error')).finally(()=>setLoadingOrg(false));
    memberAPI.getSummary(selYear).then(r=>setSummary(r.data)).catch(()=>{});
  }, [selYear, showToast]);

  const verifiedPayments = myPayments?.filter(p => p.status === 'verified') || [];
  const pendingPayments  = myPayments?.filter(p => p.status === 'pending')  || [];

  const myGrid = Array.from({ length:12 }, (_,i) => {
    const verified = myPayments?.find(x => x.month===i+1 && x.year===selYear && x.status==='verified');
    const pending  = myPayments?.find(x => x.month===i+1 && x.year===selYear && x.status==='pending');
    return { month:i+1, label:MONTHS[i], verified, pending };
  });

  const myYearTotal  = verifiedPayments.filter(p=>p.year===selYear).reduce((s,p)=>s+p.amount,0);
  const orgYearTotal = orgPayments.reduce((s,p)=>s+p.amount,0);
  const pendingYear  = pendingPayments.filter(p=>p.year===selYear).length;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-sub">Track your contributions and the organisation's fund.</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select className="sel" value={selYear} onChange={e=>setSelYear(Number(e.target.value))}>
            {[CUR_YEAR, CUR_YEAR-1, CUR_YEAR-2].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-accent" onClick={onPayNow}><I n="card" size={16}/> Pay Now</button>
        </div>
      </div>

      {pendingPayments.length > 0 && (
        <div className="notice">
          <span>⏳</span>
          <span><strong>{pendingPayments.length}</strong> payment(s) pending admin verification — {pendingPayments.map(p=>`${MONTHS[p.month-1]} ${p.year}`).join(', ')}</span>
        </div>
      )}

      <div className="seg" role="tablist">
        {[['mine','My Payments'],['org','Organisation']].map(([key,label])=>(
          <button key={key} role="tab" aria-selected={tab===key} className={tab===key?'on':''} onClick={()=>setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'mine' && (
        <div>
          <div className="hero">
            <div>
              <div className="eyebrow" style={{ marginBottom:4 }}>My Total — {selYear}</div>
              <div style={{ fontFamily:'var(--display)', fontSize:'clamp(1.5rem,4vw,1.9rem)', fontWeight:800 }}>PKR {myYearTotal.toLocaleString()}</div>
            </div>
            <div style={{ display:'flex', gap:22 }}>
              <div style={{ textAlign:'center' }}>
                <div className="num" style={{ fontSize:'1.4rem', color:'var(--accent-text)' }}>{verifiedPayments.filter(p=>p.year===selYear).length}</div>
                <div className="eyebrow">Months Paid</div>
              </div>
              {pendingYear > 0 && (
                <div style={{ textAlign:'center' }}>
                  <div className="num" style={{ fontSize:'1.4rem', color:'var(--accent-text)' }}>{pendingYear}</div>
                  <div className="eyebrow">Pending</div>
                </div>
              )}
            </div>
          </div>

          <div className="month-grid">
            {myGrid.map(({ month, label, verified, pending }) => {
              const isCur  = month === CUR_MONTH && selYear === CUR_YEAR;
              const isPast = selYear < CUR_YEAR || (selYear === CUR_YEAR && month < CUR_MONTH);
              return (
                <div key={month} className={`month-cell${verified ? ' ok' : (pending || isCur) ? ' warn' : ''}`}>
                  <div style={{ fontSize:'1.15rem', marginBottom:4 }}>
                    {verified ? '✅' : pending ? '⏳' : isCur ? '📅' : isPast ? '❌' : '○'}
                  </div>
                  <div className="t-strong" style={{ fontSize:'.82rem' }}>{label}</div>
                  {verified ? (
                    <div className="num" style={{ fontSize:'.82rem', color:'var(--ok)', marginTop:3 }}>PKR {verified.amount.toLocaleString()}</div>
                  ) : pending ? (
                    <div style={{ fontSize:'.72rem', color:'var(--warn)', marginTop:3, fontWeight:700 }}>Pending</div>
                  ) : (
                    <div style={{ fontSize:'.72rem', color:isCur?'var(--warn)':isPast?'var(--bad)':'var(--dim)', marginTop:3, fontWeight:600 }}>
                      {isCur ? 'Due now' : isPast ? 'Missed' : 'Upcoming'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-head"><h3 className="card-title">Payment History</h3></div>
            {loadingMine ? (
              <div className="empty">Loading…</div>
            ) : myPayments?.length === 0 ? (
              <div className="empty"><div className="empty-ico">💳</div><p style={{ margin:0 }}>No payments yet.</p></div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Month</th><th>Amount (PKR)</th><th>Status</th><th className="hide-sm">Note</th><th className="hide-sm">Date</th></tr></thead>
                  <tbody>
                    {myPayments.map(p => (
                      <tr key={p._id}>
                        <td className="t-strong nw">{MONTHS[p.month-1]} {p.year}</td>
                        <td><span className="num">{p.amount.toLocaleString()}</span></td>
                        <td>
                          <span className={`chip ${p.status==='verified'?'ok':p.status==='pending'?'warn':'bad'}`}>
                            {p.status==='verified'?'✅ Verified':p.status==='pending'?'⏳ Pending':'❌ Rejected'}
                          </span>
                        </td>
                        <td className="hide-sm" style={{ fontSize:'.78rem' }}>{p.note || '—'}</td>
                        <td className="nw hide-sm" style={{ fontSize:'.76rem' }}>{new Date(p.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'org' && (
        <div>
          <div className="stat-grid">
            {[
              { label:`Total ${selYear}`, value:`PKR ${orgYearTotal.toLocaleString()}` },
              { label:'Payments Count',   value:orgPayments.length },
              { label:'Avg per Payment',  value:orgPayments.length?`PKR ${Math.round(orgYearTotal/orgPayments.length).toLocaleString()}`:'—' },
            ].map(({ label, value })=>(
              <div key={label} className="kpi">
                <div className="kpi-val">{value}</div>
                <div className="kpi-lbl">{label}</div>
              </div>
            ))}
          </div>
          {summary && (
            <div className="card card-pad" style={{ marginBottom:20 }}>
              <h3 className="card-title" style={{ marginBottom:16 }}>Monthly Breakdown</h3>
              <BarChart months={summary.months} myPayments={myPayments} year={selYear} height={150}/>
            </div>
          )}
          <div className="card">
            <div className="card-head">
              <h3 className="card-title">All Payments <span style={{ fontFamily:'var(--font)', fontWeight:500, fontSize:'.78rem', color:'var(--dim)' }}>({orgPayments.length})</span></h3>
            </div>
            {loadingOrg ? (
              <div className="empty">Loading…</div>
            ) : orgPayments.length === 0 ? (
              <div className="empty"><div className="empty-ico">📭</div><p style={{ margin:0 }}>No payments for {selYear}.</p></div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl">
                  <thead><tr><th>Member</th><th className="hide-sm">Type</th><th>Month / Year</th><th>Amount (PKR)</th><th className="hide-sm">Note</th></tr></thead>
                  <tbody>
                    {orgPayments.map(p=>(
                      <tr key={p._id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <Avatar name={p.member?.fullName} size={28}/>
                            <span className="t-strong">{p.member?.fullName}</span>
                          </div>
                        </td>
                        <td className="nw hide-sm">{p.member?.memberType==='job_holder'?'💼 Job Holder':'🎓 Student'}</td>
                        <td className="t-strong nw">{MONTHS[p.month-1]} {p.year}</td>
                        <td><span className="num">{p.amount.toLocaleString()}</span></td>
                        <td className="hide-sm" style={{ fontSize:'.78rem' }}>{p.note||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ANNOUNCEMENTS PAGE
══════════════════════════════════════════════════════ */
const CATEGORY_META_M = {
  general: { label:'General', color:'#39ffb0', icon:'📢' },
  meeting: { label:'Meeting', color:'#9db8ff', icon:'📅' },
  urgent:  { label:'Urgent',  color:'#ff8f86', icon:'🚨' },
  event:   { label:'Event',   color:'#ffb27a', icon:'🎉' },
};

function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    announcementAPI.getAll()
      .then(r => setAnnouncements(r.data.announcements))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Announcements</h1>
          <p className="page-sub">Notices and updates from the MUS Welfare committee.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty"><div className="empty-ico">📢</div><p style={{ margin:0 }}>Loading…</p></div>
      ) : announcements.length === 0 ? (
        <div className="card empty" style={{ padding:60 }}>
          <div className="empty-ico" style={{ fontSize:'3rem' }}>📭</div>
          <p style={{ margin:0, fontWeight:600, fontSize:'.95rem', color:'var(--muted)' }}>No announcements yet.</p>
          <p style={{ margin:'6px 0 0', fontSize:'.8rem' }}>Check back later for updates from the committee.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {announcements.map(a => {
            const meta = CATEGORY_META_M[a.category] || CATEGORY_META_M.general;
            return (
              <div key={a._id} className="ann" style={{ borderLeftColor:meta.color }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                  {a.pinned && <span className="chip warn" style={{ fontSize:'.62rem', padding:'3px 9px' }}>📌 PINNED</span>}
                  <span className="chip plain" style={{ fontSize:'.62rem', padding:'3px 9px', color:meta.color }}>{meta.icon} {meta.label.toUpperCase()}</span>
                  <span style={{ fontSize:'.7rem', color:'var(--dim)', marginLeft:'auto' }}>
                    {new Date(a.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'long', year:'numeric' })}
                  </span>
                </div>
                <h3 style={{ fontFamily:'var(--display)', fontSize:'1.1rem', fontWeight:800, margin:'0 0 10px', overflowWrap:'anywhere' }}>{a.title}</h3>
                <p style={{ fontSize:'.86rem', color:'var(--muted)', margin:0, lineHeight:1.75, whiteSpace:'pre-wrap', overflowWrap:'anywhere' }}>{a.body}</p>
                {a.meetingLink && (
                  <div className="meet">
                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      <div style={{ flex:'1 1 220px', minWidth:0 }}>
                        <div style={{ fontSize:'.75rem', fontWeight:700, color:'var(--accent-text)', marginBottom:4 }}>📅 Google Meet Invitation</div>
                        {a.meetingDate && (
                          <div style={{ fontSize:'.8rem', fontWeight:600, marginBottom:4 }}>
                            🗓 {new Date(a.meetingDate).toLocaleString('en-PK', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                          </div>
                        )}
                        {a.meetingNote && <div style={{ fontSize:'.78rem', color:'var(--muted)', marginBottom:8 }}>{a.meetingNote}</div>}
                        <div style={{ fontSize:'.72rem', color:'var(--dim)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.meetingLink}</div>
                      </div>
                      <a className="btn btn-accent" href={a.meetingLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>📹 Join Meeting</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   MAIN SHELL
══════════════════════════════════════════════════════ */
export default function MemberDashboard() {
  const { user, logout } = useAuth();

  const isMobile = useMedia('(max-width: 900px), (pointer: coarse) and (max-height: 520px)');
  const isTablet = useMedia('(max-width: 1100px)');

  const [page,        setPage]        = useState('overview');
  const [payTab,      setPayTab]      = useState('mine');
  const [stats,       setStats]       = useState(null);
  const [myPayments,  setMyPayments]  = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [toast,       setToast]       = useState(null);
  const [sideOpen,    setSideOpen]    = useState(() => typeof window === 'undefined' ? true : window.innerWidth > 1100);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [showPayNow,  setShowPayNow]  = useState(false);
  const [annDot,      setAnnDot]      = useState(false);
  const [theme,       setTheme]       = useState(() => {
    try { return localStorage.getItem('mus-theme') || 'dark'; } catch { return 'dark'; }
  });

  /* Make sure the page has a viewport meta tag; without it phones render the desktop layout */
  useEffect(() => {
    if (!document.querySelector('meta[name="viewport"]')) {
      const m = document.createElement('meta');
      m.name = 'viewport';
      m.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
      document.head.appendChild(m);
    }
  }, []);

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);
  useEffect(() => { try { localStorage.setItem('mus-theme', theme); } catch { /* ignore */ } }, [theme]);

  /* Tablet → collapsed rail; desktop → expanded */
  useEffect(() => { setSideOpen(!isTablet); }, [isTablet]);
  useEffect(() => { if (!isMobile) setMobileOpen(false); }, [isMobile]);
  useEffect(() => { window.scrollTo({ top:0 }); if (isMobile) setMobileOpen(false); }, [page, isMobile]);
  useEffect(() => {
    if (!mobileOpen) return;
    const h = e => e.key === 'Escape' && setMobileOpen(false);
    window.addEventListener('keydown', h);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const showToast = useCallback((msg, type='success') => setToast({ message:msg, type }), []);
  const closeToast = useCallback(() => setToast(null), []);

  const fetchStats = useCallback(() => {
    memberAPI.getStats().then(r => setStats(r.data)).catch(()=>{});
  }, []);

  const fetchMyPayments = useCallback(() => {
    setLoadingMine(true);
    memberAPI.getMyPayments()
      .then(r => setMyPayments(r.data.payments))
      .catch(()=>{})
      .finally(()=>setLoadingMine(false));
  }, []);

  useEffect(() => { fetchStats(); fetchMyPayments(); }, [fetchStats, fetchMyPayments]);

  /* Dot on "Announcements" when something was posted in the last 7 days */
  useEffect(() => {
    announcementAPI.getAll()
      .then(r => setAnnDot((r.data.announcements || []).some(a => Date.now() - new Date(a.createdAt).getTime() < 7 * 864e5)))
      .catch(() => {});
  }, []);
  useEffect(() => { if (page === 'announcements') setAnnDot(false); }, [page]);

  const handlePaySuccess = useCallback(() => {
    showToast('Payment submitted! Admin will verify it shortly.', 'success');
    fetchStats();
    fetchMyPayments();
  }, [showToast, fetchStats, fetchMyPayments]);

  const openPayNow = useCallback(() => setShowPayNow(true), []);
  const collapsed  = !isMobile && !sideOpen;

  return (
    <div className={`md-root${isMobile ? ' is-mobile' : ''}`} data-theme={theme}>
      <style>{CSS}</style>
      <style>{dockCss}</style>

      {/* Mobile top bar */}
      <header className="md-topbar">
        <div className="brand-logo" style={{ width:32, height:32 }}>
          <svg width="16" height="16" viewBox="0 0 60 60"><path d="M10 42 Q7 25 22 14 Q30 8 40 13 L36 20 Q28 11 20 20 Q7 30 15 44Z" style={{ fill:'var(--text)' }}/><path d="M50 18 Q53 35 38 46 Q30 52 20 47 L24 40 Q32 49 40 40 Q53 30 45 16Z" style={{ fill:'var(--muted)' }}/><ellipse cx="30" cy="32" rx="9" ry="6" style={{ fill:'var(--accent)' }}/></svg>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div className="brand-name">MUS Welfare</div>
        </div>
        <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle night mode"><I n={theme === 'dark' ? 'moon' : 'sun'} size={16}/></button>
        <button className="icon-btn" onClick={logout} aria-label="Log out"><I n="logout" size={16}/></button>
        <button className="btn btn-accent" style={{ height:36, padding:'0 14px', fontSize:'.78rem' }} onClick={openPayNow}>Pay Now</button>
      </header>

      <Sidebar
        page={page} setPage={setPage} payTab={payTab} setPayTab={setPayTab}
        stats={stats} user={user} logout={logout}
        collapsed={collapsed} onToggle={() => setSideOpen(v => !v)}
        isMobile={isMobile} mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)}
        onPayNow={openPayNow} theme={theme} toggleTheme={toggleTheme} annDot={annDot}
      />

      <main className="md-main">
        {page === 'overview' && (
          <OverviewPage stats={stats} myPayments={myPayments} onNavigate={setPage} onPayNow={openPayNow}/>
        )}
        {page === 'members'  && <MembersPage/>}
        {page === 'payments' && (
          <PaymentsPage myPayments={myPayments} loadingMine={loadingMine} showToast={showToast} onPayNow={openPayNow} tab={payTab} setTab={setPayTab}/>
        )}
        {page === 'announcements' && <AnnouncementsPage/>}
        {page === 'family-tree' && <FamilyTreePage isAdmin={false} showToast={showToast}/>}
      </main>

      {showPayNow && (
        <PayNowModal user={user} myPayments={myPayments} onClose={() => setShowPayNow(false)} onSuccess={handlePaySuccess}/>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={closeToast}/>}
      {isMobile && <Dock page={page} setPage={setPage} stats={stats} annDot={annDot}/>}
    </div>
  );
}