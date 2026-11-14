import express from 'express';
import { Participant } from '../models/Participant.js';
import { Event } from '../models/Event.js';
import { CheckIn } from '../models/CheckIn.js';
import { protect, authorize } from '../middleware/auth.js';
import { generateCheckInId } from '../utils/idGenerator.js';
import { findEventByIdOrEventId } from './eventRoutes.js';

const router = express.Router();

// Helper to locate participant by QR token or Entry Code
const resolveParticipant = async ({ qrToken, entryCode, eventId }) => {
  let query = {};

  if (qrToken && qrToken.trim()) {
    query.qrToken = qrToken.trim();
  } else if (entryCode && entryCode.trim()) {
    query.entryCode = entryCode.trim().toUpperCase();
  } else {
    return null;
  }

  if (eventId) {
    const event = await findEventByIdOrEventId(eventId);
    if (event) {
      query.eventId = event._id;
    }
  }

  return await Participant.findOne(query).populate('eventId');
};

// Helper to check if staff is permitted for event
const isStaffAuthorizedForEvent = (user, eventId) => {
  if (user.role === 'Admin' || user.role === 'Organizer') return true;
  if (user.role === 'Check-in Staff') {
    if (!user.assignedEvents || user.assignedEvents.length === 0) return true; // Global staff
    return user.assignedEvents.some((id) => id.toString() === eventId.toString());
  }
  return false;
};

// @route   POST /api/checkin/verify
// @desc    Pre-verify a QR code or Entry Code (peek participant & check-in state)
// @access  Private (Organizer, Check-in Staff, Admin)
router.post('/verify', protect, authorize('Organizer', 'Check-in Staff', 'Admin'), async (req, res) => {
  try {
    const { qrToken, entryCode, eventId } = req.body;

    if (!qrToken && !entryCode) {
      return res.status(400).json({
        success: false,
        status: 'INVALID_ENTRY',
        message: 'Invalid QR code or entry code: No code provided.',
      });
    }

    const participant = await resolveParticipant({ qrToken, entryCode, eventId });

    if (!participant) {
      return res.status(404).json({
        success: false,
        status: 'INVALID_ENTRY',
        message: 'Invalid QR code or entry code: No matching participant found.',
      });
    }

    // Verify staff assignment
    if (!isStaffAuthorizedForEvent(req.user, participant.eventId._id)) {
      return res.status(403).json({
        success: false,
        status: 'UNAUTHORIZED_EVENT',
        message: 'You are not assigned as check-in staff for this specific event.',
      });
    }

    // Check if ticket was revoked or cancelled
    if (participant.status === 'revoked') {
      return res.status(400).json({
        success: false,
        status: 'TICKET_REVOKED',
        message: 'Ticket has been revoked by event administrators. Entry barred.',
      });
    }

    if (participant.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        status: 'TICKET_CANCELLED',
        message: 'This registration has been cancelled. Entry barred.',
      });
    }

    if (participant.checkedIn) {
      return res.status(409).json({
        success: false,
        status: 'ALREADY_CHECKED_IN',
        message: 'Participant has already checked in',
        checkInTime: participant.checkInTime ? participant.checkInTime.toISOString() : null,
        participant: {
          name: participant.name,
          participantId: participant.participantId,
          college: participant.college,
          department: participant.department,
        },
      });
    }

    res.status(200).json({
      success: true,
      status: 'READY_FOR_CHECK_IN',
      message: 'Participant verified and ready for check-in.',
      participant: {
        id: participant._id,
        name: participant.name,
        participantId: participant.participantId,
        email: participant.email,
        college: participant.college,
        department: participant.department,
        year: participant.year,
        entryCode: participant.entryCode,
        ticketTier: participant.ticketTier,
      },
      event: {
        id: participant.eventId._id,
        name: participant.eventId.name,
        date: participant.eventId.date,
      },
    });
  } catch (error) {
    console.error('Checkin verify error:', error);
    res.status(500).json({
      success: false,
      status: 'SERVER_ERROR',
      message: 'Server error during entry verification.',
      error: error.message,
    });
  }
});

