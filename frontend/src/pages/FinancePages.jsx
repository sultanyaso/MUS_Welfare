import { useState, useEffect, useCallback } from 'react';
import { financeAPI } from '../api';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PKR = n => `PKR ${Number(n || 0).toLocaleString('en-PK')}`;
const methodLabel = m => (m === 'account' ? 'Bank Transfer' : 'QR Code');
const methodIcon  = m => (m === 'account' ? '🏦' : '📱');
const STATUS_CHIP = { verified: 'ok', pending: 'warn', rejected: 'bad' };

// 'YYYY-MM-DD' <-> display, without any timezone shifting
const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const showYmd = s => { const [y, m, d] = s.split('-'); return `${d} ${MONTHS[+m - 1]} ${y}`; };
const showDate = iso => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Karachi' });

/* Styles that only the Finance pages need — they use the dashboard's existing theme variables */
export const FIN_CSS = `
.fin-pcard{display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:16px 20px;margin-bottom:12px}
.fin-who{display:flex;align-items:center;gap:12px;flex:1;min-width:200px}
.fin-av{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:.85rem;background:rgba(var(--accent-rgb),.12);color:var(--accent-text);border:1px solid rgba(var(--accent-rgb),.25);flex-shrink:0}
.fin-amt{font-family:var(--display);font-weight:800;font-size:1.05rem;color:var(--accent-text)}
.fin-sub{font-size:.74rem;color:var(--muted);margin-top:2px}
.fin-kv{font-size:.62rem;letter-spacing:.12em;text-transform:uppercase;color:var(--dim);font-weight:700;margin-bottom:4px}
.fin-filters{display:flex;gap:14px;flex-wrap:wrap;align-items:flex-end;padding:18px 20px}
.fin-filters>div{min-width:150px}
.fin-filters .inp,.fin-filters .sel{width:100%}
.fin-two{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
.fin-link{color:var(--accent-text);font-size:.78rem;font-weight:600;text-decoration:none}
.fin-link:hover{text-decoration:underline}
.fin-danger{background:var(--bad-bg);color:var(--bad);border-color:rgba(255,143,134,.3)}
.fin-danger:hover:not(:disabled){filter:brightness(1.15)}
.fin-ok{background:var(--accent);color:var(--accent-ink)}
@media(max-width:560px){.fin-two{grid-template-columns:1fr}.fin-filters>div{flex:1 1 100%}}
`;

