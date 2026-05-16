import { useState, useEffect, useCallback } from 'react';
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
   TINY SHARED COMPONENTS
═══════════════════════════════════════════════ */
function Badge({ status }) {
  const map = {
    pending:  { bg:'#fff3cd', color:'#856404', dot:'#f0ad00' },
    active:   { bg:'#d1f0da', color:'#155724', dot:'#28a745' },
    inactive: { bg:'#e9ecef', color:'#495057', dot:'#adb5bd' },
    rejected: { bg:'#fde8e8', color:'#721c24', dot:'#dc3545' },
  };
  const s = map[status] || map.inactive;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:'5px',
      padding:'3px 10px', borderRadius:'50px',
      background:s.bg, color:s.color,
      fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.3px',
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Avatar({ name, size = 36, bg = 'linear-gradient(135deg,#1a4a24,#3d8b52)' }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%', background:bg, flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'white', fontWeight:700, fontSize: size * 0.38,
    }}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position:'fixed', bottom:28, right:28, zIndex:9999,
      padding:'13px 20px', borderRadius:'12px', color:'white',
      background: type === 'success' ? '#1a4a24' : '#c0392b',
      boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
      display:'flex', alignItems:'center', gap:10,
      fontSize:'0.86rem', fontWeight:500, fontFamily:'Sora,sans-serif',
      animation:'toastIn 0.3s ease both', maxWidth:360,
    }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <span style={{ fontSize:'1rem' }}>{type === 'success' ? '✓' : '✕'}</span>
      {message}
      <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:'1rem', padding:0 }}>×</button>
    </div>
  );
}

