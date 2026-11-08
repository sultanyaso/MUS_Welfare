import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { familyAPI } from '../api';

/* ─── build children map ─── */
function buildTree(members) {
  const map = {};
  members.forEach(m => { map[m._id] = { ...m, children: [] }; });
  const roots = [];
  members.forEach(m => {
    if (m.parentId && map[m.parentId]) {
      map[m.parentId].children.push(map[m._id]);
    } else {
      roots.push(map[m._id]);
    }
  });
  return { roots, map };
}

/* ─── layout ─── */
const NODE_W = 130;
const NODE_H = 64;
const GAP_X  = 20;
const GAP_Y  = 90;
const MIN_K  = 0.15;
const MAX_K  = 2.5;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function subtreeWidth(node) {
  if (!node.children.length) return NODE_W;
  const childrenW = node.children.reduce((s, c) => s + subtreeWidth(c) + GAP_X, -GAP_X);
  return Math.max(NODE_W, childrenW);
}

function layoutTree(nodes) {
  const positions = {};
  function place(node, x, y) {
    const w = subtreeWidth(node);
    positions[node._id] = { x: x + w / 2 - NODE_W / 2, y };
    if (node.children.length) {
      let cx = x;
      node.children.forEach(child => {
        const cw = subtreeWidth(child);
        place(child, cx, y + NODE_H + GAP_Y);
        cx += cw + GAP_X;
      });
    }
  }
  let ox = 0;
  nodes.forEach(root => {
    const w = subtreeWidth(root);
    place(root, ox, 0);
    ox += w + GAP_X * 3;
  });
  return positions;
}

function collectEdges(nodes, positions) {
  const edges = [];
  function walk(node) {
    node.children.forEach(child => {
      const p  = positions[node._id];
      const c  = positions[child._id];
      const px = p.x + NODE_W / 2;
      const py = p.y + NODE_H;
      const cx = c.x + NODE_W / 2;
      const cy = c.y;
      const my = (py + cy) / 2;
      edges.push({ key: `${node._id}-${child._id}`, from: node._id, to: child._id, d: `M${px},${py} C${px},${my} ${cx},${my} ${cx},${cy}` });
      walk(child);
    });
  }
  nodes.forEach(walk);
  return edges;
}

function canvasBounds(positions) {
  if (!Object.keys(positions).length) return { w: 800, h: 400 };
  const xs = Object.values(positions).map(p => p.x);
  const ys = Object.values(positions).map(p => p.y);
  return {
    w: Math.max(...xs) + NODE_W + 60,
    h: Math.max(...ys) + NODE_H + 60,
  };
}

/* ─── styles ─── */
const css = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;600&display=swap');

