# EventEase API Specification & Reference Manual (2026 Edition)

Welcome to the **EventEase RESTful API Reference**. This documentation details every endpoint, authentication requirement, request format, response schema, and error contract implemented across the backend.

---

## 1. Global API Conventions

- **Base URL:** `http://localhost:5000/api` (or configured host)
- **Content-Type:** `application/json` (except `/events/:id/export` which returns `text/csv`)
- **Authentication:** Bearer Token via HTTP Header: `Authorization: Bearer <JWT>`
- **Security Headers:** Enforced via `helmet` (HSTS, Content-Security-Policy, X-Content-Type-Options, Frameguard).
- **Rate Limiting:**
  - Standard API routes: 300 requests / 15 minutes.
  - Authentication routes (`/auth/*`): 20 requests / 15 minutes.
  - Check-in scanning (`/checkin`): 500 requests / 15 minutes.

---

## 2. Authentication & User Management (`/api/auth`)

### 2.1 Register New Account
- **Endpoint:** `POST /api/auth/register`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "Organizer"
  }
  ```
  *(Note: Role elevation to `Admin` is prevented. Attempting to register as Admin defaults to Organizer.)*
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "Organizer"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```

### 2.2 Login
- **Endpoint:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
  ```json
  {
    "email": "admin@eventease.com",
    "password": "password123"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60d0fe4f5311236168a109ca",
      "name": "System Administrator",
      "email": "admin@eventease.com",
      "role": "Admin",
      "assignedEvents": []
    }
  }
  ```

### 2.3 Password Reset Workflow
- **Forgot Password:** `POST /api/auth/forgot-password`
  - Body: `{ "email": "user@example.com" }`
  - Returns: `{ "success": true, "message": "Password reset token generated." }`
- **Reset Password:** `POST /api/auth/reset-password`
  - Body: `{ "token": "<hex_token>", "newPassword": "NewSecurePassword123" }`
  - Returns: `{ "success": true, "message": "Password updated successfully." }`

### 2.4 Staff Account Provisioning
- **Endpoint:** `POST /api/auth/staff`
- **Access:** `Admin`, `Organizer`
- **Request Body:**
  ```json
  {
    "name": "Gate Staff Member",
    "email": "staff1@eventease.com",
    "password": "TemporaryPassword123",
    "assignedEvents": ["6af820c6a570434371e1520e"]
  }
  ```
- **Response (201 Created):** Returns the provisioned user record with role `"Staff"`.

### 2.5 List Staff Accounts
- **Endpoint:** `GET /api/auth/staff`
- **Access:** `Admin`, `Organizer`
- **Response (200 OK):** Returns array of staff accounts with their assigned event IDs.

---

## 3. Events (`/api/events`)

### 3.1 List Events
- **Endpoint:** `GET /api/events`
- **Access:** Public
- **Query Parameters:**
  - `search` (string): ReDoS-shielded search against name, description, and location.
  - `category` (string): Filter by category (e.g. `Technology`, `Academic`, `Workshop`).
  - `status` (string): Filter by `active`, `upcoming`, `completed`, `cancelled`.
  - `page` (number), `limit` (number): Pagination parameters.
- **Response (200 OK):**
  ```json
  {
    "events": [ ... ],
    "total": 4,
    "page": 1,
    "pages": 1
  }
  ```

### 3.2 Get Single Event
- **Endpoint:** `GET /api/events/:id`
- **Access:** Public
- **Description:** Returns full event metadata with live atomic participant/check-in aggregations (`registeredCount`, `checkedInCount`, `remainingSeats`).

### 3.3 Create Event
- **Endpoint:** `POST /api/events`
- **Access:** `Admin`, `Organizer`
- **Request Body:**
  ```json
  {
    "name": "TechFest 2026: Innovation Summit",
    "description": "Annual technology and software engineering conference.",
    "date": "2026-11-20T09:00:00.000Z",
    "location": "Auditorium Hall A",
    "locationUrl": "https://maps.google.com/?q=Auditorium+Hall+A",
    "capacity": 150,
    "category": "Technology",
    "tags": ["AI", "Web3", "Cloud"],
    "ticketTiers": [
      { "name": "Standard Access", "price": 0, "capacity": 100 },
      { "name": "VIP Access", "price": 499, "capacity": 50 }
    ],
    "assignedStaff": []
  }
  ```