function initials(n = '') { return n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'; }

/* ═══════════════════════════════════════════════
   VERIFY PAYMENTS
═══════════════════════════════════════════════ */
export function VerifyPaymentsPage({ showToast, onChanged }) {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [note,     setNote]     = useState('');
  const [busy,     setBusy]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await financeAPI.getPendingPayments();
      setPayments(data.payments);
    } catch { showToast('Failed to load pending payments.', 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const close = () => { setSelected(null); setNote(''); };

  const act = async (id, action) => {
    setBusy(id + action);
    try {
      const res = action === 'approve' ? await financeAPI.approvePayment(id, note) : await financeAPI.rejectPayment(id, note);
      showToast(res.data.message, 'success');
      close();
      load();
      onChanged?.();
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed.', 'error');
    } finally { setBusy(''); }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Verify Payments</h1>
          <p className="page-sub">Review member-submitted payment proofs and approve or reject them.</p>
        </div>
        <button className="btn btn-ghost" onClick={load}>↻ Refresh</button>
      </div>

      {loading ? (
        <div className="empty"><div className="empty-ico">⏳</div>Loading pending payments…</div>
      ) : payments.length === 0 ? (
        <div className="card empty">
          <div className="empty-ico">🎉</div>
          <strong style={{ color: 'var(--text)' }}>No pending payments to review!</strong><br/>All submissions have been processed.
        </div>
      ) : payments.map(p => (
        <div key={p._id} className="card fin-pcard">
          <div className="fin-who">
            <div className="fin-av">{initials(p.member?.fullName)}</div>
            <div style={{ minWidth: 0 }}>
              <div className="t-strong">{p.member?.fullName}</div>
              <div className="fin-sub">{p.member?.email}</div>
              <div className="fin-sub">{p.member?.memberType === 'job_holder' ? '💼 Job Holder' : '🎓 Student'} · {p.member?.castFamily || '—'}</div>
            </div>
          </div>
          <div>
            <div className="fin-amt">{PKR(p.amount)}</div>
            <div className="fin-sub">{MONTHS[(p.month || 1) - 1]} {p.year}</div>
          </div>
          <div style={{ minWidth: 120 }}>
            <div style={{ fontSize: '.8rem', color: 'var(--text)' }}>{methodIcon(p.paymentMethod)} {methodLabel(p.paymentMethod)}</div>
            {p.screenshotFullUrl && <a className="fin-link" href={p.screenshotFullUrl} target="_blank" rel="noopener noreferrer">View screenshot ↗</a>}
          </div>
          <div style={{ minWidth: 80 }}>
            <div className="fin-kv">Submitted</div>
            <div style={{ fontSize: '.82rem' }}>{showDate(p.createdAt)}</div>
          </div>
          <button className="btn btn-accent" style={{ height: 38 }} onClick={() => { setSelected(p); setNote(''); }}>Review</button>
        </div>
      ))}

      {selected && (
        <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && close()}>
          <div className="modal-card" role="dialog" aria-modal="true" aria-label="Review payment">
            <div className="modal-head">
              <strong style={{ fontFamily: 'var(--display)' }}>Review Payment</strong>
              <button className="icon-btn" onClick={close} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              <div className="t-strong">{selected.member?.fullName}</div>
              <div className="fin-sub" style={{ marginBottom: 16 }}>{selected.member?.email}</div>
              <div className="fin-two">
                {[['Amount', PKR(selected.amount)], ['Period', `${MONTHS[(selected.month || 1) - 1]} ${selected.year}`],
                  ['Method', methodLabel(selected.paymentMethod)], ['Member note', selected.note || '—']].map(([k, v]) => (
                  <div key={k}><div className="fin-kv">{k}</div><div style={{ fontSize: '.86rem', color: 'var(--text)' }}>{v}</div></div>
                ))}
              </div>
              {selected.screenshotFullUrl && (
                <a href={selected.screenshotFullUrl} target="_blank" rel="noopener noreferrer">
                  <img src={selected.screenshotFullUrl} alt="Payment proof"
                    style={{ width: '100%', maxHeight: 220, objectFit: 'contain', borderRadius: 10, border: '1px solid var(--line2)', background: '#050506', marginBottom: 16 }}
                    onError={e => { e.target.style.display = 'none'; }} />
                </a>
              )}
              <label className="field-lbl">Note (optional)</label>
              <input className="inp" value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. Matched with bank statement" style={{ marginBottom: 16 }} />
              <div className="row-btns">
                <button className="btn btn-ghost" onClick={close}>Cancel</button>
                <button className="btn fin-danger" style={{ flex: 1 }} disabled={!!busy} onClick={() => act(selected._id, 'reject')}>
                  {busy === selected._id + 'reject' ? 'Rejecting…' : 'Reject'}
                </button>
                <button className="btn fin-ok" style={{ flex: 2 }} disabled={!!busy} onClick={() => act(selected._id, 'approve')}>
                  {busy === selected._id + 'approve' ? 'Approving…' : '✓ Approve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PAYMENT REPORT  (date range → preview → PDF)
═══════════════════════════════════════════════ */
async function buildPdf(report, generatedBy) {
  // Loaded on demand so the PDF library doesn't slow down the rest of the app
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const { from, to, status, payments, totals } = report;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text('MUS Welfare Organization', 40, 46);
  doc.setFontSize(13); doc.setTextColor(60);
  doc.text('Payment Report', 40, 66);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90);
  doc.text(`Period: ${showYmd(from)}  to  ${showYmd(to)}`, 40, 88);
  doc.text(`Status: ${status === 'all' ? 'All' : status[0].toUpperCase() + status.slice(1)}`, 40, 102);
  const stamp = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'short' });
  doc.text(`Generated: ${stamp}`, W - 40, 88, { align: 'right' });
  doc.text(`By: ${generatedBy || '-'} (Finance Secretary)`, W - 40, 102, { align: 'right' });

  // Summary
  autoTable(doc, {
    startY: 116,
    head: [['Total records', 'Total amount', 'Verified', 'Pending', 'Rejected', 'QR amount', 'Bank transfer']],
    body: [[
      totals.count, PKR(totals.amount),
      `${totals.verifiedCount} / ${PKR(totals.verifiedAmount)}`,
      `${totals.pendingCount} / ${PKR(totals.pendingAmount)}`,
      `${totals.rejectedCount} / ${PKR(totals.rejectedAmount)}`,
      PKR(totals.qrAmount), PKR(totals.accountAmount),
    ]],
    styles: { fontSize: 9, halign: 'center' },
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: 40, right: 40 },
  });

  const rows = payments.map((p, i) => [
    i + 1,
    showDate(p.createdAt),
    p.member?.fullName || '(deleted member)',
    p.member?.memberType === 'job_holder' ? 'Job Holder' : p.member?.memberType === 'student' ? 'Student' : '-',
    p.member?.castFamily || '-',
    `${MONTHS[(p.month || 1) - 1]} ${p.year}`,
    methodLabel(p.paymentMethod),
    p.status[0].toUpperCase() + p.status.slice(1),
    p.recordedBy?.fullName || '-',
    Number(p.amount).toLocaleString('en-PK'),
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 16,
    head: [['#', 'Date', 'Member', 'Type', 'Family', 'For month', 'Method', 'Status', 'Verified by', 'Amount (PKR)']],
    body: rows.length ? rows : [[{ content: 'No payments found for this period.', colSpan: 10, styles: { halign: 'center' } }]],
    foot: rows.length ? [[{ content: 'TOTAL', colSpan: 9, styles: { halign: 'right' } }, totals.amount.toLocaleString('en-PK')]] : undefined,
    styles: { fontSize: 8.5, cellPadding: 4 },
    headStyles: { fillColor: [30, 41, 59] },
    footStyles: { fillColor: [226, 232, 240], textColor: 20, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 26 }, 9: { halign: 'right' } },
    alternateRowStyles: { fillColor: [247, 248, 250] },
    margin: { left: 40, right: 40, bottom: 40 },
  });

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(130);
    doc.text(`MUS Welfare - Payment Report ${from} to ${to}`, 40, H - 20);
    doc.text(`Page ${i} of ${pages}`, W - 40, H - 20, { align: 'right' });
  }
  doc.save(`MUS-Payment-Report_${from}_to_${to}.pdf`);
}