.ft {
  --c-panel: var(--panel, #0e0e11); --c-panel2: var(--panel2, #131317);
  --c-line: var(--line, rgba(255,255,255,.08)); --c-line2: var(--line2, rgba(255,255,255,.14));
  --c-text: var(--text, #c4c5cb); --c-dim: var(--dim, #7b7c85); --c-hi: var(--hi, #f3f3f5);
  --c-acc: var(--accent, #39ffb0); --c-acc-rgb: var(--accent-rgb, 57, 255, 176);
  --c-ok: var(--ok, #8fe0b0); --c-danger: var(--danger, #ff7a7a);
  /* member colours */
  --c-male: var(--c-acc); --c-female: #ff8fb8; --c-dead: #ffd89b;
  font-family: Sora, sans-serif; color: var(--c-text); -webkit-font-smoothing: antialiased;
}
.ad[data-theme="light"] .ft { --c-female: #d6336c; --c-dead: #b9770e; }
.ft * { box-sizing: border-box; }
.ft button { font-family: inherit; }
@keyframes ftRise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes ftModal { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
@keyframes ftSheet { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

.ft-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 22px; animation: ftRise .9s cubic-bezier(.22,1,.36,1) both; }
.ft-h1 { font-size: clamp(1.6rem, 2.6vw, 2.2rem); font-weight: 200; letter-spacing: -0.02em; line-height: 1.15; color: var(--c-hi); margin: 0 0 8px; }
.ft-lead { font-size: .82rem; color: var(--c-dim); font-weight: 300; margin: 0; }
.ft-tools { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.ft-search { position: relative; }
.ft-search svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--c-dim); pointer-events: none; }

.ft-inp { width: 100%; padding: 12px 14px; background: rgba(127,127,127,.06); border: 1px solid var(--c-line2); border-radius: 10px; color: var(--c-hi); font-family: inherit; font-size: .88rem; font-weight: 300; outline: none; transition: border-color .5s, box-shadow .5s; }
.ft-inp:focus { border-color: var(--c-acc); box-shadow: 0 0 0 3px rgba(var(--c-acc-rgb), .08); }
.ft-inp::placeholder { color: var(--c-dim); opacity: .6; }
.ft-inp.pill { width: 230px; padding: 9px 14px 9px 38px; border-radius: 99px; }
.ft select.ft-inp option { background: var(--c-panel2); color: var(--c-hi); }

.ft-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 22px; background: var(--c-acc); color: #04110b; border: 1px solid var(--c-acc); border-radius: 99px; font-size: .78rem; font-weight: 600; letter-spacing: .3px; cursor: pointer; white-space: nowrap; transition: box-shadow .6s ease, transform .6s ease, background .4s, opacity .4s; }
.ft-btn:hover:not(:disabled) { box-shadow: 0 0 36px rgba(var(--c-acc-rgb), .4); transform: translateY(-1px); }
.ft-btn:disabled { opacity: .55; cursor: wait; }
.ft-btn.ghost { background: transparent; color: var(--c-hi); border-color: var(--c-line2); font-weight: 400; }
.ft-btn.ghost:hover:not(:disabled) { background: rgba(127,127,127,.1); box-shadow: none; }
.ft-btn.danger { background: transparent; color: var(--c-danger); border-color: rgba(255,122,122,.5); font-weight: 400; }
.ft-btn.danger:hover:not(:disabled) { background: rgba(255,122,122,.08); box-shadow: 0 0 28px rgba(255,122,122,.12); }
.ft-btn.solid-danger { background: var(--c-danger); border-color: var(--c-danger); color: #1a0505; }
.ft-btn.block { width: 100%; }

/* search mode toggle */
.ft-seg { display: inline-flex; padding: 3px; border: 1px solid var(--c-line2); border-radius: 99px; background: rgba(127,127,127,.06); }
.ft-seg button { padding: 7px 16px; border: none; border-radius: 99px; background: transparent; color: var(--c-dim); font-size: .72rem; letter-spacing: .5px; cursor: pointer; transition: background .4s, color .4s; }
.ft-seg button:hover { color: var(--c-hi); }
.ft-seg button.on { background: var(--c-acc); color: #04110b; font-weight: 600; }

/* legend */
.ft-legend { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 14px; font-size: .68rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--c-dim); }
.ft-legend span { display: inline-flex; align-items: center; gap: 8px; }
.ft-legend i { width: 12px; height: 12px; border-radius: 4px; border: 1.5px solid; }
.ft-legend .m { border-color: var(--c-male);   background: color-mix(in srgb, var(--c-male) 22%, transparent); }
.ft-legend .f { border-color: var(--c-female); background: color-mix(in srgb, var(--c-female) 22%, transparent); }
.ft-legend .d { border-color: var(--c-dead);   background: color-mix(in srgb, var(--c-dead) 22%, transparent); border-style: dashed; }
.ft-legend .hit { color: var(--c-hi); letter-spacing: 1px; }
.ft-legend .hit b { color: var(--c-acc); font-weight: 600; }

/* pusht chips */
.ft-lineage { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 14px; animation: ftRise .6s cubic-bezier(.22,1,.36,1) both; }
.ft-lchain { display: inline-flex; align-items: center; gap: 8px; }
.ft-lchain em { font-style: normal; color: var(--c-dim); }
.ft-chip { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; padding: 8px 14px; border: 1px solid var(--c-line2); border-radius: 12px; background: var(--c-panel2); color: var(--c-hi); font-size: .82rem; font-weight: 300; cursor: pointer; transition: border-color .4s, box-shadow .5s; }
.ft-chip small { font-size: .56rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--c-dim); }
.ft-chip:hover { border-color: rgba(var(--c-acc-rgb), .6); box-shadow: 0 0 22px rgba(var(--c-acc-rgb), .12); }
.ft-chip.first { border-color: rgba(var(--c-acc-rgb), .6); }
.ft-chip.first small { color: var(--c-acc); }

/* stage */
.ft-stage { position: relative; height: calc(100dvh - 330px); min-height: 440px; animation: ftRise 1s cubic-bezier(.22,1,.36,1) .1s both; }
.ft-canvas { position: absolute; inset: 0; overflow: hidden; border-radius: 16px; border: 1px solid var(--c-line); background: var(--c-panel); touch-action: none; user-select: none; -webkit-user-select: none; cursor: grab;
  background-image: radial-gradient(rgba(127,127,127,.16) 1px, transparent 1px); background-size: 26px 26px; }
.ft-canvas.grabbing { cursor: grabbing; }
.ft-canvas svg { display: block; width: 100%; height: 100%; }
.ft-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; color: var(--c-dim); font-size: .88rem; font-weight: 300; text-align: center; padding: 20px; }
.ft-center .big { font-size: 2.6rem; filter: grayscale(1) brightness(1.3); opacity: .85; }
.ft-center strong { color: var(--c-hi); font-weight: 400; }

.ft-edge { fill: none; stroke: rgba(var(--c-acc-rgb), .32); stroke-width: 1.6; stroke-dasharray: 5 4; transition: opacity .4s; }
.ft-edge.lit { stroke: var(--c-acc); stroke-opacity: 1; stroke-width: 3; stroke-dasharray: none; filter: drop-shadow(0 0 6px rgba(var(--c-acc-rgb), .7)); }
.ft-edge.dim { opacity: .15; }
.ft-node { cursor: pointer; transition: opacity .4s; }
.ft-node.dim { opacity: .22; }
.ft-node .card { fill: color-mix(in srgb, var(--c-male) 8%, var(--c-panel2)); stroke: var(--c-male); stroke-opacity: .75; stroke-width: 1.3; transition: stroke-opacity .4s; }
.ft-node:hover .card { stroke-opacity: 1; }
.ft-node.f .card { fill: color-mix(in srgb, var(--c-female) 8%, var(--c-panel2)); stroke: var(--c-female); }
.ft-node.d .card { fill: color-mix(in srgb, var(--c-dead) 8%, var(--c-panel2)); stroke: var(--c-dead); stroke-opacity: .85; stroke-dasharray: 4 3; }
.ft-node .ring { fill: none; stroke: var(--c-hi); stroke-width: 2; opacity: 0; filter: drop-shadow(0 0 8px rgba(255,255,255,.45)); transition: opacity .4s; }
.ft-node.sel .ring, .ft-node.match .ring { opacity: 1; }
.ft-node.focus .ring { animation: ftPulse 1.6s ease-in-out infinite; }
@keyframes ftPulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
.ft-node text { font-family: Sora, sans-serif; pointer-events: none; }
.ft-node .nm { fill: var(--c-hi); font-size: 12px; font-weight: 400; }
.ft-node .sub { fill: var(--c-dim); font-size: 9px; }
.ft-node .gi { fill: var(--c-male); font-size: 11px; }
.ft-node.f .gi { fill: var(--c-female); }
.ft-node.d .gi { fill: var(--c-dead); }
.ft-node .cnt-bg { fill: rgba(var(--c-acc-rgb), .14); stroke: rgba(var(--c-acc-rgb), .5); stroke-width: 1; }
.ft-node .cnt { fill: var(--c-acc); font-size: 9px; font-weight: 600; }

.ft-zoom { position: absolute; left: 14px; bottom: 14px; display: flex; flex-direction: column; gap: 6px; align-items: center; z-index: 5; }
.ft-zoom button { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--c-panel2); border: 1px solid var(--c-line2); border-radius: 10px; color: var(--c-hi); font-size: 1.1rem; cursor: pointer; transition: border-color .4s, color .4s, box-shadow .5s; }
.ft-zoom button:hover { color: var(--c-acc); border-color: rgba(var(--c-acc-rgb), .5); box-shadow: 0 0 22px rgba(var(--c-acc-rgb), .12); }
.ft-zoom small { font-size: .62rem; letter-spacing: 1px; color: var(--c-dim); }

/* detail panel */
.ft-panel { position: absolute; top: 14px; right: 14px; z-index: 6; width: 264px; max-height: calc(100% - 28px); overflow-y: auto; padding: 22px; border: 1px solid var(--c-line2); border-radius: 16px; background: var(--c-panel2); box-shadow: 0 24px 60px rgba(0,0,0,.45), 0 0 50px rgba(var(--c-acc-rgb), .05); animation: ftRise .5s cubic-bezier(.22,1,.36,1) both; }
.ft-x { position: absolute; top: 12px; right: 12px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; background: transparent; border: 1px solid var(--c-line2); border-radius: 50%; color: var(--c-dim); font-size: 1rem; cursor: pointer; transition: color .4s, border-color .4s; }
.ft-x:hover { color: var(--c-acc); border-color: rgba(var(--c-acc-rgb), .5); }
.ft-av { width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 1.2rem; margin-bottom: 14px; color: var(--c-male); border: 1px solid color-mix(in srgb, var(--c-male) 55%, transparent); background: color-mix(in srgb, var(--c-male) 10%, transparent); }
.ft-av.f { color: var(--c-female); border-color: color-mix(in srgb, var(--c-female) 55%, transparent); background: color-mix(in srgb, var(--c-female) 10%, transparent); }
.ft-av.d { color: var(--c-dead); border-color: color-mix(in srgb, var(--c-dead) 55%, transparent); background: color-mix(in srgb, var(--c-dead) 10%, transparent); border-style: dashed; }
.ft-pname { font-size: 1.05rem; font-weight: 300; color: var(--c-hi); margin-bottom: 8px; padding-right: 30px; }
.ft-pline { font-size: .78rem; font-weight: 300; color: var(--c-dim); margin-bottom: 4px; }
.ft-pnote { font-size: .78rem; font-weight: 300; font-style: italic; color: var(--c-text); margin: 8px 0; }
.ft-pkids { font-size: .66rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--c-acc); margin-top: 10px; }
.ft-pacts { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--c-line); }

/* modal */
.ft-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,.72); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 16px; }
.ft-modal { width: 100%; max-height: 92dvh; overflow-y: auto; background: var(--c-panel); border: 1px solid var(--c-line2); border-radius: 18px; box-shadow: 0 40px 100px rgba(0,0,0,.7), 0 0 80px rgba(var(--c-acc-rgb), .06); animation: ftModal .5s cubic-bezier(.22,1,.36,1) both; color: var(--c-text); font-family: Sora, sans-serif; }
.ft-mh { display: flex; align-items: center; justify-content: space-between; padding: 20px 26px; border-bottom: 1px solid var(--c-line); }
.ft-mh h3 { margin: 0; font-size: 1.05rem; font-weight: 300; color: var(--c-hi); }
.ft-mb { padding: 26px; }
.ft-ff { margin-bottom: 18px; }
.ft-fl { display: block; font-size: .6rem; letter-spacing: 2.5px; text-transform: uppercase; color: var(--c-dim); margin-bottom: 10px; }
.ft-two { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.ft-check { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: .85rem; font-weight: 300; color: var(--c-text); }
.ft-check input { width: 16px; height: 16px; accent-color: var(--c-acc); cursor: pointer; }
.ft-err { padding: 12px 14px; margin-bottom: 16px; border-left: 2px solid var(--c-danger); font-size: .82rem; color: var(--c-danger); }
.ft-row { display: flex; gap: 10px; }
.ft-row .f1 { flex: 1; } .ft-row .f2 { flex: 2; }
.ft-mtext { font-size: .88rem; line-height: 1.8; font-weight: 300; margin: 0 0 22px; color: var(--c-text); }

/* small screens */
@media (max-width: 760px) {
  .ft-stage { height: calc(100dvh - 300px); min-height: 420px; }
  .ft-inp.pill { width: 100%; }
  .ft-search { flex: 1 1 100%; }
  .ft-zoom { left: auto; right: 12px; top: 12px; bottom: auto; flex-direction: row; }
  .ft-panel { top: auto; right: 10px; left: 10px; bottom: 10px; width: auto; max-height: 62%; animation-name: ftSheet; }
  .ft-two { grid-template-columns: 1fr; }
  .ft-mb { padding: 20px; }
}
@media (prefers-reduced-motion: reduce) {
  .ft *, .ft-modal { animation-duration: .01s !important; transition-duration: .01s !important; }
}
`;

/* ══════════════════════════════════════════════════════
   FAMILY TREE PAGE
══════════════════════════════════════════════════════ */
export default function FamilyTreePage({ isAdmin = false, showToast }) {
  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [showForm,   setShowForm]   = useState(false);
  const [editNode,   setEditNode]   = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [search,     setSearch]     = useState('');
  const [matchIdx,   setMatchIdx]   = useState(0);
  const [mode,       setMode]       = useState('member');   // 'member' | 'lineage'

  // pan / zoom
  const canvasRef = useRef(null);
  const [view, setView] = useState({ x: 40, y: 40, k: 1 });
  const [smooth, setSmooth] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pts = useRef(new Map());
  const gesture = useRef({ moved: false, sx: 0, sy: 0, pinch: 0 });

  // form
  const emptyForm = { name: '', parentId: '', gender: 'male', birthYear: '', note: '', isAlive: true };
  const [form,   setForm]   = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [fErr,   setFErr]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await familyAPI.getAll();
      setMembers(data.members);
    } catch { showToast?.('Failed to load family tree.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const { map, positions, edges, w, h } = useMemo(() => {
    const t = buildTree(members);
    const pos = layoutTree(t.roots);
    const b = canvasBounds(pos);
    return { map: t.map, positions: pos, edges: collectEdges(t.roots, pos), w: b.w, h: b.h };
  }, [members]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? members.filter(m => m.name.toLowerCase().includes(q)).map(m => m._id) : [];
  }, [members, search]);
  const searchIds = useMemo(() => new Set(matches), [matches]);
  const matchKey = matches.join(',');
  const focusId = matches.length ? matches[Math.min(matchIdx, matches.length - 1)] : null;

  /* ── pusht: selected member se upar root tak ── */
  const chain = useMemo(() => {
    if (mode !== 'lineage' || !focusId) return [];
    const out = [];
    const seen = new Set();
    let cur = map[focusId];
    while (cur && !seen.has(cur._id)) {
      seen.add(cur._id);
      out.push(cur);                                   // pehle member, phir abu, phir dada...
      cur = cur.parentId ? map[cur.parentId] : null;
    }
    return out;
  }, [mode, focusId, map]);
  const chainIds = useMemo(() => new Set(chain.map(c => c._id)), [chain]);

  const relLabel = (i, gender) => {
    const f = gender === 'female';
    if (i === 0) return 'Selected';
    if (i === 1) return f ? 'Mother' : 'Father';
    if (i === 2) return f ? 'Grandmother' : 'Grandfather';
    if (i === 3) return f ? 'Great-grandmother' : 'Great-grandfather';
    return `${i}th ancestor`;
  };

  /* ── fit whole tree into the visible canvas ── */
  const fit = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const pad = 24;
    const k = clamp(Math.min(1, (r.width - pad * 2) / w, (r.height - pad * 2) / h), MIN_K, 1);
    setSmooth(true);
    setView({ k, x: (r.width - w * k) / 2, y: Math.max(pad, (r.height - h * k) / 2) });
  }, [w, h]);

  useEffect(() => { if (!loading) { setSmooth(false); fit(); } }, [loading, fit, members.length]);

  /* ── fly to a member ── */
  const goTo = useCallback((id) => {
    const el = canvasRef.current;
    const pos = positions[id];
    if (!el || !pos) return;
    const r = el.getBoundingClientRect();
    const k = clamp(Math.max(view.k, 1), MIN_K, MAX_K);
    setSmooth(true);
    setView({
      k,
      x: r.width / 2 - (pos.x + NODE_W / 2) * k,
      y: r.height / 2 - (pos.y + NODE_H / 2) * k,
    });
  }, [positions, view.k]);

  /* ── kai members ko ek saath screen mein fit karo ── */
  const fitIds = useCallback((ids) => {
    const el = canvasRef.current;
    if (!el) return;
    const ps = ids.map(id => positions[id]).filter(Boolean);
    if (!ps.length) return;
    const r = el.getBoundingClientRect();
    const minX = Math.min(...ps.map(p => p.x));
    const maxX = Math.max(...ps.map(p => p.x)) + NODE_W;
    const minY = Math.min(...ps.map(p => p.y));
    const maxY = Math.max(...ps.map(p => p.y)) + NODE_H;
    const bw = maxX - minX, bh = maxY - minY, pad = 60;
    const k = clamp(Math.min(1.1, (r.width - pad * 2) / bw, (r.height - pad * 2) / bh), MIN_K, MAX_K);
    setSmooth(true);
    setView({ k, x: r.width / 2 - (minX + bw / 2) * k, y: r.height / 2 - (minY + bh / 2) * k });
  }, [positions]);

  // new search → start from the first match
  useEffect(() => { setMatchIdx(0); }, [search]);

  // go to the current match (debounced while typing)
  useEffect(() => {
    if (!focusId) return;
    const t = setTimeout(() => {
      if (mode === 'lineage') { fitIds(chain.map(c => c._id)); return; }
      goTo(focusId);
      if (matches.length === 1) {
        const m = members.find(x => x._id === focusId);
        if (m) setSelected(m);
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, matchKey, mode]);

  const onSearchKey = e => {
    if (e.key === 'Enter' && matches.length > 1) {
      e.preventDefault();
      setMatchIdx(i => (i + 1) % matches.length);
    }
    if (e.key === 'Escape') setSearch('');
  };

  /* ── zoom around a point ── */
  const zoomAt = useCallback((cx, cy, factor) => {
    setSmooth(false);
    setView(v => {
      const k = clamp(v.k * factor, MIN_K, MAX_K);
      const f = k / v.k;
      return { k, x: cx - (cx - v.x) * f, y: cy - (cy - v.y) * f };
    });
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = e => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const zoomCentre = factor => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (r) zoomAt(r.width / 2, r.height / 2, factor);
  };

  /* ── pointer gestures: drag to pan, two fingers to pinch ── */
  const onPointerDown = e => {
    setSmooth(false);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    g.moved = false; g.sx = e.clientX; g.sy = e.clientY;
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      g.pinch = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = e => {
    const prev = pts.current.get(e.pointerId);
    if (!prev) return;
    const g = gesture.current;
    const cur = { x: e.clientX, y: e.clientY };
    pts.current.set(e.pointerId, cur);

    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (g.pinch > 0 && dist > 0) {
        const r = canvasRef.current.getBoundingClientRect();
        zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, dist / g.pinch);
      }
      g.pinch = dist;
      g.moved = true;
      return;
    }

    if (!g.moved) {
      if (Math.hypot(cur.x - g.sx, cur.y - g.sy) < 5) return;   // still a tap
      g.moved = true;
      setDragging(true);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    setView(v => ({ ...v, x: v.x + (cur.x - prev.x), y: v.y + (cur.y - prev.y) }));
  };

  const onPointerUp = e => {
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) gesture.current.pinch = 0;
    if (pts.current.size === 0) setDragging(false);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  /* ── form helpers ── */
  const openAdd = (parentId = '') => {
    setEditNode(null);
    setForm({ ...emptyForm, parentId });
    setFErr('');
    setShowForm(true);
  };

  const openEdit = node => {
    setEditNode(node);
    setForm({
      name:      node.name,
      parentId:  node.parentId || '',
      gender:    node.gender || 'male',
      birthYear: node.birthYear || '',
      note:      node.note || '',
      isAlive:   node.isAlive !== false,
    });
    setFErr('');
    setShowForm(true);
  };

  const blockedParents = (() => {
    if (!editNode || !map[editNode._id]) return new Set();
    const out = new Set([editNode._id]);
    (function walk(n) { n.children.forEach(c => { out.add(c._id); walk(c); }); })(map[editNode._id]);
    return out;
  })();

  const handleSave = async () => {
    if (!form.name.trim()) { setFErr('Name is required.'); return; }
    setSaving(true); setFErr('');
    try {
      if (editNode) {
        await familyAPI.update(editNode._id, form);
        showToast?.('Member updated.', 'success');
      } else {
        await familyAPI.addMember(form);
        showToast?.('Member added to family tree.', 'success');
      }
      setShowForm(false);
      setSelected(null);
      load();
    } catch (err) {
      setFErr(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!delConfirm) return;
    try {
      await familyAPI.remove(delConfirm._id);
      showToast?.('Member and descendants removed.', 'success');
      setDelConfirm(null); setSelected(null); load();
    } catch { showToast?.('Delete failed.', 'error'); }
  };

  const kids = selected ? map[selected._id]?.children.length || 0 : 0;

  return (
    <div className="ft">
      <style>{css}</style>

      {/* ── Header ── */}
      <div className="ft-head">
        <div>
          <h1 className="ft-h1">🌳 Family Tree</h1>
          <p className="ft-lead">{members.length} members · Scroll to zoom · Drag to pan</p>
        </div>
        <div className="ft-tools">
          <div className="ft-search">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input
              className="ft-inp pill" value={search}
              placeholder={mode === 'lineage' ? 'Search to see ancestors…' : 'Search member…'}
              onChange={e => setSearch(e.target.value)} onKeyDown={onSearchKey}
            />
          </div>
          <div className="ft-seg" role="tablist" aria-label="Search mode">
            <button className={mode === 'member' ? 'on' : ''} onClick={() => setMode('member')}>Member</button>
            <button className={mode === 'lineage' ? 'on' : ''} onClick={() => setMode('lineage')}>Ancestors </button>
          </div>
          <button className="ft-btn ghost" onClick={fit}>⟳ Reset View</button>
          {isAdmin && <button className="ft-btn" onClick={() => openAdd('')}>+ Add Root Member</button>}
        </div>
      </div>

      {/* Legend */}
      <div className="ft-legend">
        <span><i className="m" /> Male</span>
        <span><i className="f" /> Female</span>
        <span><i className="d" /> Deceased</span>
        {search && matches.length > 0 && (
          <span className="hit">
            🔍 {matches.length} match{matches.length !== 1 ? 'es' : ''} found
            {matches.length > 1 && <> · <b>{Math.min(matchIdx, matches.length - 1) + 1} of {matches.length}</b> · Enter for next</>}
          </span>
        )}
        {search && matches.length === 0 && members.length > 0 && <span className="hit">No member found</span>}
      </div>

      {/* Pusht (lineage) chips */}
      {mode === 'lineage' && chain.length > 0 && (
        <div className="ft-lineage">
          {chain.map((c, i) => (
            <span key={c._id} className="ft-lchain">
              <button
                className={`ft-chip ${i === 0 ? 'first' : ''}`}
                onClick={() => { goTo(c._id); setSelected(members.find(x => x._id === c._id) || null); }}
              >
                <small>{relLabel(i, c.gender)}</small>
                {c.name}
              </button>
              {i < chain.length - 1 && <em>←</em>}
            </span>
          ))}
        </div>
      )}

      {/* ── Tree canvas ── */}
      <div className="ft-stage">
        <div
          ref={canvasRef}
          className={`ft-canvas ${dragging ? 'grabbing' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {loading ? (
            <div className="ft-center">
              <div className="big">🌳</div>
              <p style={{ margin: 0 }}>Loading family tree…</p>
            </div>
          ) : members.length === 0 ? (
            <div className="ft-center">
              <div className="big">🌱</div>
              <strong>Family tree is empty</strong>
              {isAdmin && <button className="ft-btn" onClick={() => openAdd('')}>+ Add First Member</button>}
            </div>
          ) : (
            <svg>
              <g style={{
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
                transformOrigin: '0 0',
                transition: smooth ? 'transform .8s cubic-bezier(.22,1,.36,1)' : 'none',
              }}>
                {edges.map(e => {
                  const lit = mode === 'lineage' && chainIds.has(e.from) && chainIds.has(e.to);
                  const dim = mode === 'lineage' && chain.length > 0 && !lit;
                  return <path key={e.key} className={`ft-edge ${lit ? 'lit' : ''} ${dim ? 'dim' : ''}`} d={e.d} />;
                })}

                {members.map(m => {
                  const pos = positions[m._id];
                  if (!pos) return null;
                  const isMatch  = mode === 'lineage' ? chainIds.has(m._id) : searchIds.has(m._id);
                  const isFocus  = m._id === focusId;
                  const isSel    = selected?._id === m._id;
                  const isFemale = m.gender === 'female';
                  const isDead   = !m.isAlive;
                  const dimmed   = mode === 'lineage' ? (chain.length > 0 && !isMatch) : (searchIds.size > 0 && !isMatch);
                  const nKids    = map[m._id]?.children.length || 0;
                  const cls = `ft-node ${isFemale ? 'f' : ''} ${isDead ? 'd' : ''} ${dimmed ? 'dim' : ''} ${isSel ? 'sel' : ''} ${isMatch ? 'match' : ''} ${isFocus && matches.length > 1 && mode === 'member' ? 'focus' : ''}`;

                  return (
                    <g key={m._id} className={cls} transform={`translate(${pos.x},${pos.y})`}
                      onClick={e => {
                        e.stopPropagation();
                        if (gesture.current.moved) return;       // it was a drag, not a tap
                        setSelected(isSel ? null : m);
                      }}>
                      <rect className="ring" x={-4} y={-4} width={NODE_W + 8} height={NODE_H + 8} rx={14} />
                      <rect className="card" width={NODE_W} height={NODE_H} rx={10} />

                      <text className="gi" x={NODE_W - 16} y={19} textAnchor="middle">{isFemale ? '♀' : '♂'}</text>
                      <text className="nm" x={NODE_W / 2} y={30} textAnchor="middle">
                        {m.name.length > 14 ? m.name.slice(0, 13) + '…' : m.name}
                      </text>
                      <text className="sub" x={NODE_W / 2} y={46} textAnchor="middle">
                        {isDead ? '✝ Deceased' : m.birthYear ? `b. ${m.birthYear}` : ''}
                      </text>

                      {nKids > 0 && (
                        <g>
                          <circle className="cnt-bg" cx={16} cy={NODE_H - 13} r={9} />
                          <text className="cnt" x={16} y={NODE_H - 10} textAnchor="middle">{nKids}</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          )}
        </div>

        {/* Zoom controls */}
        <div className="ft-zoom">
          <button onClick={() => zoomCentre(1.25)} aria-label="Zoom in">＋</button>
          <button onClick={() => zoomCentre(0.8)} aria-label="Zoom out">－</button>
          <small>{Math.round(view.k * 100)}%</small>
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <div className="ft-panel">
            <button className="ft-x" onClick={() => setSelected(null)} aria-label="Close">×</button>

            <div className={`ft-av ${selected.gender === 'female' ? 'f' : ''} ${!selected.isAlive ? 'd' : ''}`}>
              {selected.gender === 'female' ? '♀' : '♂'}
            </div>

            <div className="ft-pname">{selected.name}</div>
            {selected.birthYear && <div className="ft-pline">Born: {selected.birthYear}</div>}
            <div className="ft-pline">{selected.isAlive ? '✅ Alive' : '✝ Deceased'}</div>
            {selected.note && <div className="ft-pnote">"{selected.note}"</div>}

            {kids > 0 && (
              <div className="ft-pkids">👶 {kids} child{kids !== 1 ? 'ren' : ''}</div>
            )}

            {isAdmin && (
              <div className="ft-pacts">
                <button className="ft-btn block" onClick={() => openAdd(selected._id)}>+ Add Child</button>
                <button className="ft-btn ghost block" onClick={() => openEdit(selected)}>✏️ Edit</button>
                <button className="ft-btn danger block" onClick={() => setDelConfirm(selected)}>🗑 Delete</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add / Edit modal ── */}
      {showForm && (
        <div className="ft-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
          <div className="ft-modal" style={{ maxWidth: 460 }}>
            <div className="ft-mh">
              <h3>{editNode ? '✏️ Edit Member' : '+ Add Family Member'}</h3>
              <button className="ft-x" style={{ position: 'static' }} onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>
            <div className="ft-mb">
              <div className="ft-ff">
                <label className="ft-fl">Full Name *</label>
                <input className="ft-inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Ahmad Jan" />
              </div>

              <div className="ft-ff">
                <label className="ft-fl">Parent (Father / Mother)</label>
                <select className="ft-inp" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                  <option value="">— No parent (root member) —</option>
                  {members.filter(m => !blockedParents.has(m._id)).map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="ft-two ft-ff">
                <div>
                  <label className="ft-fl">Gender</label>
                  <select className="ft-inp" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="ft-fl">Birth Year</label>
                  <input className="ft-inp" type="number" value={form.birthYear} onChange={e => setForm(f => ({ ...f, birthYear: e.target.value }))} placeholder="e.g. 1980" />
                </div>
              </div>

              <div className="ft-ff">
                <label className="ft-fl">Note (optional)</label>
                <input className="ft-inp" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="e.g. Eldest son" />
              </div>

              <div className="ft-ff" style={{ marginBottom: 22 }}>
                <label className="ft-check">
                  <input type="checkbox" checked={form.isAlive} onChange={e => setForm(f => ({ ...f, isAlive: e.target.checked }))} />
                  Currently Alive
                </label>
              </div>

              {fErr && <div className="ft-err">⚠️ {fErr}</div>}

              <div className="ft-row">
                <button className="ft-btn ghost f1" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="ft-btn f2" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : editNode ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {delConfirm && (
        <div className="ft-overlay" onClick={e => e.target === e.currentTarget && setDelConfirm(null)}>
          <div className="ft-modal" style={{ maxWidth: 400 }}>
            <div className="ft-mh"><h3>⚠️ Delete "{delConfirm.name}"?</h3></div>
            <div className="ft-mb">
              <p className="ft-mtext">This will also delete all of their descendants in the tree. This action cannot be undone.</p>
              <div className="ft-row">
                <button className="ft-btn ghost f1" onClick={() => setDelConfirm(null)}>Cancel</button>
                <button className="ft-btn solid-danger f1" onClick={handleDelete}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}