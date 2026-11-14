/**
 * Concurrency Test: 10 simultaneous check-in requests for the same participant.
 * Proves that atomic findOneAndUpdate prevents race-condition duplicate admissions.
 */
const BASE_URL = 'http://localhost:5000/api';

async function testConcurrency() {
  console.log('\n--- TESTING SIMULTANEOUS CONCURRENT CHECK-IN REQUESTS ---');

  // 1. Login
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'organizer@eventease.com', password: 'password123' }),
  });
  const { token } = await loginRes.json();

  // 2. Create test event
  const evtRes = await fetch(`${BASE_URL}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Concurrency Stress Test 2026',
      description: 'Simultaneous check-in race condition test',
      date: '2026-10-30',
      startTime: '10:00 AM',
      endTime: '11:00 AM',
      venue: 'Lab C',
      capacity: 50,
    }),
  });
  const { event } = await evtRes.json();

  // 3. Register participant
  const regRes = await fetch(`${BASE_URL}/events/${event._id}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Concurrent Tester',
      email: 'concurrent@example.com',
      phone: '+91 99999 88888',
      college: 'BITS',
      department: 'ECE',
      year: '2nd Year',
    }),
  });
  const { participant } = await regRes.json();

  console.log(`Registered participant ${participant.name} (${participant.participantId})`);
  console.log('Sending 10 simultaneous check-in requests via Promise.all...');

  // 4. Send 10 simultaneous check-ins
  const promises = Array.from({ length: 10 }).map((_, i) =>
    fetch(`${BASE_URL}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ qrToken: participant.qrToken, eventId: event._id }),
    }).then(async (res) => ({ index: i, status: res.status, data: await res.json() }))
  );

  const results = await Promise.all(promises);

  const successes = results.filter((r) => r.status === 200 && r.data.status === 'CHECKED_IN');
  const duplicates = results.filter((r) => r.status === 409 && r.data.status === 'ALREADY_CHECKED_IN');

  console.log(`Results: ${successes.length} SUCCESS (200), ${duplicates.length} REJECTED DUPLICATES (409)`);

  if (successes.length === 1 && duplicates.length === 9) {
    console.log('\x1b[32m[PASS] CONCURRENCY SAFETY VERIFIED: Exactly 1 check-in succeeded, 9 concurrent requests were rejected as duplicates!\x1b[0m\n');
  } else {
    console.error('\x1b[31m[FAIL] Race condition detected!\x1b[0m', { successes, duplicates });
    process.exit(1);
  }
}

testConcurrency();
