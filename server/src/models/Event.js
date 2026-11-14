import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      default: 'Technology & Engineering',
      trim: true,
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    date: {
      type: String,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    locationUrl: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    registrationCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    attendanceCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedStaff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    ticketTiers: [
      {
        tierId: { type: String, default: 'standard' },
        name: { type: String, default: 'Standard Entry' },
        price: { type: Number, default: 0 },
        capacity: { type: Number, default: 100 },
        soldCount: { type: Number, default: 0 },
        description: { type: String, default: 'Standard admission pass' },
      },
    ],
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    registrationDeadline: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },
    waitlist: [
      {
        name: { type: String, required: true },
        email: { type: String, required: true, lowercase: true, trim: true },
        phone: { type: String, required: true },
        college: { type: String, required: true },
        department: { type: String, required: true },
        year: { type: String, required: true },
        addedAt: { type: Date, default: Date.now },
        promoted: { type: Boolean, default: false },
        promotedAt: { type: Date, default: null },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast search queries
eventSchema.index({ name: 'text', description: 'text', venue: 'text', category: 'text' });

export const Event = mongoose.model('Event', eventSchema);
