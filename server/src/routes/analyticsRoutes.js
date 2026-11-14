import express from 'express';
import { Event } from '../models/Event.js';
import { Participant } from '../models/Participant.js';
import { CheckIn } from '../models/CheckIn.js';
import { protect, authorize } from '../middleware/auth.js';
import { findEventByIdOrEventId } from './eventRoutes.js';

const router = express.Router();

// @route   GET /api/events/:id/analytics
// @desc    Get real-time event analytics computed directly from MongoDB with parallel aggregations
// @access  Private (Organizer, Admin)
router.get('/:id/analytics', protect, authorize('Organizer', 'Admin'), async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    const totalCapacity = event.capacity;

    // Run core counts and analytics aggregations in parallel via Promise.all
    const [
      totalRegistered,
      totalCheckedIn,
      totalCancelled,
      duplicateScanAttempts,
      departmentBreakdown,
      collegeBreakdown,
      yearBreakdown,
      registrationTimeline,
      checkInTimeline,
      recentCheckIns,
    ] = await Promise.all([
      // Total active registrations
      Participant.countDocuments({ eventId: event._id, status: { $ne: 'cancelled' } }),
      // Total checked in
      Participant.countDocuments({ eventId: event._id, checkedIn: true, status: { $ne: 'cancelled' } }),
      // Total cancelled
      Participant.countDocuments({ eventId: event._id, status: 'cancelled' }),
      // Duplicate scan attempts
      CheckIn.countDocuments({ eventId: event._id, status: 'DUPLICATE' }),
      // Department breakdown
      Participant.aggregate([
        { $match: { eventId: event._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { department: '$_id', count: 1, _id: 0 } },
      ]),
      // College breakdown
      Participant.aggregate([
        { $match: { eventId: event._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$college', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: { college: '$_id', count: 1, _id: 0 } },
      ]),
      // Year breakdown
      Participant.aggregate([
        { $match: { eventId: event._id, status: { $ne: 'cancelled' } } },
        { $group: { _id: '$year', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { year: '$_id', count: 1, _id: 0 } },
      ]),
      // Registration timeline
      Participant.aggregate([
        { $match: { eventId: event._id, status: { $ne: 'cancelled' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$registeredAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),
      // Check-in timeline
      Participant.aggregate([
        { $match: { eventId: event._id, checkedIn: true, checkInTime: { $ne: null } } },
        {
          $group: {
            _id: { $dateToString: { format: '%H:00', date: '$checkInTime' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { time: '$_id', count: 1, _id: 0 } },
      ]),
      // Recent check-ins list
      CheckIn.find({ eventId: event._id })
        .populate('participantId', 'name email college department entryCode participantId')
        .populate('checkedInBy', 'name email role')
        .sort({ checkedInAt: -1 })
        .limit(15),
    ]);

    const totalNotArrived = Math.max(0, totalRegistered - totalCheckedIn);
    const remainingSeats = Math.max(0, totalCapacity - totalRegistered);

    const capacityUtilization =
      totalCapacity > 0 ? Number(((totalRegistered / totalCapacity) * 100).toFixed(1)) : 0;
    const attendanceRate =
      totalRegistered > 0 ? Number(((totalCheckedIn / totalRegistered) * 100).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      event: {
        id: event._id,
        eventId: event.eventId,
        name: event.name,
        date: event.date,
        venue: event.venue,
        capacity: totalCapacity,
        category: event.category,
        status: event.status,
      },
      summary: {
        totalCapacity,
        totalRegistered,
        totalCheckedIn,
        totalNotArrived,
        totalCancelled,
        remainingSeats,
        capacityUtilization,
        attendanceRate,
        duplicateScanAttempts,
        waitlistCount: event.waitlist ? event.waitlist.filter((w) => !w.promoted).length : 0,
      },
      charts: {
        departmentBreakdown,
        collegeBreakdown,
        yearBreakdown,
        registrationTimeline,
        checkInTimeline,
      },
      recentCheckIns,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error calculating analytics.',
      error: error.message,
    });
  }
});

export default router;
