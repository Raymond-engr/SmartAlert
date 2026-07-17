import request from 'supertest';
import app from '../src/app';
import { UserRole } from '../src/model/user.model';
import Course from '../src/Timetable/models/course.model';
import TimetableSession, {
  SessionStatus,
} from '../src/Timetable/models/timetableSession.model';
import Enrolment from '../src/Enrolment/models/enrolment.model';
import Notification, {
  NotificationType,
} from '../src/Notifications/models/notification.model';
import emailService from '../src/services/email.service';
import { createUserWithToken } from './testUtils';

// The factory must not close over anything declared in this file: jest hoists
// it above the imports, and importing `app` pulls in the email service, so a
// reference to a `const` down here would be read before it is initialised.
jest.mock('../src/services/email.service', () => ({
  __esModule: true,
  default: {
    verifyConnection: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendSessionCancelledEmail: jest.fn().mockResolvedValue(undefined),
    sendSessionRescheduledEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

const mockEmailService = emailService as jest.Mocked<typeof emailService>;

beforeEach(() => {
  jest.clearAllMocks();
});

/** Creates a lecturer, a course they teach, and one scheduled session. */
const buildCourseWithSession = async () => {
  const { user: lecturer, token: lecturerToken } = await createUserWithToken({
    email: 'lecturer@csc.uniben.edu',
    role: UserRole.LECTURER,
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
  });

  return { lecturer, lecturerToken, course, session };
};

describe('PATCH /api/v1/sessions/:id/cancel', () => {
  it('cancels a session, notifies enrolled students, and records a notification when called by its lecturer', async () => {
    const { lecturerToken, course, session } = await buildCourseWithSession();

    const { user: student1 } = await createUserWithToken({
      email: 'student1@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    const { user: student2 } = await createUserWithToken({
      email: 'student2@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    await Enrolment.create({ student: student1._id, course: course._id });
    await Enrolment.create({ student: student2._id, course: course._id });

    const res = await request(app)
      .patch(`/api/v1/sessions/${session._id}/cancel`)
      .set('Authorization', `Bearer ${lecturerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.recipientCount).toBe(2);
    expect(res.body.data.emailsSent).toBe(2);

    const updatedSession = await TimetableSession.findById(session._id);
    expect(updatedSession?.status).toBe(SessionStatus.CANCELLED);

    const note = await Notification.findOne({ session: session._id });
    expect(note).not.toBeNull();
    expect(note!.type).toBe(NotificationType.CANCELLED);
    expect(note!.recipients).toHaveLength(2);

    expect(mockEmailService.sendSessionCancelledEmail).toHaveBeenCalledTimes(2);
  });

  it('rejects the request when the caller is a student, not a lecturer', async () => {
    const { session } = await buildCourseWithSession();
    const { token: studentToken } = await createUserWithToken({
      email: 'onlooker@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    const res = await request(app)
      .patch(`/api/v1/sessions/${session._id}/cancel`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });

  it('rejects the request when the caller is a lecturer who does not teach this course', async () => {
    const { session } = await buildCourseWithSession();
    const { token: otherLecturerToken } = await createUserWithToken({
      email: 'otherlecturer@csc.uniben.edu',
      role: UserRole.LECTURER,
    });

    const res = await request(app)
      .patch(`/api/v1/sessions/${session._id}/cancel`)
      .set('Authorization', `Bearer ${otherLecturerToken}`);

    expect(res.status).toBe(403);
  });

  it('rejects a request without a token', async () => {
    const { session } = await buildCourseWithSession();

    const res = await request(app).patch(
      `/api/v1/sessions/${session._id}/cancel`
    );

    expect(res.status).toBe(401);
  });

  it('rejects cancelling an already-cancelled session', async () => {
    const { lecturerToken, session } = await buildCourseWithSession();

    await request(app)
      .patch(`/api/v1/sessions/${session._id}/cancel`)
      .set('Authorization', `Bearer ${lecturerToken}`);

    const res = await request(app)
      .patch(`/api/v1/sessions/${session._id}/cancel`)
      .set('Authorization', `Bearer ${lecturerToken}`);

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/sessions/:id/reschedule', () => {
  it('reschedules a session and notifies enrolled students with the previous and new slot', async () => {
    const { lecturerToken, course, session } = await buildCourseWithSession();
    const { user: student } = await createUserWithToken({
      email: 'student3@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    await Enrolment.create({ student: student._id, course: course._id });

    const res = await request(app)
      .patch(`/api/v1/sessions/${session._id}/reschedule`)
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send({
        day: 'Wednesday',
        startTime: '14:00',
        endTime: '16:00',
        venue: 'PSC Lecture Theatre 2',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.session.day).toBe('Wednesday');
    expect(res.body.data.session.status).toBe(SessionStatus.RESCHEDULED);

    expect(mockEmailService.sendSessionRescheduledEmail).toHaveBeenCalledTimes(1);
    const [, , , , previousArg, updatedArg] =
      mockEmailService.sendSessionRescheduledEmail.mock.calls[0];
    expect(previousArg.day).toBe('Monday');
    expect(updatedArg.day).toBe('Wednesday');
  });

  it('rejects a request with missing required fields', async () => {
    const { lecturerToken, session } = await buildCourseWithSession();

    const res = await request(app)
      .patch(`/api/v1/sessions/${session._id}/reschedule`)
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send({ day: 'Wednesday' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/sessions', () => {
  it('scopes results to only the courses a lecturer teaches', async () => {
    const { lecturerToken, session } = await buildCourseWithSession();

    const { user: otherLecturer } = await createUserWithToken({
      email: 'unrelated@csc.uniben.edu',
      role: UserRole.LECTURER,
    });
    const otherCourse = await Course.create({
      code: 'CSC 405',
      name: 'Machine Learning',
      department: 'Department of Computer Science',
      units: 3,
      lecturer: otherLecturer._id,
    });
    await TimetableSession.create({
      course: otherCourse._id,
      day: 'Friday',
      startTime: '09:00',
      endTime: '11:00',
      venue: 'PSC Lecture Theatre 3',
    });

    const res = await request(app)
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${lecturerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(String(session._id));
    // The API serves the flattened shape the client reads, not the raw document.
    expect(res.body.data[0].courseCode).toBe('CSC 401');
  });
});
