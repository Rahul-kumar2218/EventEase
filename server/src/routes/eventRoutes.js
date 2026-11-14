import express from 'express';
import { Event } from '../models/Event.js';
import { Participant } from '../models/Participant.js';
import { CheckIn } from '../models/CheckIn.js';
import { protect, authorize } from '../middleware/auth.js';
import { generateEventId } from '../utils/idGenerator.js';
import { escapeRegex } from '../utils/security.js';

const router = express.Router();

// Helper to find event by mongo _id or custom eventId
export const findEventByIdOrEventId = async (param) => {
  if (!param) return null;
  let event = null;
  if (typeof param === 'string' && param.match(/^[0-9a-fA-F]{24}$/)) {
    event = await Event.findById(param);
  }
  if (!event) {
    event = await Event.findOne({ eventId: param });
  }
  return event;
};

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Organizer, Admin)
router.post('/', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const {
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      capacity,
      category,
      tags,
      locationUrl,
      imageUrl,
      ticketTiers,
      registrationDeadline,
    } = req.body;

    if (!name || !description || !date || !startTime || !endTime || !venue || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, description, date, startTime, endTime, venue, capacity.',
      });
    }

    const parsedCapacity = parseInt(capacity, 10);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a positive integer.',
      });
    }

    // Generate unique eventId
    let eventId = generateEventId();
    while (await Event.findOne({ eventId })) {
      eventId = generateEventId();
    }

    // Parse tiers if supplied or provide default standard tier
    let parsedTiers = [
      {
        tierId: 'standard',
        name: 'Standard Entry',
        price: 0,
        capacity: parsedCapacity,
        soldCount: 0,
        description: 'Standard admission pass',
      },
    ];

    if (Array.isArray(ticketTiers) && ticketTiers.length > 0) {
      parsedTiers = ticketTiers.map((t, idx) => ({
        tierId: t.tierId || `tier-${idx + 1}`,
        name: t.name || 'General Admission',
        price: Number(t.price) || 0,
        capacity: Number(t.capacity) || parsedCapacity,
        soldCount: 0,
        description: t.description || '',
      }));
    }

    const event = await Event.create({
      eventId,
      name: name.trim(),
      description: description.trim(),
      category: category ? category.trim() : 'Technology & Engineering',
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()) : [],
      date,
      startTime,
      endTime,
      venue: venue.trim(),
      locationUrl: locationUrl ? locationUrl.trim() : '',
      imageUrl: imageUrl || '',
      capacity: parsedCapacity,
      ticketTiers: parsedTiers,
      registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
      registrationCount: 0,
      attendanceCount: 0,
      organizerId: req.user._id,
      status: 'upcoming',
      approvalStatus: 'approved',
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating event.',
      error: error.message,
    });
  }
});

// @route   GET /api/events
// @desc    Get all events with search, category & status filter
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { search, status, category, organizerId, myEvents } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    if (category && category !== 'all') {
      query.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, 'i') };
    }

    if (organizerId) {
      query.organizerId = organizerId;
    }

    if (search && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { venue: { $regex: sanitized, $options: 'i' } },
        { eventId: { $regex: sanitized, $options: 'i' } },
        { category: { $regex: sanitized, $options: 'i' } },
        { description: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const events = await Event.find(query)
      .populate('organizerId', 'name email')
      .populate('assignedStaff', 'name email role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving events.',
      error: error.message,
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID or eventId with live verified database stats
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // Always fetch latest accurate counts directly from DB
    const actualRegistrationCount = await Participant.countDocuments({
      eventId: event._id,
      status: { $ne: 'cancelled' },
    });
    const actualAttendanceCount = await Participant.countDocuments({
      eventId: event._id,
      checkedIn: true,
      status: { $ne: 'cancelled' },
    });

    // Populate organizer and assigned staff
    await event.populate('organizerId', 'name email');
    await event.populate('assignedStaff', 'name email role');

    res.status(200).json({
      success: true,
      event,
      stats: {
        capacity: event.capacity,
        registered: actualRegistrationCount,
        checkedIn: actualAttendanceCount,
        remainingSeats: Math.max(0, event.capacity - actualRegistrationCount),
        notArrived: Math.max(0, actualRegistrationCount - actualAttendanceCount),
        attendanceRate:
          actualRegistrationCount > 0
            ? Math.round((actualAttendanceCount / actualRegistrationCount) * 100)
            : 0,
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving event details.',
      error: error.message,
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event details & manage capacity
// @access  Private (Organizer, Admin)
router.put('/:id', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    // Verify organizer ownership if not Admin
    if (
      req.user.role !== 'Admin' &&
      event.organizerId &&
      event.organizerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only edit events you organized.',
      });
    }

    const {
      name,
      description,
      date,
      startTime,
      endTime,
      venue,
      capacity,
      category,
      tags,
      locationUrl,
      imageUrl,
      status,
      cancellationReason,
      registrationDeadline,
    } = req.body;

    if (name) event.name = name.trim();
    if (description) event.description = description.trim();
    if (date) event.date = date;
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (venue) event.venue = venue.trim();
    if (category) event.category = category.trim();
    if (tags && Array.isArray(tags)) event.tags = tags.map((t) => String(t).trim());
    if (locationUrl !== undefined) event.locationUrl = locationUrl.trim();
    if (imageUrl !== undefined) event.imageUrl = imageUrl;
    if (registrationDeadline !== undefined) {
      event.registrationDeadline = registrationDeadline ? new Date(registrationDeadline) : null;
    }

    if (capacity !== undefined) {
      const parsed = parseInt(capacity, 10);
      if (parsed < event.registrationCount) {
        return res.status(400).json({
          success: false,
          message: `Capacity cannot be set lower than current registrations (${event.registrationCount}).`,
        });
      }
      event.capacity = parsed;
    }

    if (status) {
      event.status = status;
      if (status === 'cancelled' && cancellationReason) {
        event.cancellationReason = cancellationReason.trim();
      }
    }

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating event.',
      error: error.message,
    });
  }
});

