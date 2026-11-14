import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema(
  {
    checkInId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
      index: true,
    },
    checkedInAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    method: {
      type: String,
      enum: ['QR', 'MANUAL', 'OFFLINE_SYNC'],
      default: 'QR',
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'DUPLICATE', 'INVALID', 'SUSPICIOUS_REPEAT'],
      default: 'SUCCESS',
      index: true,
    },
    gate: {
      type: String,
      default: 'Main Gate A',
    },
    notes: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

checkInSchema.index({ eventId: 1, checkedInAt: -1 });
checkInSchema.index({ participantId: 1, checkedInAt: -1 });

export const CheckIn = mongoose.model('CheckIn', checkInSchema);
