import express      from 'express';
import Announcement from '../models/Announcement.js';
import User         from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendAnnouncementEmail } from '../utils/mailer.js';

const router = express.Router();

// ── GET /api/announcements  (any authenticated member) ───────
router.get('/', authenticate, async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('postedBy', 'fullName')
      .sort({ pinned: -1, createdAt: -1 })
      .limit(50);
    return res.json({ announcements });
  } catch (err) {
    console.error('Get announcements error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/announcements  (admin only) ────────────────────
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, body, category, meetingLink, meetingDate, meetingNote, pinned, sendEmail } = req.body;

    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ message: 'Title and body are required.' });
    }

    const announcement = await Announcement.create({
      title:       title.trim(),
      body:        body.trim(),
      category:    category || 'general',
      postedBy:    req.user.id,
      meetingLink: meetingLink?.trim() || '',
      meetingDate: meetingDate ? new Date(meetingDate) : null,
      meetingNote: meetingNote?.trim() || '',
      pinned:      !!pinned,
    });

    // ── Optional email blast to all active members ───────────
    let emailCount = 0;
    if (sendEmail) {
      try {
        const members = await User.find({ status: 'active' }).select('email fullName');
        if (members.length > 0) {
          await sendAnnouncementEmail(members, announcement);
          emailCount = members.length;
          announcement.emailSent  = true;
          announcement.emailSentAt = new Date();
          announcement.emailCount  = emailCount;
          await announcement.save();
        }
      } catch (mailErr) {
        console.error('Announcement email blast failed:', mailErr.message);
        // Don't fail the whole request — announcement is saved
      }
    }

    const populated = await announcement.populate('postedBy', 'fullName');
    return res.status(201).json({
      message: sendEmail
        ? `Announcement posted and emailed to ${emailCount} member(s).`
        : 'Announcement posted.',
      announcement: populated,
      emailCount,
    });
  } catch (err) {
    console.error('Create announcement error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/announcements/:id  (admin only) ───────────────
router.patch('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, body, category, meetingLink, meetingDate, meetingNote, pinned } = req.body;

    const updates = {};
    if (title       !== undefined) updates.title       = title.trim();
    if (body        !== undefined) updates.body        = body.trim();
    if (category    !== undefined) updates.category    = category;
    if (meetingLink !== undefined) updates.meetingLink = meetingLink.trim();
    if (meetingDate !== undefined) updates.meetingDate = meetingDate ? new Date(meetingDate) : null;
    if (meetingNote !== undefined) updates.meetingNote = meetingNote.trim();
    if (pinned      !== undefined) updates.pinned      = !!pinned;

    const announcement = await Announcement.findByIdAndUpdate(
      req.params.id, updates, { new: true }
    ).populate('postedBy', 'fullName');

    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });
    return res.json({ message: 'Announcement updated.', announcement });
  } catch (err) {
    console.error('Update announcement error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── DELETE /api/announcements/:id  (admin only) ──────────────
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const a = await Announcement.findByIdAndDelete(req.params.id);
    if (!a) return res.status(404).json({ message: 'Announcement not found.' });
    return res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    console.error('Delete announcement error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/announcements/:id/resend-email  (admin only) ───
router.post('/:id/resend-email', authenticate, requireAdmin, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.status(404).json({ message: 'Announcement not found.' });

    const members = await User.find({ status: 'active' }).select('email fullName');
    if (members.length === 0) return res.status(400).json({ message: 'No active members to email.' });

    await sendAnnouncementEmail(members, announcement);

    announcement.emailSent   = true;
    announcement.emailSentAt = new Date();
    announcement.emailCount  = members.length;
    await announcement.save();

    return res.json({ message: `Email resent to ${members.length} member(s).`, emailCount: members.length });
  } catch (err) {
    console.error('Resend email error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

export default router;