// @route   PUT /api/events/:id/staff
// @desc    Assign check-in staff to an event
// @access  Private (Organizer, Admin)
router.put('/:id/staff', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const { staffIds } = req.body;
    if (!Array.isArray(staffIds)) {
      return res.status(400).json({ success: false, message: 'staffIds must be an array of user IDs.' });
    }

    event.assignedStaff = staffIds;
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event staff assignments updated successfully.',
      assignedStaff: event.assignedStaff,
    });
  } catch (error) {
    console.error('Assign staff error:', error);
    res.status(500).json({ success: false, message: 'Server error assigning staff.' });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event and related participants/check-ins
// @access  Private (Organizer, Admin)
router.delete('/:id', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    if (
      req.user.role !== 'Admin' &&
      event.organizerId &&
      event.organizerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete events you created.',
      });
    }

    await Participant.deleteMany({ eventId: event._id });
    await CheckIn.deleteMany({ eventId: event._id });
    await Event.findByIdAndDelete(event._id);

    res.status(200).json({
      success: true,
      message: 'Event and associated records deleted successfully.',
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting event.',
      error: error.message,
    });
  }
});

// @route   POST /api/events/:id/waitlist
// @desc    Join waitlist when event is full
// @access  Public
router.post('/:id/waitlist', async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const { name, email, phone, college, department, year } = req.body;
    if (!name || !email || !phone || !college || !department || !year) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required to join the waitlist.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already registered
    const existing = await Participant.findOne({
      eventId: event._id,
      email: normalizedEmail,
      status: { $ne: 'cancelled' },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'You are already registered for this event.',
      });
    }

    const alreadyInWaitlist = event.waitlist.some(
      (w) => w.email.toLowerCase() === normalizedEmail && !w.promoted
    );
    if (alreadyInWaitlist) {
      return res.status(409).json({
        success: false,
        message: 'You are already on the waitlist for this event.',
      });
    }

    event.waitlist.push({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      college: college.trim(),
      department: department.trim(),
      year: year.trim(),
      addedAt: new Date(),
      promoted: false,
    });

    await event.save();

    res.status(200).json({
      success: true,
      message: 'Successfully added to waitlist! You will be notified if a seat opens up.',
      waitlistPosition: event.waitlist.filter((w) => !w.promoted).length,
    });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join waitlist.',
      error: error.message,
    });
  }
});

// @route   GET /api/events/:id/waitlist
// @desc    Get waitlist for an event
// @access  Private (Organizer, Admin)
router.get('/:id/waitlist', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }
    res.status(200).json({
      success: true,
      waitlist: event.waitlist || [],
    });
  } catch (error) {
    console.error('Get waitlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving waitlist.',
      error: error.message,
    });
  }
});

// @route   GET /api/events/:id/crowd
// @desc    Live crowd telemetry, gate throughput, and capacity alert thresholds
// @access  Private (Organizer, Check-in Staff, Admin)
router.get('/:id/crowd', protect, authorize('Organizer', 'Check-in Staff', 'Admin'), async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const [currentAttendance, registered, recentCheckInsCount, gates] = await Promise.all([
      Participant.countDocuments({ eventId: event._id, checkedIn: true, status: { $ne: 'cancelled' } }),
      Participant.countDocuments({ eventId: event._id, status: { $ne: 'cancelled' } }),
      CheckIn.countDocuments({ eventId: event._id, status: 'SUCCESS', checkedInAt: { $gte: fifteenMinutesAgo } }),
      CheckIn.aggregate([
        { $match: { eventId: event._id, status: 'SUCCESS' } },
        { $group: { _id: '$gate', count: { $sum: 1 } } },
        { $project: { gate: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    const capacity = event.capacity;
    const occupancyRate = capacity > 0 ? Number(((currentAttendance / capacity) * 100).toFixed(1)) : 0;
    
    let alertLevel = 'NORMAL';
    if (occupancyRate >= 95) {
      alertLevel = 'CRITICAL';
    } else if (occupancyRate >= 80) {
      alertLevel = 'WARNING';
    }

    const velocityPerMinute = Number((recentCheckInsCount / 15).toFixed(1));

    res.status(200).json({
      success: true,
      telemetry: {
        capacity,
        registered,
        currentAttendance,
        availableSeats: Math.max(0, capacity - currentAttendance),
        occupancyRate,
        alertLevel,
        recentCheckIns15m: recentCheckInsCount,
        velocityPerMinute,
        gatesDistribution: gates,
      },
    });
  } catch (error) {
    console.error('Crowd telemetry error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate crowd telemetry.' });
  }
});

export default router;
