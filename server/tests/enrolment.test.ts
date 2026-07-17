import request from 'supertest';
import app from '../src/app';
import { UserRole } from '../src/model/user.model';
import Course from '../src/Timetable/models/course.model';
import Enrolment from '../src/Enrolment/models/enrolment.model';
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

const buildCourse = async () => {
  const { user: lecturer } = await createUserWithToken({
    email: 'lecturer@csc.uniben.edu',
    role: UserRole.LECTURER,
  });
  return Course.create({
    code: 'CSC 401',
    name: 'Distributed Systems',
    department: 'Department of Computer Science',
    units: 3,
    lecturer: lecturer._id,
  });
};

describe('POST /api/v1/enrolments', () => {
  it('enrols a student in a course', async () => {
    const course = await buildCourse();
    const { token: studentToken } = await createUserWithToken({
      email: 'student@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    const res = await request(app)
      .post('/api/v1/enrolments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: String(course._id) });

    expect(res.status).toBe(201);
  });

  it('rejects a duplicate enrolment in the same course', async () => {
    const course = await buildCourse();
    const { user: student, token: studentToken } = await createUserWithToken({
      email: 'student2@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    await Enrolment.create({ student: student._id, course: course._id });

    const res = await request(app)
      .post('/api/v1/enrolments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: String(course._id) });

    expect(res.status).toBe(409);
  });

  it('rejects enrolment attempts from a lecturer token', async () => {
    const course = await buildCourse();
    const { token: lecturerToken } = await createUserWithToken({
      email: 'notastudent@csc.uniben.edu',
      role: UserRole.LECTURER,
    });

    const res = await request(app)
      .post('/api/v1/enrolments')
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send({ courseId: String(course._id) });

    expect(res.status).toBe(403);
  });

  it('rejects an enrolment referencing a non-existent course', async () => {
    const { token: studentToken } = await createUserWithToken({
      email: 'student3@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    const res = await request(app)
      .post('/api/v1/enrolments')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courseId: '64b7f3f1a1b2c3d4e5f6a7b8' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/v1/enrolments/me', () => {
  it("lists only the logged-in student's enrolments", async () => {
    const course = await buildCourse();
    const { user: student, token: studentToken } = await createUserWithToken({
      email: 'student4@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    const { user: otherStudent } = await createUserWithToken({
      email: 'student5@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    await Enrolment.create({ student: student._id, course: course._id });
    await Enrolment.create({ student: otherStudent._id, course: course._id });

    const res = await request(app)
      .get('/api/v1/enrolments/me')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