export function PaymentReportPage({ showToast, user }) {
  const today = new Date();
  const [from,    setFrom]    = useState(ymd(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [to,      setTo]      = useState(ymd(today));
  const [status,  setStatus]  = useState('verified');
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const preset = key => {
    const y = today.getFullYear(), m = today.getMonth();
    if (key === 'month')  { setFrom(ymd(new Date(y, m, 1)));     setTo(ymd(today)); }
    if (key === 'last')   { setFrom(ymd(new Date(y, m - 1, 1))); setTo(ymd(new Date(y, m, 0))); }
    if (key === 'year')   { setFrom(ymd(new Date(y, 0, 1)));     setTo(ymd(today)); }
  };

  const generate = async () => {
    if (!from || !to) return showToast('Please choose both dates.', 'error');
    if (from > to)    return showToast('"From" date must be before "To" date.', 'error');
    setLoading(true);
    try {
      const { data } = await financeAPI.getReport({ from, to, status });
      setReport(data);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to generate report.', 'error');
    } finally { setLoading(false); }
  };

  const download = async () => {
    setPdfBusy(true);
    try { await buildPdf(report, user?.fullName); showToast('PDF downloaded.', 'success'); }
    catch (e) { console.error(e); showToast('Could not create the PDF.', 'error'); }
    finally { setPdfBusy(false); }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Payment Report</h1>
          <p className="page-sub">Choose a date range, preview the payments and download them as a PDF.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="fin-filters">
          <div><label className="field-lbl">From date</label><input className="inp" type="date" value={from} max={to || undefined} onChange={e => setFrom(e.target.value)} /></div>
          <div><label className="field-lbl">To date</label><input className="inp" type="date" value={to} min={from || undefined} onChange={e => setTo(e.target.value)} /></div>
          <div>
            <label className="field-lbl">Status</label>
            <select className="sel" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="verified">Verified only</option>
              <option value="pending">Pending only</option>
              <option value="rejected">Rejected only</option>
              <option value="all">All statuses</option>
            </select>
          </div>
          <button className="btn btn-accent" onClick={generate} disabled={loading}>{loading ? 'Loading…' : 'Generate Report'}</button>
        </div>
        <div className="pill-row" style={{ padding: '0 20px', marginBottom: 16 }}>
          <span className="eyebrow">Quick:</span>
          <button className="pill" onClick={() => preset('month')}>This month</button>
          <button className="pill" onClick={() => preset('last')}>Last month</button>
          <button className="pill" onClick={() => preset('year')}>This year</button>
        </div>
      </div>

      {report && (
        <>
          <div className="kpi-grid">
            {[['Records', report.totals.count], ['Total amount', PKR(report.totals.amount)],
              ['Verified', PKR(report.totals.verifiedAmount)], ['Pending', PKR(report.totals.pendingAmount)]].map(([l, v]) => (
              <div key={l} className="kpi"><div className="kpi-val">{v}</div><div className="kpi-lbl">{l}</div></div>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <h3 className="card-title">{showYmd(report.from)} → {showYmd(report.to)}</h3>
              <button className="btn btn-accent" style={{ height: 38 }} onClick={download} disabled={pdfBusy}>
                {pdfBusy ? 'Preparing…' : '⬇ Download PDF'}
              </button>
            </div>
            {report.payments.length === 0 ? (
              <div className="empty"><div className="empty-ico">📭</div>No payments found for this period.</div>
            ) : (
              <div className="tbl-wrap">
                <table className="tbl" style={{ minWidth: 760 }}>
                  <thead><tr><th>Date</th><th>Member</th><th>For month</th><th>Method</th><th>Status</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                  <tbody>
                    {report.payments.map(p => (
                      <tr key={p._id}>
                        <td className="nw">{showDate(p.createdAt)}</td>
                        <td><span className="t-strong">{p.member?.fullName || '(deleted member)'}</span></td>
                        <td className="nw">{MONTHS[(p.month || 1) - 1]} {p.year}</td>
                        <td className="nw">{methodIcon(p.paymentMethod)} {methodLabel(p.paymentMethod)}</td>
                        <td><span className={`chip ${STATUS_CHIP[p.status] || 'plain'}`}>{p.status}</span></td>
                        <td className="nw" style={{ textAlign: 'right' }}><span className="num">{PKR(p.amount)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}