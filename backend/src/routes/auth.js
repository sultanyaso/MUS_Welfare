import express  from 'express';
import bcrypt   from 'bcryptjs';
import jwt      from 'jsonwebtoken';
import crypto   from 'crypto';
import User     from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { sendVerificationEmail, sendCongratsEmail } from '../utils/mailer.js';

const router = express.Router();

// ── POST /api/auth/register ──────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phone,
      memberType,
      castFamily,
    } = req.body;

    // ── Validation ─────────────────────────────────────────
    if (!fullName || !email || !password || !memberType) {
      return res.status(400).json({
        message: 'Full name, email, password and member type are required.',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters.',
      });
    }

    if (!['job_holder', 'student'].includes(memberType)) {
      return res.status(400).json({
        message: 'Member type must be job_holder or student.',
      });
    }

    // ── Check duplicate email ───────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }

    // ── Hash password ───────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Generate email verification token ───────────────────
    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    // ── Create user (NOT verified yet) ──────────────────────
    const user = await User.create({
      fullName:        fullName.trim(),
      email:           email.toLowerCase().trim(),
      password:        hashedPassword,
      phone:           phone?.trim() || '',
      memberType,
      castFamily:      castFamily?.trim() || '',
      isEmailVerified: false,
      emailVerifyToken,
    });

    // ── Send verification email ──────────────────────────────
    try {
      await sendVerificationEmail(user.email, user.fullName, emailVerifyToken);
    } catch (mailErr) {
      // Don't block registration if email fails — log it
      console.error('Verification email failed to send:', mailErr.message);
    }

    return res.status(201).json({
      message: 'Account created! Please check your email and click the verification link before logging in.',
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/verify-email ───────────────────────────────
// Called when user clicks the link in their inbox
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('<h2>Invalid verification link.</h2>');
    }

    const user = await User.findOne({ emailVerifyToken: token });

    if (!user) {
      return res.status(400).send(`
        <div style="font-family:Arial;text-align:center;margin-top:80px;">
          <h2 style="color:#c62828;">❌ Invalid or expired verification link.</h2>
          <p>This link has already been used or does not exist.</p>
        </div>
      `);
    }

    // Mark email as verified and clear the token
    user.isEmailVerified  = true;
    user.emailVerifyToken = null;
    await user.save();

    // Redirect to frontend login with success flag
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${FRONTEND_URL}/login?verified=1`);

  } catch (err) {
    console.error('Verify email error:', err);
    return res.status(500).send('<h2>Server error during verification.</h2>');
  }
});

// ── POST /api/auth/login ─────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validation ─────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.',
      });
    }

    // ── Find user ───────────────────────────────────────────
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    // ── Check password ──────────────────────────────────────
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    // ── Block unverified (fake) accounts ────────────────────
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Your email is not verified. Only real Gmail account holders can log in. Please check your inbox and click the verification link.',
        status: 'unverified',
      });
    }

    // ── Check account status ────────────────────────────────
    if (user.status === 'pending') {
      return res.status(403).json({
        message: 'Your account is pending approval. Please wait for the admin to approve your membership.',
        status: 'pending',
      });
    }

    if (user.status === 'rejected') {
      return res.status(403).json({
        message: 'Your membership application was rejected. Please contact the committee.',
        status: 'rejected',
      });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact the committee.',
        status: 'inactive',
      });
    }

    // ── Generate JWT token ──────────────────────────────────
    const token = jwt.sign(
      {
        id:         user._id,
        email:      user.email,
        role:       user.role,
        memberType: user.memberType,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // ── Send congratulations email (non-blocking) ───────────
    sendCongratsEmail(user.email, user.fullName).catch((err) => {
      console.error('Congrats email failed to send:', err.message);
    });

    // ── Send response (exclude password) ────────────────────
    const { password: _, ...safe } = user.toObject();

    return res.json({
      message: 'Login successful!',
      token,
      user: safe,
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json(user);

  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/auth/change-password ─────────────────────────
router.patch('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters.',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({ message: 'Password changed successfully.' });

  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── PATCH /api/auth/update-profile ──────────────────────────
router.patch('/update-profile', authenticate, async (req, res) => {
  try {
    const { fullName, phone, castFamily } = req.body;

    const updates = {};
    if (fullName)                 updates.fullName   = fullName.trim();
    if (phone !== undefined)      updates.phone      = phone.trim();
    if (castFamily !== undefined) updates.castFamily = castFamily.trim();

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.json({ message: 'Profile updated successfully.', user });

  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

// ── POST /api/auth/seed-admin ────────────────────────────────
router.post('/seed-admin', async (req, res) => {
  try {
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      return res.status(409).json({ message: 'An admin account already exists.' });
    }

    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const admin  = await User.create({
      fullName:        fullName.trim(),
      email:           email.toLowerCase().trim(),
      password:        hashed,
      memberType:      'job_holder',
      role:            'admin',
      status:          'active',
      isEmailVerified: true,   // Admin is pre-verified
    });

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role, memberType: admin.memberType },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...safe } = admin.toObject();
    return res.status(201).json({ message: 'Admin account created.', token, user: safe });
  } catch (err) {
    console.error('Seed admin error:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
});

export default router;