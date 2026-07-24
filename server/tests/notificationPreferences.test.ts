import request from 'supertest';
import app from '../src/app';
import User, { UserRole } from '../src/model/user.model';
import Course from '../src/Timetable/models/course.model';
import TimetableSession, {
  SessionStatus,
} from '../src/Timetable/models/timetableSession.model';
import Enrolment from '../src/Enrolment/models/enrolment.model';
import { NotificationType } from '../src/Notifications/models/notification.model';
import emailService from '../src/services/email.service';
import { emitToUser } from '../src/sockets';
import notificationService from '../src/services/notification.service';
import { createUserWithToken } from './testUtils';

// The factory must not close over anything declared in this file: jest hoists
// it above the imports.
jest.mock('../src/services/email.service', () => ({
  __esModule: true,
  default: {
    verifyConnection: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendSessionCancelledEmail: jest.fn().mockResolvedValue(undefined),
    sendSessionRescheduledEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

// emitToUser is stubbed to report every online student as delivered, so the
// gating (not the socket map) is what the assertions observe.
jest.mock('../src/sockets', () => ({
  __esModule: true,
  emitToUser: jest.fn().mockReturnValue(true),
}));

const mockEmailService = emailService as jest.Mocked<typeof emailService>;
const mockEmitToUser = emitToUser as jest.MockedFunction<typeof emitToUser>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('PATCH /api/v1/auth/me notificationPreferences', () => {
  it('persists a preference change and reflects it via GET /auth/me', async () => {
    const { token } = await createUserWithToken({
      email: 'prefs1@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    const patch = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationPreferences: { email: false } });

    expect(patch.status).toBe(200);
    expect(patch.body.user.notificationPreferences).toEqual({
      inApp: true,
      email: false,
    });

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.user.notificationPreferences).toEqual({
      inApp: true,
      email: false,
    });
  });

  it('preserves the untouched channel on a partial update', async () => {
    const { token } = await createUserWithToken({
      email: 'prefs2@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    // Turn inApp off first.
    await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationPreferences: { inApp: false } });

    // Now change only email; inApp must remain false.
    const patch = await request(app)
      .patch('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .send({ notificationPreferences: { email: false } });

    expect(patch.status).toBe(200);
    expect(patch.body.user.notificationPreferences).toEqual({
      inApp: false,
      email: false,
    });
  });

  it('defaults both channels to true for a freshly registered user', async () => {
    const { token } = await createUserWithToken({
      email: 'prefs3@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    const me = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.body.user.notificationPreferences).toEqual({
      inApp: true,
      email: true,
    });
  });
});

describe('dispatchSessionUpdate channel gating', () => {
  const buildCourseWithSession = async () => {
    const lecturer = await User.create({
      name: 'Lecturer',
      email: 'preflecturer@csc.uniben.edu',
      password: 'Password123!',
      role: UserRole.LECTURER,
      department: 'Department of Computer Science',
    });

    const course = await Course.create({
      code: 'CSC 401',
      name: 'Distributed Systems',
      department: 'Department of Computer Science',
      units: 3,
      lecturer: lecturer._id,
    });

    const session = await TimetableSession.create({
      course: course._id,
      day: 'Monday',
      startTime: '10:00',
      endTime: '12:00',
      venue: 'PSC Lecture Theatre 1',
      status: SessionStatus.CANCELLED,
    });

    return { course, session };
  };

  const enrol = async (
    email: string,
    prefs: { inApp?: boolean; email?: boolean },
    course: { _id: unknown }
  ) => {
    const student = await User.create({
      name: 'Student',
      email,
      password: 'Password123!',
      role: UserRole.STUDENT,
      department: 'Department of Computer Science',
      notificationPreferences: prefs,
    });
    await Enrolment.create({ student: student._id, course: course._id });
    return student;
  };

  it('excludes an email:false student from the email send but keeps their socket emit', async () => {
    const { course, session } = await buildCourseWithSession();

    const emailOptedOut = await enrol(
      'emailoff@csc.uniben.edu',
      { inApp: true, email: false },
      course
    );
    const fullyOptedIn = await enrol(
      'allon@csc.uniben.edu',
      { inApp: true, email: true },
      course
    );

    const result = await notificationService.dispatchSessionUpdate({
      session: session as any,
      course: course as any,
      type: NotificationType.CANCELLED,
    });

    // Only the opted-in student is emailed.
    expect(mockEmailService.sendSessionCancelledEmail).toHaveBeenCalledTimes(1);
    expect(mockEmailService.sendSessionCancelledEmail).toHaveBeenCalledWith(
      'allon@csc.uniben.edu',
      expect.anything(),
      'CSC 401',
      expect.anything(),
      expect.anything()
    );
    expect(result.emailsSent).toBe(1);

    // Both students still get the in-app emit (inApp is true for both).
    const socketTargets = mockEmitToUser.mock.calls.map((call) => call[0]);
    expect(socketTargets).toContain(String(emailOptedOut._id));
    expect(socketTargets).toContain(String(fullyOptedIn._id));
    expect(result.socketsDelivered).toBe(2);

    // The history record still covers every enrolled active student.
    expect(result.recipientCount).toBe(2);
    expect(result.notification.recipients).toHaveLength(2);
  });

  it('skips the socket emit for an inApp:false student but still emails them', async () => {
    const { course, session } = await buildCourseWithSession();

    const inAppOptedOut = await enrol(
      'inappoff@csc.uniben.edu',
      { inApp: false, email: true },
      course
    );

    const result = await notificationService.dispatchSessionUpdate({
      session: session as any,
      course: course as any,
      type: NotificationType.CANCELLED,
    });

    // No socket emit went to the inApp-off student.
    const socketTargets = mockEmitToUser.mock.calls.map((call) => call[0]);
    expect(socketTargets).not.toContain(String(inAppOptedOut._id));
    expect(result.socketsDelivered).toBe(0);

    // But email still fires and the record still covers them.
    expect(mockEmailService.sendSessionCancelledEmail).toHaveBeenCalledTimes(1);
    expect(result.emailsSent).toBe(1);
    expect(result.recipientCount).toBe(1);
  });
});
