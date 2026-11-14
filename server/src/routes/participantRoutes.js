import express from 'express';
import { Event } from '../models/Event.js';
import { Participant } from '../models/Participant.js';
import { protect, authorize } from '../middleware/auth.js';
import {
  generateParticipantId,
  generateEntryCode,
  generateQrToken,
} from '../utils/idGenerator.js';
import { escapeRegex, sanitizeCsvCell, isValidEmail, isValidPhone } from '../utils/security.js';
import { findEventByIdOrEventId } from './eventRoutes.js';

const router = express.Router();

/**
 * Helper to auto-promote the next eligible waitlist attendee when a seat opens up
 */
export const promoteNextWaitlistedParticipant = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    if (!event || !event.waitlist || event.waitlist.length === 0) return null;

    // Find the oldest unpromoted waitlist member
    const nextCandidateIndex = event.waitlist.findIndex((w) => !w.promoted);
    if (nextCandidateIndex === -1) return null;

    const candidate = event.waitlist[nextCandidateIndex];

    // Check if seats are available
    if (event.registrationCount >= event.capacity) return null;

    // Generate credentials
    let participantId = generateParticipantId();
    while (await Participant.findOne({ participantId })) {
      participantId = generateParticipantId();
    }
    let entryCode = generateEntryCode();
    while (await Participant.findOne({ entryCode })) {
      entryCode = generateEntryCode();
    }
    let qrToken = generateQrToken();
    while (await Participant.findOne({ qrToken })) {
      qrToken = generateQrToken();
    }

    // Atomically increment registration count and promote
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        $expr: { $lt: ['$registrationCount', '$capacity'] },
      },
      {
        $inc: { registrationCount: 1 },
      },
      { new: true }
    );

    if (!updatedEvent) return null;

    const promotedParticipant = await Participant.create({
      participantId,
      eventId: event._id,
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      college: candidate.college,
      department: candidate.department,
      year: candidate.year,
      entryCode,
      qrToken,
      checkedIn: false,
      checkInTime: null,
      status: 'registered',
      registeredAt: new Date(),
    });

    // Mark as promoted in waitlist
    event.waitlist[nextCandidateIndex].promoted = true;
    event.waitlist[nextCandidateIndex].promotedAt = new Date();
    await event.save();

    console.log(`[Waitlist Promotion] Successfully promoted ${candidate.name} (${candidate.email}) for event ${event.name}`);
    return promotedParticipant;
  } catch (err) {
    console.error('Waitlist promotion error:', err);
    return null;
  }
};

// @route   POST /api/events/:id/register
// @desc    Register a participant for an event
// @access  Public
router.post('/events/:id/register', async (req, res) => {
  try {
    const { name, email, phone, college, department, year, ticketTier } = req.body;

    if (!name || !email || !phone || !college || !department || !year) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: Full Name, Email, Phone, College, Department, Year.',
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number (minimum 7 digits).',
      });
    }

    const event = await findEventByIdOrEventId(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // Check if event is cancelled
    if (event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        status: 'EVENT_CANCELLED',
        message: 'This event has been cancelled by the organizers. Registrations are closed.',
      });
    }

    // Check registration deadline if set
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        status: 'REGISTRATION_CLOSED',
        message: 'Registration deadline for this event has passed.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if participant is already registered for this event
    const existingParticipant = await Participant.findOne({
      eventId: event._id,
      email: normalizedEmail,
    });

    if (existingParticipant) {
      return res.status(409).json({
        success: false,
        message: 'This email is already registered for this event.',
        existingParticipant: {
          participantId: existingParticipant.participantId,
          entryCode: existingParticipant.entryCode,
        },
      });
    }

    // Backend Capacity Validation (Atomic Check & Reservation)
    // Find event where registrationCount < capacity and increment atomically
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        $expr: { $lt: ['$registrationCount', '$capacity'] },
      },
      {
        $inc: { registrationCount: 1 },
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        success: false,
        status: 'EVENT_FULL',
        message: 'EVENT FULL. Registration capacity has been reached.',
      });
    }

    // Generate unique participantId, entryCode, and qrToken
    let participantId = generateParticipantId();
    while (await Participant.findOne({ participantId })) {
      participantId = generateParticipantId();
    }

    let entryCode = generateEntryCode();
    while (await Participant.findOne({ entryCode })) {
      entryCode = generateEntryCode();
    }

    let qrToken = generateQrToken();
    while (await Participant.findOne({ qrToken })) {
      qrToken = generateQrToken();
    }

    // Create participant record
    let participant;
    try {
      participant = await Participant.create({
        participantId,
        eventId: event._id,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        college: college.trim(),
        department: department.trim(),
        year: year.trim(),
        ticketTier: ticketTier || 'Standard Entry',
        entryCode,
        qrToken,
        checkedIn: false,
        checkInTime: null,
        status: 'registered',
        registeredAt: new Date(),
      });
    } catch (insertError) {
      // Rollback the capacity count if participant creation fails
      await Event.findByIdAndUpdate(event._id, { $inc: { registrationCount: -1 } });
      throw insertError;
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      participant: {
        id: participant._id,
        participantId: participant.participantId,
        name: participant.name,
        email: participant.email,
        phone: participant.phone,
        college: participant.college,
        department: participant.department,
        year: participant.year,
        ticketTier: participant.ticketTier,
        entryCode: participant.entryCode,
        qrToken: participant.qrToken,
        checkedIn: participant.checkedIn,
        status: participant.status,
        registeredAt: participant.registeredAt,
      },
      event: {
        id: event._id,
        eventId: event.eventId,
        name: event.name,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        venue: event.venue,
      },
    });
  } catch (error) {
    console.error('Participant registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
});

