import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

// Finance Secretary (or admin). The role is read from the database on every call,
// so assigning / removing the role takes effect immediately — no re-login needed.
export async function requireFinance(req, res, next) {
  try {
    const u = await User.findById(req.user?.id).select('role status');
    if (!u || u.status !== 'active' || !['finance_secretary', 'admin'].includes(u.role)) {
      return res.status(403).json({ message: 'Finance Secretary access required.' });
    }
    next();
  } catch {
    return res.status(500).json({ message: 'Server error.' });
  }
}