// @route   POST /api/checkin
// @desc    Process check-in with atomic duplicate prevention
// @access  Private (Organizer, Check-in Staff, Admin)
router.post('/', protect, authorize('Organizer', 'Check-in Staff', 'Admin'), async (req, res) => {
  try {
    const { qrToken, entryCode, eventId, gate = 'Main Gate A', notes } = req.body;

    if (!qrToken && !entryCode) {
      return res.status(400).json({
        success: false,
        status: 'INVALID_ENTRY',
        message: 'Invalid QR code or entry code',
      });
    }

    // 1. Find participant by token or code
    const participant = await resolveParticipant({ qrToken, entryCode, eventId });

    if (!participant) {
      return res.status(404).json({
        success: false,
        status: 'INVALID_ENTRY',
        message: 'Invalid QR code or entry code',
      });
    }

    // Verify staff assignment
    if (!isStaffAuthorizedForEvent(req.user, participant.eventId._id)) {
      return res.status(403).json({
        success: false,
        status: 'UNAUTHORIZED_EVENT',
        message: 'You are not assigned as check-in staff for this specific event.',
      });
    }

    // Check revocation/cancellation
    if (participant.status === 'revoked') {
      return res.status(400).json({
        success: false,
        status: 'TICKET_REVOKED',
        message: 'Ticket has been revoked by event administrators. Entry barred.',
      });
    }

    if (participant.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        status: 'TICKET_CANCELLED',
        message: 'This registration has been cancelled. Entry barred.',
      });
    }

    // 2. Check if already checked in
    if (participant.checkedIn) {
      // Log suspicious repeated scan attempt in audit trail
      await CheckIn.create({
        checkInId: generateCheckInId(),
        eventId: participant.eventId._id,
        participantId: participant._id,
        checkedInAt: new Date(),
        checkedInBy: req.user._id,
        method: qrToken ? 'QR' : 'MANUAL',
        status: 'DUPLICATE',
        gate,
        notes: notes || 'Rejected duplicate gate scan attempt',
        ipAddress: req.ip,
      }).catch((err) => console.error('Failed to log duplicate check-in audit:', err));

      return res.status(409).json({
        success: false,
        status: 'ALREADY_CHECKED_IN',
        message: 'Participant has already checked in',
        checkInTime: participant.checkInTime
          ? participant.checkInTime.toISOString()
          : new Date().toISOString(),
        participant: {
          name: participant.name,
          participantId: participant.participantId,
          college: participant.college,
          entryCode: participant.entryCode,
        },
      });
    }

    // 3. ATOMIC CHECK-IN TO PREVENT CONCURRENT DUPLICATES
    const now = new Date();
    const updatedParticipant = await Participant.findOneAndUpdate(
      {
        _id: participant._id,
        checkedIn: false, // Condition ensures only first atomic hit succeeds!
      },
      {
        $set: {
          checkedIn: true,
          checkInTime: now,
          status: 'attended',
        },
      },
      { new: true }
    );

    // If null, another concurrent request checked this participant in right at this instant
    if (!updatedParticipant) {
      const refreshed = await Participant.findById(participant._id);

      // Log concurrent duplicate
      await CheckIn.create({
        checkInId: generateCheckInId(),
        eventId: participant.eventId._id,
        participantId: participant._id,
        checkedInAt: now,
        checkedInBy: req.user._id,
        method: qrToken ? 'QR' : 'MANUAL',
        status: 'DUPLICATE',
        gate,
        notes: 'Race-condition concurrent scan detected and blocked',
      }).catch(() => {});

      return res.status(409).json({
        success: false,
        status: 'ALREADY_CHECKED_IN',
        message: 'Participant has already checked in',
        checkInTime: refreshed.checkInTime
          ? refreshed.checkInTime.toISOString()
          : now.toISOString(),
        participant: {
          name: refreshed.name,
          participantId: refreshed.participantId,
        },
      });
    }

    // 4. Update Event attendanceCount
    await Event.findByIdAndUpdate(participant.eventId._id, {
      $inc: { attendanceCount: 1 },
    });

    // 5. Create CheckIn audit log
    await CheckIn.create({
      checkInId: generateCheckInId(),
      eventId: participant.eventId._id,
      participantId: participant._id,
      checkedInAt: now,
      checkedInBy: req.user._id,
      method: qrToken ? 'QR' : 'MANUAL',
      status: 'SUCCESS',
      gate,
      notes,
      ipAddress: req.ip,
    });

    // 6. Return exact required success format
    return res.status(200).json({
      success: true,
      status: 'CHECKED_IN',
      message: 'Check-in successful',
      participant: {
        name: updatedParticipant.name,
        participantId: updatedParticipant.participantId,
        college: updatedParticipant.college,
        department: updatedParticipant.department,
        entryCode: updatedParticipant.entryCode,
      },
      checkInTime: now.toISOString(),
    });
  } catch (error) {
    console.error('Checkin execution error:', error);
    res.status(500).json({
      success: false,
      status: 'SERVER_ERROR',
      message: 'Server error processing check-in.',
      error: error.message,
    });
  }
});

