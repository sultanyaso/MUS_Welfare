import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    member:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount:        { type: Number, required: true, min: 1 },
    month:         { type: Number, required: true, min: 1, max: 12 },
    year:          { type: Number, required: true },
    note:          { type: String, default: '', trim: true },
    recordedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // 'verified' = confirmed by admin (default for admin-recorded payments)
    // 'pending'  = member submitted, waiting admin approval
    // 'rejected' = admin rejected
    status:        { type: String, enum: ['verified', 'pending', 'rejected'], default: 'verified' },
    selfSubmitted: { type: Boolean, default: false },
    adminNote:     { type: String, default: '', trim: true },

    // 'qr'      = paid via QR code scan
    // 'account' = paid via bank transfer, screenshot uploaded
    paymentMethod: { type: String, enum: ['qr', 'account'], default: 'qr' },
    screenshotUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

// Allow multiple pending attempts but only one verified per month
paymentSchema.index({ member: 1, month: 1, year: 1, status: 1 });

export default mongoose.model('Payment', paymentSchema);