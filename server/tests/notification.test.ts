import request from 'supertest';
import app from '../src/app';
import { UserRole } from '../src/model/user.model';
import Course from '../src/Timetable/models/course.model';
import TimetableSession from '../src/Timetable/models/timetableSession.model';
import Notification, {
  NotificationType,
} from '../src/Notifications/models/notification.model';
import { createUserWithToken } from './testUtils';

jest.mock('../src/services/email.service', () => ({
  __esModule: true,
  default: {
    verifyConnection: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    sendSessionCancelledEmail: jest.fn().mockResolvedValue(undefined),
    sendSessionRescheduledEmail: jest.fn().mockResolvedValue(undefined),
  },
}));

/**
 * One cancelled-session notification addressed to `recipientId`.
 *
 * The lecturer and course are reused when they already exist, so a test can
 * build more than one notification without tripping the unique indexes on
 * User.email and Course.code.
 */
const buildNotification = async (recipientId: unknown) => {
  let course = await Course.findOne({ code: 'CSC 401' });

  if (!course) {
    const { user: lecturer } = await createUserWithToken({
      email: 'notif-lecturer@csc.uniben.edu',
      role: UserRole.LECTURER,
    });
    course = await Course.create({
      code: 'CSC 401',
      name: 'Distributed Systems',
      department: 'Department of Computer Science',
      units: 3,
      lecturer: lecturer._id,
    });
  }

  const session = await TimetableSession.create({
    course: course._id,
    day: 'Monday',
    startTime: '10:00',
    endTime: '12:00',
    venue: 'PSC Lecture Theatre 1',
  });

  return Notification.create({
    session: session._id,
    course: course._id,
    type: NotificationType.CANCELLED,
    message: 'Your CSC 401 class on Monday, 10:00 has been cancelled.',
    recipients: [recipientId],
    emailsSent: 1,
    emailsFailed: 0,
  });
};

describe('GET /api/v1/notifications/me', () => {
  it("returns the logged-in student's notification history, most recent first", async () => {
    const { user: student, token: studentToken } = await createUserWithToken({
      email: 'notifstudent@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    await buildNotification(student._id);

    const res = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    // Serialized as an alert: the notification's `type` is mapped onto the
    // status vocabulary the client colours sessions with.
    expect(res.body.data[0].status).toBe(NotificationType.CANCELLED);
    expect(res.body.data[0].courseCode).toBe('CSC 401');
    expect(res.body.data[0].unread).toBe(true);
  });

  it("does not return another student's notifications", async () => {
    const { user: otherStudent } = await createUserWithToken({
      email: 'notifother@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    await buildNotification(otherStudent._id);

    const { token: studentToken } = await createUserWithToken({
      email: 'notifself@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    const res = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('rejects the request when the caller is a lecturer, not a student', async () => {
    const { token: lecturerToken } = await createUserWithToken({
      email: 'notiflecturer2@csc.uniben.edu',
      role: UserRole.LECTURER,
    });

    const res = await request(app)
      .get('/api/v1/notifications/me')
      .set('Authorization', `Bearer ${lecturerToken}`);

    expect(res.status).toBe(403);
  });

  it('rejects a request without a token', async () => {
    const res = await request(app).get('/api/v1/notifications/me');
    expect(res.status).toBe(401);
  });
});

describe('notification read tracking', () => {
  it('counts an unread alert and stops counting it once read', async () => {
    const { user: student, token } = await createUserWithToken({
      email: 'unread@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    const note = await buildNotification(student._id);

    const before = await request(app)
      .get('/api/v1/notifications/me/unread-count')
      .set('Authorization', `Bearer ${token}`);
    expect(before.body.data.count).toBe(1);

    const read = await request(app)
      .patch(`/api/v1/notifications/${note._id}/read`)
      .set('Authorization', `Bearer ${token}`);
    expect(read.status).toBe(200);
    expect(read.body.data.unread).toBe(false);

    const after = await request(app)
      .get('/api/v1/notifications/me/unread-count')
      .set('Authorization', `Bearer ${token}`);
    expect(after.body.data.count).toBe(0);
  });

  it('marks an alert read for one student without affecting another', async () => {
    const { user: reader, token: readerToken } = await createUserWithToken({
      email: 'reader@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    const { user: other, token: otherToken } = await createUserWithToken({
      email: 'nonreader@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    const note = await buildNotification(reader._id);
    await Notification.updateOne(
      { _id: note._id },
      { $addToSet: { recipients: other._id } }
    );

    await request(app)
      .patch(`/api/v1/notifications/${note._id}/read`)
      .set('Authorization', `Bearer ${readerToken}`);

    const otherCount = await request(app)
      .get('/api/v1/notifications/me/unread-count')
      .set('Authorization', `Bearer ${otherToken}`);

    expect(otherCount.body.data.count).toBe(1);
  });

  it('will not let a student mark an alert they were never sent', async () => {
    const { user: recipient } = await createUserWithToken({
      email: 'recipient@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    const note = await buildNotification(recipient._id);

    const { token: outsiderToken } = await createUserWithToken({
      email: 'outsider@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    const res = await request(app)
      .patch(`/api/v1/notifications/${note._id}/read`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(res.status).toBe(404);
  });

  it('clears every unread alert at once', async () => {
    const { user: student, token } = await createUserWithToken({
      email: 'readall@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    await buildNotification(student._id);
    await buildNotification(student._id);

    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.updated).toBe(2);

    const after = await request(app)
      .get('/api/v1/notifications/me/unread-count')
      .set('Authorization', `Bearer ${token}`);
    expect(after.body.data.count).toBe(0);
  });
});

describe('GET /api/v1/notifications/course/:courseId', () => {
  it('lets an admin view every notification sent for a course', async () => {
    const { user: student } = await createUserWithToken({
      email: 'notifstudent2@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    const note = await buildNotification(student._id);

    const { token: adminToken } = await createUserWithToken({
      email: 'notifadmin@csc.uniben.edu',
      role: UserRole.ADMIN,
    });

    const res = await request(app)
      .get(`/api/v1/notifications/course/${note.course}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  it('rejects the request when the caller is a student', async () => {
    const { user: student, token: studentToken } = await createUserWithToken({
      email: 'notifstudent3@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    const note = await buildNotification(student._id);

    const res = await request(app)
      .get(`/api/v1/notifications/course/${note.course}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(403);
  });
});
