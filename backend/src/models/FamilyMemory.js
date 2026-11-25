import mongoose from 'mongoose';

const familyMemorySchema = new mongoose.Schema(
  {
    member:  { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', required: true },
    title:   { type: String, default: '', trim: true, maxlength: 120 },
    text:    { type: String, required: true, trim: true, maxlength: 2000 },
    sticker: { type: String, enum: ['achievement', 'service', 'education', 'religious', 'special'], default: 'special' },
    year:    { type: Number, default: null },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('FamilyMemory', familyMemorySchema);