// @route   POST /api/participants/:id/cancel
// @desc    Cancel participant registration & trigger automatic waitlist reallocation
// @access  Public
router.post('/participants/:id/cancel', async (req, res) => {
  try {
    const param = req.params.id;
    const { reason } = req.body;

    let query = {};
    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = param;
    } else {
      query.$or = [
        { participantId: param },
        { entryCode: param.toUpperCase() },
        { qrToken: param },
      ];
    }

    const participant = await Participant.findOne(query);
    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant record not found.' });
    }

    if (participant.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This registration is already cancelled.' });
    }

    if (participant.checkedIn) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel registration after participant has already checked in to the venue.',
      });
    }

    participant.status = 'cancelled';
    participant.cancelledAt = new Date();
    participant.cancellationReason = reason || 'Cancelled by participant';
    await participant.save();

    // Decrement event registration count
    await Event.findByIdAndUpdate(participant.eventId, {
      $inc: { registrationCount: -1 },
    });

    // Automatically check and promote next waitlisted attendee!
    const promotedAttendee = await promoteNextWaitlistedParticipant(participant.eventId);

    res.status(200).json({
      success: true,
      message: 'Registration successfully cancelled. Seat has been released.',
      cancelledParticipant: {
        participantId: participant.participantId,
        name: participant.name,
        status: 'cancelled',
      },
      waitlistPromoted: promotedAttendee ? true : false,
    });
  } catch (error) {
    console.error('Cancel registration error:', error);
    res.status(500).json({ success: false, message: 'Server error cancelling registration.' });
  }
});

// @route   POST /api/participants/:id/revoke
// @desc    Revoke a ticket pass (Organizer only)
// @access  Private (Organizer, Admin)
router.post('/participants/:id/revoke', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const participant = await Participant.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { participantId: req.params.id }],
    });

    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant ticket not found.' });
    }

    participant.status = 'revoked';
    await participant.save();

    res.status(200).json({
      success: true,
      message: `Pass #${participant.participantId} has been revoked. Gate entry will be barred.`,
      participant,
    });
  } catch (error) {
    console.error('Revoke ticket error:', error);
    res.status(500).json({ success: false, message: 'Server error revoking ticket.' });
  }
});

