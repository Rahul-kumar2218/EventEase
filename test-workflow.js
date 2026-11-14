/**
 * EventEase End-to-End Workflow Verification Test
 * Tests all 21 mandatory test steps using native Node.js fetch against the live backend API.
 */
const BASE_URL = 'http://localhost:5000/api';
let authToken = '';
let organizerUser = null;
let createdEvent = null;
let createdParticipant = null;
let originalCheckInTime = null;

const logPass = (stepNum, message) => {
  console.log(`\x1b[32m[PASS] Step ${stepNum}: ${message}\x1b[0m`);
};

const logFail = (stepNum, message, details) => {
  console.error(`\x1b[31m[FAIL] Step ${stepNum}: ${message}\x1b[0m`, details || '');
  process.exit(1);
};

const request = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  return { status: response.status, ok: response.ok, data };
};

async function runTests() {
  console.log('\n============================================================');
  console.log('🚀 EXECUTING MANDATORY 21-STEP EVENTEASE WORKFLOW VERIFICATION');
  console.log('============================================================\n');

  // Step 1: Health check / Startup
  try {
    const res = await request('/health');
    if (res.status === 200 && res.data?.status === 'ok') {
      logPass(1, 'EventEase Server is running and healthy on port 5000');
    } else {
      throw new Error(`Unexpected health status: ${res.status}`);
    }
  } catch (err) {
    logFail(1, 'Server health check failed. Is the server running?', err);
  }

  // Step 2: Login as organizer
  try {
    const res = await request('/auth/login', {
      method: 'POST',
      body: {
        email: 'organizer@eventease.com',
        password: 'password123',
      },
    });

    if (res.status === 200 && res.data?.success && res.data?.token) {
      authToken = res.data.token;
      organizerUser = res.data.user;
      logPass(2, `Logged in successfully as Organizer: "${organizerUser.name}" (${organizerUser.email})`);
    } else {
      throw new Error(`Login failed with status ${res.status}: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail(2, 'Login as organizer failed', err);
  }

  // Steps 3 & 4: Create "TechFest 2026" with capacity 100
  try {
    const res = await request('/events', {
      method: 'POST',
      body: {
        name: 'TechFest 2026',
        description: 'Premier University Technology Symposium & Hackathon',
        date: '2026-10-25',
        startTime: '09:00 AM',
        endTime: '06:00 PM',
        venue: 'Auditorium Hall A, Tech Campus',
        capacity: 100,
      },
    });

    if (res.status === 201 && res.data?.success) {
      createdEvent = res.data.event;
      logPass(3, `Created event "${createdEvent.name}" with ID: ${createdEvent.eventId}`);
      logPass(4, `Capacity successfully set to ${createdEvent.capacity} seats`);
    } else {
      throw new Error(`Event creation failed: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail(3, 'Event creation failed', err);
  }

  // Steps 5, 6, 7, 8: Register a participant, generate participant ID, entry code, QR token
  try {
    const res = await request(`/events/${createdEvent._id}/register`, {
      method: 'POST',
      body: {
        name: 'Aditya Sen',
        email: 'aditya.sen@university.edu',
        phone: '+91 98765 11223',
        college: 'Indian Institute of Technology',
        department: 'Computer Science',
        year: '3rd Year',
      },
    });

    if (res.status === 201 && res.data?.success) {
      createdParticipant = res.data.participant;
      logPass(5, `Registered participant "${createdParticipant.name}" (${createdParticipant.email})`);

      // Verify participant ID format (e.g. PAR-...)
      if (createdParticipant.participantId && createdParticipant.participantId.startsWith('PAR-')) {
        logPass(6, `Generated unique Participant ID: ${createdParticipant.participantId}`);
      } else {
        throw new Error(`Invalid participantId format: ${createdParticipant.participantId}`);
      }

      // Verify 6-character entry code
      if (createdParticipant.entryCode && createdParticipant.entryCode.length === 6) {
        logPass(7, `Generated unique 6-char Entry Code: ${createdParticipant.entryCode}`);
      } else {
        throw new Error(`Invalid entryCode format: ${createdParticipant.entryCode}`);
      }

      // Verify secure QR token
      if (createdParticipant.qrToken && createdParticipant.qrToken.length >= 32) {
        logPass(8, `Generated secure cryptographic QR Token: ${createdParticipant.qrToken.substring(0, 16)}...`);
      } else {
        throw new Error(`Invalid qrToken: ${createdParticipant.qrToken}`);
      }
    } else {
      throw new Error(`Registration failed: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail(5, 'Participant registration failed', err);
  }

  // Step 9: Open Check-In & Pre-verify
  try {
    const res = await request('/checkin/verify', {
      method: 'POST',
      body: { qrToken: createdParticipant.qrToken, eventId: createdEvent._id },
    });

    if (res.status === 200 && res.data?.status === 'READY_FOR_CHECK_IN') {
      logPass(9, 'Check-In terminal verified participant status: READY_FOR_CHECK_IN');
    } else {
      throw new Error(`Check-in verify failed: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    logFail(9, 'Pre-verification of check-in failed', err);
  }

  // Steps 10 & 11: Scan/verify the QR and show SUCCESSFUL CHECK-IN
  try {
    const res = await request('/checkin', {
      method: 'POST',
      body: { qrToken: createdParticipant.qrToken, eventId: createdEvent._id },
    });

    const data = res.data;
    if (res.status === 200 && data?.success === true && data?.status === 'CHECKED_IN') {
      originalCheckInTime = data.checkInTime;
      logPass(10, `Scanned & Verified QR token successfully`);
      logPass(11, `SHOW SUCCESSFUL CHECK-IN: "${data.message}" for ${data.participant.name} at ${new Date(originalCheckInTime).toLocaleTimeString()}`);
    } else {
      throw new Error(`Initial check-in returned status ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail(10, 'Initial check-in failed', err);
  }

  // Step 12: Dashboard must show Registered: 1 and Checked In: 1
  try {
    const res = await request(`/events/${createdEvent._id}`);
    const stats = res.data?.stats;
    if (stats?.registered === 1 && stats?.checkedIn === 1 && stats?.remainingSeats === 99) {
      logPass(12, `Dashboard counts verified from DB: Registered = ${stats.registered}, Checked In = ${stats.checkedIn}, Remaining = ${stats.remainingSeats}`);
    } else {
      throw new Error(`Dashboard stats mismatch: registered=${stats?.registered}, checkedIn=${stats?.checkedIn}`);
    }
  } catch (err) {
    logFail(12, 'Dashboard verification failed', err);
  }

  // Steps 13, 14, 15, 16: Scan the SAME QR again. System MUST reject it with DUPLICATE CHECK-IN and display original check-in time
  try {
    const res = await request('/checkin', {
      method: 'POST',
      body: { qrToken: createdParticipant.qrToken, eventId: createdEvent._id },
    });

    const data = res.data;
    if (res.status === 409 && data?.status === 'ALREADY_CHECKED_IN') {
      logPass(13, 'Scanned the SAME QR again');
      logPass(14, 'System REJECTED duplicate check-in with HTTP 409');
      logPass(15, `SHOW DUPLICATE CHECK-IN: "${data.message}"`);

      if (data.checkInTime) {
        logPass(16, `Original Check-In Time correctly returned: ${data.checkInTime}`);
      } else {
        throw new Error('Duplicate response missing original checkInTime');
      }
    } else {
      throw new Error(`Duplicate QR check returned unexpected status ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail(13, 'Duplicate QR check did not behave as expected', err);
  }

  // Steps 17 & 18: Try the same entry code again. It must also be rejected as duplicate
  try {
    const res = await request('/checkin', {
      method: 'POST',
      body: { entryCode: createdParticipant.entryCode, eventId: createdEvent._id },
    });

    const data = res.data;
    if (res.status === 409 && data?.status === 'ALREADY_CHECKED_IN') {
      logPass(17, `Tried the SAME Entry Code ("${createdParticipant.entryCode}") again`);
      logPass(18, 'System REJECTED the duplicate entry code as ALREADY_CHECKED_IN');
    } else {
      throw new Error(`Duplicate Entry Code returned unexpected status ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail(17, 'Duplicate Entry Code test failed', err);
  }

  // Step 19: Test invalid QR / code
  try {
    const res = await request('/checkin', {
      method: 'POST',
      body: { entryCode: 'FAKE99', eventId: createdEvent._id },
    });

    const data = res.data;
    if (res.status === 404 && data?.status === 'INVALID_ENTRY') {
      logPass(19, `Tested invalid code "FAKE99": System rejected with "${data.message}" (INVALID_ENTRY)`);
    } else {
      throw new Error(`Invalid code returned unexpected status ${res.status}: ${JSON.stringify(data)}`);
    }
  } catch (err) {
    logFail(19, 'Invalid entry code test failed', err);
  }

  // Step 20: Test event capacity limit (Capacity = 1, next registration must be REJECTED with EVENT FULL)
  try {
    const tinyEventRes = await request('/events', {
      method: 'POST',
      body: {
        name: 'VIP Roundtable 2026',
        description: 'Single seat invitation roundtable',
        date: '2026-11-01',
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'Boardroom A',
        capacity: 1,
      },
    });

    const tinyEvent = tinyEventRes.data?.event;

    // 1st participant
    await request(`/events/${tinyEvent._id}/register`, {
      method: 'POST',
      body: {
        name: 'First VIP Attendee',
        email: 'vip1@example.com',
        phone: '+91 99999 11111',
        college: 'IIT Delhi',
        department: 'CSE',
        year: '4th Year',
      },
    });

    // 2nd participant (OVERFLOW - MUST BE REJECTED)
    const overflowRes = await request(`/events/${tinyEvent._id}/register`, {
      method: 'POST',
      body: {
        name: 'Second Attendee (Overflow)',
        email: 'vip2@example.com',
        phone: '+91 99999 22222',
        college: 'IIT Delhi',
        department: 'CSE',
        year: '4th Year',
      },
    });

    const errData = overflowRes.data;
    if (
      overflowRes.status === 400 &&
      (errData?.status === 'EVENT_FULL' || errData?.message?.includes('EVENT FULL'))
    ) {
      logPass(20, `TEST EVENT CAPACITY: Registration correctly rejected with "${errData.message}"`);
    } else {
      throw new Error(`Capacity overflow did not reject properly (status ${overflowRes.status}): ${JSON.stringify(errData)}`);
    }
  } catch (err) {
    logFail(20, 'Capacity limit test failed', err);
  }

  // Step 21: Verify dashboard counts and analytics from database
  try {
    const res = await request(`/events/${createdEvent._id}/analytics`);
    const summary = res.data?.summary;
    if (
      summary?.totalCapacity === 100 &&
      summary?.totalRegistered === 1 &&
      summary?.totalCheckedIn === 1 &&
      summary?.remainingSeats === 99
    ) {
      logPass(21, `VERIFY DASHBOARD & ANALYTICS: Capacity: ${summary.totalCapacity}, Registered: ${summary.totalRegistered}, Checked In: ${summary.totalCheckedIn}, Remaining: ${summary.remainingSeats}, Turnout: ${summary.attendanceRate}%`);
    } else {
      throw new Error(`Analytics summary mismatch: ${JSON.stringify(summary)}`);
    }
  } catch (err) {
    logFail(21, 'Analytics summary verification failed', err);
  }

  console.log('\n============================================================');
  console.log('🎉 ALL 21 MANDATORY TEST WORKFLOW STEPS PASSED SUCCESSFULLY!');
  console.log('============================================================\n');
}

runTests();
