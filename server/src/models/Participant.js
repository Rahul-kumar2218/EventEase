import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    participantId: {
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    college: {
      type: String,
      required: [true, 'College is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    year: {
      type: String,
      required: [true, 'Year of study is required'],
      trim: true,
    },
    ticketTier: {
      type: String,
      default: 'Standard Entry',
    },
    entryCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    checkedIn: {
      type: Boolean,
      default: false,
      index: true,
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled', 'revoked'],
      default: 'registered',
      index: true,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active participant email for the same event
participantSchema.index({ eventId: 1, email: 1 }, { unique: true });
// Compound index for participant search & filtering
participantSchema.index({ eventId: 1, checkedIn: 1, status: 1 });

export const Participant = mongoose.model('Participant', participantSchema);