// @route   POST /api/checkin/offline-sync
// @desc    Synchronize an array of offline check-ins with conflict resolution
// @access  Private (Organizer, Check-in Staff, Admin)
router.post('/offline-sync', protect, authorize('Organizer', 'Check-in Staff', 'Admin'), async (req, res) => {
  try {
    const { items, eventId } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of offline check-in records required.' });
    }

    const event = await findEventByIdOrEventId(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    let syncedCount = 0;
    let duplicateCount = 0;
    const syncResults = [];

    for (const item of items) {
      const { entryCode, qrToken, timestamp, gate = 'Offline Terminal' } = item;
      const participant = await resolveParticipant({ qrToken, entryCode, eventId: event._id });

      if (!participant) {
        syncResults.push({
          code: entryCode || qrToken,
          status: 'NOT_FOUND',
          message: 'No participant matched',
        });
        continue;
      }

      if (participant.checkedIn) {
        duplicateCount++;
        syncResults.push({
          participantId: participant.participantId,
          name: participant.name,
          status: 'ALREADY_CHECKED_IN',
          originalCheckInTime: participant.checkInTime,
        });

        await CheckIn.create({
          checkInId: generateCheckInId(),
          eventId: event._id,
          participantId: participant._id,
          checkedInAt: new Date(),
          checkedInBy: req.user._id,
          method: 'OFFLINE_SYNC',
          status: 'DUPLICATE',
          gate,
          notes: `Offline sync flagged duplicate (offline timestamp: ${timestamp || 'unknown'})`,
        }).catch(() => {});
        continue;
      }

      const syncTime = timestamp ? new Date(timestamp) : new Date();
      const updated = await Participant.findOneAndUpdate(
        { _id: participant._id, checkedIn: false },
        {
          $set: {
            checkedIn: true,
            checkInTime: syncTime,
            status: 'attended',
          },
        },
        { new: true }
      );

      if (updated) {
        syncedCount++;
        await Event.findByIdAndUpdate(event._id, { $inc: { attendanceCount: 1 } });
        await CheckIn.create({
          checkInId: generateCheckInId(),
          eventId: event._id,
          participantId: participant._id,
          checkedInAt: syncTime,
          checkedInBy: req.user._id,
          method: 'OFFLINE_SYNC',
          status: 'SUCCESS',
          gate,
          notes: 'Synchronized from offline gate queue',
        });

        syncResults.push({
          participantId: updated.participantId,
          name: updated.name,
          status: 'SYNCED',
          checkInTime: syncTime.toISOString(),
        });
      } else {
        duplicateCount++;
        syncResults.push({
          participantId: participant.participantId,
          status: 'CONFLICT_DUPLICATE',
        });
      }
    }

    res.status(200).json({
      success: true,
      summary: {
        totalReceived: items.length,
        syncedCount,
        duplicateCount,
      },
      results: syncResults,
    });
  } catch (error) {
    console.error('Offline sync error:', error);
    res.status(500).json({ success: false, message: 'Server error during offline sync.', error: error.message });
  }
});

// @route   GET /api/checkin/history/:eventId
// @desc    Get check-in audit logs & suspicious scan alerts
// @access  Private (Organizer, Check-in Staff, Admin)
router.get('/history/:eventId', protect, authorize('Organizer', 'Check-in Staff', 'Admin'), async (req, res) => {
  try {
    const event = await findEventByIdOrEventId(req.params.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const { limit = 50, status } = req.query;
    const query = { eventId: event._id };
    if (status) {
      query.status = status;
    }

    const logs = await CheckIn.find(query)
      .populate('participantId', 'name email participantId entryCode college department')
      .populate('checkedInBy', 'name email role')
      .sort({ checkedInAt: -1 })
      .limit(Math.min(200, parseInt(limit, 10) || 50));

    const totalLogs = await CheckIn.countDocuments({ eventId: event._id });
    const duplicateAttempts = await CheckIn.countDocuments({ eventId: event._id, status: 'DUPLICATE' });

    res.status(200).json({
      success: true,
      totalLogs,
      duplicateAttempts,
      logs,
    });
  } catch (error) {
    console.error('Checkin history error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve check-in history.' });
  }
});

export default router;
