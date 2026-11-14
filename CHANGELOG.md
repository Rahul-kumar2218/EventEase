# Changelog - EventEase 2026

All notable changes to the EventEase platform are documented in this file.

## [2.0.0] - 2026-11-14

### 🚀 Architecture & RBAC Overhaul
- **4-Tier RBAC:** Extended user roles to `Admin`, `Organizer`, `Staff`, and `Participant`.
- **Event-Scoped Staff Delegation:** Added `assignedEvents` to User model and `assignedStaff` to Event model. Created `authorizeEventStaff` middleware ensuring check-in staff can only access gates for their assigned events.
- **Universal Admin Bypass:** Admin role has system-wide governance, event oversight, and staff management capabilities.
- **Atomic Concurrency Protection:** Refactored ticket registration and check-in to use atomic MongoDB conditional updates (`findUniqueOrUpdate` / `$inc`), preventing overbooking and simultaneous duplicate check-in race conditions.

### 🛡️ Security & Hardening (OWASP Compliance)
- **Helmet HTTP Headers:** Integrated Content Security Policy (CSP), HSTS, and frame protection.
- **Multi-Tier Rate Limiting:** Configured granular rate limits for global routes, strict limits for authentication endpoints (anti-brute-force), and high-throughput limits for check-in gates.
- **HMAC-SHA256 Signed QR Tokens:** Upgraded raw random strings to cryptographically signed QR tokens that embed and verify ticket ownership.
- **ReDoS Shield:** Added regex escaping (`escapeRegex`) across all event searches to prevent Regular Expression Denial of Service attacks.
- **CSV Formula Injection Sanitization:** Implemented `sanitizeCsvCell` prefixing suspicious formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) with single quotes during attendee exports.
- **Strict Input Validation:** Added RFC 5322 email regex and E.164 international phone number format validation.
- **Password Reset Workflow:** Implemented secure time-limited token-based password reset (`/forgot-password`, `/reset-password`).

### 🎟️ Smart Registration & Automated Waitlist
- **Automated Waitlist Promotion:** When an attendee cancels their registration, the platform immediately releases the seat and automatically promotes the highest-priority waitlisted candidate.
- **Organizer Ticket Revocation:** Organizers and admins can immediately invalidate compromised or violative tickets with reasons, permanently barring gate entry.
- **Participant Self-Service Portal:** Added `MyRegistrationsPage` allowing attendees to view upcoming passes, download QR codes, and cancel passes.

### 📱 Gate Check-In & Offline Resilience
- **Offline Check-In Mode:** Check-in staff can toggle offline mode. Scans are stored in local storage and synchronized with conflict resolution via `/api/checkin/offline-sync`.
- **Duplicate & Suspicious Repeat Detection:** Immediate 409 rejection for duplicate scans with full timestamp retrieval, accompanied by audit logging of duplicate scan attempts.
- **Live Crowd Velocity Telemetry:** Real-time occupancy percentage and scan velocity (scans/minute) calculations with automated capacity alerts (`NORMAL`, `CAPACITY_WARNING`, `CAPACITY_CRITICAL`).

### 🤖 2026 Next-Gen Features
- **Google Gemini AI Event Assistant:**
  - AI Description & copy generation based on title, category, and target audience.
  - Automated event FAQ generator.
  - Grounded attendee Q&A drawer extracting verified facts from event schemas.
  - Smart recommendations matching user interests and event categories.
- **Razorpay Payment Gateway:**
  - Server-side order creation.
  - Cryptographic HMAC-SHA256 signature verification preventing client-side forgery.
  - Graceful fallback to simulation mode when keys are omitted.
- **Progressive Web App (PWA):**
  - Added `manifest.webmanifest` and mobile theme configuration.
  - Responsive dark/light mode toggle with localStorage persistence.
- **Performance Optimization:**
  - Chunk splitting in Vite bundling (`vendor`, `charts`, `icons`, `deps`), bringing all chunk sizes under 450 kB.
  - Compound MongoDB indexes on `{ eventId: 1, checkedIn: 1, status: 1 }` and `{ eventId: 1, checkedInAt: -1 }`.

---

## [1.0.0] - Prior Release
- Initial baseline event management prototype.
- Basic CRUD operations for events and participants.
- Single-event check-in terminal.

