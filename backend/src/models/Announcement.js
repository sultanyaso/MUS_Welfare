import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    body:        { type: String, required: true, trim: true },
    category:    { type: String, enum: ['general', 'meeting', 'urgent', 'event'], default: 'general' },
    postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Google Meet / video call
    meetingLink: { type: String, default: '' },
    meetingDate: { type: Date,   default: null },
    meetingNote: { type: String, default: '' },

    // Email blast tracking
    emailSent:   { type: Boolean, default: false },
    emailSentAt: { type: Date,    default: null },
    emailCount:  { type: Number,  default: 0 },

    pinned:      { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Announcement', announcementSchema);