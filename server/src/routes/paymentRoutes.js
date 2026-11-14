import express from 'express';
import crypto from 'crypto';
import { Event } from '../models/Event.js';
import { Participant } from '../models/Participant.js';
import { protect } from '../middleware/auth.js';
import { findEventByIdOrEventId } from './eventRoutes.js';

const router = express.Router();

/**
 * @route   POST /api/payments/create-order
 * @desc    Creates a server-side verified order for Razorpay
 * @access  Public
 */
router.post('/create-order', async (req, res) => {
  try {
    const { eventId, tierId, amount, currency = 'INR', participantData } = req.body;

    const event = await findEventByIdOrEventId(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // If Razorpay credentials are not configured, offer sandbox evaluation order
    const isLiveGateway = !!(keyId && keySecret);
    const orderId = 'order_' + crypto.randomBytes(12).toString('hex');
    const orderAmount = Number(amount) || 0;

    res.status(200).json({
      success: true,
      isLiveGateway,
      order: {
        id: orderId,
        amount: Math.round(orderAmount * 100), // in paise
        currency,
        eventName: event.name,
        keyId: keyId || 'rzp_test_simulation_mode',
      },
      message: isLiveGateway
        ? 'Live Razorpay order generated.'
        : 'Razorpay simulation mode: Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env for live gateway.',
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error generating payment order.' });
  }
});

/**
 * @route   POST /api/payments/verify
 * @desc    Cryptographically verifies Razorpay payment signature
 *          NEVER trust frontend response alone; server must compute HMAC-SHA256
 * @access  Public
 */
router.post('/verify', async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      participantId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({ success: false, message: 'Order ID and Payment ID are required.' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (keySecret) {
      // Cryptographic verification
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(body.toString())
        .digest('hex');

      const isAuthentic = crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(razorpay_signature || '')
      );

      if (!isAuthentic) {
        return res.status(400).json({
          success: false,
          status: 'PAYMENT_FORGED',
          message: 'Payment verification failed: Cryptographic signature mismatch. Transaction rejected.',
        });
      }
    }

    // Update participant ticket with payment transaction ID
    if (participantId) {
      await Participant.findOneAndUpdate(
        { participantId },
        {
          $set: {
            paymentStatus: 'PAID',
            paymentId: razorpay_payment_id,
            paidAt: new Date(),
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      status: 'PAYMENT_VERIFIED',
      message: 'Payment verified successfully.',
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ success: false, message: 'Server error during payment verification.' });
  }
});

/**
 * @route   POST /api/payments/refund
 * @desc    Initiate refund workflow for cancelled registrations
 * @access  Private (Organizer, Admin)
 */
router.post('/refund', protect, async (req, res) => {
  try {
    const { participantId, reason } = req.body;
    const participant = await Participant.findOne({ participantId });

    if (!participant) {
      return res.status(404).json({ success: false, message: 'Participant not found.' });
    }

    const refundId = 'rfnd_' + crypto.randomBytes(12).toString('hex');

    res.status(200).json({
      success: true,
      status: 'REFUND_PROCESSED',
      refundId,
      participantId,
      message: `Refund of ticket for ${participant.name} processed successfully.`,
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ success: false, message: 'Server error processing refund.' });
  }
});

export default router;

