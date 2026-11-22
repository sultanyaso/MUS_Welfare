import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName:         { type: String, required: true, trim: true },
    email:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:         { type: String, required: true },
    phone:            { type: String, default: '' },
    memberType:       { type: String, enum: ['job_holder', 'student'], required: true },
    castFamily:       { type: String, default: '' },
    role:             { type: String, enum: ['member', 'admin'], default: 'member' },
    status:           { type: String, enum: ['pending', 'active', 'inactive', 'rejected'], default: 'pending' },
    totalContributed: { type: Number, default: 0 },

    // ── Email verification ─────────────────────────────────
    isEmailVerified:   { type: Boolean, default: false },
    emailVerifyToken:  { type: String, default: null },   // UUID token sent in verification link
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);