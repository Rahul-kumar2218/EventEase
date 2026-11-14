import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './models/User.js';
import { Event } from './models/Event.js';
import { Participant } from './models/Participant.js';
import { CheckIn } from './models/CheckIn.js';
import {
  generateParticipantId,
  generateEntryCode,
  generateQrToken,
  generateCheckInId,
} from './utils/idGenerator.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventease');
    console.log('[Seed] Connected to MongoDB.');

    // Clear existing data
    await User.deleteMany({});
    await Event.deleteMany({});
    await Participant.deleteMany({});
    await CheckIn.deleteMany({});
    console.log('[Seed] Cleared existing collections.');

    // 1. Create demo users (4-tier RBAC)
    const admin = await User.create({
      name: 'Dr. Robert Vance (System Administrator)',
      email: 'admin@eventease.com',
      password: 'password123',
      role: 'Admin',
    });

    const organizer = await User.create({
      name: 'Alex Rivera (Lead Organizer)',
      email: 'organizer@eventease.com',
      password: 'password123',
      role: 'Organizer',
    });

    const staff = await User.create({
      name: 'Sarah Chen (Check-in Staff)',
      email: 'staff@eventease.com',
      password: 'password123',
      role: 'Check-in Staff',
    });

    const demoParticipantUser = await User.create({
      name: 'Devin Martinez',
      email: 'participant@eventease.com',
      password: 'password123',
      role: 'Participant',
    });

    console.log('[Seed] Demo users created:');
    console.log(' - Admin:     admin@eventease.com / password123');
    console.log(' - Organizer: organizer@eventease.com / password123');
    console.log(' - Staff:     staff@eventease.com / password123');
    console.log(' - User:      participant@eventease.com / password123');

    // 2. Create Sample Event
    const event = await Event.create({
      eventId: 'EVT-DEMO26',
      name: 'TechFest 2026: Innovation Summit',
      description: 'Annual flagship engineering and technology symposium with keynote presentations, hackathons, and industry networking.',
      category: 'Technology & Engineering',
      tags: ['AI', 'Robotics', 'Hackathon', 'Keynotes'],
      date: '2026-11-15',
      startTime: '09:30 AM',
      endTime: '05:30 PM',
      venue: 'Main Auditorium, Tech Campus Block B',
      locationUrl: 'https://maps.google.com/?q=Auditorium',
      capacity: 100,
      registrationCount: 0,
      attendanceCount: 0,
      organizerId: organizer._id,
      assignedStaff: [staff._id],
      status: 'upcoming',
      approvalStatus: 'approved',
      ticketTiers: [
        { tierId: 'standard', name: 'General Admission', price: 0, capacity: 80, soldCount: 0 },
        { tierId: 'vip', name: 'VIP Pass & Hackathon Access', price: 0, capacity: 20, soldCount: 0 },
      ],
    });

    // Update staff with assigned event
    staff.assignedEvents = [event._id];
    await staff.save();

    // 3. Create Sample Participants
    const sampleParticipants = [
      {
        name: 'Arjun Sharma',
        email: 'arjun.sharma@example.edu',
        phone: '+91 98765 43210',
        college: 'National Institute of Technology',
        department: 'Computer Science',
        year: '3rd Year',
        checkedIn: true,
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@example.edu',
        phone: '+91 98765 43211',
        college: 'Indian Institute of Information Technology',
        department: 'Information Technology',
        year: '2nd Year',
        checkedIn: false,
      },
      {
        name: 'Rohan Gupta',
        email: 'rohan.gupta@example.edu',
        phone: '+91 98765 43212',
        college: 'Delhi Technological University',
        department: 'Electronics & Communication',
        year: '4th Year',
        checkedIn: false,
      },
      {
        name: 'Ananya Verma',
        email: 'ananya.v@example.edu',
        phone: '+91 98765 43213',
        college: 'BITS Pilani',
        department: 'Data Science & AI',
        year: '1st Year',
        checkedIn: true,
      },
    ];

    let registeredCount = 0;
    let checkedInCount = 0;

    for (const pData of sampleParticipants) {
      const pId = generateParticipantId();
      const entryCode = generateEntryCode();
      const qrToken = generateQrToken();
      const now = new Date();
      const checkInTime = pData.checkedIn ? new Date(now.getTime() - Math.floor(Math.random() * 3600000)) : null;

      const participant = await Participant.create({
        participantId: pId,
        eventId: event._id,
        name: pData.name,
        email: pData.email,
        phone: pData.phone,
        college: pData.college,
        department: pData.department,
        year: pData.year,
        ticketTier: 'General Admission',
        entryCode,
        qrToken,
        checkedIn: pData.checkedIn,
        checkInTime,
        status: pData.checkedIn ? 'attended' : 'registered',
        registeredAt: new Date(Date.now() - 86400000 * 2),
      });

      registeredCount++;

      if (pData.checkedIn) {
        checkedInCount++;
        await CheckIn.create({
          checkInId: generateCheckInId(),
          eventId: event._id,
          participantId: participant._id,
          checkedInAt: checkInTime,
          checkedInBy: staff._id,
          method: 'QR',
          status: 'SUCCESS',
          gate: 'North Gate Terminal',
        });
      }
    }

    event.registrationCount = registeredCount;
    event.attendanceCount = checkedInCount;
    await event.save();

    console.log(`[Seed] Seeded event "${event.name}" with ${registeredCount} participants (${checkedInCount} checked-in).`);
    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
