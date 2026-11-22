import express from 'express';
import Payment from '../models/Payment.js';
import User    from '../models/User.js';
import { authenticate, requireFinance } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, requireFinance);

// Dates typed by the Finance Secretary are Pakistan time (UTC+05:00)
const PKT = '+05:00';
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ── GET /api/finance/stats ───────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const now = new Date();
    const [pendingPayments, monthAgg] = await Promise.all([
      Payment.countDocuments({ status: 'pending' }),
      Payment.aggregate([
        { $match: { status: 'verified', month: now.getMonth() + 1, year: now.getFullYear() } },
        { $group: { _id: null, sum: { $sum: '$amount' } } },
      ]),
    ]);
    return res.json({ pendingPayments, thisMonthFund: monthAgg[0]?.sum || 0 });
  } catch {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/finance/pending-payments ────────────────────────
router.get('/pending-payments', async (_req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('member', 'fullName email memberType castFamily')
      .sort({ createdAt: -1 });
    return res.json({
      payments: payments.map(p => ({ ...p.toObject(), screenshotFullUrl: p.screenshotUrl || null })),
    });
  } catch {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/finance/pending-payments/:id/approve ──────────
router.patch('/pending-payments/:id/approve', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('member', 'fullName email');
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is not pending.' });

    const duplicate = await Payment.findOne({
      member: payment.member._id, month: payment.month, year: payment.year, status: 'verified',
    });
    if (duplicate) return res.status(409).json({ message: 'A verified payment already exists for this member and month.' });

    payment.status     = 'verified';
    payment.recordedBy = req.user.id;
    payment.adminNote  = req.body.adminNote?.trim() || '';
    await payment.save();

    await User.findByIdAndUpdate(payment.member._id, { $inc: { totalContributed: payment.amount } });
    return res.json({ message: 'Payment approved and verified.', payment });
  } catch {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/finance/pending-payments/:id/reject ───────────
router.patch('/pending-payments/:id/reject', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is not pending.' });

    payment.status     = 'rejected';
    payment.recordedBy = req.user.id;
    payment.adminNote  = req.body.adminNote?.trim() || '';
    await payment.save();
    return res.json({ message: 'Payment rejected.', payment });
  } catch {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/finance/report?from=2026-10-01&to=2026-11-22&status=verified ──
// status: verified (default) | pending | rejected | all.  Filters on the payment date (createdAt).
router.get('/report', async (req, res) => {
  try {
    const { from, to, status = 'verified' } = req.query;

    if (!DATE_RE.test(from || '') || !DATE_RE.test(to || '')) {
      return res.status(400).json({ message: 'Please provide valid from and to dates (YYYY-MM-DD).' });
    }
    const start = new Date(`${from}T00:00:00.000${PKT}`);
    const end   = new Date(`${to}T23:59:59.999${PKT}`);
    if (isNaN(start) || isNaN(end)) return res.status(400).json({ message: 'Invalid date.' });
    if (start > end) return res.status(400).json({ message: '"From" date must be before "To" date.' });
    if (!['verified', 'pending', 'rejected', 'all'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status filter.' });
    }

    const filter = { createdAt: { $gte: start, $lte: end } };
    if (status !== 'all') filter.status = status;

    const payments = await Payment.find(filter)
      .populate('member', 'fullName email memberType castFamily')
      .populate('recordedBy', 'fullName')
      .sort({ createdAt: 1 });

    const sum = (arr) => arr.reduce((s, p) => s + p.amount, 0);
    const by  = (k, v) => payments.filter(p => p[k] === v);
    const totals = {
      count:          payments.length,
      amount:         sum(payments),
      verifiedCount:  by('status', 'verified').length,
      verifiedAmount: sum(by('status', 'verified')),
      pendingCount:   by('status', 'pending').length,
      pendingAmount:  sum(by('status', 'pending')),
      rejectedCount:  by('status', 'rejected').length,
      rejectedAmount: sum(by('status', 'rejected')),
      qrAmount:       sum(by('paymentMethod', 'qr')),
      accountAmount:  sum(by('paymentMethod', 'account')),
    };

    return res.json({ from, to, status, payments, totals });
  } catch (err) {
    console.error('Finance report error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

export default router;