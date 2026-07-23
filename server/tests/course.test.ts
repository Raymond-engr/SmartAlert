import request from 'supertest';
import app from '../src/app';
import { UserRole } from '../src/model/user.model';
import Course from '../src/Timetable/models/course.model';
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

describe('POST /api/v1/courses', () => {
  it('lets an admin create a course for an existing lecturer', async () => {
    const { token: adminToken } = await createUserWithToken({
      email: 'admin@csc.uniben.edu',
      role: UserRole.ADMIN,
    });
    const { user: lecturer } = await createUserWithToken({
      email: 'lecturer@csc.uniben.edu',
      role: UserRole.LECTURER,
    });

    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'CSC 401',
        name: 'Distributed Systems',
        department: 'Department of Computer Science',
        units: 3,
        lecturer: String(lecturer._id),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.code).toBe('CSC 401');
    expect(res.body.data.units).toBe(3);
  });

  it('rejects course creation from a non-admin role', async () => {
    const { token: lecturerToken, user: lecturer } = await createUserWithToken({
      email: 'lecturer2@csc.uniben.edu',
      role: UserRole.LECTURER,
    });

    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${lecturerToken}`)
      .send({
        code: 'CSC 402',
        name: 'Operating Systems',
        department: 'Department of Computer Science',
        units: 3,
        lecturer: String(lecturer._id),
      });

    expect(res.status).toBe(403);
  });

  it('rejects a request with missing required fields', async () => {
    const { token: adminToken } = await createUserWithToken({
      email: 'admin2@csc.uniben.edu',
      role: UserRole.ADMIN,
    });

    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: 'CSC 403' });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate course code', async () => {
    const { token: adminToken } = await createUserWithToken({
      email: 'admin3@csc.uniben.edu',
      role: UserRole.ADMIN,
    });
    const { user: lecturer } = await createUserWithToken({
      email: 'lecturer3@csc.uniben.edu',
      role: UserRole.LECTURER,
    });

    await Course.create({
      code: 'CSC 404',
      name: 'Computer Networks',
      department: 'Department of Computer Science',
      units: 3,
      lecturer: lecturer._id,
    });

    const res = await request(app)
      .post('/api/v1/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        code: 'CSC 404',
        name: 'Computer Networks II',
        department: 'Department of Computer Science',
        units: 3,
        lecturer: String(lecturer._id),
      });

    expect(res.status).toBe(409);
  });
});

describe('GET /api/v1/courses', () => {
  it('finds a course by a text search on its name', async () => {
    const { token: studentToken } = await createUserWithToken({
      email: 'searcher@csc.uniben.edu',
      role: UserRole.STUDENT,
    });
    const { user: lecturer } = await createUserWithToken({
      email: 'lecturer4@csc.uniben.edu',
      role: UserRole.LECTURER,
    });

    await Course.create({
      code: 'CSC 405',
      name: 'Machine Learning',
      department: 'Department of Computer Science',
      units: 4,
      lecturer: lecturer._id,
    });

    const res = await request(app)
      .get('/api/v1/courses')
      .query({ search: 'Machine' })
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.some((c: any) => c.code === 'CSC 405')).toBe(true);
  });
});
