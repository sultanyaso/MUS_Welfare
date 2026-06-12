import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { memberAPI, announcementAPI } from '../api';
import FamilyTreePage from './FamilyTreePage';

const MONTHS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CUR_YEAR  = new Date().getFullYear();
const CUR_MONTH = new Date().getMonth() + 1;

/* ─── Avatar ─── */
function Avatar({ name, size = 36 }) {
  const colors = ['#1a4a24','#2d6a3f','#3d8b52','#c9973a','#0f2d15','#5a3e00'];
  const bg = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width:size, height:size, borderRadius:'50%', flexShrink:0,
      background:`linear-gradient(135deg,${bg},${bg}cc)`,
      display:'flex', alignItems:'center', justifyContent:'center',
      color:'white', fontWeight:700, fontSize:size*0.38, boxShadow:`0 2px 8px ${bg}44` }}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  );
}

/* ─── Toast ─── */
function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999,
      padding:'13px 20px', borderRadius:12, color:'white',
      background: type === 'success' ? '#1a4a24' : '#c0392b',
      boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
      display:'flex', alignItems:'center', gap:10,
      fontSize:'0.86rem', fontWeight:500, fontFamily:'Sora,sans-serif',
      animation:'toastIn 0.3s ease both', maxWidth:380 }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      {message}
      <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', fontSize:'1rem', padding:0 }}>×</button>
    </div>
  );
}

