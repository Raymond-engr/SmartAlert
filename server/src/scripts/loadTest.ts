import mongoose from 'mongoose';
import axios from 'axios';
import { io as ioClient, Socket } from 'socket.io-client';
import connectDB from '../db/database';
import validateEnv from '../utils/validateEnv';
import logger from '../utils/logger';
import User, { UserRole } from '../model/user.model';
import Course from '../Timetable/models/course.model';
import TimetableSession, {
  SessionStatus,
} from '../Timetable/models/timetableSession.model';
import Enrolment from '../Enrolment/models/enrolment.model';
import tokenService from '../services/token.service';
import { SESSION_UPDATE_EVENT } from '../services/notification.service';
import { LAUNCH_DEPARTMENT } from '../utils/departments';

validateEnv();

const CLIENT_COUNT = 50;
const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}`;
const SOCKET_URL = API_URL.replace(/\/api\/v1$/, '');

/**
 * Reproduces the load test reported in Chapter Four, Section 4.5.4: 50
 * concurrent WebSocket connections, one cancellation, per-client delivery
 * latency.
 *
 * Requires the server to already be running (`npm run dev` in another
 * terminal) — this script is a client, not the server under test.
 *
 * Test accounts, the course, and the session are created directly against
 * the database (bypassing the registration and login endpoints) so the
 * 50-connection setup itself isn't rate-limited or timed as part of the
 * result; only socket handshake + event delivery is measured.
 */
const runLoadTest = async (): Promise<void> => {
  await connectDB();
  logger.info(`Connected to database, provisioning ${CLIENT_COUNT} test students`);

  const lecturer = await User.create({
    name: 'Load Test Lecturer',
    email: `loadtest-lecturer-${Date.now()}@csc.uniben.edu`,
    password: 'Password123!',
    role: UserRole.LECTURER,
    department: LAUNCH_DEPARTMENT,
    isActive: true,
  });

  const course = await Course.create({
    code: `LT${Date.now() % 100000}`,
    name: 'Load Test Course',
    department: LAUNCH_DEPARTMENT,
    units: 3,
    lecturer: lecturer._id,
  });

  const session = await TimetableSession.create({
    course: course._id,
    day: 'Monday',
    startTime: '08:00',
    endTime: '10:00',
    venue: 'Load Test Hall',
    status: SessionStatus.SCHEDULED,
  });

  const students = await User.insertMany(
    Array.from({ length: CLIENT_COUNT }, (_, i) => ({
      name: `Load Test Student ${i + 1}`,
      email: `loadtest-student-${Date.now()}-${i}@csc.uniben.edu`,
      password: 'Password123!',
      role: UserRole.STUDENT,
      department: LAUNCH_DEPARTMENT,
      isActive: true,
    }))
  );

  await Enrolment.insertMany(
    students.map((student) => ({ student: student._id, course: course._id }))
  );

  const lecturerTokens = tokenService.generateTokens({
    userId: String(lecturer._id),
    email: lecturer.email,
    role: lecturer.role,
  });

  logger.info(`Opening ${CLIENT_COUNT} socket connections to ${SOCKET_URL}`);

  const latencies: number[] = [];
  const sockets: Socket[] = [];
  let cancelSentAt = 0;

  const connectPromises = students.map((student) => {
    const tokens = tokenService.generateTokens({
      userId: String(student._id),
      email: student.email,
      role: student.role,
    });

    return new Promise<void>((resolve, reject) => {
      const socket = ioClient(SOCKET_URL, {
        auth: { token: tokens.accessToken },
        transports: ['websocket'],
      });
      sockets.push(socket);

      socket.on('connect', () => resolve());
      socket.on('connect_error', (err) => reject(err));

      socket.on(SESSION_UPDATE_EVENT, () => {
        latencies.push(Date.now() - cancelSentAt);
      });
    });
  });

  await Promise.all(connectPromises);
  logger.info(`All ${CLIENT_COUNT} clients connected. Triggering cancellation...`);

  cancelSentAt = Date.now();
  await axios.patch(
    `${API_URL}/sessions/${session._id}/cancel`,
    {},
    { headers: { Authorization: `Bearer ${lecturerTokens.accessToken}` } }
  );

  // Give the slowest client a generous window before reporting.
  await new Promise((resolve) => setTimeout(resolve, 5000));

  sockets.forEach((s) => s.disconnect());

  const sorted = [...latencies].sort((a, b) => a - b);
  const mean = sorted.reduce((sum, v) => sum + v, 0) / (sorted.length || 1);
  const max = sorted[sorted.length - 1] ?? 0;

  logger.info('--- Load test results ---');
  logger.info(`Clients connected: ${CLIENT_COUNT}`);
  logger.info(`Events received:   ${latencies.length}`);
  logger.info(`Mean latency:      ${mean.toFixed(1)} ms`);
  logger.info(`Max latency:       ${max} ms`);
  logger.info(`Under 5000ms:      ${latencies.filter((l) => l < 5000).length}/${latencies.length}`);

  // Clean up so repeated runs don't accumulate load-test accounts.
  await Enrolment.deleteMany({ course: course._id });
  await TimetableSession.deleteOne({ _id: session._id });
  await Course.deleteOne({ _id: course._id });
  await User.deleteOne({ _id: lecturer._id });
  await User.deleteMany({ _id: { $in: students.map((s) => s._id) } });

  await mongoose.disconnect();
  process.exit(0);
};

runLoadTest().catch((error) => {
  logger.error('Load test failed:', error instanceof Error ? error : String(error));
  process.exit(1);
});