function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9000,
      background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:'white', borderRadius:20, width:'100%', maxWidth:width,
        boxShadow:'0 24px 64px rgba(0,0,0,0.2)',
        animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        fontFamily:'Sora,sans-serif', overflow:'hidden',
      }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:scale(0.92)}to{opacity:1;transform:scale(1)}}`}</style>
        <div style={{
          padding:'20px 24px', borderBottom:'1px solid #f0f0f0',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <h3 style={{ margin:0, fontFamily:'Fraunces,serif', fontSize:'1.1rem', color:'#0f1a10' }}>{title}</h3>
          <button onClick={onClose} style={{
            background:'#f5f5f5', border:'none', borderRadius:'50%',
            width:32, height:32, cursor:'pointer', fontSize:'1.1rem', color:'#555',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>×</button>
        </div>
        <div style={{ padding:'24px' }}>{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, children, error }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', marginBottom:6, fontSize:'0.75rem', fontWeight:700, color:'#52695a', textTransform:'uppercase', letterSpacing:'0.6px' }}>{label}</label>
      {children}
      {error && <p style={{ margin:'5px 0 0', fontSize:'0.73rem', color:'#c0392b' }}>{error}</p>}
    </div>
  );
}

const inputStyle = {
  width:'100%', boxSizing:'border-box', padding:'11px 14px',
  border:'1.5px solid rgba(26,74,36,0.18)', borderRadius:10,
  fontSize:'0.88rem', color:'#0f1a10', outline:'none',
  fontFamily:'Sora,sans-serif', background:'#f8faf6',
  transition:'border-color 0.2s, box-shadow 0.2s',
};

/* ═══════════════════════════════════════════════
   OVERVIEW PAGE
═══════════════════════════════════════════════ */
function OverviewPage({ stats, onNavigate }) {
  const [summary, setSummary]   = useState(null);
  const [selYear, setSelYear]   = useState(CURRENT_YEAR);

  useEffect(() => {
    paymentAPI.getSummary(selYear)
      .then(r => setSummary(r.data))
      .catch(() => {});
  }, [selYear]);

  const maxBar = summary ? Math.max(...summary.months.map(m => m.total), 1) : 1;

  const kpiCards = [
    { label:'Active Members',    value: stats?.active   ?? '—', icon:'👥', color:'#1a6b2a', bg:'#d1f0da' },
    { label:'Pending Approval',  value: stats?.pending  ?? '—', icon:'⏳', color:'#856404', bg:'#fff3cd', action: () => onNavigate('members','pending') },
    { label:'Total Fund (PKR)',   value: stats?.totalFund != null ? `${stats.totalFund.toLocaleString()}` : '—', icon:'🏦', color:'#1a4a24', bg:'#e8f5eb' },
    { label:'This Month (PKR)',   value: stats?.thisMonthFund != null ? `${stats.thisMonthFund.toLocaleString()}` : '—', icon:'📅', color:'#5a3e00', bg:'#fff8e6' },
  ];

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.75rem', fontWeight:900, color:'#0f1a10', margin:'0 0 4px' }}>Dashboard Overview</h1>
        <p style={{ color:'#6b7c6d', fontSize:'0.85rem', margin:0 }}>
          {new Date().toLocaleDateString('en-PK',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
        {kpiCards.map(({ label, value, icon, color, bg, action }) => (
          <div key={label}
            onClick={action}
            style={{
              background:'white', borderRadius:16, padding:'20px 22px',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)',
              border:'1px solid rgba(0,0,0,0.05)',
              cursor: action ? 'pointer' : 'default',
              transition:'transform 0.15s, box-shadow 0.15s',
              position:'relative', overflow:'hidden',
            }}
            onMouseEnter={e => { if(action){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.1)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; }}
          >
            <div style={{ position:'absolute', top:0, right:0, width:80, height:80, borderRadius:'0 16px 0 80px', background:bg, opacity:0.5 }}/>
            <div style={{ fontSize:'1.5rem', marginBottom:10 }}>{icon}</div>
            <div style={{ fontSize:'1.6rem', fontWeight:800, color, fontFamily:'Fraunces,serif', lineHeight:1 }}>
              {value}
            </div>
            <div style={{ fontSize:'0.75rem', color:'#6b7c6d', marginTop:5, fontWeight:600 }}>{label}</div>
            {action && <div style={{ fontSize:'0.7rem', color, marginTop:4, fontWeight:600 }}>View →</div>}
          </div>
        ))}
      </div>

      {/* Chart + recent */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20 }}>

        {/* Monthly bar chart */}
        <div style={{ background:'white', borderRadius:16, padding:'24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <div>
              <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'1rem', fontWeight:700, color:'#0f1a10', margin:'0 0 2px' }}>Monthly Collections</h3>
              <p style={{ color:'#8a9e8c', fontSize:'0.75rem', margin:0 }}>PKR collected per month</p>
            </div>
            <select
              value={selYear}
              onChange={e => setSelYear(Number(e.target.value))}
              style={{ ...inputStyle, width:'auto', padding:'7px 12px', fontSize:'0.8rem' }}
            >
              {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {summary ? (
            <div>
              <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:160 }}>
                {summary.months.map(m => {
                  const pct = (m.total / maxBar) * 100;
                  const isCurrent = m.month === CURRENT_MONTH && selYear === CURRENT_YEAR;
                  return (
                    <div key={m.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                      <div style={{ fontSize:'0.6rem', color:'#8a9e8c', fontWeight:600 }}>
                        {m.total > 0 ? (m.total >= 1000 ? `${(m.total/1000).toFixed(1)}k` : m.total) : ''}
                      </div>
                      <div style={{
                        width:'100%', borderRadius:'6px 6px 0 0',
                        height: `${Math.max(pct, m.total > 0 ? 4 : 0)}%`,
                        background: isCurrent
                          ? 'linear-gradient(180deg,#c9973a,#e8b84b)'
                          : m.total > 0
                            ? 'linear-gradient(180deg,#2d6a3f,#3d8b52)'
                            : 'rgba(0,0,0,0.06)',
                        transition:'height 0.4s ease',
                        minHeight: m.total > 0 ? 4 : 0,
                      }}/>
                      <div style={{ fontSize:'0.62rem', color: isCurrent ? '#c9973a' : '#8a9e8c', fontWeight: isCurrent ? 700 : 500 }}>
                        {m.label}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop:16, paddingTop:16, borderTop:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:'0.78rem', color:'#6b7c6d' }}>Total {selYear}</span>
                <span style={{ fontFamily:'Fraunces,serif', fontSize:'1.1rem', fontWeight:700, color:'#1a4a24' }}>
                  PKR {summary.grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ height:160, display:'flex', alignItems:'center', justifyContent:'center', color:'#8a9e8c', fontSize:'0.85rem' }}>Loading chart…</div>
          )}
        </div>

        {/* Quick stats panel */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Member breakdown */}
          <div style={{ background:'white', borderRadius:16, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', flex:1 }}>
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'0.95rem', fontWeight:700, color:'#0f1a10', margin:'0 0 16px' }}>Member Breakdown</h3>
            {[
              { label:'Active',   val: stats?.active,   color:'#28a745' },
              { label:'Pending',  val: stats?.pending,  color:'#f0ad00' },
              { label:'Inactive', val: stats?.inactive, color:'#adb5bd' },
              { label:'Rejected', val: stats?.rejected, color:'#dc3545' },
            ].map(({ label, val, color }) => {
              const pct = stats?.total ? Math.round((val / stats.total) * 100) : 0;
              return (
                <div key={label} style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                    <span style={{ fontSize:'0.78rem', color:'#52695a', fontWeight:600 }}>{label}</span>
                    <span style={{ fontSize:'0.78rem', color:'#0f1a10', fontWeight:700 }}>{val ?? 0}</span>
                  </div>
                  <div style={{ height:6, borderRadius:3, background:'#f0f0f0', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:3, transition:'width 0.5s ease' }}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fund summary */}
          <div style={{
            background:'linear-gradient(135deg,#1a4a24,#2d6a3f)',
            borderRadius:16, padding:'20px',
            boxShadow:'0 4px 20px rgba(26,74,36,0.25)',
          }}>
            <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:8 }}>Total Fund Collected</div>
            <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.6rem', fontWeight:900, color:'white', lineHeight:1 }}>
              PKR {(stats?.totalFund || 0).toLocaleString()}
            </div>
            <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.5)', marginBottom:2 }}>This month</div>
              <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.1rem', fontWeight:700, color:'#c9973a' }}>
                PKR {(stats?.thisMonthFund || 0).toLocaleString()}
              </div>
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
      if (action === 'approve')    res = await adminAPI.approve(id);
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
    { key:'pending',  label:'Pending',  color:'#856404' },
    { key:'active',   label:'Active',   color:'#155724' },
    { key:'inactive', label:'Inactive', color:'#495057' },
    { key:'rejected', label:'Rejected', color:'#721c24' },
    { key:'all',      label:'All',      color:'#1a4a24' },
  ];

  const filtered = members.filter(m => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return m.fullName?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.castFamily?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.75rem', fontWeight:900, color:'#0f1a10', margin:'0 0 4px' }}>Members</h1>
        <p style={{ color:'#6b7c6d', fontSize:'0.85rem', margin:0 }}>Manage membership applications and active members.</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding:'8px 18px', borderRadius:50, border:'none', cursor:'pointer',
            background: filter === t.key ? t.color : 'white',
            color: filter === t.key ? 'white' : '#52695a',
            fontWeight:700, fontSize:'0.8rem', fontFamily:'Sora,sans-serif',
            boxShadow: filter === t.key ? `0 4px 12px ${t.color}44` : '0 1px 4px rgba(0,0,0,0.08)',
            transition:'all 0.2s',
          }}>{t.label}</button>
        ))}
        <div style={{ marginLeft:'auto', position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#8fbc8f', display:'flex', pointerEvents:'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            style={{ ...inputStyle, paddingLeft:32, width:200, padding:'8px 14px 8px 32px' }}/>
        </div>
      </div>

      {/* Table */}
      <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#8a9e8c' }}>
            <div style={{ fontSize:'2rem', marginBottom:8 }}>⏳</div>
            <p style={{ margin:0, fontSize:'0.85rem' }}>Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#8a9e8c' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:8 }}>{filter === 'pending' ? '🎉' : '📭'}</div>
            <p style={{ margin:0, fontWeight:600, color:'#52695a', fontSize:'0.9rem' }}>
              {filter === 'pending' ? 'No pending approvals!' : 'No members found.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse', width:'100%' }}>
              <thead>
                <tr style={{ background:'#f8faf6' }}>
                  {['Member','Type','Cast / Family','Phone','Joined','Status','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:'0.68rem', fontWeight:700, color:'#52695a', letterSpacing:'0.8px', textTransform:'uppercase', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
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

      {/* Delete confirm */}
      {confirmDel && (
        <Modal title="Delete Member" onClose={() => setConfirmDel(null)} width={380}>
          <p style={{ color:'#52695a', fontSize:'0.88rem', lineHeight:1.6, margin:'0 0 20px' }}>
            Are you sure you want to permanently delete <strong>{confirmDel.fullName}</strong>? This cannot be undone.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setConfirmDel(null)} style={{ flex:1, padding:'11px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600, color:'#555' }}>Cancel</button>
            <button onClick={() => { doAction(confirmDel._id, 'delete'); setConfirmDel(null); }} style={{ flex:1, padding:'11px', background:'#c0392b', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600 }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function MemberRow({ member: m, isLoading, onAction }) {
  return (
    <tr style={{ borderBottom:'1px solid #f8f8f8', transition:'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background='#fafff8'}
      onMouseLeave={e => e.currentTarget.style.background='transparent'}
    >
      <td style={{ padding:'13px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Avatar name={m.fullName} size={34}/>
          <div>
            <div style={{ fontWeight:600, fontSize:'0.85rem', color:'#0f1a10' }}>{m.fullName}</div>
            <div style={{ fontSize:'0.72rem', color:'#8a9e8c' }}>{m.email}</div>
          </div>
        </div>
      </td>
      <td style={{ padding:'13px 12px', fontSize:'0.8rem', color:'#52695a', whiteSpace:'nowrap' }}>
        {m.memberType === 'job_holder' ? '💼 Job Holder' : '🎓 Student'}
      </td>
      <td style={{ padding:'13px 12px', fontSize:'0.8rem', color:'#52695a' }}>{m.castFamily || '—'}</td>
      <td style={{ padding:'13px 12px', fontSize:'0.8rem', color:'#52695a' }}>{m.phone || '—'}</td>
      <td style={{ padding:'13px 12px', fontSize:'0.75rem', color:'#8a9e8c', whiteSpace:'nowrap' }}>
        {new Date(m.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}
      </td>
      <td style={{ padding:'13px 12px' }}><Badge status={m.status}/></td>
      <td style={{ padding:'13px 16px' }}>
        <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
          {m.status === 'pending' && <>
            <Btn label="Approve" color="#155724" bg="#d1f0da" disabled={isLoading} onClick={() => onAction(m._id,'approve')}/>
            <Btn label="Reject"  color="#721c24" bg="#fde8e8" disabled={isLoading} onClick={() => onAction(m._id,'reject')}/>
          </>}
          {m.status === 'active' && <Btn label="Deactivate" color="#856404" bg="#fff3cd" disabled={isLoading} onClick={() => onAction(m._id,'deactivate')}/>}
          {(m.status === 'inactive' || m.status === 'rejected') && <Btn label="Approve" color="#155724" bg="#d1f0da" disabled={isLoading} onClick={() => onAction(m._id,'approve')}/>}
          {m.role !== 'admin' && <Btn label="Delete" color="#888" bg="#f5f5f5" disabled={isLoading} onClick={() => onAction(m._id,'delete')}/>}
          {isLoading && <span style={{ fontSize:'0.72rem', color:'#8a9e8c', alignSelf:'center' }}>…</span>}
        </div>
      </td>
    </tr>
  );
}

function Btn({ label, color, bg, onClick, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding:'5px 11px', borderRadius:7, border:`1px solid ${color}33`,
        background: hov ? color : bg, color: hov ? 'white' : color,
        fontSize:'0.72rem', fontWeight:700, cursor: disabled ? 'wait' : 'pointer',
        transition:'all 0.15s', fontFamily:'Sora,sans-serif', opacity: disabled ? 0.6 : 1,
      }}
    >{label}</button>
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

  // Record payment form state
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

  // Group payments by member for summary view
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
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.75rem', fontWeight:900, color:'#0f1a10', margin:'0 0 4px' }}>Payments</h1>
          <p style={{ color:'#6b7c6d', fontSize:'0.85rem', margin:0 }}>Record and track monthly contributions from members.</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          padding:'11px 22px', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)',
          color:'white', border:'none', borderRadius:12, cursor:'pointer',
          fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.88rem',
          boxShadow:'0 4px 16px rgba(26,74,36,0.25)', display:'flex', alignItems:'center', gap:8,
          transition:'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(26,74,36,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(26,74,36,0.25)'; }}
        >
          <span style={{ fontSize:'1.1rem' }}>+</span> Record Payment
        </button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}
          style={{ ...inputStyle, width:'auto', padding:'9px 14px', fontSize:'0.85rem' }}>
          {[CURRENT_YEAR, CURRENT_YEAR-1, CURRENT_YEAR-2].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          style={{ ...inputStyle, width:'auto', padding:'9px 14px', fontSize:'0.85rem' }}>
          <option value="">All Months</option>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <div style={{ marginLeft:'auto', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', borderRadius:12, padding:'10px 20px', color:'white' }}>
          <span style={{ fontSize:'0.7rem', opacity:0.7 }}>Total Shown: </span>
          <span style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'1rem' }}>PKR {grandTotal.toLocaleString()}</span>
        </div>
      </div>

      {/* Two-column layout: member summary + payment list */}
      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:20 }}>

        {/* Member contribution summary */}
        <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', overflow:'hidden' }}>
          <div style={{ padding:'16px 18px', borderBottom:'1px solid #f0f0f0' }}>
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'0.95rem', fontWeight:700, color:'#0f1a10', margin:0 }}>By Member</h3>
          </div>
          <div style={{ maxHeight:520, overflowY:'auto' }}>
            {Object.values(memberTotals).length === 0 ? (
              <div style={{ padding:32, textAlign:'center', color:'#8a9e8c', fontSize:'0.82rem' }}>No data</div>
            ) : (
              Object.values(memberTotals)
                .sort((a,b) => b.total - a.total)
                .map(({ member: mem, total, count }) => (
                  <div key={mem._id} style={{ padding:'12px 18px', borderBottom:'1px solid #f8f8f8', display:'flex', alignItems:'center', gap:10 }}>
                    <Avatar name={mem.fullName} size={32}/>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:'0.82rem', color:'#0f1a10', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{mem.fullName}</div>
                      <div style={{ fontSize:'0.7rem', color:'#8a9e8c' }}>{count} payment{count !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'0.9rem', color:'#1a4a24', whiteSpace:'nowrap' }}>
                      PKR {total.toLocaleString()}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        {/* Payment records table */}
        <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', overflow:'hidden' }}>
          <div style={{ padding:'16px 18px', borderBottom:'1px solid #f0f0f0' }}>
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'0.95rem', fontWeight:700, color:'#0f1a10', margin:0 }}>
              Payment Records <span style={{ fontFamily:'Sora,sans-serif', fontWeight:500, fontSize:'0.78rem', color:'#8a9e8c' }}>({payments.length})</span>
            </h3>
          </div>
          {loading ? (
            <div style={{ padding:48, textAlign:'center', color:'#8a9e8c', fontSize:'0.85rem' }}>Loading…</div>
          ) : payments.length === 0 ? (
            <div style={{ padding:48, textAlign:'center', color:'#8a9e8c' }}>
              <div style={{ fontSize:'2rem', marginBottom:8 }}>💳</div>
              <p style={{ margin:0, fontSize:'0.85rem' }}>No payments recorded yet.</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto', maxHeight:520, overflowY:'auto' }}>
              <table style={{ borderCollapse:'collapse', width:'100%' }}>
                <thead style={{ position:'sticky', top:0, zIndex:1 }}>
                  <tr style={{ background:'#f8faf6' }}>
                    {['Member','Month / Year','Amount (PKR)','Note','Recorded',''].map(h => (
                      <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:'0.67rem', fontWeight:700, color:'#52695a', letterSpacing:'0.8px', textTransform:'uppercase', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p._id} style={{ borderBottom:'1px solid #f8f8f8', transition:'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#fafff8'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <Avatar name={p.member?.fullName} size={28}/>
                          <div>
                            <div style={{ fontWeight:600, fontSize:'0.82rem', color:'#0f1a10' }}>{p.member?.fullName}</div>
                            <div style={{ fontSize:'0.7rem', color:'#8a9e8c' }}>{p.member?.memberType === 'job_holder' ? '💼' : '🎓'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ fontWeight:700, fontSize:'0.82rem', color:'#1a4a24' }}>{MONTHS[p.month-1]} {p.year}</span>
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <span style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'0.95rem', color:'#1a4a24' }}>
                          {p.amount.toLocaleString()}
                        </span>
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:'0.78rem', color:'#6b7c6d', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {p.note || <span style={{ color:'#c0c0c0' }}>—</span>}
                      </td>
                      <td style={{ padding:'12px 14px', fontSize:'0.72rem', color:'#8a9e8c', whiteSpace:'nowrap' }}>
                        {new Date(p.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}
                      </td>
                      <td style={{ padding:'12px 14px' }}>
                        <button onClick={() => setDelConfirm(p)} style={{
                          background:'none', border:'none', cursor:'pointer', color:'#ccc', fontSize:'1rem', padding:4,
                          transition:'color 0.15s',
                        }}
                          onMouseEnter={e => e.target.style.color='#c0392b'}
                          onMouseLeave={e => e.target.style.color='#ccc'}
                          title="Delete payment"
                        >🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record payment modal */}
      {showForm && (
        <Modal title="Record Monthly Payment" onClose={() => { setShowForm(false); setFormErrors({}); }}>
          <form onSubmit={handleSubmit} noValidate>
            <FormField label="Member *" error={formErrors.memberId}>
              <select value={form.memberId} onChange={e => { setForm(f=>({...f,memberId:e.target.value})); setFormErrors(er=>({...er,memberId:''})); }}
                style={{ ...inputStyle }}>
                <option value="">— Select active member —</option>
                {members.map(m => (
                  <option key={m._id} value={m._id}>{m.fullName} ({m.memberType === 'job_holder' ? 'Job Holder' : 'Student'})</option>
                ))}
              </select>
            </FormField>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <FormField label="Month *" error={formErrors.month}>
                <select value={form.month} onChange={e => { setForm(f=>({...f,month:e.target.value})); setFormErrors(er=>({...er,month:''})); }}
                  style={{ ...inputStyle }}>
                  {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Year *" error={formErrors.year}>
                <select value={form.year} onChange={e => { setForm(f=>({...f,year:e.target.value})); setFormErrors(er=>({...er,year:''})); }}
                  style={{ ...inputStyle }}>
                  {[CURRENT_YEAR, CURRENT_YEAR-1].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </FormField>
            </div>

            <FormField label="Amount (PKR) *" error={formErrors.amount}>
              <input type="number" min="1" value={form.amount}
                onChange={e => { setForm(f=>({...f,amount:e.target.value})); setFormErrors(er=>({...er,amount:''})); }}
                placeholder="e.g. 500"
                style={{ ...inputStyle }}
                onFocus={e => { e.target.style.borderColor='#2d6a3f'; e.target.style.boxShadow='0 0 0 3px rgba(45,106,63,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(26,74,36,0.18)'; e.target.style.boxShadow='none'; }}
              />
            </FormField>

            <FormField label="Note (optional)">
              <input type="text" value={form.note}
                onChange={e => setForm(f=>({...f,note:e.target.value}))}
                placeholder="e.g. Cash payment"
                style={{ ...inputStyle }}
                onFocus={e => { e.target.style.borderColor='#2d6a3f'; e.target.style.boxShadow='0 0 0 3px rgba(45,106,63,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(26,74,36,0.18)'; e.target.style.boxShadow='none'; }}
              />
            </FormField>

            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button type="button" onClick={() => { setShowForm(false); setFormErrors({}); }} style={{ flex:1, padding:'12px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600, color:'#555' }}>Cancel</button>
              <button type="submit" disabled={submitting} style={{ flex:2, padding:'12px', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', border:'none', borderRadius:10, color:'white', cursor: submitting ? 'wait' : 'pointer', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.9rem', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Saving…' : 'Record Payment'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {delConfirm && (
        <Modal title="Delete Payment" onClose={() => setDelConfirm(null)} width={360}>
          <p style={{ color:'#52695a', fontSize:'0.88rem', lineHeight:1.6, margin:'0 0 20px' }}>
            Delete <strong>PKR {delConfirm.amount.toLocaleString()}</strong> payment for <strong>{delConfirm.member?.fullName}</strong> ({MONTHS[delConfirm.month-1]} {delConfirm.year})?
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setDelConfirm(null)} style={{ flex:1, padding:'11px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600, color:'#555' }}>Cancel</button>
            <button onClick={() => handleDelete(delConfirm._id)} style={{ flex:1, padding:'11px', background:'#c0392b', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600 }}>Delete</button>
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
  const [selected,      setSelected]      = useState(null); // payment being reviewed
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
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.75rem', fontWeight:900, color:'#0f1a10', margin:'0 0 4px' }}>Verify Payments</h1>
        <p style={{ color:'#6b7c6d', fontSize:'0.85rem', margin:0 }}>Review and approve member-submitted payment proofs.</p>
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#8a9e8c' }}>
          <div style={{ fontSize:'2rem', marginBottom:8 }}>⏳</div>
          <p style={{ margin:0, fontSize:'0.85rem' }}>Loading pending payments…</p>
        </div>
      ) : payments.length === 0 ? (
        <div style={{ background:'white', borderRadius:16, padding:60, textAlign:'center', color:'#8a9e8c', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>🎉</div>
          <p style={{ margin:0, fontWeight:600, fontSize:'0.95rem', color:'#52695a' }}>No pending payments to review!</p>
          <p style={{ margin:'6px 0 0', fontSize:'0.8rem' }}>All submissions have been processed.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gap:14 }}>
          {payments.map(p => (
            <div key={p._id} style={{
              background:'white', borderRadius:16, padding:'20px 24px',
              boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)',
              display:'flex', alignItems:'center', gap:16, flexWrap:'wrap',
            }}>
              {/* Member info */}
              <Avatar name={p.member?.fullName} size={42} />
              <div style={{ flex:1, minWidth:160 }}>
                <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#0f1a10' }}>{p.member?.fullName}</div>
                <div style={{ fontSize:'0.72rem', color:'#8a9e8c', marginTop:2 }}>{p.member?.email}</div>
                <div style={{ fontSize:'0.72rem', color:'#52695a', marginTop:3 }}>
                  {p.member?.memberType === 'job_holder' ? '💼 Job Holder' : '🎓 Student'} · {p.member?.castFamily || '—'}
                </div>
              </div>

              {/* Payment details */}
              <div style={{ textAlign:'center', minWidth:100 }}>
                <div style={{ fontFamily:'Fraunces,serif', fontWeight:800, fontSize:'1.15rem', color:'#1a4a24' }}>
                  PKR {p.amount?.toLocaleString()}
                </div>
                <div style={{ fontSize:'0.75rem', color:'#6b7c6d', fontWeight:600 }}>
                  {MONTHS[(p.month || 1) - 1]} {p.year}
                </div>
              </div>

              {/* Method */}
              <div style={{ textAlign:'center', minWidth:120 }}>
                <div style={{ fontSize:'0.78rem', color:'#52695a', fontWeight:600 }}>{methodLabel(p.paymentMethod)}</div>
                {p.screenshotFullUrl && (
                  <a href={p.screenshotFullUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:'0.7rem', color:'#2d6a3f', textDecoration:'underline', marginTop:3, display:'block' }}>
                    View Screenshot ↗
                  </a>
                )}
                {p.note && (
                  <div style={{ fontSize:'0.7rem', color:'#8a9e8c', marginTop:3, fontStyle:'italic' }}>"{p.note}"</div>
                )}
              </div>

              {/* Submitted date */}
              <div style={{ textAlign:'center', minWidth:90 }}>
                <div style={{ fontSize:'0.68rem', color:'#aaa', letterSpacing:'0.5px', textTransform:'uppercase' }}>Submitted</div>
                <div style={{ fontSize:'0.78rem', color:'#52695a', fontWeight:600, marginTop:2 }}>
                  {new Date(p.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short' })}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                <button
                  onClick={() => { setSelected(p); setAdminNote(''); }}
                  style={{
                    padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer',
                    background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', color:'white',
                    fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.8rem',
                    boxShadow:'0 3px 10px rgba(26,74,36,0.25)',
                  }}
                >Review</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {selected && (
        <Modal title="Review Payment Submission" onClose={() => { setSelected(null); setAdminNote(''); }} width={500}>
          <div style={{ marginBottom:16, padding:'14px 16px', background:'#f8faf6', borderRadius:12, border:'1px solid rgba(26,74,36,0.1)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <Avatar name={selected.member?.fullName} size={36}/>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.88rem', color:'#0f1a10' }}>{selected.member?.fullName}</div>
                <div style={{ fontSize:'0.72rem', color:'#8a9e8c' }}>{selected.member?.email}</div>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                ['Amount',  `PKR ${selected.amount?.toLocaleString()}`],
                ['Period',  `${MONTHS[(selected.month||1)-1]} ${selected.year}`],
                ['Method',  methodLabel(selected.paymentMethod)],
                ['Note',    selected.note || '—'],
              ].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize:'0.65rem', color:'#8a9e8c', textTransform:'uppercase', letterSpacing:'0.8px' }}>{k}</div>
                  <div style={{ fontSize:'0.82rem', fontWeight:600, color:'#0f1a10', marginTop:2 }}>{v}</div>
                </div>
              ))}
            </div>
            {selected.screenshotFullUrl && (
              <div style={{ marginTop:12 }}>
                <div style={{ fontSize:'0.65rem', color:'#8a9e8c', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>Payment Screenshot</div>
                <a href={selected.screenshotFullUrl} target="_blank" rel="noopener noreferrer">
                  <img src={selected.screenshotFullUrl} alt="Payment proof"
                    style={{ width:'100%', maxHeight:200, objectFit:'contain', borderRadius:8, border:'1px solid #e0e0e0', background:'#fafafa' }}
                    onError={e => { e.target.style.display='none'; }}
                  />
                </a>
              </div>
            )}
          </div>

          <FormField label="Admin Note (optional)">
            <input
              type="text" value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="e.g. Verified via bank statement"
              style={{ ...inputStyle }}
              onFocus={e => { e.target.style.borderColor='#2d6a3f'; e.target.style.boxShadow='0 0 0 3px rgba(45,106,63,0.08)'; }}
              onBlur={e => { e.target.style.borderColor='rgba(26,74,36,0.18)'; e.target.style.boxShadow='none'; }}
            />
          </FormField>

          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <button onClick={() => { setSelected(null); setAdminNote(''); }}
              style={{ flex:1, padding:'11px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600, color:'#555' }}>
              Cancel
            </button>
            <button
              onClick={() => doAction(selected._id, 'reject')}
              disabled={!!actionLoading}
              style={{ flex:1, padding:'11px', background:'#fde8e8', border:'1px solid #f5c6cb', borderRadius:10, color:'#721c24', cursor: actionLoading ? 'wait' : 'pointer', fontFamily:'Sora,sans-serif', fontWeight:700, opacity: actionLoading ? 0.6 : 1 }}>
              {actionLoading === selected._id + 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
            <button
              onClick={() => doAction(selected._id, 'approve')}
              disabled={!!actionLoading}
              style={{ flex:2, padding:'11px', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', border:'none', borderRadius:10, color:'white', cursor: actionLoading ? 'wait' : 'pointer', fontFamily:'Sora,sans-serif', fontWeight:700, opacity: actionLoading ? 0.6 : 1 }}>
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
  general: { label:'General',  color:'#1a4a24', bg:'#d1f0da', icon:'📢' },
  meeting: { label:'Meeting',  color:'#1a237e', bg:'#e8eaf6', icon:'📅' },
  urgent:  { label:'Urgent',   color:'#b71c1c', bg:'#fde8e8', icon:'🚨' },
  event:   { label:'Event',    color:'#e65100', bg:'#fff3e0', icon:'🎉' },
};

function AnnouncementsPage({ showToast }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [editItem,      setEditItem]      = useState(null);   // announcement being edited
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
  const isMeeting = form.category === 'meeting';

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.75rem', fontWeight:900, color:'#0f1a10', margin:'0 0 4px' }}>Announcements</h1>
          <p style={{ color:'#6b7c6d', fontSize:'0.85rem', margin:0 }}>Post notices, meeting links, and updates to all members.</p>
        </div>
        <button onClick={openCreate} style={{
          padding:'11px 22px', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)',
          color:'white', border:'none', borderRadius:12, cursor:'pointer',
          fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.88rem',
          boxShadow:'0 4px 16px rgba(26,74,36,0.25)', display:'flex', alignItems:'center', gap:8,
        }}>
          <span style={{ fontSize:'1.1rem' }}>+</span> New Announcement
        </button>
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#8a9e8c' }}>
          <div style={{ fontSize:'2rem', marginBottom:8 }}>📢</div>
          <p style={{ margin:0, fontSize:'0.85rem' }}>Loading…</p>
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ background:'white', borderRadius:16, padding:60, textAlign:'center', color:'#8a9e8c', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>📭</div>
          <p style={{ margin:0, fontWeight:600, fontSize:'0.95rem', color:'#52695a' }}>No announcements yet.</p>
          <p style={{ margin:'6px 0 0', fontSize:'0.8rem' }}>Click "New Announcement" to post one.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {announcements.map(a => {
            const meta = CATEGORY_META[a.category] || CATEGORY_META.general;
            return (
              <div key={a._id} style={{
                background:'white', borderRadius:16, overflow:'hidden',
                boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)',
                borderLeft: `4px solid ${meta.color}`,
              }}>
                <div style={{ padding:'18px 22px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12, flexWrap:'wrap' }}>
                    <div style={{ flex:1, minWidth:200 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, flexWrap:'wrap' }}>
                        {a.pinned && <span style={{ fontSize:'0.65rem', fontWeight:700, background:'#fff3cd', color:'#856404', padding:'2px 8px', borderRadius:50 }}>📌 PINNED</span>}
                        <span style={{ fontSize:'0.65rem', fontWeight:700, background:meta.bg, color:meta.color, padding:'2px 8px', borderRadius:50 }}>
                          {meta.icon} {meta.label.toUpperCase()}
                        </span>
                        {a.emailSent && (
                          <span style={{ fontSize:'0.65rem', fontWeight:700, background:'#e8f5e9', color:'#2d6a3f', padding:'2px 8px', borderRadius:50 }}>
                            ✉ Emailed {a.emailCount}
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'1.05rem', fontWeight:800, color:'#0f1a10', margin:'0 0 6px' }}>{a.title}</h3>
                      <p style={{ fontSize:'0.83rem', color:'#52695a', margin:'0 0 8px', lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                        {a.body.length > 200 ? a.body.slice(0, 200) + '…' : a.body}
                      </p>
                      {a.meetingLink && (
                        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:'#e8f5e9', borderRadius:8, marginTop:8 }}>
                          <span style={{ fontSize:'0.8rem' }}>📅</span>
                          <div style={{ flex:1, minWidth:0 }}>
                            {a.meetingDate && (
                              <div style={{ fontSize:'0.72rem', color:'#52695a', fontWeight:600 }}>
                                {new Date(a.meetingDate).toLocaleString('en-PK', { dateStyle:'medium', timeStyle:'short' })}
                              </div>
                            )}
                            <a href={a.meetingLink} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize:'0.75rem', color:'#1a4a24', fontWeight:700, textDecoration:'none', display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                              {a.meetingLink}
                            </a>
                          </div>
                          <a href={a.meetingLink} target="_blank" rel="noopener noreferrer"
                            style={{ padding:'4px 10px', background:'#1a4a24', color:'white', borderRadius:6, fontSize:'0.7rem', fontWeight:700, textDecoration:'none', whiteSpace:'nowrap' }}>
                            Join ↗
                          </a>
                        </div>
                      )}
                    </div>
                    {/* Actions */}
                    <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end', flexShrink:0 }}>
                      <div style={{ fontSize:'0.68rem', color:'#aaa', textAlign:'right' }}>
                        {new Date(a.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}
                      </div>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
                        <Btn label="Edit" color="#52695a" bg="#f0f4f0" onClick={() => openEdit(a)}/>
                        {!a.emailSent
                          ? <Btn label={resending===a._id ? '…' : '✉ Send Email'} color="#1a237e" bg="#e8eaf6" disabled={resending===a._id} onClick={() => handleResend(a._id)}/>
                          : <Btn label={resending===a._id ? '…' : '↺ Resend'} color="#52695a" bg="#f5f5f5" disabled={resending===a._id} onClick={() => handleResend(a._id)}/>
                        }
                        <Btn label="Delete" color="#888" bg="#f5f5f5" onClick={() => setDelConfirm(a)}/>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {showForm && (
        <Modal title={editItem ? 'Edit Announcement' : 'New Announcement'} onClose={() => setShowForm(false)} width={560}>
          <div style={{ maxHeight:'72vh', overflowY:'auto', paddingRight:4 }}>

            <FormField label="Category">
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {Object.entries(CATEGORY_META).map(([key, m]) => (
                  <button key={key} type="button"
                    onClick={() => fld('category', key)}
                    style={{
                      padding:'7px 14px', borderRadius:50, border:'none', cursor:'pointer',
                      background: form.category === key ? m.color : m.bg,
                      color: form.category === key ? 'white' : m.color,
                      fontWeight:700, fontSize:'0.75rem', fontFamily:'Sora,sans-serif',
                      transition:'all 0.15s',
                    }}>
                    {m.icon} {m.label}
                  </button>
                ))}
              </div>
            </FormField>

            <FormField label="Title *" error={formErrors.title}>
              <input value={form.title} onChange={e => { fld('title', e.target.value); setFormErrors(er => ({...er, title:''})); }}
                placeholder="e.g. Monthly Meeting — June 2026"
                style={{ ...inputStyle }}
                onFocus={e => { e.target.style.borderColor='#2d6a3f'; e.target.style.boxShadow='0 0 0 3px rgba(45,106,63,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(26,74,36,0.18)'; e.target.style.boxShadow='none'; }}
              />
            </FormField>

            <FormField label="Message *" error={formErrors.body}>
              <textarea value={form.body} onChange={e => { fld('body', e.target.value); setFormErrors(er => ({...er, body:''})); }}
                placeholder="Write your announcement here…"
                rows={5}
                style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
                onFocus={e => { e.target.style.borderColor='#2d6a3f'; e.target.style.boxShadow='0 0 0 3px rgba(45,106,63,0.08)'; }}
                onBlur={e => { e.target.style.borderColor='rgba(26,74,36,0.18)'; e.target.style.boxShadow='none'; }}
              />
            </FormField>

            {/* Meeting section */}
            <div style={{ background:'#f8faf6', borderRadius:12, padding:'16px', marginBottom:16, border:'1px solid rgba(26,74,36,0.08)' }}>
              <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#52695a', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:12 }}>
                📅 Google Meet (optional)
              </div>

              <FormField label="Google Meet Link" error={formErrors.meetingLink}>
                <input value={form.meetingLink}
                  onChange={e => { fld('meetingLink', e.target.value); setFormErrors(er => ({...er, meetingLink:''})); }}
                  placeholder="https://meet.google.com/xxx-xxxx-xxx"
                  style={{ ...inputStyle }}
                  onFocus={e => { e.target.style.borderColor='#2d6a3f'; e.target.style.boxShadow='0 0 0 3px rgba(45,106,63,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor='rgba(26,74,36,0.18)'; e.target.style.boxShadow='none'; }}
                />
              </FormField>

              {form.meetingLink && (
                <>
                  <FormField label="Meeting Date & Time">
                    <input type="datetime-local" value={form.meetingDate}
                      onChange={e => fld('meetingDate', e.target.value)}
                      style={{ ...inputStyle }}
                      onFocus={e => { e.target.style.borderColor='#2d6a3f'; e.target.style.boxShadow='0 0 0 3px rgba(45,106,63,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor='rgba(26,74,36,0.18)'; e.target.style.boxShadow='none'; }}
                    />
                  </FormField>
                  <FormField label="Meeting Agenda / Note">
                    <input value={form.meetingNote} onChange={e => fld('meetingNote', e.target.value)}
                      placeholder="e.g. Monthly budget review"
                      style={{ ...inputStyle }}
                      onFocus={e => { e.target.style.borderColor='#2d6a3f'; e.target.style.boxShadow='0 0 0 3px rgba(45,106,63,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor='rgba(26,74,36,0.18)'; e.target.style.boxShadow='none'; }}
                    />
                  </FormField>
                </>
              )}
            </div>

            {/* Options */}
            <div style={{ display:'flex', gap:16, marginBottom:16 }}>
              {[
                { key:'pinned',    icon:'📌', label:'Pin to top' },
                { key:'sendEmail', icon:'✉',  label: editItem ? 'Resend email to all members' : 'Email all active members' },
              ].map(({ key, icon, label }) => (
                <label key={key} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:'0.83rem', color:'#52695a', fontWeight:500 }}>
                  <input type="checkbox" checked={form[key]} onChange={e => fld(key, e.target.checked)}
                    style={{ width:15, height:15, accentColor:'#1a4a24', cursor:'pointer' }}/>
                  {icon} {label}
                </label>
              ))}
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button type="button" onClick={() => setShowForm(false)}
                style={{ flex:1, padding:'12px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600, color:'#555' }}>
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} disabled={submitting}
                style={{ flex:2, padding:'12px', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', border:'none', borderRadius:10, color:'white', cursor: submitting ? 'wait' : 'pointer', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.9rem', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Saving…' : editItem ? 'Save Changes' : form.sendEmail ? 'Post & Send Email' : 'Post Announcement'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ── */}
      {delConfirm && (
        <Modal title="Delete Announcement" onClose={() => setDelConfirm(null)} width={380}>
          <p style={{ color:'#52695a', fontSize:'0.88rem', lineHeight:1.6, margin:'0 0 20px' }}>
            Permanently delete <strong>"{delConfirm.title}"</strong>? This cannot be undone.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setDelConfirm(null)} style={{ flex:1, padding:'11px', background:'#f5f5f5', border:'none', borderRadius:10, cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600, color:'#555' }}>Cancel</button>
            <button onClick={() => handleDelete(delConfirm._id)} style={{ flex:1, padding:'11px', background:'#c0392b', border:'none', borderRadius:10, color:'white', cursor:'pointer', fontFamily:'Sora,sans-serif', fontWeight:600 }}>Delete</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN SHELL — Sidebar + routing
═══════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const [page,       setPage]       = useState('overview');   // overview | members | payments
  const [pageParams, setPageParams] = useState({});
  const [stats,      setStats]      = useState(null);
  const [toast,      setToast]      = useState(null);
  const [sideOpen,   setSideOpen]   = useState(true);

  const showToast = useCallback((message, type = 'success') => setToast({ message, type }), []);

  const fetchStats = useCallback(async () => {
    try { const { data } = await adminAPI.getStats(); setStats(data); } catch {}
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const navigate = (p, params = {}) => { setPage(p); setPageParams(params); };

  const navItems = [
  { key:'overview',         label:'Overview',        icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { key:'members',          label:'Members',         icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, badge: stats?.pending },
  { key:'payments',         label:'Payments',        icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
  { key:'pending-payments', label:'Verify Payments', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, badge: stats?.pendingPayments, gold: true },
  { key:'announcements',    label:'Announcements',  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 20V4l-10 4L2 4v16l10-4 10 4z"/></svg> },
  { key:'family-tree', label:'Family Tree',   icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="6" x2="6" y2="12"/><line x1="12" y1="6" x2="18" y2="12"/><circle cx="12" cy="2" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/></svg> },
];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f2f5f2', fontFamily:'Sora,sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap');
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; height:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(26,74,36,0.18); border-radius:3px; }
        select, input { font-family:Sora,sans-serif !important; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sideOpen ? 240 : 68,
        background:'linear-gradient(180deg,#081a0c 0%,#0f2d15 40%,#1a4a24 100%)',
        display:'flex', flexDirection:'column',
        transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow:'hidden', flexShrink:0,
        position:'sticky', top:0, height:'100vh',
        boxShadow:'4px 0 24px rgba(0,0,0,0.12)',
      }}>
        {/* Logo */}
        <div style={{ padding: sideOpen ? '24px 20px 20px' : '24px 16px 20px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:12, overflow:'hidden' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 60 60">
              <path d="M10 42 Q7 25 22 14 Q30 8 40 13 L36 20 Q28 11 20 20 Q7 30 15 44Z" fill="white"/>
              <path d="M50 18 Q53 35 38 46 Q30 52 20 47 L24 40 Q32 49 40 40 Q53 30 45 16Z" fill="#8fbc8f"/>
              <ellipse cx="30" cy="32" rx="9" ry="6" fill="#c9973a"/>
            </svg>
          </div>
          {sideOpen && (
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'0.95rem', color:'white', lineHeight:1.1, whiteSpace:'nowrap' }}>MUS Welfare</div>
              <div style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.35)', letterSpacing:'2.5px', textTransform:'uppercase', marginTop:2 }}>Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'16px 10px', display:'flex', flexDirection:'column', gap:4 }}>
          {navItems.map(({ key, label, icon, badge, gold }) => {
            const active     = page === key;
            const accentColor = gold ? '#c9973a' : '#c9973a';
            const activeBg    = gold && active ? 'rgba(201,151,58,0.18)' : active ? 'rgba(255,255,255,0.12)' : 'transparent';
            return (
              <button key={key} onClick={() => navigate(key)} style={{
                display:'flex', alignItems:'center', gap:12,
                padding: sideOpen ? '11px 14px' : '11px',
                justifyContent: sideOpen ? 'flex-start' : 'center',
                borderRadius:10, border:'none', cursor:'pointer',
                background: activeBg,
                color: active ? 'white' : gold ? 'rgba(201,151,58,0.85)' : 'rgba(255,255,255,0.55)',
                fontFamily:'Sora,sans-serif', fontWeight: active ? 700 : 500,
                fontSize:'0.85rem', transition:'all 0.15s',
                position:'relative', overflow:'hidden',
              }}
                onMouseEnter={e => { if(!active) e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='white'; }}
                onMouseLeave={e => { if(!active) e.currentTarget.style.background=activeBg; e.currentTarget.style.color= active ? 'white' : gold ? 'rgba(201,151,58,0.85)' : 'rgba(255,255,255,0.55)'; }}
              >
                {active && <span style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, background:accentColor, borderRadius:'0 3px 3px 0' }}/>}
                <span style={{ flexShrink:0 }}>{icon}</span>
                {sideOpen && <span style={{ whiteSpace:'nowrap' }}>{label}</span>}
                {badge > 0 && sideOpen && (
                  <span style={{ marginLeft:'auto', background:'#c9973a', color:'white', borderRadius:50, padding:'1px 7px', fontSize:'0.65rem', fontWeight:700 }}>{badge}</span>
                )}
                {badge > 0 && !sideOpen && (
                  <span style={{ position:'absolute', top:6, right:6, width:8, height:8, borderRadius:'50%', background:'#c9973a' }}/>
                )}
              </button>
            );
          })}
        </nav>

        {/* User + collapse */}
        <div style={{ padding:'12px 10px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          {sideOpen && (
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, background:'rgba(255,255,255,0.06)', marginBottom:8 }}>
              <Avatar name={user?.fullName} size={30} bg="rgba(255,255,255,0.15)"/>
              <div style={{ overflow:'hidden', flex:1 }}>
                <div style={{ fontSize:'0.8rem', fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.fullName}</div>
                <div style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.4)', letterSpacing:'1px', textTransform:'uppercase' }}>Admin</div>
              </div>
            </div>
          )}
          <button onClick={() => setSideOpen(v => !v)} style={{
            width:'100%', padding:'9px', background:'rgba(255,255,255,0.06)', border:'none',
            borderRadius:8, color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:'0.75rem',
            fontFamily:'Sora,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            transition:'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
          >
            {sideOpen ? '← Collapse' : '→'}
          </button>
          <button onClick={logout} style={{
            width:'100%', marginTop:6, padding:'9px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)',
            borderRadius:8, color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:'0.75rem',
            fontFamily:'Sora,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
            transition:'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(220,53,69,0.15)'; e.currentTarget.style.color='#ff6b6b'; e.currentTarget.style.borderColor='rgba(220,53,69,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {sideOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex:1, minHeight:0, padding:'32px', overflowY:'auto', minWidth:0 }}>
        {page === 'overview'         && <OverviewPage        stats={stats} onNavigate={navigate}/>}
        {page === 'members'          && <MembersPage         initialFilter={pageParams.filter || 'pending'} showToast={showToast} onRefreshStats={fetchStats}/>}
        {page === 'payments'         && <PaymentsPage        showToast={showToast}/>}
        {page === 'pending-payments' && <PendingPaymentsPage showToast={showToast} onRefreshStats={fetchStats}/>}
        {page === 'announcements'    && <AnnouncementsPage   showToast={showToast}/>}
        {page === 'family-tree' && <FamilyTreePage isAdmin={true} showToast={showToast}/>}
      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  );
}