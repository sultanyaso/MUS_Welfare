import mongoose from 'mongoose';

const familyMemberSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    parentId:   { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyMember', default: null },
    gender:     { type: String, enum: ['male', 'female'], default: 'male' },
    birthYear:  { type: Number, default: null },
    note:       { type: String, default: '', trim: true },
    isAlive:    { type: Boolean, default: true },
    addedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.model('FamilyMember', familyMemberSchema);