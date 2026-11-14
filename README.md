# EventEase — Modern Event Management & Security Platform (2026 Edition)

> **Enterprise-grade, secure, and scalable event operating system for universities, conferences, and high-throughput events.**  
> Built with React 19, TypeScript, Vite, Tailwind CSS, Node.js, Express, MongoDB, Google Gemini AI, and Razorpay.

[![CI Tests](https://img.shields.io/badge/Tests-52%2F52%20Passing-brightgreen?style=flat-square)](run-all-tests.js)
[![Vite Build](https://img.shields.io/badge/Frontend%20Build-Optimized%20Chunks-blue?style=flat-square)](client/vite.config.ts)
[![Security](https://img.shields.io/badge/OWASP-Hardened%20(HMAC%20%2B%20CSP%20%2B%20ReDoS%20Shield)-purple?style=flat-square)](PROJECT_AUDIT.md)

---

## 🌟 Key Highlights & 2026 Capabilities

### 1. 🛡️ Cryptographic Security & Anti-Fraud
- **HMAC-SHA256 Signed QR Tokens:** QR codes are signed cryptographically with server-side secrets, preventing token forgery and PII exposure.
- **Atomic Duplicate Prevention:** Hard race-condition resistance using atomic MongoDB updates. Simultaneous scans for the same pass reject subsequent scans immediately with `409 ALREADY_CHECKED_IN` and log suspicious repeated scan audits.
- **OWASP Hardened:** HTTP headers via Helmet, multi-tier express-rate-limit, ReDoS regex injection shields, and CSV/Excel Formula Injection neutralization (`=`, `+`, `-`, `@`).

### 2. 🎟️ Smart Registration & Dynamic Waitlist
- **Atomic Capacity Enforcement:** Real-time seat reservation prevents overselling even under heavy concurrent traffic.
- **Automated Waitlist Seat Promotion:** When an attendee cancels their ticket, the system automatically frees the seat and promotes the next eligible waitlisted candidate with instant pass generation.
- **Ticket Revocation:** Organizers can revoke compromised or violative tickets with reasons, barring them from gate check-in.
- **Participant Self-Service:** Attendees can view all registered passes, download high-contrast QR tickets, and cancel registrations via `/my-registrations`.

### 3. 📱 High-Speed Gate Terminal & Offline Sync
- **Camera & Manual Backup:** Live optical scanning (`html5-qrcode`) + 6-character backup entry codes (e.g., `TQBYTW`).
- **Offline Check-In Mode:** Check-in staff can scan tickets offline without internet. Scans queue in IndexedDB/localStorage and seamlessly synchronize with conflict resolution when network reconnects.
- **Live Crowd Telemetry:** Real-time occupancy percentage, check-in velocity (scans/minute), and automated capacity threshold alerts (`NORMAL`, `CAPACITY_WARNING` @ 85%, `CAPACITY_CRITICAL` @ 95%).

### 4. 🤖 Next-Gen AI & Payment Integrations
- **Google Gemini AI Event Assistant:** AI description writer, automatic event FAQ generator, grounded attendee Q&A drawer, and smart event recommendations.
- **Razorpay Payments:** Server-side order creation, cryptographic HMAC-SHA256 signature verification, and safe simulation fallback.

### 5. 🎨 Modern SaaS UX & PWA
- **Dark & Light Mode:** Theme switcher with persistent storage and system theme detection.
- **PWA Ready:** Installable application with `manifest.webmanifest`.
- **Bundle Optimization:** Custom chunk splitting (`vendor`, `charts`, `icons`, `deps`) keeping all bundles under 450 kB.

---

## 👥 4-Tier Role-Based Access Control (RBAC)

EventEase implements strict role-based authorization with event-scoped access:

| Role | Default Seed Account | Password | Scope & Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@eventease.com` | `password123` | System-wide administrative control, staff roster management, diagnostics |
| **Organizer** | `organizer@eventease.com` | `password123` | Create/edit events, ticket tiers, assign staff, revoke tickets, export CSV |
| **Check-in Staff** | `staff@eventease.com` | `password123` | Gate terminal, QR scanning, offline check-in, crowd telemetry (scoped to assigned events) |
| **Participant** | `participant@eventease.com` | `password123` | Browse events, register, self-service pass portal, ticket cancellation |

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Axios, Recharts, Lucide React, HTML5-QRCode, Canvas-Confetti.
- **Backend:** Node.js (ES Modules), Express.js, MongoDB 8.0, Mongoose.
- **Security:** Helmet, Express Rate Limit, JWT, bcrypt, HMAC-SHA256.
- **AI & Integrations:** Google Gemini API (`@google/genai`), Razorpay SDK.

---

## 🚀 Quick Start & Development

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **MongoDB:** Running locally on `mongodb://127.0.0.1:27017/eventease` or MongoDB Atlas URI

### 2. Environment Configuration
Copy the template and configure your environment variables:
```bash
cp server/.env.example server/.env
```

### 3. Install Dependencies & Seed Database
```bash
# Install server & client dependencies
npm install
npm --prefix server install
npm --prefix client install

# Seed demo users, events, and sample participants
npm run seed
```

### 4. Run Development Servers
```bash
# Concurrently start backend (port 5000) and frontend (port 5173)
npm run dev

# Or start individually:
npm run server   # Express backend on http://localhost:5000
npm run client   # Vite frontend on http://localhost:5173
```

---

## 🧪 Comprehensive Automated Test Suites

EventEase includes an automated test runner executing **52 comprehensive test steps** across 3 test suites:

```bash
# Run all 3 test suites concurrently (spawns DB, server, and runs all suites)
node run-all-tests.js
```

### Test Suites Included:
1. **Core Workflow Verification (`test-workflow.js`):** 21 mandatory steps testing registration, QR token generation, entry code verification, check-in, duplicate prevention, and analytics.
2. **Concurrency & Race-Condition Stress Test (`test-concurrency.js`):** 10 simultaneous concurrent check-in requests verifying that exactly 1 succeeds and 9 are rejected with `409 ALREADY_CHECKED_IN`.
3. **Advanced 2026 Features & Security Audit (`test-advanced-features.js`):** 21 advanced steps testing 4-tier RBAC, staff provisioning, email validation, waitlist promotion, ticket revocation, offline sync, crowd telemetry, ReDoS shielding, CSV formula sanitization, AI Q&A, and Razorpay signature verification.

To run the frontend production build verification:
```bash
npm --prefix client run build
```

---

## 🔑 Features Requiring External API Credentials

EventEase is built to be **fully operational out-of-the-box** without any mandatory external accounts. The platform uses built-in smart simulation engines when external keys are not provided.

To activate live external cloud services in production, configure the following in `server/.env`:

| Feature | Environment Variable | Service Provider | Live Behavior When Configured | Fallback When Omitted |
| :--- | :--- | :--- | :--- | :--- |
| **AI Event Assistant** | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/) | Live generative copy, grounded Q&A, and category suggestions using Gemini models. | Deterministic smart rule-based AI copy and grounded schema extraction. |
| **Payment Gateway** | `RAZORPAY_KEY_ID`<br>`RAZORPAY_KEY_SECRET` | [Razorpay Dashboard](https://dashboard.razorpay.com/) | Live payment checkout, webhook handling, and cryptographic HMAC-SHA256 verification. | Built-in payment simulation mode with mock transaction receipts. |

---

## 📚 Project Documentation

- 📋 [**PROJECT_AUDIT.md**](file:///d:/Project/EventEase/PROJECT_AUDIT.md): Comprehensive pre-implementation audit covering architecture, security vulnerabilities, bottlenecks, and the 8-phase enhancement roadmap.
- 📖 [**API_DOCUMENTATION.md**](file:///d:/Project/EventEase/API_DOCUMENTATION.md): Complete RESTful API specification covering all endpoints, query parameters, payloads, and status codes.
- 🚀 [**DEPLOYMENT.md**](file:///d:/Project/EventEase/DEPLOYMENT.md): Production deployment guide covering PM2, Nginx reverse proxy, Docker, SSL/TLS certificates, and MongoDB Atlas.
- 📝 [**CHANGELOG.md**](file:///d:/Project/EventEase/CHANGELOG.md): Detailed chronicle of architectural and security enhancements from v1.0.0 to v2.0.0.

---

## 📄 License
MIT License. Created for production-grade university, corporate, and public event management.
