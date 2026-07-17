# SmartAlert Server

Backend API for SmartAlert, a lecture timetable and real-time class alert
system for the Department of Computer Science, University of Benin. It
replaces the WhatsApp-and-notice-board way lecture changes get shared: a
lecturer cancels or reschedules a session in one action, and every enrolled
student is notified through two channels at once — an in-app real-time alert
(Socket.io) for students currently online, and an email (Nodemailer) that
reaches everyone regardless of connection state.

## Overview

The project is a Node.js + Express + TypeScript server backed by MongoDB, with
Socket.io running on the same HTTP server as the REST API.

Three roles share one data model:

- **Student** — registers, searches and enrols in courses, views a personal
  weekly timetable, receives in-app + email alerts, browses notification
  history.
- **Lecturer** — views their own sessions, cancels or reschedules a session.
  A single action triggers the dual-channel alert to every enrolled student.
- **Admin** — manages departments, courses, the master schedule, and user
  accounts (create/edit/deactivate any role).

## Core Features

- JWT auth (15-minute access token, 7-day httpOnly-cookie refresh token) +
  bcrypt password hashing, role-checked middleware on every protected route.
- The dual-channel notification pipeline: cancel/reschedule → update session
  status → fan out to Socket.io (online students) and Nodemailer (every
  enrolled student) in parallel → record a `Notification` document.
- Scoped session listing: a lecturer sees only the courses they teach, a
  student sees only their enrolments, an admin sees the full schedule.
- Admin user management (edit/deactivate rather than delete, so a lecturer's
  history on past sessions is never orphaned).
- Zod request validation on every route, following the same
  `validateRequest(schema)` pattern as the department's other backend
  services.

## Project Structure

```
src/
├─ app.ts                     ← Express app: security middleware, swagger, versioned router
├─ index.ts                   ← Entry point: env validation, Mongo connection, Socket.io bootstrap
├─ db/
│  └─ database.ts             ← Mongoose connection with retry
├─ model/
│  └─ user.model.ts           ← Shared across all three roles
├─ Timetable/
│  ├─ models/                 ← Course, TimetableSession
│  ├─ controllers/
│  └─ routes/                 ← courses + sessions (cancel/reschedule live here)
├─ Enrolment/
│  ├─ models/
│  ├─ controllers/
│  └─ routes/
├─ Notifications/
│  ├─ models/                 ← Notification (delivery record, not the transport itself)
│  ├─ controllers/
│  └─ routes/                 ← student notification history
├─ controllers/
│  └─ auth.controller.ts, admin.controller.ts
├─ routes/
│  └─ auth.routes.ts, admin.routes.ts, index.ts (mounts every sub-router)
├─ middleware/
│  ├─ auth.middleware.ts       ← authenticateToken, authorize(...roles), rateLimiter
│  ├─ validateRequest.ts
│  ├─ errorHandler.ts
│  └─ notFound.ts
├─ services/
│  ├─ token.service.ts         ← access/refresh token issuance, rotation, blacklist
│  ├─ email.service.ts         ← Nodemailer transporter + templated sends
│  └─ notification.service.ts ← the dual-channel dispatch pipeline itself
├─ sockets/
│  └─ index.ts                 ← Socket.io init, JWT handshake auth, userId→socket map
├─ templates/emails/           ← cancelled / rescheduled / welcome templates + shared styles
├─ utils/
│  ├─ asyncHandler.ts, customErrors.ts, ResponseHelpers.ts
│  ├─ logger.ts, validateEnv.ts, securityConfig.ts, passwordGenerator.ts
│  └─ departments.ts           ← UNIBEN faculty/department reference data
└─ scripts/
   ├─ createAdmin.ts           ← npm run seed:admin
   ├─ seedDemoData.ts          ← npm run seed:demo (local testing without a frontend)
   └─ loadTest.ts              ← npm run loadtest (Chapter 4, Section 4.5.4)
```

## Setup

```bash
npm install
cp .env.example .env   # fill in the values described below
npm run seed:admin     # creates the admin account from ADMIN_* env vars
npm run dev
```

The server boots on `PORT` (default 4000) with the REST API under `/api/v1`
and Swagger docs at `/api-docs`. Socket.io shares the same HTTP server and
path (`/socket.io`), authenticated with the same access token as the REST API
— pass it as `auth: { token }` in the client's `io()` call.

### Environment variables

| Variable | Notes |
|---|---|
| `NODE_ENV` | `development` \| `test` \| `production` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `PORT` | defaults to 4000 |
| `FRONTEND_URL` | used for CORS defaults, refresh-cookie domain, and links in emails |
| `ALLOWED_ORIGINS` | comma-separated CORS origins beyond `FRONTEND_URL` |
| `API_URL` | base URL this API is reachable at (used by the load test script) |
| `LOG_LEVEL` | winston level, e.g. `info` |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | separate secrets, 15 min / 7 day expiry |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | any SMTP provider works, not just Gmail |
| `EMAIL_FROM` | e.g. `SmartAlert <alerts@yourdomain>` |
| `SUPPORT_EMAIL` | contact address surfaced on failures |
| `ADMIN_NAME` / `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_DEPARTMENT` | consumed only by `npm run seed:admin` |

### Demo data

`npm run seed:demo` creates one lecturer, three students, two courses, and a
couple of timetable sessions in the Department of Computer Science — enough
to exercise `PATCH /sessions/:id/cancel` and `/reschedule` by hand with a REST
client before a frontend exists. It's safe to re-run; it skips records that
already exist. Every seeded account's password is `Password123!`.

## Testing

```bash
npm test
```

Jest + Supertest, with `mongodb-memory-server` spinning up a real (in-memory)
MongoDB instance per test run — no `MONGODB_URI` from `.env` is touched.
`src/services/email.service.ts` is mocked in every test file so no real SMTP
connection is attempted; assertions check that the right template function
was called with the right recipients instead. Coverage follows the plan in
the PRD: success case, missing/malformed fields, no token, and wrong role for
every route, plus the cancel/reschedule pipeline's ownership check and its
`Notification` side effect.

> These tests weren't run inside the tool that generated this scaffold — that
> sandbox's network policy blocks `fastdl.mongodb.org`, which
> `mongodb-memory-server` needs to download its first `mongod` binary. `tsc`
> and `eslint` were run clean, and the Express app boots and correctly
> validates requests. On a normal machine or CI with internet access,
> `npm test` will pull that one-time binary and run the whole suite locally.

## Load testing

```bash
npm run dev            # in one terminal
npm run loadtest        # in another
```

Reproduces Chapter Four's load test: 50 concurrent Socket.io connections, one
cancellation, per-client delivery latency. Test accounts, the course, and the
session are created directly against the database and cleaned up afterward,
so it doesn't pollute real data or count registration/login time toward the
result — only handshake + event delivery is measured.

## Known limitations (carried over from Chapter Four, Section 4.6)

- Single department (Computer Science) for this launch phase — the schema
  supports more (`utils/departments.ts` already lists three faculties), but
  seed data and testing target one.
- No SMS channel — in-app + email only, by design (Section 1.2).
- Render.com's free tier introduces a cold-start delay after inactivity; the
  load test numbers assume a warm backend.
