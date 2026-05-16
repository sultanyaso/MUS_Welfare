import { useState, useEffect, useCallback, useRef } from 'react';
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

/* ─── measure subtree width ─── */
const NODE_W = 130;
const NODE_H = 64;
const GAP_X  = 20;
const GAP_Y  = 90;

function subtreeWidth(node) {
  if (!node.children.length) return NODE_W;
  const childrenW = node.children.reduce((s, c) => s + subtreeWidth(c) + GAP_X, -GAP_X);
  return Math.max(NODE_W, childrenW);
}

/* ─── layout: assign x,y to every node ─── */
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

/* ─── collect all edges ─── */
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
      edges.push({ key:`${node._id}-${child._id}`, d:`M${px},${py} C${px},${my} ${cx},${my} ${cx},${cy}` });
      walk(child);
    });
  }
  nodes.forEach(walk);
  return edges;
}

/* ─── SVG canvas bounds ─── */
function canvasBounds(positions) {
  if (!Object.keys(positions).length) return { w: 800, h: 400 };
  const xs = Object.values(positions).map(p => p.x);
  const ys = Object.values(positions).map(p => p.y);
  return {
    w: Math.max(...xs) + NODE_W + 60,
    h: Math.max(...ys) + NODE_H + 60,
  };
}

/* ══════════════════════════════════════════════════════
   FAMILY TREE PAGE
══════════════════════════════════════════════════════ */
export default function FamilyTreePage({ isAdmin = false, showToast }) {
  const [members,    setMembers]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);   // clicked node
  const [showForm,   setShowForm]   = useState(false);
  const [editNode,   setEditNode]   = useState(null);
  const [delConfirm, setDelConfirm] = useState(null);
  const [search,     setSearch]     = useState('');

  // pan/zoom
  const svgRef    = useRef(null);
  const canvasRef = useRef(null);
  const [pan,   setPan]   = useState({ x: 40, y: 40 });
  const [zoom,  setZoom]  = useState(1);
  const dragging = useRef(false);
  const lastPt   = useRef({ x: 0, y: 0 });

  // form state
  const emptyForm = { name:'', parentId:'', gender:'male', birthYear:'', note:'', isAlive:true };
  const [form,    setForm]    = useState(emptyForm);
  const [saving,  setSaving]  = useState(false);
  const [fErr,    setFErr]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await familyAPI.getAll();
      setMembers(data.members);
    } catch { showToast?.('Failed to load family tree.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  // build tree
  const { roots, map } = buildTree(members);
  const positions       = layoutTree(roots);
  const edges           = collectEdges(roots, positions);
  const { w, h }        = canvasBounds(positions);

  // search highlight
  const searchIds = search.trim()
    ? new Set(members.filter(m => m.name.toLowerCase().includes(search.toLowerCase())).map(m => m._id))
    : new Set();

  // pan handlers
  const onMouseDown = e => {
    dragging.current = true;
    lastPt.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  };
  const onPointerMove = e => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPt.current.x;
    const dy = e.clientY - lastPt.current.y;
    setPan(p => ({ x: p.x - dx, y: p.y - dy }));
    lastPt.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => { dragging.current = false; };
  const onWheel     = e => { e.preventDefault(); setZoom(z => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001))); };

  useEffect(() => {
    const el = svgRef.current;
    if (el) el.addEventListener('wheel', onWheel, { passive: false });
    return () => { if (el) el.removeEventListener('wheel', onWheel); };
  }, []);

  useEffect(() => {
    const handleMove = e => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPt.current.x;
      const dy = e.clientY - lastPt.current.y;
      setPan(p => ({ x: p.x - dx, y: p.y - dy }));
      lastPt.current = { x: e.clientX, y: e.clientY };
    };
    const handleUp = () => { dragging.current = false; };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || w === 0 || h === 0) return;
    const rect = el.getBoundingClientRect();
    setPan({
      x: rect.width > w ? (rect.width - w) / 2 : 40,
      y: rect.height > h ? (rect.height - h) / 2 : 40,
    });
  }, [w, h, members.length]);

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

  const iSt = { width:'100%', boxSizing:'border-box', padding:'10px 13px', border:'1.5px solid rgba(26,74,36,0.2)', borderRadius:9, fontSize:'0.87rem', fontFamily:'Sora,sans-serif', background:'#f8faf6', color:'#0f1a10', outline:'none' };
  const lbl = { display:'block', marginBottom:5, fontSize:'0.7rem', fontWeight:700, color:'#52695a', textTransform:'uppercase', letterSpacing:'0.6px' };

  return (
    <div style={{ height:'100%', minHeight:0, display:'flex', flexDirection:'column', fontFamily:'Sora,sans-serif' }}>
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10 }}>
        <div>
          <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.6rem', fontWeight:900, color:'#0f1a10', margin:'0 0 2px' }}>🌳 Family Tree</h1>
          <p style={{ color:'#6b7c6d', fontSize:'0.82rem', margin:0 }}>
            {members.length} members · Scroll to zoom · Drag to pan
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          {/* Search */}
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#8fbc8f', pointerEvents:'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search member…"
              style={{ ...iSt, width:180, paddingLeft:30, padding:'9px 12px 9px 30px' }}/>
          </div>
          {/* Reset view */}
          <button onClick={() => { setPan({ x:40, y:40 }); setZoom(1); }}
            style={{ padding:'9px 16px', background:'white', border:'1.5px solid rgba(26,74,36,0.18)', borderRadius:9, fontSize:'0.8rem', fontWeight:600, color:'#52695a', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>
            ⟳ Reset View
          </button>
          {/* Add root member — admin only */}
          {isAdmin && (
            <button onClick={() => openAdd('')}
              style={{ padding:'9px 18px', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', color:'white', border:'none', borderRadius:9, fontWeight:700, fontSize:'0.82rem', cursor:'pointer', fontFamily:'Sora,sans-serif', display:'flex', alignItems:'center', gap:6 }}>
              + Add Root Member
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginBottom:12, flexWrap:'wrap' }}>
        {[['#1a4a24','Male'],['#c9973a','Female'],['rgba(0,0,0,0.25)','Deceased']].map(([color, label]) => (
          <div key={label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.72rem', color:'#6b7c6d' }}>
            <div style={{ width:12, height:12, borderRadius:3, background:color }}/>
            {label}
          </div>
        ))}
        {search && searchIds.size > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.72rem', color:'#856404', fontWeight:700 }}>
            🔍 {searchIds.size} match{searchIds.size !== 1 ? 'es' : ''} found
          </div>
        )}
      </div>

      {/* ── Tree canvas ── */}
      <div ref={canvasRef} style={{ flex:'1 1 0', minHeight:0, background:'white', borderRadius:16, border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', overflow:'auto', position:'relative', cursor:dragging.current?'grabbing':'grab', touchAction:'none', userSelect:'none', MozUserSelect:'none', WebkitUserSelect:'none' }}
        onMouseDown={onMouseDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>

        {loading ? (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#8a9e8c' }}>
            <div style={{ fontSize:'2.5rem' }}>🌳</div>
            <p style={{ margin:0, fontSize:'0.88rem' }}>Loading family tree…</p>
          </div>
        ) : members.length === 0 ? (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#8a9e8c' }}>
            <div style={{ fontSize:'3rem' }}>🌱</div>
            <p style={{ margin:0, fontWeight:700, color:'#52695a' }}>Family tree is empty</p>
            {isAdmin && (
              <button onClick={() => openAdd('')}
                style={{ padding:'10px 22px', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', color:'white', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontFamily:'Sora,sans-serif', fontSize:'0.88rem' }}>
                + Add First Member
              </button>
            )}
          </div>
        ) : (
          <svg ref={svgRef} width={w} height={h} style={{ display:'block', userSelect:'none' }} draggable={false}>
            <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {edges.map(e => (
                <path key={e.key} d={e.d} fill="none" stroke="rgba(26,74,36,0.25)" strokeWidth="2" strokeDasharray="5,3"/>
              ))}

              {/* Nodes */}
              {members.map(m => {
                const pos      = positions[m._id];
                if (!pos) return null;
                const isMatch  = searchIds.size > 0 && searchIds.has(m._id);
                const isSel    = selected?._id === m._id;
                const isFemale = m.gender === 'female';
                const isDead   = !m.isAlive;
                const nodeBg   = isDead ? '#9e9e9e' : isFemale ? '#c9973a' : '#1a4a24';
                const dimmed   = searchIds.size > 0 && !isMatch;

                return (
                  <g key={m._id} transform={`translate(${pos.x},${pos.y})`}
                    style={{ cursor:'pointer', opacity: dimmed ? 0.25 : 1, transition:'opacity 0.2s' }}
                    onClick={e => { e.stopPropagation(); setSelected(isSel ? null : m); }}>

                    {/* Glow if selected or search match */}
                    {(isSel || isMatch) && (
                      <rect x={-4} y={-4} width={NODE_W+8} height={NODE_H+8} rx={14}
                        fill="none" stroke={isMatch ? '#c9973a' : '#2d6a3f'} strokeWidth="2.5"
                        style={{ filter:'drop-shadow(0 0 6px rgba(201,151,58,0.5))' }}/>
                    )}

                    {/* Card */}
                    <rect width={NODE_W} height={NODE_H} rx={10}
                      fill={nodeBg} style={{ filter:'drop-shadow(0 3px 8px rgba(0,0,0,0.18))' }}/>

                    {/* Gender icon circle */}
                    <circle cx={NODE_W-16} cy={16} r={8} fill="rgba(255,255,255,0.2)"/>
                    <text x={NODE_W-16} y={20} textAnchor="middle" fontSize="9" fill="white">
                      {isFemale ? '♀' : '♂'}
                    </text>

                    {/* Name */}
                    <text x={NODE_W/2} y={28} textAnchor="middle" fontSize="12" fontWeight="700"
                      fill="white" fontFamily="Sora,sans-serif"
                      style={{ textShadow:'0 1px 2px rgba(0,0,0,0.3)' }}>
                      {m.name.length > 14 ? m.name.slice(0,13)+'…' : m.name}
                    </text>

                    {/* Birth year / deceased */}
                    <text x={NODE_W/2} y={44} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.7)" fontFamily="Sora,sans-serif">
                      {isDead ? '✝ Deceased' : m.birthYear ? `b. ${m.birthYear}` : ''}
                    </text>

                    {/* Children count */}
                    {map[m._id]?.children.length > 0 && (
                      <g>
                        <circle cx={16} cy={NODE_H-12} r={9} fill="rgba(255,255,255,0.2)"/>
                        <text x={16} y={NODE_H-8} textAnchor="middle" fontSize="9" fill="white" fontWeight="700">
                          {map[m._id].children.length}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Zoom controls */}
        <div style={{ position:'absolute', bottom:16, right:16, display:'flex', flexDirection:'column', gap:6 }}>
          {[['＋', () => setZoom(z => Math.min(2, z+0.15))], ['－', () => setZoom(z => Math.max(0.3, z-0.15))]].map(([label, fn]) => (
            <button key={label} onClick={fn}
              style={{ width:34, height:34, borderRadius:8, border:'1px solid rgba(0,0,0,0.1)', background:'white', cursor:'pointer', fontSize:'1.1rem', fontWeight:700, boxShadow:'0 2px 8px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              {label}
            </button>
          ))}
          <div style={{ textAlign:'center', fontSize:'0.65rem', color:'#8a9e8c', fontWeight:600 }}>
            {Math.round(zoom*100)}%
          </div>
        </div>
      </div>

      {/* ── Detail panel — shown when a node is selected ── */}
      {selected && (
        <div style={{ position:'fixed', right:24, top:'50%', transform:'translateY(-50%)', zIndex:500,
          background:'white', borderRadius:16, padding:'20px 22px', width:240,
          boxShadow:'0 12px 40px rgba(0,0,0,0.15)', border:'1px solid rgba(0,0,0,0.07)',
          animation:'slideIn 0.2s ease' }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateY(-50%) translateX(10px)}to{opacity:1;transform:translateY(-50%) translateX(0)}}`}</style>
          <button onClick={() => setSelected(null)}
            style={{ position:'absolute', top:10, right:12, background:'none', border:'none', fontSize:'1.1rem', cursor:'pointer', color:'#aaa' }}>×</button>

          <div style={{ width:44, height:44, borderRadius:12,
            background: !selected.isAlive ? '#9e9e9e' : selected.gender==='female' ? '#c9973a' : '#1a4a24',
            display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'1.3rem', marginBottom:12 }}>
            {selected.gender==='female' ? '♀' : '♂'}
          </div>

          <div style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'1rem', color:'#0f1a10', marginBottom:4 }}>{selected.name}</div>
          {selected.birthYear && <div style={{ fontSize:'0.78rem', color:'#6b7c6d', marginBottom:2 }}>Born: {selected.birthYear}</div>}
          <div style={{ fontSize:'0.78rem', color:'#6b7c6d', marginBottom:2 }}>{selected.isAlive ? '✅ Alive' : '✝ Deceased'}</div>
          {selected.note && <div style={{ fontSize:'0.78rem', color:'#52695a', fontStyle:'italic', marginBottom:8 }}>"{selected.note}"</div>}

          {map[selected._id]?.children.length > 0 && (
            <div style={{ fontSize:'0.75rem', color:'#1a4a24', fontWeight:700, marginBottom:8 }}>
              👶 {map[selected._id].children.length} child{map[selected._id].children.length!==1?'ren':''}
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:12, paddingTop:12, borderTop:'1px solid #f0f0f0' }}>
              <button onClick={() => openAdd(selected._id)}
                style={{ padding:'9px 0', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', color:'white', border:'none', borderRadius:8, fontWeight:700, fontSize:'0.8rem', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>
                + Add Child
              </button>
              <button onClick={() => openEdit(selected)}
                style={{ padding:'9px 0', background:'#e8f5eb', color:'#1a4a24', border:'1px solid rgba(26,74,36,0.2)', borderRadius:8, fontWeight:700, fontSize:'0.8rem', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>
                ✏️ Edit
              </button>
              <button onClick={() => setDelConfirm(selected)}
                style={{ padding:'9px 0', background:'#fde8e8', color:'#c0392b', border:'1px solid #f5c6c6', borderRadius:8, fontWeight:700, fontSize:'0.8rem', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>
                🗑 Delete
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Add / Edit modal ── */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e => e.target===e.currentTarget && setShowForm(false)}>
          <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:440, boxShadow:'0 24px 64px rgba(0,0,0,0.2)', overflow:'auto', fontFamily:'Sora,sans-serif' }}>
            <div style={{ background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', padding:'18px 22px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'Fraunces,serif', fontWeight:900, fontSize:'1.05rem', color:'white' }}>
                {editNode ? '✏️ Edit Member' : '+ Add Family Member'}
              </span>
              <button onClick={() => setShowForm(false)}
                style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:7, width:30, height:30, color:'white', cursor:'pointer', fontSize:'1rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
            </div>
            <div style={{ padding:'22px 24px' }}>
              {/* Name */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Full Name *</label>
                <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))}
                  placeholder="e.g. Ahmad Jan" style={iSt}
                  onFocus={e => e.target.style.borderColor='#2d6a3f'}
                  onBlur={e => e.target.style.borderColor='rgba(26,74,36,0.2)'}/>
              </div>

              {/* Parent */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Parent (Father / Mother)</label>
                <select value={form.parentId} onChange={e => setForm(f => ({...f, parentId:e.target.value}))} style={iSt}>
                  <option value="">— No parent (root member) —</option>
                  {members.map(m => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Gender + Birth year */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                <div>
                  <label style={lbl}>Gender</label>
                  <select value={form.gender} onChange={e => setForm(f => ({...f, gender:e.target.value}))} style={iSt}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Birth Year</label>
                  <input type="number" value={form.birthYear} onChange={e => setForm(f => ({...f, birthYear:e.target.value}))}
                    placeholder="e.g. 1980" style={iSt}
                    onFocus={e => e.target.style.borderColor='#2d6a3f'}
                    onBlur={e => e.target.style.borderColor='rgba(26,74,36,0.2)'}/>
                </div>
              </div>

              {/* Note */}
              <div style={{ marginBottom:14 }}>
                <label style={lbl}>Note (optional)</label>
                <input value={form.note} onChange={e => setForm(f => ({...f, note:e.target.value}))}
                  placeholder="e.g. Eldest son" style={iSt}
                  onFocus={e => e.target.style.borderColor='#2d6a3f'}
                  onBlur={e => e.target.style.borderColor='rgba(26,74,36,0.2)'}/>
              </div>

              {/* Alive toggle */}
              <div style={{ marginBottom:18, display:'flex', alignItems:'center', gap:10 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.85rem', color:'#52695a', fontWeight:600 }}>
                  <input type="checkbox" checked={form.isAlive}
                    onChange={e => setForm(f => ({...f, isAlive:e.target.checked}))}
                    style={{ width:16, height:16, accentColor:'#1a4a24' }}/>
                  Currently Alive
                </label>
              </div>

              {fErr && <div style={{ padding:'9px 13px', background:'#fde8e8', borderRadius:9, marginBottom:14, fontSize:'0.82rem', color:'#c0392b', fontWeight:600 }}>⚠️ {fErr}</div>}

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setShowForm(false)}
                  style={{ flex:1, padding:'12px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600, color:'#555', fontSize:'0.88rem' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  style={{ flex:2, padding:'12px', background:saving?'#ccc':'linear-gradient(135deg,#1a4a24,#2d6a3f)', border:'none', borderRadius:10, color:'white', cursor:saving?'wait':'pointer', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.9rem' }}>
                  {saving ? 'Saving…' : editNode ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {delConfirm && (
        <div style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e => e.target===e.currentTarget && setDelConfirm(null)}>
          <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:380, padding:'28px 26px', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', fontFamily:'Sora,sans-serif' }}>
            <div style={{ fontSize:'2rem', marginBottom:10 }}>⚠️</div>
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'1.05rem', color:'#0f1a10', margin:'0 0 10px' }}>Delete "{delConfirm.name}"?</h3>
            <p style={{ color:'#52695a', fontSize:'0.85rem', lineHeight:1.6, margin:'0 0 20px' }}>
              This will also delete all of their descendants in the tree. This action cannot be undone.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setDelConfirm(null)}
                style={{ flex:1, padding:'11px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600, color:'#555' }}>Cancel</button>
              <button onClick={handleDelete}
                style={{ flex:1, padding:'11px', background:'#c0392b', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:700 }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}