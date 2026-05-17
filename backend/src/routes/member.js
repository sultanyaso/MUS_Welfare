import express  from 'express';
import multer   from 'multer';
import User     from '../models/User.js';
import Payment  from '../models/Payment.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ── Multer: memory storage for Vercel serverless ─────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg','image/png','image/jpg','image/webp'].includes(file.mimetype))
      cb(null, true);
    else
      cb(new Error('Only image files are allowed.'));
  },
});

// ── GET /api/member/directory ─────────────────────────────────
router.get('/directory', async (req, res) => {
  try {
    const members = await User.find({ status: 'active' })
      .select('fullName email phone memberType castFamily totalContributed createdAt')
      .sort({ fullName: 1 });
    return res.json({ members });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/member/my-payments ───────────────────────────────
router.get('/my-payments', async (req, res) => {
  try {
    const payments = await Payment.find({ member: req.user.id })
      .sort({ year: -1, month: -1 });

    const summary = Array.from({ length: 12 }, (_, i) => {
      const year  = new Date().getFullYear();
      const found = payments.find(p => p.month === i+1 && p.year === year && p.status === 'verified');
      const pend  = payments.find(p => p.month === i+1 && p.year === year && p.status === 'pending');
      return { month: i+1, label: MONTH_NAMES[i], paid: !!found, pending: !!pend, amount: found?.amount || 0 };
    });

    const totalPaid = payments.filter(p => p.status === 'verified').reduce((s,p) => s+p.amount, 0);
    return res.json({ payments, summary, totalPaid });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/member/submit-payment ──────────────────────────
router.post('/submit-payment', upload.single('screenshot'), async (req, res) => {
  try {
    const { month, year, amount, note, paymentMethod } = req.body;
    const memberId = req.user.id;

    if (!month || !year || !amount)
      return res.status(400).json({ message: 'Month, year and amount are required.' });

    if (Number(amount) <= 0)
      return res.status(400).json({ message: 'Amount must be greater than 0.' });

    const member = await User.findById(memberId);
    if (!member || member.status !== 'active')
      return res.status(403).json({ message: 'Only active members can submit payments.' });

    // Block if already verified for this month
    const alreadyVerified = await Payment.findOne({
      member: memberId, month: Number(month), year: Number(year), status: 'verified',
    });
    if (alreadyVerified)
      return res.status(409).json({ message: `Your payment for ${MONTH_NAMES[month-1]} ${year} is already verified.` });

    // Block if already pending for this month
    const alreadyPending = await Payment.findOne({
      member: memberId, month: Number(month), year: Number(year), status: 'pending',
    });
    if (alreadyPending)
      return res.status(409).json({ message: `You already have a pending submission for ${MONTH_NAMES[month-1]} ${year}.` });

    const method = paymentMethod === 'account' ? 'account' : 'qr';

    // Screenshot required for account transfer
    if (method === 'account' && !req.file)
      return res.status(400).json({ message: 'Screenshot is required for bank transfer submissions.' });

    // Store screenshot as base64 string in database
    const screenshotUrl = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : '';

    const payment = await Payment.create({
      member:        memberId,
      amount:        Number(amount),
      month:         Number(month),
      year:          Number(year),
      note:          note?.trim() || '',
      status:        'pending',
      selfSubmitted: true,
      paymentMethod: method,
      screenshotUrl,
      recordedBy:    null,
    });

    return res.status(201).json({
      message: 'Payment submitted! The admin will verify and approve it shortly.',
      payment,
    });
  } catch (err) {
    console.error('Submit payment error:', err);
    return res.status(500).json({ message: err.message || 'Server error.' });
  }
});

// ── GET /api/member/org-payments ──────────────────────────────
router.get('/org-payments', async (req, res) => {
  try {
    const { year } = req.query;
    const filter = { status: 'verified' };
    if (year) filter.year = Number(year);
    const payments = await Payment.find(filter)
      .populate('member', 'fullName memberType')
      .sort({ year: -1, month: -1, createdAt: -1 });
    return res.json({ payments });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/member/summary ───────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const agg  = await Payment.aggregate([
      { $match: { year, status: 'verified' } },
      { $group: { _id: '$month', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    const months = Array.from({ length: 12 }, (_, i) => {
      const found = agg.find(a => a._id === i+1);
      return { month: i+1, label: MONTH_NAMES[i], total: found?.total||0, count: found?.count||0 };
    });
    const grandTotal = months.reduce((s,m) => s+m.total, 0);
    return res.json({ year, months, grandTotal });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── GET /api/member/stats ─────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const now       = new Date();
    const thisMonth = now.getMonth() + 1;
    const thisYear  = now.getFullYear();

    const [totalMembers, myPayments, orgThisMonth, orgTotal, myPending] = await Promise.all([
      User.countDocuments({ status: 'active' }),
      Payment.find({ member: req.user.id, status: 'verified' }).sort({ year: -1, month: -1 }),
      Payment.aggregate([{ $match: { month: thisMonth, year: thisYear, status: 'verified' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Payment.aggregate([{ $match: { status: 'verified' } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Payment.countDocuments({ member: req.user.id, status: 'pending' }),
    ]);

    const myTotal     = myPayments.reduce((s,p) => s+p.amount, 0);
    const myThisMonth = myPayments.find(p => p.month === thisMonth && p.year === thisYear);

    return res.json({
      totalMembers,
      myTotal,
      myThisMonth:  myThisMonth?.amount || 0,
      myPaidMonths: myPayments.length,
      myPending,
      orgThisMonth: orgThisMonth[0]?.sum || 0,
      orgTotal:     orgTotal[0]?.sum     || 0,
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

export default router;