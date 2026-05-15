import express  from 'express';
import Payment  from '../models/Payment.js';
import User     from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, requireAdmin);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── POST /api/payments ───────────────────────────────────────
// Record a payment for a member
router.post('/', async (req, res) => {
  try {
    const { memberId, amount, month, year, note } = req.body;

    if (!memberId || !amount || !month || !year) {
      return res.status(400).json({ message: 'memberId, amount, month and year are required.' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0.' });
    }
    if (month < 1 || month > 12) {
      return res.status(400).json({ message: 'Month must be between 1 and 12.' });
    }

    const member = await User.findById(memberId);
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    if (member.status !== 'active') {
      return res.status(400).json({ message: 'Can only record payments for active members.' });
    }

    // Check duplicate
    const existing = await Payment.findOne({ member: memberId, month, year });
    if (existing) {
      return res.status(409).json({
        message: `Payment for ${MONTH_NAMES[month - 1]} ${year} already recorded for this member.`,
      });
    }

    const payment = await Payment.create({
      member:     memberId,
      amount:     Number(amount),
      month:      Number(month),
      year:       Number(year),
      note:       note?.trim() || '',
      recordedBy: req.user.id,
    });

    // Update member's totalContributed
    await User.findByIdAndUpdate(memberId, { $inc: { totalContributed: Number(amount) } });

    const populated = await payment.populate('member', 'fullName email memberType');

    return res.status(201).json({ message: 'Payment recorded successfully.', payment: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Payment for this month already exists.' });
    }
    console.error('Record payment error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/payments ────────────────────────────────────────
// All payments — optional ?year=2026&month=5
// ── GET /api/payments ────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { year, month, memberId } = req.query;
    const filter = { status: 'verified' };   // ← only show verified payments
    if (year)     filter.year   = Number(year);
    if (month)    filter.month  = Number(month);
    if (memberId) filter.member = memberId;

    const payments = await Payment.find(filter)
      .populate('member', 'fullName email memberType castFamily')
      .sort({ year: -1, month: -1, createdAt: -1 });

    return res.json({ payments });
  } catch (err) {
    console.error('Get payments error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/payments/summary ────────────────────────────────
// Monthly totals for a given year
// ── GET /api/payments/summary ────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const agg = await Payment.aggregate([
      { $match: { year, status: 'verified' } },   // ← only verified
      { $group: { _id: '$month', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => {
      const found = agg.find(a => a._id === i + 1);
      return { month: i + 1, label: MONTH_NAMES[i], total: found?.total || 0, count: found?.count || 0 };
    });

    const grandTotal = months.reduce((s, m) => s + m.total, 0);
    return res.json({ year, months, grandTotal });
  } catch (err) {
    console.error('Payment summary error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/payments/member/:id ─────────────────────────────
// All payments for a specific member
router.get('/member/:id', async (req, res) => {
  try {
    const payments = await Payment.find({ member: req.params.id })
      .sort({ year: -1, month: -1 });
    const member = await User.findById(req.params.id).select('-password');
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    return res.json({ member, payments });
  } catch (err) {
    console.error('Member payments error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── DELETE /api/payments/:id ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    // Reverse the totalContributed
    await User.findByIdAndUpdate(payment.member, { $inc: { totalContributed: -payment.amount } });

    return res.json({ message: 'Payment deleted.' });
  } catch (err) {
    console.error('Delete payment error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
