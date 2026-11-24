import express from 'express';
import FamilyMember from '../models/FamilyMember.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

// ── GET /api/family-tree — all members (public to logged-in users)
router.get('/', async (req, res) => {
  try {
    const members = await FamilyMember.find().sort({ createdAt: 1 });
    return res.json({ members });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/family-tree — add new member (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, parentId, gender, birthYear, note, isAlive } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required.' });

    const member = await FamilyMember.create({
      name:      name.trim(),
      parentId:  parentId || null,
      gender:    gender || 'male',
      birthYear: birthYear ? Number(birthYear) : null,
      note:      note?.trim() || '',
      isAlive:   isAlive !== false,
      addedBy:   req.user.id,
    });
    return res.status(201).json({ message: 'Family member added.', member });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/family-tree/bulk — add several children to one parent (admin only)
// body: { parentId, children: [{ name, gender, isAlive, dob }] }
router.post('/bulk', requireAdmin, async (req, res) => {
  try {
    const { parentId, children } = req.body;
    if (!parentId) return res.status(400).json({ message: 'parentId is required.' });
    if (!Array.isArray(children) || children.length === 0 || children.length > 30) {
      return res.status(400).json({ message: 'Provide between 1 and 30 children.' });
    }
    const parent = await FamilyMember.findById(parentId);
    if (!parent) return res.status(404).json({ message: 'Parent not found.' });

    const docs = [];
    for (let i = 0; i < children.length; i++) {
      const c = children[i];
      if (!c.name?.trim()) return res.status(400).json({ message: `Child ${i + 1}: name is required.` });
      let dob = null, birthYear = null;
      if (c.dob) {
        dob = new Date(c.dob);
        if (isNaN(dob)) return res.status(400).json({ message: `Child ${i + 1}: invalid date of birth.` });
        birthYear = dob.getUTCFullYear();
      }
      docs.push({
        name:      c.name.trim(),
        parentId,
        gender:    c.gender === 'female' ? 'female' : 'male',
        dob, birthYear,
        isAlive:   c.isAlive !== false,
        addedBy:   req.user.id,
      });
    }
    const created = await FamilyMember.insertMany(docs);
    return res.status(201).json({ message: `${created.length} child(ren) added.`, members: created });
  } catch (err) {
    console.error('Bulk add children error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/family-tree/:id — edit member (admin only)
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { name, parentId, gender, birthYear, note, isAlive } = req.body;
    const updates = {};
    if (name      !== undefined) updates.name      = name.trim();
    if (parentId  !== undefined) updates.parentId  = parentId || null;
    if (gender    !== undefined) updates.gender    = gender;
    if (birthYear !== undefined) updates.birthYear = birthYear ? Number(birthYear) : null;
    if (note      !== undefined) updates.note      = note.trim();
    if (isAlive   !== undefined) updates.isAlive   = isAlive;

    const member = await FamilyMember.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!member) return res.status(404).json({ message: 'Member not found.' });
    return res.json({ message: 'Updated.', member });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── DELETE /api/family-tree/:id — delete member (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    // Also delete all descendants
    const toDelete = [req.params.id];
    let queue = [req.params.id];
    while (queue.length) {
      const children = await FamilyMember.find({ parentId: { $in: queue } }).select('_id');
      const ids = children.map(c => c._id.toString());
      toDelete.push(...ids);
      queue = ids;
    }
    await FamilyMember.deleteMany({ _id: { $in: toDelete } });
    return res.json({ message: `Deleted ${toDelete.length} member(s).` });
  } catch (err) {
    return res.status(500).json({ message: 'Server error.' });
  }
});

export default router;