### 3.4 Assign Staff to Event
- **Endpoint:** `PUT /api/events/:id/staff`
- **Access:** `Admin`, `Organizer`
- **Request Body:** `{ "staffIds": ["60d0fe..."] }`
- **Response (200 OK):** Returns updated event record.

### 3.5 Real-Time Crowd Telemetry
- **Endpoint:** `GET /api/events/:id/crowd`
- **Access:** `Admin`, `Organizer`, assigned `Staff`
- **Response (200 OK):**
  ```json
  {
    "capacity": 100,
    "registered": 85,
    "checkedIn": 42,
    "turnoutPercentage": 49.4,
    "occupancyPercentage": 42.0,
    "scansLast10Min": 18,
    "checkInVelocityPerMin": 1.8,
    "crowdAlert": "NORMAL"
  }
  ```
  *(Alert levels: `NORMAL`, `CAPACITY_WARNING` [>=85%], `CAPACITY_CRITICAL` [>=95%])*

### 3.6 Event Analytics
- **Endpoint:** `GET /api/events/:id/analytics`
- **Access:** `Admin`, `Organizer`, assigned `Staff`
- **Response (200 OK):** Returns deep metrics: hourly check-in distribution, ticket tier distribution, duplicate scans blocked, cancellation counts, and gate velocity.

### 3.7 Export Attendees as CSV
- **Endpoint:** `GET /api/events/:id/export`
- **Access:** `Admin`, `Organizer`
- **Security:** Cells sanitized against CSV/Excel Formula Injection (`=`, `+`, `-`, `@`, `\t`, `\r`).
- **Response:** `Content-Type: text/csv` download stream.

---

## 4. Participant Registration & Self-Service (`/api/participants` & `/api/events/:id/register`)

### 4.1 Register for Event
- **Endpoint:** `POST /api/events/:id/register`
- **Access:** Public
- **Validations:**
  - RFC 5322 email regex verification.
  - E.164 phone number verification.
  - Capacity bounds check.
  - Duplicate registration prevention (`409 Conflict`).
- **Request Body:**
  ```json
  {
    "name": "Alex Smith",
    "email": "alex.smith@example.com",
    "phone": "+15551234567",
    "ticketTier": "Standard Access"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "participant": {
      "participantId": "PAR-ABC123",
      "entryCode": "TR89X1",
      "qrToken": "5f9a0...32-char-hmac-signed-token",
      "status": "registered",
      "ticketTier": "Standard Access"
    }
  }
  ```

### 4.2 Join Waitlist
- **Endpoint:** `POST /api/events/:id/waitlist`
- **Access:** Public (Active when event reaches capacity)
- **Response (200 OK):** Returns waitlist position and receipt timestamp.

### 4.3 Attendee Ticket Cancellation (Self-Service)
- **Endpoint:** `POST /api/participants/:id/cancel`
- **Access:** Public (With matching email/ticket verification) or Authenticated User
- **Automated Workflow:**
  1. Sets ticket status to `cancelled`.
  2. Empties the reserved seat.
  3. Automatically promotes the first active participant from the event waitlist.
  4. Generates an active ticket for the promoted user.
- **Response (200 OK):** Returns cancellation confirmation and promotion audit log.

### 4.4 Organizer Ticket Revocation
- **Endpoint:** `POST /api/participants/:id/revoke`
- **Access:** `Admin`, `Organizer`
- **Request Body:** `{ "reason": "Violation of code of conduct" }`
- **Response (200 OK):** Ticket immediately marked `revoked` and barred from all gate terminals.

### 4.5 Attendee Passes Portal
- **Endpoint:** `GET /api/participants/me`
- **Access:** Authenticated `User` / `Participant`
- **Response (200 OK):** Returns all registered passes for the caller's email with QR codes, entry codes, and live statuses.

---

## 5. Check-In & Gate Verification (`/api/checkin`)

### 5.1 Pre-Verification / Lookup
- **Endpoint:** `POST /api/checkin/verify`
- **Access:** `Admin`, `Organizer`, assigned `Staff`
- **Request Body:** `{ "code": "TR89X1", "eventId": "..." }`
- **Response (200 OK):** Inspects ticket status without performing check-in.

