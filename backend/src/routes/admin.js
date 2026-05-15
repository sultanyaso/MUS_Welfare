import express from 'express';
import User    from '../models/User.js';
import Payment from '../models/Payment.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate, requireAdmin);

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// ── GET /api/admin/members ────────────────────────────────────
router.get('/members', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const filter = status === 'all' ? {} : { status };
    const [members, total] = await Promise.all([
      User.find(filter).select('-password').sort({ createdAt: -1 }).skip((page-1)*limit).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    return res.json({ members, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now       = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear  = now.getFullYear();

    const [pending, active, inactive, rejected, total, totalFund, thisMonthFund, pendingPayments] =
      await Promise.all([
        User.countDocuments({ status: 'pending' }),
        User.countDocuments({ status: 'active' }),
        User.countDocuments({ status: 'inactive' }),
        User.countDocuments({ status: 'rejected' }),
        User.countDocuments({}),
        Payment.aggregate([{ $match: { status: 'verified' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
        Payment.aggregate([{ $match: { month: thisMonth, year: thisYear, status: 'verified' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
        Payment.countDocuments({ status: 'pending' }),
      ]);

    return res.json({
      pending, active, inactive, rejected, total,
      totalFund:     totalFund[0]?.sum     || 0,
      thisMonthFund: thisMonthFund[0]?.sum || 0,
      pendingPayments,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/admin/pending-payments ──────────────────────────
router.get('/pending-payments', async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'pending' })
      .populate('member', 'fullName email memberType castFamily')
      .sort({ createdAt: -1 });

    // Attach full URL for screenshots
    const result = payments.map(p => ({
      ...p.toObject(),
      screenshotFullUrl: p.screenshotUrl ? `${BACKEND_URL}${p.screenshotUrl}` : null,
    }));

    return res.json({ payments: result });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/admin/pending-payments/:id/approve ────────────
router.patch('/pending-payments/:id/approve', async (req, res) => {
  try {
    const { adminNote } = req.body;
    const payment = await Payment.findById(req.params.id).populate('member', 'fullName email');

    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is not pending.' });

    const duplicate = await Payment.findOne({
      member: payment.member._id, month: payment.month, year: payment.year, status: 'verified',
    });
    if (duplicate) return res.status(409).json({ message: 'A verified payment already exists for this member and month.' });

    payment.status     = 'verified';
    payment.recordedBy = req.user.id;
    payment.adminNote  = adminNote?.trim() || '';
    await payment.save();

    await User.findByIdAndUpdate(payment.member._id, { $inc: { totalContributed: payment.amount } });

    return res.json({ message: 'Payment approved and verified.', payment });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/admin/pending-payments/:id/reject ─────────────
router.patch('/pending-payments/:id/reject', async (req, res) => {
  try {
    const { adminNote } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status !== 'pending') return res.status(400).json({ message: 'Payment is not pending.' });

    payment.status    = 'rejected';
    payment.adminNote = adminNote?.trim() || '';
    await payment.save();

    return res.json({ message: 'Payment rejected.', payment });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/admin/members/:id/approve ─────────────────────
router.patch('/members/:id/approve', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'active' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Member not found.' });
    return res.json({ message: 'Member approved.', user });
  } catch (err) { return res.status(500).json({ message: 'Server error.' }); }
});

// ── PATCH /api/admin/members/:id/reject ──────────────────────
router.patch('/members/:id/reject', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Member not found.' });
    return res.json({ message: 'Member rejected.', user });
  } catch (err) { return res.status(500).json({ message: 'Server error.' }); }
});

// ── PATCH /api/admin/members/:id/deactivate ──────────────────
router.patch('/members/:id/deactivate', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Member not found.' });
    return res.json({ message: 'Member deactivated.', user });
  } catch (err) { return res.status(500).json({ message: 'Server error.' }); }
});

// ── DELETE /api/admin/members/:id ────────────────────────────
router.delete('/members/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Member not found.' });
    await Payment.deleteMany({ member: req.params.id });
    return res.json({ message: 'Member deleted.' });
  } catch (err) { return res.status(500).json({ message: 'Server error.' }); }
});

export default router;