// @route   GET /api/participants/me
// @desc    Get all registrations belonging to the current user (by email or account link)
// @access  Private
router.get('/participants/me', protect, async (req, res) => {
  try {
    const userEmail = req.user.email.toLowerCase().trim();
    const registrations = await Participant.find({
      email: userEmail,
      status: { $ne: 'cancelled' },
    })
      .populate('eventId')
      .sort({ registeredAt: -1 });

    res.status(200).json({
      success: true,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error('Get my registrations error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve your registrations.' });
  }
});

// @route   GET /api/events/:id/participants
// @desc    Get all participants for an event with search, filter, sort, pagination
// @access  Private (Organizer / Staff / Admin)
router.get('/events/:id/participants', protect, async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const {
      search = '',
      status = 'all', // all | checkedIn | notArrived | cancelled
      sortBy = 'registeredAt',
      order = 'desc',
      page = 1,
      limit = 50,
    } = req.query;

    const query = { eventId: event._id };

    if (status === 'checkedIn') {
      query.checkedIn = true;
      query.status = { $ne: 'cancelled' };
    } else if (status === 'notArrived') {
      query.checkedIn = false;
      query.status = { $ne: 'cancelled' };
    } else if (status === 'cancelled') {
      query.status = 'cancelled';
    }

    if (search && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } },
        { college: { $regex: sanitized, $options: 'i' } },
        { department: { $regex: sanitized, $options: 'i' } },
        { entryCode: { $regex: sanitized, $options: 'i' } },
        { participantId: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const sortOption = {};
    sortOption[sortBy] = order === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const total = await Participant.countDocuments(query);
    const participants = await Participant.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const checkedInCount = await Participant.countDocuments({
      eventId: event._id,
      checkedIn: true,
      status: { $ne: 'cancelled' },
    });

    res.status(200).json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      checkedInCount,
      notArrivedCount: Math.max(0, total - checkedInCount),
      participants,
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving participants.',
      error: error.message,
    });
  }
});

// @route   GET /api/participants/:id
// @desc    Get participant details & ticket info by participantId, qrToken, entryCode, or _id
// @access  Public
router.get('/participants/:id', async (req, res) => {
  try {
    const param = req.params.id;
    let participant = null;

    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      participant = await Participant.findById(param).populate('eventId');
    }
    if (!participant) {
      participant = await Participant.findOne({ participantId: param }).populate('eventId');
    }
    if (!participant) {
      participant = await Participant.findOne({ qrToken: param }).populate('eventId');
    }
    if (!participant) {
      participant = await Participant.findOne({ entryCode: param.toUpperCase() }).populate('eventId');
    }

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant ticket not found.',
      });
    }

    res.status(200).json({
      success: true,
      participant,
      event: participant.eventId,
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving ticket.',
      error: error.message,
    });
  }
});

// @route   GET /api/events/:id/export
// @desc    Export participants to CSV with Formula Injection Sanitization
// @access  Private (Organizer, Admin)
router.get('/events/:id/export', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const participants = await Participant.find({ eventId: event._id }).sort({ registeredAt: 1 });

    const headers = [
      'Participant ID',
      'Name',
      'Email',
      'Phone',
      'College',
      'Department',
      'Year',
      'Ticket Tier',
      'Entry Code',
      'Check-in Status',
      'Check-in Time',
      'Registration Status',
      'Registration Time',
    ];

    const rows = participants.map((p) => [
      sanitizeCsvCell(p.participantId),
      sanitizeCsvCell(p.name),
      sanitizeCsvCell(p.email),
      sanitizeCsvCell(p.phone),
      sanitizeCsvCell(p.college),
      sanitizeCsvCell(p.department),
      sanitizeCsvCell(p.year),
      sanitizeCsvCell(p.ticketTier || 'Standard Entry'),
      sanitizeCsvCell(p.entryCode),
      sanitizeCsvCell(p.checkedIn ? 'CHECKED IN' : 'NOT ARRIVED'),
      sanitizeCsvCell(p.checkInTime ? new Date(p.checkInTime).toISOString() : 'N/A'),
      sanitizeCsvCell((p.status || 'registered').toUpperCase()),
      sanitizeCsvCell(new Date(p.registeredAt).toISOString()),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${event.name.replace(/[^a-zA-Z0-9]/g, '_')}_participants.csv"`
    );

    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error exporting participants.',
      error: error.message,
    });
  }
});

export default router;