### 5.2 Process Check-In (Real-Time Scan)
- **Endpoint:** `POST /api/checkin`
- **Access:** `Admin`, `Organizer`, assigned `Staff`
- **Request Body:**
  ```json
  {
    "token": "5f9a0...32-char-hmac-signed-token",
    "eventId": "6af820c6a570434371e1520e",
    "gate": "Gate 1 - East Entrance"
  }
  ```
- **Responses:**
  - `200 OK`: Valid scan. Returns participant details, check-in timestamp, and gate.
  - `409 Conflict`: Duplicate scan. Returns `ALREADY_CHECKED_IN` and original check-in timestamp. Logs repeat scan attempt.
  - `403 Forbidden`: `TICKET_REVOKED` or `TICKET_CANCELLED`.
  - `404 Not Found`: Invalid or forged token.

### 5.3 Offline Check-In Batch Synchronization
- **Endpoint:** `POST /api/checkin/offline-sync`
- **Access:** `Admin`, `Organizer`, assigned `Staff`
- **Request Body:**
  ```json
  {
    "eventId": "6af820c6a570434371e1520e",
    "records": [
      {
        "code": "TR89X1",
        "timestamp": "2026-11-20T10:15:30.000Z",
        "gate": "Offline Terminal B"
      }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "total": 1,
    "successful": 1,
    "conflicts": 0,
    "alreadyCheckedIn": 0,
    "details": [ ... ]
  }
  ```

### 5.4 Check-In Gate Audit Logs
- **Endpoint:** `GET /api/checkin/history/:eventId`
- **Access:** `Admin`, `Organizer`, assigned `Staff`
- **Response (200 OK):** Paginated chronological audit log of all gate check-ins, duplicate scan rejections, gate locations, and staff identities.

---

## 6. AI Event Assistant & Recommendations (`/api/ai`)

*Powered by Google Gemini Generative AI (with deterministic fallback when `GEMINI_API_KEY` is omitted).*

### 6.1 Generate Event Copy & Description
- **Endpoint:** `POST /api/ai/generate-description`
- **Access:** `Admin`, `Organizer`
- **Body:** `{ "title": "...", "category": "...", "targetAudience": "..." }`
- **Response (200 OK):** Returns structured overview, key highlights, and recommended agenda.

### 6.2 Generate Event FAQs
- **Endpoint:** `POST /api/ai/generate-faqs`
- **Access:** `Admin`, `Organizer`
- **Body:** `{ "title": "...", "category": "..." }`
- **Response (200 OK):** Returns array of `{ question, answer }` objects.

### 6.3 Grounded Attendee Q&A
- **Endpoint:** `POST /api/ai/ask-event`
- **Access:** Public
- **Body:** `{ "eventId": "...", "question": "Where is the event and when do doors open?" }`
- **Response (200 OK):** Returns strictly grounded answers extracted directly from the verified event schema (venue, timing, rules, agenda).

### 6.4 Smart Recommendations
- **Endpoint:** `GET /api/ai/recommendations`
- **Access:** Public
- **Query Params:** `category`, `excludeId`
- **Response (200 OK):** Recommends top matching upcoming events based on category, tags, and audience interest.

---

## 7. Payments & Billing (`/api/payments`)

*Powered by Razorpay (with cryptographic HMAC-SHA256 signature verification).*

### 7.1 Create Server-Side Order
- **Endpoint:** `POST /api/payments/create-order`
- **Access:** Public
- **Body:** `{ "eventId": "...", "amount": 250, "currency": "INR" }`
- **Response (200 OK):** Returns `order_id`, calculated amount in smallest currency unit (paise), and currency.

### 7.2 Cryptographic Payment Verification
- **Endpoint:** `POST /api/payments/verify`
- **Access:** Public
- **Body:**
  ```json
  {
    "razorpay_order_id": "order_xyz",
    "razorpay_payment_id": "pay_123",
    "razorpay_signature": "<hmac_sha256_hex>",
    "participantId": "PAR-ABC123"
  }
  ```
- **Security:** Verifies `crypto.timingSafeEqual` between frontend signature and server-generated signature. Updates participant status to `PAID`.

---

## 8. Health & Diagnostics (`/api/health`)

- **Endpoint:** `GET /api/health`
- **Access:** Public
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "service": "EventEase API",
    "version": "2.0.0",
    "timestamp": "2026-11-14T08:50:13.663Z"
  }
  ```