/* ─── Bar Chart ─── */
function BarChart({ months, myPayments, height = 180 }) {
  const maxVal = Math.max(...months.map(m => m.total), 1);
  return (
    <div style={{ width:'100%' }}>
      <div style={{ display:'flex', alignItems:'flex-end', gap:6, height }}>
        {months.map(m => {
          const orgPct = (m.total / maxVal) * 100;
          const myPay  = myPayments?.find(p => p.month === m.month && p.year === CUR_YEAR && p.status === 'verified');
          const isCur  = m.month === CUR_MONTH;
          return (
            <div key={m.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3, position:'relative' }}>
              <div className="bar-tip" style={{ position:'absolute', bottom:'100%', left:'50%', transform:'translateX(-50%)',
                background:'#0f1a10', color:'white', borderRadius:6, padding:'4px 8px',
                fontSize:'0.65rem', fontWeight:600, whiteSpace:'nowrap', marginBottom:4,
                opacity:0, transition:'opacity 0.15s', pointerEvents:'none', zIndex:10 }}>
                {m.total > 0 ? `PKR ${m.total.toLocaleString()}` : 'No data'}
                {myPay ? ` · You: ${myPay.amount.toLocaleString()}` : ''}
              </div>
              <div style={{ width:'100%', display:'flex', alignItems:'flex-end', gap:1, height:height-24 }}
                onMouseEnter={e => { const t=e.currentTarget.parentElement.querySelector('.bar-tip'); if(t) t.style.opacity='1'; }}
                onMouseLeave={e => { const t=e.currentTarget.parentElement.querySelector('.bar-tip'); if(t) t.style.opacity='0'; }}>
                <div style={{ flex:1, borderRadius:'4px 4px 0 0',
                  height:`${Math.max(orgPct, m.total>0?3:0)}%`,
                  background: isCur ? 'linear-gradient(180deg,#c9973a,#e8b84b)' : m.total>0 ? 'linear-gradient(180deg,#2d6a3f,#3d8b52)' : 'rgba(0,0,0,0.06)',
                  transition:'height 0.5s', minHeight:m.total>0?3:0 }}/>
                {myPay && (
                  <div style={{ flex:1, borderRadius:'4px 4px 0 0',
                    height:`${(myPay.amount/maxVal)*100}%`,
                    background:'linear-gradient(180deg,#c9973a88,#e8b84b88)', transition:'height 0.5s', minHeight:3 }}/>
                )}
              </div>
              <div style={{ fontSize:'0.6rem', color:isCur?'#c9973a':'#8a9e8c', fontWeight:isCur?700:500, marginTop:2 }}>{m.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display:'flex', gap:16, marginTop:12, justifyContent:'flex-end' }}>
        {[['linear-gradient(135deg,#2d6a3f,#3d8b52)','Org total'],['#c9973a88','My payment'],['linear-gradient(135deg,#c9973a,#e8b84b)','Current month']].map(([bg,label])=>(
          <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:'0.72rem', color:label==='Current month'?'#c9973a':'#6b7c6d', fontWeight:label==='Current month'?700:400 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:bg }}/>{label}
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
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f0f0f0" strokeWidth="12"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#dg)" strokeWidth="12"
        strokeDasharray={`${dash} ${circ-dash}`} strokeDashoffset={circ/4} strokeLinecap="round"
        style={{ transition:'stroke-dasharray 0.8s' }}/>
      <defs><linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1a4a24"/><stop offset="100%" stopColor="#3d8b52"/>
      </linearGradient></defs>
      <text x={cx} y={cy-6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#0f1a10" fontFamily="Fraunces,serif">{paid}</text>
      <text x={cx} y={cy+12} textAnchor="middle" fontSize="10" fill="#8a9e8c" fontFamily="Sora,sans-serif">of {total}</text>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════
   PAY NOW MODAL — fully responsive & scrollable
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

  /* Lock body scroll when modal is open */
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const alreadyVerified = myPayments?.find(p => p.month === month && p.year === year && p.status === 'verified');
  const alreadyPending  = myPayments?.find(p => p.month === month && p.year === year && p.status === 'pending');

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

  const lbl = { display:'block', marginBottom:6, fontSize:'0.7rem', fontWeight:700, color:'#52695a', textTransform:'uppercase', letterSpacing:'0.8px' };
  const iSt = { width:'100%', padding:'11px 14px', border:'1.5px solid rgba(26,74,36,0.2)', borderRadius:10, fontSize:'0.88rem', fontFamily:'Sora,sans-serif', background:'#f8faf6', color:'#0f1a10', outline:'none', boxSizing:'border-box' };

  const stepLabels = method === 'account'
    ? ['Select Month', 'Account Details', 'Upload Proof', 'Confirm']
    : ['Select Month', 'Scan QR', 'Confirm'];

  return (
    <>
      <style>{`
        @keyframes modalIn{from{opacity:0;transform:scale(0.94) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}
        .paynow-modal-scroll::-webkit-scrollbar{width:4px}
        .paynow-modal-scroll::-webkit-scrollbar-track{background:transparent}
        .paynow-modal-scroll::-webkit-scrollbar-thumb{background:rgba(26,74,36,0.2);border-radius:4px}
        .paynow-step-label{font-size:0.58rem;font-weight:700;color:#adb5bd;text-transform:uppercase;letter-spacing:0.5px}
        .paynow-step-label.active{color:#1a4a24}
        .paynow-step-label.done{color:#2d6a3f}
        @media(max-width:480px){
          .paynow-step-label{font-size:0.52rem;letter-spacing:0}
          .paynow-grid-2{grid-template-columns:1fr!important}
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={e => e.target === e.currentTarget && onClose()}
        style={{
          position:'fixed', inset:0, zIndex:9000,
          background:'rgba(0,0,0,0.6)',
          backdropFilter:'blur(5px)',
          display:'flex',
          alignItems:'center',
          justifyContent:'center',
          padding:'16px',
          animation:'overlayIn 0.2s ease both',
        }}
      >
        {/* Modal card */}
        <div style={{
          background:'white',
          borderRadius:'20px',
          width:'100%',
          maxWidth:520,
          maxHeight:'92dvh',             /* leave room for top safe area */
          display:'flex',
          flexDirection:'column',        /* header fixed, body scrolls */
          boxShadow:'0 -8px 48px rgba(0,0,0,0.28)',
          animation:'modalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
          fontFamily:'Sora,sans-serif',
          overflow:'hidden',
        }}
        /* On wider screens: centered card with rounded corners everywhere */
        className="paynow-modal-card"
        >
          <style>{`
            @media(min-width:560px){
              .paynow-modal-card{
                max-height:88dvh!important;
              }
            }
          `}</style>

          {/* ── Fixed Header ── */}
          <div style={{
            background:'linear-gradient(135deg,#1a4a24,#2d6a3f)',
            padding:'18px 20px 16px',
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexShrink:0,
          }}>
            {/* Drag handle (mobile only) */}
            <div style={{ position:'absolute', top:8, left:'50%', transform:'translateX(-50%)', width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.25)' }}/>
            <div>
              <div style={{ fontFamily:'Fraunces,serif', fontWeight:900, fontSize:'1.1rem', color:'white', display:'flex', alignItems:'center', gap:8 }}>
                💳 Pay Now
              </div>
              <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.55)', marginTop:2 }}>
                {step === 0 ? 'Choose payment method' : stepLabels[step - 1]}
              </div>
            </div>
            <button onClick={onClose} style={{
              background:'rgba(255,255,255,0.15)', border:'none', borderRadius:8,
              width:32, height:32, cursor:'pointer', color:'white', fontSize:'1.1rem',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            }}>×</button>
          </div>

          {/* ── Fixed Step Progress ── */}
          {step > 0 && (
            <div style={{ display:'flex', flexShrink:0, borderBottom:'1px solid #f0f0f0' }}>
              {stepLabels.map((label, i) => (
                <div key={label} style={{
                  flex:1, padding:'8px 4px', textAlign:'center',
                  background: step > i+1 ? '#d1f0da' : step === i+1 ? '#e8f5eb' : '#f8faf6',
                  borderBottom: step === i+1 ? '3px solid #1a4a24' : '3px solid transparent',
                  transition:'all 0.2s',
                }}>
                  <span className={`paynow-step-label${step > i+1 ? ' done' : step === i+1 ? ' active' : ''}`}>
                    {step > i+1 ? '✓ ' : `${i+1}. `}{label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ── Scrollable Body ── */}
          <div
            className="paynow-modal-scroll"
            style={{
              flex:1,
              overflowY:'auto',
              overflowX:'hidden',
              padding:'20px 20px 28px',
              WebkitOverflowScrolling:'touch',
            }}
          >

            {/* ── STEP 0: Choose method ── */}
            {step === 0 && (
              <div>
                <p style={{ margin:'0 0 18px', fontSize:'0.88rem', color:'#52695a', lineHeight:1.6 }}>How would you like to pay your monthly contribution?</p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

                  {/* QR Method */}
                  <button onClick={() => { setMethod('qr'); setStep(1); }}
                    style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:14, border:'2px solid rgba(26,74,36,0.18)', background:'#f8faf6', cursor:'pointer', textAlign:'left', transition:'all 0.18s', width:'100%' }}
                    onMouseEnter={e => { e.currentTarget.style.border='2px solid #2d6a3f'; e.currentTarget.style.background='#e8f5eb'; }}
                    onMouseLeave={e => { e.currentTarget.style.border='2px solid rgba(26,74,36,0.18)'; e.currentTarget.style.background='#f8faf6'; }}>
                    <div style={{ width:50, height:50, borderRadius:12, background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/>
                        <rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/><rect x="19" y="19" width="2" height="2"/>
                      </svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'0.93rem', color:'#0f1a10', marginBottom:3 }}>Scan QR Code</div>
                      <div style={{ fontSize:'0.76rem', color:'#6b7c6d', lineHeight:1.5 }}>Scan with your banking app and pay directly.</div>
                    </div>
                    <span style={{ color:'#2d6a3f', fontSize:'1.1rem', flexShrink:0 }}>→</span>
                  </button>

                  {/* Account Transfer */}
                  <button onClick={() => { setMethod('account'); setStep(1); }}
                    style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', borderRadius:14, border:'2px solid rgba(201,151,58,0.25)', background:'#fffdf5', cursor:'pointer', textAlign:'left', transition:'all 0.18s', width:'100%' }}
                    onMouseEnter={e => { e.currentTarget.style.border='2px solid #c9973a'; e.currentTarget.style.background='#fff8e6'; }}
                    onMouseLeave={e => { e.currentTarget.style.border='2px solid rgba(201,151,58,0.25)'; e.currentTarget.style.background='#fffdf5'; }}>
                    <div style={{ width:50, height:50, borderRadius:12, background:'linear-gradient(135deg,#c9973a,#e8b84b)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                        <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                      </svg>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:'0.93rem', color:'#0f1a10', marginBottom:3 }}>Bank Account Transfer</div>
                      <div style={{ fontSize:'0.76rem', color:'#6b7c6d', lineHeight:1.5 }}>Transfer to our account and upload a screenshot as proof.</div>
                    </div>
                    <span style={{ color:'#c9973a', fontSize:'1.1rem', flexShrink:0 }}>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 1: Select month & amount ── */}
            {step === 1 && (
              <div>
                <p style={{ margin:'0 0 16px', fontSize:'0.88rem', color:'#52695a', lineHeight:1.6 }}>Select the month you are paying for.</p>
                <div className="paynow-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
                  <div>
                    <label style={lbl}>Month</label>
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} style={iSt}>
                      {MONTHS.map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Year</label>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} style={iSt}>
                      {[CUR_YEAR, CUR_YEAR-1].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Amount (PKR) — min PKR {minAmount}</label>
                  <input type="number" value={amount} min={minAmount} onChange={e => setAmount(e.target.value)} style={iSt}/>
                </div>
                <div style={{ marginBottom:18 }}>
                  <label style={lbl}>Note (optional)</label>
                  <input value={note} onChange={e => setNote(e.target.value)}
                    placeholder={method === 'account' ? 'e.g. Transferred via Meezan Bank' : 'e.g. via JazzCash'} style={iSt}/>
                </div>
                {alreadyVerified && (
                  <div style={{ padding:'11px 14px', background:'#d1f0da', borderRadius:10, marginBottom:14, fontSize:'0.82rem', color:'#155724', fontWeight:600 }}>✅ Already paid for {MONTHS[month-1]} {year}.</div>
                )}
                {alreadyPending && !alreadyVerified && (
                  <div style={{ padding:'11px 14px', background:'#fff3cd', borderRadius:10, marginBottom:14, fontSize:'0.82rem', color:'#856404', fontWeight:600 }}>⏳ Pending submission already exists for {MONTHS[month-1]} {year}.</div>
                )}
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => { setStep(0); setMethod(''); }} style={{ flex:1, padding:'12px', background:'#f8faf6', border:'1.5px solid rgba(26,74,36,0.15)', borderRadius:10, color:'#52695a', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>← Back</button>
                  <button
                    disabled={!!alreadyVerified || !!alreadyPending || Number(amount) < minAmount}
                    onClick={() => setStep(2)}
                    style={{ flex:2, padding:'12px', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.88rem', fontFamily:'Sora,sans-serif', color:'white', cursor:(alreadyVerified||alreadyPending||Number(amount)<minAmount)?'not-allowed':'pointer', background:(alreadyVerified||alreadyPending||Number(amount)<minAmount)?'#ccc':method==='account'?'linear-gradient(135deg,#c9973a,#e8b84b)':'linear-gradient(135deg,#1a4a24,#2d6a3f)' }}>
                    {method === 'account' ? 'View Account Details →' : 'Scan QR Code →'}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2 (QR): QR code ── */}
            {step === 2 && method === 'qr' && (
              <div style={{ textAlign:'center' }}>
                <p style={{ margin:'0 0 16px', fontSize:'0.88rem', color:'#52695a', lineHeight:1.6 }}>
                  Scan the QR code and pay exactly <strong>PKR {Number(amount).toLocaleString()}</strong> for <strong>{MONTHS[month-1]} {year}</strong>.
                </p>
                <div style={{ display:'inline-block', padding:14, background:'white', borderRadius:16, border:'2px solid rgba(26,74,36,0.15)', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', marginBottom:14 }}>
                  <img src="/qr-code.png" alt="Bank QR Code" style={{ width:180, height:180, objectFit:'contain', display:'block' }}
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}/>
                  <div style={{ width:180, height:180, display:'none', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#f8faf6', borderRadius:8, gap:8 }}>
                    <svg width="54" height="54" viewBox="0 0 24 24" fill="none" stroke="#1a4a24" strokeWidth="1.5">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="3" height="3"/>
                      <rect x="19" y="14" width="2" height="2"/><rect x="14" y="19" width="2" height="2"/><rect x="19" y="19" width="2" height="2"/>
                    </svg>
                    <p style={{ margin:0, fontSize:'0.72rem', color:'#8a9e8c', fontWeight:600 }}>Place qr-code.png in<br/>frontend/public/</p>
                  </div>
                </div>
                <div style={{ background:'#e8f5eb', borderRadius:12, padding:'12px 16px', marginBottom:14, display:'inline-block' }}>
                  <div style={{ fontSize:'0.68rem', color:'#52695a', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>Pay exactly</div>
                  <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.5rem', fontWeight:900, color:'#1a4a24' }}>PKR {Number(amount).toLocaleString()}</div>
                  <div style={{ fontSize:'0.75rem', color:'#52695a', marginTop:2 }}>{MONTHS[month-1]} {year}</div>
                </div>
                <div style={{ fontSize:'0.78rem', color:'#856404', background:'#fff3cd', borderRadius:10, padding:'10px 14px', marginBottom:20, textAlign:'left' }}>
                  ⚠️ After paying, tap <strong>"I've Paid"</strong> to notify the admin for verification.
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setStep(1)} style={{ flex:1, padding:'12px', background:'#f8faf6', border:'1.5px solid rgba(26,74,36,0.15)', borderRadius:10, color:'#52695a', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>← Back</button>
                  <button onClick={() => setStep(3)} style={{ flex:2, padding:'12px', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>I've Paid ✓</button>
                </div>
              </div>
            )}

            {/* ── STEP 2 (Account): Account details + upload ── */}
            {step === 2 && method === 'account' && (
              <div>
                <p style={{ margin:'0 0 14px', fontSize:'0.88rem', color:'#52695a', lineHeight:1.6 }}>
                  Transfer <strong>PKR {Number(amount).toLocaleString()}</strong> to the account below, then upload your payment screenshot.
                </p>

                {/* Account card */}
                <div style={{ background:'linear-gradient(135deg,#0f2d15,#1a4a24)', borderRadius:16, padding:'16px 18px', marginBottom:16 }}>
                  <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.45)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>Bank Account Details</div>
                  {[['Bank', BANK.name],['Account Title', BANK.title],['Account No.', BANK.account],['IBAN', BANK.iban]].map(([label, val]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.08)', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.45)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>{label}</span>
                      <span style={{ fontSize:'0.83rem', color:'white', fontWeight:700, fontFamily:label==='Account No.'||label==='IBAN'?'monospace':'Sora,sans-serif', wordBreak:'break-all', textAlign:'right' }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(201,151,58,0.18)', borderRadius:10, border:'1px solid rgba(201,151,58,0.3)' }}>
                    <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.5)', marginBottom:3 }}>Amount to Transfer</div>
                    <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.4rem', fontWeight:900, color:'#c9973a' }}>PKR {Number(amount).toLocaleString()}</div>
                  </div>
                </div>

                {/* Screenshot upload */}
                <div style={{ marginBottom:16 }}>
                  <label style={lbl}>Upload Payment Screenshot *</label>
                  <div style={{ border:`2px dashed ${preview?'#2d6a3f':'rgba(26,74,36,0.25)'}`, borderRadius:12, overflow:'hidden', transition:'border-color 0.2s', position:'relative' }}>
                    {preview ? (
                      <div style={{ position:'relative' }}>
                        <img src={preview} alt="proof" style={{ width:'100%', maxHeight:200, objectFit:'contain', display:'block' }}/>
                        <button onClick={() => { setScreenshot(null); setPreview(''); }}
                          style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', width:28, height:28, color:'white', cursor:'pointer', fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center' }}>×</button>
                      </div>
                    ) : (
                      <label htmlFor="ss-input" style={{ cursor:'pointer', display:'block', padding:'26px 16px', textAlign:'center', background:'#f8faf6' }}>
                        <div style={{ fontSize:'2rem', marginBottom:8 }}>📸</div>
                        <div style={{ fontWeight:700, fontSize:'0.88rem', color:'#1a4a24', marginBottom:4 }}>Tap to upload screenshot</div>
                        <div style={{ fontSize:'0.75rem', color:'#8a9e8c' }}>JPG, PNG or WEBP — max 5 MB</div>
                      </label>
                    )}
                    <input id="ss-input" type="file" accept="image/*" onChange={handleFileChange}
                      style={{ position:'absolute', inset:0, opacity:0, cursor:'pointer', display:preview?'none':'block' }}/>
                  </div>
                </div>

                {error && <div style={{ padding:'10px 13px', background:'#fde8e8', borderRadius:10, marginBottom:14, fontSize:'0.82rem', color:'#c0392b', fontWeight:600 }}>⚠️ {error}</div>}

                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setStep(1)} style={{ flex:1, padding:'12px', background:'#f8faf6', border:'1.5px solid rgba(26,74,36,0.15)', borderRadius:10, color:'#52695a', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>← Back</button>
                  <button disabled={!screenshot} onClick={() => { setError(''); setStep(3); }}
                    style={{ flex:2, padding:'12px', borderRadius:10, border:'none', fontWeight:700, fontSize:'0.88rem', cursor:screenshot?'pointer':'not-allowed', fontFamily:'Sora,sans-serif', color:'white', background:screenshot?'linear-gradient(135deg,#c9973a,#e8b84b)':'#ccc' }}>
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Review & Submit ── */}
            {step === 3 && (
              <div>
                <div style={{ textAlign:'center', marginBottom:16 }}>
                  <div style={{ fontSize:'2.2rem', marginBottom:6 }}>{method === 'account' ? '🏦' : '🎉'}</div>
                  <p style={{ margin:0, fontSize:'0.88rem', color:'#52695a', lineHeight:1.7 }}>Review your details and tap <strong>Submit</strong> to notify the admin.</p>
                </div>
                <div style={{ background:'#f8faf6', borderRadius:14, padding:'14px 16px', marginBottom:14 }}>
                  {[
                    ['Month',  `${MONTHS[month-1]} ${year}`],
                    ['Amount', `PKR ${Number(amount).toLocaleString()}`],
                    ['Method', method === 'account' ? '🏦 Bank Transfer' : '📱 QR Code'],
                    ['Member', user?.fullName],
                    ['Type',   user?.memberType === 'student' ? '🎓 Student' : '💼 Job Holder'],
                    ['Note',   note || '—'],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid rgba(0,0,0,0.05)', gap:8 }}>
                      <span style={{ fontSize:'0.73rem', color:'#8a9e8c', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', flexShrink:0 }}>{label}</span>
                      <span style={{ fontSize:'0.85rem', color:'#0f1a10', fontWeight:600, textAlign:'right', wordBreak:'break-word' }}>{val}</span>
                    </div>
                  ))}
                  {preview && (
                    <div style={{ paddingTop:10, marginTop:4 }}>
                      <div style={{ fontSize:'0.7rem', color:'#8a9e8c', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Screenshot</div>
                      <img src={preview} alt="proof" style={{ width:'100%', maxHeight:120, objectFit:'contain', borderRadius:8, border:'1px solid rgba(0,0,0,0.08)' }}/>
                    </div>
                  )}
                </div>
                {error && <div style={{ padding:'10px 13px', background:'#fde8e8', borderRadius:10, marginBottom:14, fontSize:'0.82rem', color:'#c0392b', fontWeight:600 }}>⚠️ {error}</div>}
                <div style={{ background:'#e8f5eb', borderRadius:10, padding:'10px 14px', marginBottom:18, fontSize:'0.78rem', color:'#155724' }}>
                  ℹ️ Shows as <strong>Pending</strong> until admin verifies — usually within a few hours.
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => setStep(2)} disabled={loading} style={{ flex:1, padding:'12px', background:'#f8faf6', border:'1.5px solid rgba(26,74,36,0.15)', borderRadius:10, color:'#52695a', fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'Sora,sans-serif' }}>← Back</button>
                  <button onClick={handleSubmit} disabled={loading} style={{ flex:2, padding:'12px', background:loading?'#ccc':'linear-gradient(135deg,#1a4a24,#2d6a3f)', color:'white', border:'none', borderRadius:10, fontWeight:700, fontSize:'0.88rem', cursor:loading?'not-allowed':'pointer', fontFamily:'Sora,sans-serif' }}>
                    {loading ? 'Submitting…' : 'Submit Payment ✓'}
                  </button>
                </div>
              </div>
            )}

          </div>{/* end scrollable body */}
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════
   OVERVIEW PAGE
══════════════════════════════════════════════════════ */
function OverviewPage({ stats, myPayments, onNavigate, onPayNow }) {
  const [summary, setSummary] = useState(null);
  const [selYear, setSelYear] = useState(CUR_YEAR);

  useEffect(() => {
    memberAPI.getSummary(selYear).then(r => setSummary(r.data)).catch(() => {});
  }, [selYear]);

  const kpis = [
    { label:'My Total Contributed', value:`PKR ${(stats?.myTotal||0).toLocaleString()}`,    icon:'💰', color:'#1a4a24', bg:'#e8f5eb' },
    { label:'This Month',           value:`PKR ${(stats?.myThisMonth||0).toLocaleString()}`, icon:'📅', color:'#856404', bg:'#fff3cd' },
    { label:'Months Paid',          value: stats?.myPaidMonths ?? '—',                        icon:'✅', color:'#155724', bg:'#d1f0da' },
    { label:'Active Members',       value: stats?.totalMembers ?? '—',                        icon:'👥', color:'#1a4a24', bg:'#e8f5eb', action:() => onNavigate('members') },
  ];

  return (
    <div>
      <div style={{ marginBottom:24, display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.75rem', fontWeight:900, color:'#0f1a10', margin:'0 0 4px' }}>My Dashboard</h1>
          <p style={{ color:'#6b7c6d', fontSize:'0.85rem', margin:0 }}>
            {new Date().toLocaleDateString('en-PK',{ weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
        <button onClick={onPayNow} style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 22px',
          background:'linear-gradient(135deg,#c9973a,#e8b84b)', color:'#0f1a10', border:'none', borderRadius:12,
          fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'Sora,sans-serif',
          boxShadow:'0 4px 16px rgba(201,151,58,0.4)', transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(201,151,58,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 4px 16px rgba(201,151,58,0.4)'; }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Pay Now
        </button>
      </div>

      {stats?.myPending > 0 && (
        <div style={{ background:'#fff3cd', border:'1px solid #f0ad0044', borderRadius:12, padding:'12px 16px', marginBottom:20,
          display:'flex', alignItems:'center', gap:10, fontSize:'0.85rem', color:'#856404' }}>
          <span style={{ fontSize:'1.1rem' }}>⏳</span>
          <span>You have <strong>{stats.myPending}</strong> pending payment{stats.myPending > 1 ? 's' : ''} awaiting admin approval.</span>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:14, marginBottom:24 }}>
        {kpis.map(({ label, value, icon, color, bg, action }) => (
          <div key={label} onClick={action} style={{ background:'white', borderRadius:16, padding:'18px 20px',
            boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)',
            cursor:action?'pointer':'default', position:'relative', overflow:'hidden', transition:'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { if(action){ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(0,0,0,0.1)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 2px 12px rgba(0,0,0,0.06)'; }}>
            <div style={{ position:'absolute', top:0, right:0, width:72, height:72, borderRadius:'0 16px 0 72px', background:bg, opacity:0.6 }}/>
            <div style={{ fontSize:'1.4rem', marginBottom:8 }}>{icon}</div>
            <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.45rem', fontWeight:900, color, lineHeight:1 }}>{value}</div>
            <div style={{ fontSize:'0.73rem', color:'#6b7c6d', marginTop:5, fontWeight:600 }}>{label}</div>
            {action && <div style={{ fontSize:'0.68rem', color, marginTop:3, fontWeight:700 }}>View all →</div>}
          </div>
        ))}
      </div>

      <div className="grid-aside-2col-r" style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:18, marginBottom:18 }}>
        <div style={{ background:'white', borderRadius:16, padding:'22px 24px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
            <div>
              <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'1rem', fontWeight:700, color:'#0f1a10', margin:'0 0 2px' }}>Monthly Collections</h3>
              <p style={{ color:'#8a9e8c', fontSize:'0.73rem', margin:0 }}>Organisation vs my contributions</p>
            </div>
            <select value={selYear} onChange={e => setSelYear(Number(e.target.value))}
              style={{ padding:'7px 12px', border:'1.5px solid rgba(26,74,36,0.15)', borderRadius:8, fontSize:'0.8rem', background:'#f8faf6', color:'#0f1a10', outline:'none', fontFamily:'Sora,sans-serif' }}>
              {[CUR_YEAR, CUR_YEAR-1, CUR_YEAR-2].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {summary
            ? <BarChart months={summary.months} myPayments={myPayments} height={180}/>
            : <div style={{ height:180, display:'flex', alignItems:'center', justifyContent:'center', color:'#8a9e8c', fontSize:'0.85rem' }}>Loading…</div>}
          {summary && (
            <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f0f0f0', display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:'0.78rem', color:'#6b7c6d' }}>Org total {selYear}</span>
              <span style={{ fontFamily:'Fraunces,serif', fontSize:'1.05rem', fontWeight:700, color:'#1a4a24' }}>PKR {summary.grandTotal.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'white', borderRadius:16, padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', alignItems:'center' }}>
            <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'0.9rem', fontWeight:700, color:'#0f1a10', margin:'0 0 14px', alignSelf:'flex-start' }}>Months Paid ({CUR_YEAR})</h3>
            <DonutChart paid={myPayments?.filter(p => p.year === CUR_YEAR && p.status === 'verified').length || 0} total={CUR_MONTH}/>
            <p style={{ fontSize:'0.75rem', color:'#8a9e8c', marginTop:8, textAlign:'center' }}>
              {myPayments?.filter(p => p.year === CUR_YEAR && p.status === 'verified').length || 0} of {CUR_MONTH} months paid
            </p>
          </div>
          <div style={{ background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', borderRadius:16, padding:'18px 20px', boxShadow:'0 4px 20px rgba(26,74,36,0.25)', flex:1 }}>
            <div style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.5)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:6 }}>Org Fund Total</div>
            <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.5rem', fontWeight:900, color:'white' }}>PKR {(stats?.orgTotal||0).toLocaleString()}</div>
            <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.5)', marginBottom:2 }}>This month</div>
              <div style={{ fontFamily:'Fraunces,serif', fontSize:'1rem', fontWeight:700, color:'#c9973a' }}>PKR {(stats?.orgThisMonth||0).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'0.95rem', fontWeight:700, color:'#0f1a10', margin:0 }}>My Recent Payments</h3>
          <button onClick={() => onNavigate('payments')} style={{ background:'none', border:'none', color:'#2d6a3f', fontSize:'0.78rem', fontWeight:700, cursor:'pointer', fontFamily:'Sora,sans-serif' }}>View all →</button>
        </div>
        {!myPayments || myPayments.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center', color:'#8a9e8c' }}>
            <div style={{ fontSize:'2rem', marginBottom:8 }}>💳</div>
            <p style={{ margin:0, fontSize:'0.85rem' }}>No payments recorded yet.</p>
            <button onClick={onPayNow} style={{ marginTop:14, padding:'10px 24px', background:'linear-gradient(135deg,#c9973a,#e8b84b)', color:'#0f1a10', border:'none', borderRadius:10, fontWeight:700, cursor:'pointer', fontFamily:'Sora,sans-serif', fontSize:'0.85rem' }}>
              Make your first payment →
            </button>
          </div>
        ) : (
          myPayments.slice(0,5).map(p => (
            <div key={p._id} style={{ padding:'13px 20px', borderBottom:'1px solid #f8f8f8', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background: p.status === 'pending' ? '#fff3cd' : 'linear-gradient(135deg,#e8f5eb,#d1f0da)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>
                  {p.status === 'pending' ? '⏳' : p.status === 'rejected' ? '❌' : '💳'}
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.85rem', color:'#0f1a10' }}>{MONTHS[p.month-1]} {p.year}</div>
                  <div style={{ fontSize:'0.72rem', color: p.status === 'pending' ? '#856404' : p.status === 'rejected' ? '#c0392b' : '#8a9e8c' }}>
                    {p.status === 'pending' ? 'Awaiting approval' : p.status === 'rejected' ? 'Rejected' : p.note || 'Monthly contribution'}
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'0.95rem', color: p.status === 'pending' ? '#856404' : p.status === 'rejected' ? '#c0392b' : '#1a4a24' }}>
                  PKR {p.amount.toLocaleString()}
                </div>
                <div style={{ fontSize:'0.68rem', color:'#adb5bd', marginTop:2 }}>
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
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.75rem', fontWeight:900, color:'#0f1a10', margin:'0 0 4px' }}>Members Directory</h1>
        <p style={{ color:'#6b7c6d', fontSize:'0.85rem', margin:0 }}>All active members of MUS Welfare Organization.</p>
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        {[['all',`All (${members.length})`,'#1a4a24'],['job_holder',`💼 Job Holders (${members.filter(m=>m.memberType==='job_holder').length})`,'#2d6a3f'],['student',`🎓 Students (${members.filter(m=>m.memberType==='student').length})`,'#856404']].map(([key,label,color])=>(
          <button key={key} onClick={() => setFilter(key)} style={{ padding:'8px 18px', borderRadius:50, border:'none', cursor:'pointer', background:filter===key?color:'white', color:filter===key?'white':'#52695a', fontWeight:700, fontSize:'0.8rem', fontFamily:'Sora,sans-serif', boxShadow:filter===key?`0 4px 12px ${color}44`:'0 1px 4px rgba(0,0,0,0.08)', transition:'all 0.2s' }}>{label}</button>
        ))}
        <div style={{ marginLeft:'auto', position:'relative' }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#8fbc8f', display:'flex', pointerEvents:'none' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search members…" className="search-input-responsive"
          style={{ padding:'9px 14px 9px 34px', border:'1.5px solid rgba(26,74,36,0.15)', borderRadius:10, fontSize:'0.85rem', outline:'none', fontFamily:'Sora,sans-serif', background:'#f8faf6', color:'#0f1a10', width:220 }}/>
        </div>
      </div>

      <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', overflow:'hidden' }}>
        {loading ? (
          <div style={{ padding:60, textAlign:'center', color:'#8a9e8c' }}><div style={{ fontSize:'2rem', marginBottom:8 }}>⏳</div><p style={{ margin:0, fontSize:'0.85rem' }}>Loading…</p></div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:60, textAlign:'center', color:'#8a9e8c' }}><div style={{ fontSize:'2.5rem', marginBottom:8 }}>📭</div><p style={{ margin:0, fontWeight:600 }}>No members found.</p></div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse', width:'100%' }}>
              <thead>
                <tr style={{ background:'#f8faf6' }}>
                  {['Member','Type','Cast / Family','Phone','Joined','Status'].map(h=>(
                    <th key={h} style={{ padding:'14px 24px', textAlign:'left', fontSize:'0.7rem', fontWeight:700, color:'#52695a', letterSpacing:'1px', textTransform:'uppercase', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m._id} style={{ borderBottom:'1px solid #f8f8f8', transition:'background 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='#fafff8'}
                    onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'14px 24px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <Avatar name={m.fullName} size={36}/>
                        <div style={{ minWidth:0 }}>
                          <div style={{ fontWeight:700, fontSize:'0.9rem', color:'#0f1a10' }}>{m.fullName}</div>
                          <div style={{ fontSize:'0.78rem', color:'#8a9e8c' }}>{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'14px 24px', fontSize:'0.85rem', color:'#52695a', whiteSpace:'nowrap' }}>
                      {m.memberType === 'job_holder' ? '💼 Job Holder' : '🎓 Student'}
                    </td>
                    <td style={{ padding:'14px 24px', fontSize:'0.85rem', color:'#52695a' }}>{m.castFamily || '—'}</td>
                    <td style={{ padding:'14px 24px', fontSize:'0.85rem', color:'#52695a', whiteSpace:'nowrap' }}>{m.phone || '—'}</td>
                    <td style={{ padding:'14px 24px', fontSize:'0.85rem', color:'#8a9e8c', whiteSpace:'nowrap' }}>
                      {new Date(m.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}
                    </td>
                    <td style={{ padding:'14px 24px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 14px', borderRadius:50, fontSize:'0.78rem', fontWeight:700, background: m.isActive === false ? '#fde8e8' : '#d1f0da', color: m.isActive === false ? '#721c24' : '#155724' }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background: m.isActive === false ? '#c0392b' : '#1a4a24' }}/>
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
function PaymentsPage({ myPayments, loadingMine, showToast, onPayNow }) {
  const [tab,         setTab]         = useState('mine');
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

  return (
    <div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.75rem', fontWeight:900, color:'#0f1a10', margin:'0 0 4px' }}>Payments</h1>
          <p style={{ color:'#6b7c6d', fontSize:'0.85rem', margin:0 }}>Track your contributions and the organisation's fund.</p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <select value={selYear} onChange={e=>setSelYear(Number(e.target.value))}
            style={{ padding:'10px 16px', border:'1.5px solid rgba(26,74,36,0.15)', borderRadius:10, fontSize:'0.85rem', background:'#f8faf6', color:'#0f1a10', outline:'none', fontFamily:'Sora,sans-serif', fontWeight:600 }}>
            {[CUR_YEAR, CUR_YEAR-1, CUR_YEAR-2].map(y=><option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={onPayNow} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px',
            background:'linear-gradient(135deg,#c9973a,#e8b84b)', color:'#0f1a10', border:'none', borderRadius:10,
            fontWeight:700, fontSize:'0.85rem', cursor:'pointer', fontFamily:'Sora,sans-serif',
            boxShadow:'0 3px 12px rgba(201,151,58,0.35)' }}>
            💳 Pay Now
          </button>
        </div>
      </div>

      {pendingPayments.length > 0 && (
        <div style={{ background:'#fff3cd', border:'1px solid #f0ad0044', borderRadius:12, padding:'12px 16px', marginBottom:20, fontSize:'0.85rem', color:'#856404', display:'flex', alignItems:'center', gap:8 }}>
          <span>⏳</span>
          <span><strong>{pendingPayments.length}</strong> payment(s) pending admin verification — {pendingPayments.map(p=>`${MONTHS[p.month-1]} ${p.year}`).join(', ')}</span>
        </div>
      )}

      <div style={{ display:'flex', gap:4, marginBottom:20, background:'white', borderRadius:12, padding:4, width:'fit-content', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
        {[['mine','My Payments'],['org','Organisation']].map(([key,label])=>(
          <button key={key} onClick={()=>setTab(key)} style={{ padding:'9px 22px', borderRadius:9, border:'none', cursor:'pointer', background:tab===key?'linear-gradient(135deg,#1a4a24,#2d6a3f)':'transparent', color:tab===key?'white':'#52695a', fontWeight:700, fontSize:'0.83rem', fontFamily:'Sora,sans-serif', transition:'all 0.2s', boxShadow:tab===key?'0 2px 8px rgba(26,74,36,0.25)':'none' }}>{label}</button>
        ))}
      </div>

      {tab === 'mine' && (
        <div>
          <div style={{ background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', borderRadius:16, padding:'18px 24px', marginBottom:20, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:4 }}>My Total — {selYear}</div>
              <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.8rem', fontWeight:900, color:'white' }}>PKR {myYearTotal.toLocaleString()}</div>
            </div>
            <div style={{ display:'flex', gap:16 }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.4rem', fontWeight:700, color:'#c9973a' }}>{verifiedPayments.filter(p=>p.year===selYear).length}</div>
                <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'1px' }}>Months Paid</div>
              </div>
              {pendingPayments.filter(p=>p.year===selYear).length > 0 && (
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.4rem', fontWeight:700, color:'#e8b84b' }}>{pendingPayments.filter(p=>p.year===selYear).length}</div>
                  <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.5)', textTransform:'uppercase', letterSpacing:'1px' }}>Pending</div>
                </div>
              )}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:10, marginBottom:20 }}>
            {myGrid.map(({ month, label, verified, pending }) => {
              const isCur  = month === CUR_MONTH && selYear === CUR_YEAR;
              const isPast = selYear < CUR_YEAR || (selYear === CUR_YEAR && month < CUR_MONTH);
              return (
                <div key={month} style={{ background: verified ? 'linear-gradient(135deg,#e8f5eb,#d1f0da)' : pending ? '#fff8e6' : isCur ? '#fff8e6' : 'white',
                  border: verified ? '1.5px solid #28a74544' : pending ? '1.5px solid #c9973a88' : isCur ? '1.5px solid #c9973a44' : '1.5px solid rgba(0,0,0,0.07)',
                  borderRadius:12, padding:'14px 12px', textAlign:'center', transition:'transform 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'}
                  onMouseLeave={e=>e.currentTarget.style.transform=''}>
                  <div style={{ fontSize:'1.2rem', marginBottom:4 }}>
                    {verified ? '✅' : pending ? '⏳' : isCur ? '📅' : isPast ? '❌' : '○'}
                  </div>
                  <div style={{ fontWeight:700, fontSize:'0.82rem', color:'#0f1a10' }}>{label}</div>
                  {verified ? (
                    <div style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'0.85rem', color:'#155724', marginTop:3 }}>PKR {verified.amount.toLocaleString()}</div>
                  ) : pending ? (
                    <div style={{ fontSize:'0.72rem', color:'#856404', marginTop:3, fontWeight:700 }}>Pending</div>
                  ) : (
                    <div style={{ fontSize:'0.72rem', color:isCur?'#c9973a':isPast?'#dc3545':'#adb5bd', marginTop:3, fontWeight:600 }}>
                      {isCur ? 'Due now' : isPast ? 'Missed' : 'Upcoming'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0' }}>
              <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'0.95rem', fontWeight:700, color:'#0f1a10', margin:0 }}>Payment History</h3>
            </div>
            {loadingMine ? (
              <div style={{ padding:40, textAlign:'center', color:'#8a9e8c', fontSize:'0.85rem' }}>Loading…</div>
            ) : myPayments?.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#8a9e8c' }}>
                <div style={{ fontSize:'2rem', marginBottom:8 }}>💳</div>
                <p style={{ margin:0, fontSize:'0.85rem' }}>No payments yet.</p>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ borderCollapse:'collapse', width:'100%' }}>
                  <thead>
                    <tr style={{ background:'#f8faf6' }}>
                      {['Month','Amount (PKR)','Status','Note','Date'].map(h=>(
                        <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'0.68rem', fontWeight:700, color:'#52695a', letterSpacing:'0.8px', textTransform:'uppercase', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {myPayments.map(p => (
                      <tr key={p._id} style={{ borderBottom:'1px solid #f8f8f8', transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#fafff8'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'12px 16px', fontWeight:700, fontSize:'0.85rem', color:'#1a4a24' }}>{MONTHS[p.month-1]} {p.year}</td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'0.95rem', color:'#1a4a24' }}>{p.amount.toLocaleString()}</span>
                        </td>
                        <td style={{ padding:'12px 16px' }}>
                          <span style={{ padding:'3px 10px', borderRadius:50, fontSize:'0.7rem', fontWeight:700,
                            background: p.status==='verified'?'#d1f0da':p.status==='pending'?'#fff3cd':'#fde8e8',
                            color: p.status==='verified'?'#155724':p.status==='pending'?'#856404':'#721c24' }}>
                            {p.status==='verified'?'✅ Verified':p.status==='pending'?'⏳ Pending':'❌ Rejected'}
                          </span>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'0.78rem', color:'#6b7c6d' }}>{p.note || '—'}</td>
                        <td style={{ padding:'12px 16px', fontSize:'0.75rem', color:'#8a9e8c', whiteSpace:'nowrap' }}>
                          {new Date(p.createdAt).toLocaleDateString('en-PK',{ day:'numeric', month:'short', year:'numeric' })}
                        </td>
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
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginBottom:20 }}>
            {[
              { label:`Total ${selYear}`, value:`PKR ${orgYearTotal.toLocaleString()}`, color:'#1a4a24', bg:'#e8f5eb' },
              { label:'Payments Count',  value:orgPayments.length,                       color:'#2d6a3f', bg:'#f0f9f2' },
              { label:'Avg per Payment', value:orgPayments.length?`PKR ${Math.round(orgYearTotal/orgPayments.length).toLocaleString()}`:'—', color:'#856404', bg:'#fff3cd' },
            ].map(({ label, value, color, bg })=>(
              <div key={label} style={{ background:'white', borderRadius:14, padding:'16px 18px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.05)', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, right:0, width:60, height:60, borderRadius:'0 14px 0 60px', background:bg, opacity:0.6 }}/>
                <div style={{ fontFamily:'Fraunces,serif', fontSize:'1.3rem', fontWeight:900, color, lineHeight:1 }}>{value}</div>
                <div style={{ fontSize:'0.72rem', color:'#6b7c6d', marginTop:5, fontWeight:600 }}>{label}</div>
              </div>
            ))}
          </div>
          {summary && (
            <div style={{ background:'white', borderRadius:16, padding:'20px 24px', marginBottom:20, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'0.95rem', fontWeight:700, color:'#0f1a10', margin:'0 0 16px' }}>Monthly Breakdown</h3>
              <BarChart months={summary.months} myPayments={myPayments} height={140}/>
            </div>
          )}
          <div style={{ background:'white', borderRadius:16, boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)', overflow:'hidden' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0' }}>
              <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'0.95rem', fontWeight:700, color:'#0f1a10', margin:0 }}>
                All Payments <span style={{ fontFamily:'Sora,sans-serif', fontWeight:500, fontSize:'0.78rem', color:'#8a9e8c' }}>({orgPayments.length})</span>
              </h3>
            </div>
            {loadingOrg ? (
              <div style={{ padding:40, textAlign:'center', color:'#8a9e8c', fontSize:'0.85rem' }}>Loading…</div>
            ) : orgPayments.length === 0 ? (
              <div style={{ padding:40, textAlign:'center', color:'#8a9e8c' }}>
                <div style={{ fontSize:'2rem', marginBottom:8 }}>📭</div>
                <p style={{ margin:0, fontSize:'0.85rem' }}>No payments for {selYear}.</p>
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ borderCollapse:'collapse', width:'100%' }}>
                  <thead>
                    <tr style={{ background:'#f8faf6' }}>
                      {['Member','Type','Month / Year','Amount (PKR)','Note'].map(h=>(
                        <th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:'0.68rem', fontWeight:700, color:'#52695a', letterSpacing:'0.8px', textTransform:'uppercase', borderBottom:'1px solid #f0f0f0', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orgPayments.map(p=>(
                      <tr key={p._id} style={{ borderBottom:'1px solid #f8f8f8', transition:'background 0.15s' }}
                        onMouseEnter={e=>e.currentTarget.style.background='#fafff8'}
                        onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                        <td style={{ padding:'12px 16px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <Avatar name={p.member?.fullName} size={28}/>
                            <span style={{ fontWeight:600, fontSize:'0.85rem', color:'#0f1a10' }}>{p.member?.fullName}</span>
                          </div>
                        </td>
                        <td style={{ padding:'12px 16px', fontSize:'0.8rem', color:'#52695a', whiteSpace:'nowrap' }}>{p.member?.memberType==='job_holder'?'💼 Job Holder':'🎓 Student'}</td>
                        <td style={{ padding:'12px 16px', fontWeight:700, fontSize:'0.85rem', color:'#1a4a24', whiteSpace:'nowrap' }}>{MONTHS[p.month-1]} {p.year}</td>
                        <td style={{ padding:'12px 16px' }}><span style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'0.95rem', color:'#1a4a24' }}>{p.amount.toLocaleString()}</span></td>
                        <td style={{ padding:'12px 16px', fontSize:'0.78rem', color:'#6b7c6d' }}>{p.note||'—'}</td>
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
  general: { label:'General',  color:'#1a4a24', bg:'#d1f0da', icon:'📢' },
  meeting: { label:'Meeting',  color:'#1a237e', bg:'#e8eaf6', icon:'📅' },
  urgent:  { label:'Urgent',   color:'#b71c1c', bg:'#fde8e8', icon:'🚨' },
  event:   { label:'Event',    color:'#e65100', bg:'#fff3e0', icon:'🎉' },
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
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'Fraunces,serif', fontSize:'1.75rem', fontWeight:900, color:'#0f1a10', margin:'0 0 4px' }}>Announcements</h1>
        <p style={{ color:'#6b7c6d', fontSize:'0.85rem', margin:0 }}>Notices and updates from the MUS Welfare committee.</p>
      </div>

      {loading ? (
        <div style={{ padding:60, textAlign:'center', color:'#8a9e8c' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:8 }}>📢</div>
          <p style={{ margin:0, fontSize:'0.85rem' }}>Loading…</p>
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ background:'white', borderRadius:16, padding:60, textAlign:'center', color:'#8a9e8c', boxShadow:'0 2px 12px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize:'3rem', marginBottom:12 }}>📭</div>
          <p style={{ margin:0, fontWeight:600, fontSize:'0.95rem', color:'#52695a' }}>No announcements yet.</p>
          <p style={{ margin:'6px 0 0', fontSize:'0.8rem' }}>Check back later for updates from the committee.</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {announcements.map(a => {
            const meta = CATEGORY_META_M[a.category] || CATEGORY_META_M.general;
            return (
              <div key={a._id} style={{
                background:'white', borderRadius:16, overflow:'hidden',
                boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.04)',
                borderLeft: `4px solid ${meta.color}`,
              }}>
                <div style={{ padding:'20px 24px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap' }}>
                    {a.pinned && (
                      <span style={{ fontSize:'0.65rem', fontWeight:700, background:'#fff3cd', color:'#856404', padding:'2px 8px', borderRadius:50 }}>📌 PINNED</span>
                    )}
                    <span style={{ fontSize:'0.65rem', fontWeight:700, background:meta.bg, color:meta.color, padding:'2px 8px', borderRadius:50 }}>
                      {meta.icon} {meta.label.toUpperCase()}
                    </span>
                    <span style={{ fontSize:'0.7rem', color:'#aaa', marginLeft:'auto' }}>
                      {new Date(a.createdAt).toLocaleDateString('en-PK', { day:'numeric', month:'long', year:'numeric' })}
                    </span>
                  </div>
                  <h3 style={{ fontFamily:'Fraunces,serif', fontSize:'1.1rem', fontWeight:800, color:'#0f1a10', margin:'0 0 10px' }}>{a.title}</h3>
                  <p style={{ fontSize:'0.85rem', color:'#52695a', margin:0, lineHeight:1.7, whiteSpace:'pre-wrap' }}>{a.body}</p>
                  {a.meetingLink && (
                    <div style={{ marginTop:16, padding:'14px 18px', background:'linear-gradient(135deg,#e8f5e9,#f1f8e9)', borderRadius:12, border:'1px solid rgba(26,74,36,0.12)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'0.75rem', fontWeight:700, color:'#1a4a24', marginBottom:4 }}>📅 Google Meet Invitation</div>
                          {a.meetingDate && (
                            <div style={{ fontSize:'0.8rem', color:'#2d6a3f', fontWeight:600, marginBottom:4 }}>
                              🗓 {new Date(a.meetingDate).toLocaleString('en-PK', { weekday:'long', day:'numeric', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}
                            </div>
                          )}
                          {a.meetingNote && <div style={{ fontSize:'0.78rem', color:'#52695a', marginBottom:8 }}>{a.meetingNote}</div>}
                          <div style={{ fontSize:'0.72rem', color:'#8a9e8c', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.meetingLink}</div>
                        </div>
                        <a href={a.meetingLink} target="_blank" rel="noopener noreferrer"
                          style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', background:'linear-gradient(135deg,#1a4a24,#2d6a3f)', color:'white', borderRadius:10, textDecoration:'none', fontFamily:'Sora,sans-serif', fontWeight:700, fontSize:'0.83rem', boxShadow:'0 4px 12px rgba(26,74,36,0.3)', flexShrink:0 }}>
                          📹 Join Meeting
                        </a>
                      </div>
                    </div>
                  )}
                </div>
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

  const [page,        setPage]        = useState('overview');
  const [stats,       setStats]       = useState(null);
  const [myPayments,  setMyPayments]  = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [toast,       setToast]       = useState(null);
  const [sideOpen,    setSideOpen]    = useState(true);
  const [showPayNow,  setShowPayNow]  = useState(false);

  const showToast = useCallback((msg, type='success') => setToast({ message:msg, type }), []);

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

  const handlePaySuccess = useCallback(() => {
    showToast('Payment submitted! Admin will verify it shortly.', 'success');
    fetchStats();
    fetchMyPayments();
  }, [showToast, fetchStats, fetchMyPayments]);

  const navItems = [
    { key:'overview', label:'Overview', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { key:'members',  label:'Members',  icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { key:'payments', label:'Payments', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
    { key:'paynow',        label:'Pay Now',       icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>, gold:true },
    { key:'announcements', label:'Announcements', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 20V4l-10 4L2 4v16l10-4 10 4z"/></svg> },
    { key:'family-tree', label:'Family Tree', icon:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="6" x2="6" y2="12"/><line x1="12" y1="6" x2="18" y2="12"/><circle cx="12" cy="2" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/></svg> },
  ];

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f2f5f2', fontFamily:'Sora,sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=Fraunces:ital,wght@0,700;0,900;1,700;1,900&display=swap');
        *{box-sizing:border-box}
        select,input{font-family:Sora,sans-serif!important}
        @media(max-width:768px){
          .mem-sidebar{width:60px!important}
          .mem-sidebar .side-label{display:none!important}
          .mem-sidebar .side-user{display:none!important}
          .mem-sidebar .side-collapse{display:none!important}
          .mem-main{padding:20px 16px!important}
        }
        @media(max-width:600px){
          .mem-main{padding:16px 12px!important}
          .grid-aside-2col-r{grid-template-columns:1fr!important}
        }
        @media(max-width:480px){
          .search-input-responsive{width:160px!important}
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className="mem-sidebar" style={{ width:sideOpen?230:64, background:'linear-gradient(180deg,#081a0c 0%,#0f2d15 40%,#1a4a24 100%)', display:'flex', flexDirection:'column', transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)', overflow:'hidden', flexShrink:0, position:'sticky', top:0, alignSelf:'stretch', minHeight:'100vh', boxShadow:'4px 0 24px rgba(0,0,0,0.12)' }}>

        <div style={{ padding:sideOpen?'22px 18px 18px':'22px 14px 18px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(255,255,255,0.18)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="19" height="19" viewBox="0 0 60 60"><path d="M10 42 Q7 25 22 14 Q30 8 40 13 L36 20 Q28 11 20 20 Q7 30 15 44Z" fill="white"/><path d="M50 18 Q53 35 38 46 Q30 52 20 47 L24 40 Q32 49 40 40 Q53 30 45 16Z" fill="#8fbc8f"/><ellipse cx="30" cy="32" rx="9" ry="6" fill="#c9973a"/></svg>
          </div>
          {sideOpen && (
            <div className="side-label" style={{ overflow:'hidden' }}>
              <div style={{ fontFamily:'Fraunces,serif', fontWeight:700, fontSize:'0.9rem', color:'white', lineHeight:1.1, whiteSpace:'nowrap' }}>MUS Welfare</div>
              <div style={{ fontSize:'0.55rem', color:'rgba(255,255,255,0.35)', letterSpacing:'2px', textTransform:'uppercase', marginTop:2 }}>Member Portal</div>
            </div>
          )}
        </div>

        <nav style={{ flex:1, padding:'14px 8px', display:'flex', flexDirection:'column', gap:3 }}>
          {navItems.map(({ key, label, icon, gold }) => {
            const active = page === key;
            return (
              <button key={key} onClick={() => { if(key === 'paynow') { setShowPayNow(true); } else { setPage(key); } }}
                style={{ display:'flex', alignItems:'center', gap:10,
                  padding:sideOpen?'10px 13px':'10px',
                  justifyContent:sideOpen?'flex-start':'center',
                  borderRadius:9, border:'none', cursor:'pointer',
                  background: gold ? 'rgba(201,151,58,0.18)' : active ? 'rgba(255,255,255,0.12)' : 'transparent',
                  color: gold ? '#c9973a' : active ? 'white' : 'rgba(255,255,255,0.52)',
                  fontFamily:'Sora,sans-serif', fontWeight: gold || active ? 700 : 500,
                  fontSize:'0.84rem', transition:'all 0.15s', position:'relative' }}
                onMouseEnter={e => { if(!active && !gold) { e.currentTarget.style.background='rgba(255,255,255,0.07)'; e.currentTarget.style.color='white'; } if(gold) e.currentTarget.style.background='rgba(201,151,58,0.28)'; }}
                onMouseLeave={e => { if(!active && !gold) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.52)'; } if(gold) e.currentTarget.style.background='rgba(201,151,58,0.18)'; }}>
                {active && !gold && <span style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, background:'#c9973a', borderRadius:'0 3px 3px 0' }}/>}
                <span style={{ flexShrink:0 }}>{icon}</span>
                {sideOpen && <span className="side-label" style={{ whiteSpace:'nowrap' }}>{label}</span>}
              </button>
            );
          })}
        </nav>

        <div style={{ padding:'10px 8px', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          {sideOpen && (
            <div className="side-user" style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 11px', borderRadius:9, background:'rgba(255,255,255,0.06)', marginBottom:6 }}>
              <Avatar name={user?.fullName} size={28}/>
              <div style={{ overflow:'hidden', flex:1 }}>
                <div style={{ fontSize:'0.78rem', fontWeight:600, color:'white', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.fullName}</div>
                <div style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', letterSpacing:'1px', textTransform:'uppercase' }}>
                  {user?.memberType === 'job_holder' ? 'Job Holder' : 'Student'}
                </div>
              </div>
            </div>
          )}
          <button className="side-collapse" onClick={() => setSideOpen(v => !v)} style={{ width:'100%', padding:'8px', background:'rgba(255,255,255,0.06)', border:'none', borderRadius:7, color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:'0.73rem', fontFamily:'Sora,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'background 0.15s', marginBottom:5 }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
            {sideOpen ? '← Collapse' : '→'}
          </button>
          <button onClick={logout} style={{ width:'100%', padding:'8px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:7, color:'rgba(255,255,255,0.42)', cursor:'pointer', fontSize:'0.73rem', fontFamily:'Sora,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:5, transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(220,53,69,0.15)';e.currentTarget.style.color='#ff6b6b';e.currentTarget.style.borderColor='rgba(220,53,69,0.3)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,255,255,0.42)';e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {sideOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="mem-main" style={{ flex:1, minHeight:0, padding:'28px 32px', overflowY:'auto', minWidth:0 }}>
        {page === 'overview' && (
          <OverviewPage stats={stats} myPayments={myPayments} onNavigate={setPage} onPayNow={() => setShowPayNow(true)}/>
        )}
        {page === 'members'  && <MembersPage/>}
        {page === 'payments' && (
          <PaymentsPage myPayments={myPayments} loadingMine={loadingMine} showToast={showToast} onPayNow={() => setShowPayNow(true)}/>
        )}
        {page === 'announcements' && <AnnouncementsPage/>}
        {page === 'family-tree' && <FamilyTreePage isAdmin={false} showToast={showToast}/>}
      </main>

      {/* ── Pay Now Modal ── */}
      {showPayNow && (
        <PayNowModal user={user} myPayments={myPayments} onClose={() => setShowPayNow(false)} onSuccess={handlePaySuccess}/>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  );
}
