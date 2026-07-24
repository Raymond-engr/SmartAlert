import request from 'supertest';
import app from '../src/app';
import { UserRole } from '../src/model/user.model';
import Department from '../src/model/department.model';
import Course from '../src/Timetable/models/course.model';
import User from '../src/model/user.model';
import { seedDepartments } from '../src/utils/departments';
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

// Every suite clears collections between tests (see tests/setup.ts), so the
// canonical departments are reseeded before each test to mirror a warm server.
beforeEach(async () => {
  await seedDepartments();
});

const adminToken = async (): Promise<string> => {
  const { token } = await createUserWithToken({
    email: `admin+${Math.random().toString(36).slice(2)}@csc.uniben.edu`,
    role: UserRole.ADMIN,
  });
  return token;
};

describe('POST /api/v1/admin/departments', () => {
  it('creates a department and refreshes the reference list', async () => {
    const token = await adminToken();

    const res = await request(app)
      .post('/api/v1/admin/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Department of Cybersecurity',
        code: 'CYB',
        faculty: 'Faculty of Physical Sciences',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name: 'Department of Cybersecurity',
      code: 'CYB',
      faculty: 'Faculty of Physical Sciences',
    });
    expect(res.body.data.id).toBeDefined();

    const list = await request(app)
      .get('/api/v1/admin/departments')
      .set('Authorization', `Bearer ${token}`);
    expect(
      list.body.data.departments.some(
        (d: any) => d.name === 'Department of Cybersecurity'
      )
    ).toBe(true);
  });

  it('rejects a duplicate department name', async () => {
    const token = await adminToken();

    const res = await request(app)
      .post('/api/v1/admin/departments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Department of Computer Science',
        code: 'CSC',
        faculty: 'Faculty of Physical Sciences',
      });

    expect(res.status).toBe(409);
  });
});

describe('PUT /api/v1/admin/departments/:id', () => {
  it('cascades a rename to referencing users and courses', async () => {
    const token = await adminToken();

    const department = await Department.findOne({
      name: 'Department of Computer Science',
    });

    const { user: lecturer } = await createUserWithToken({
      email: 'lecturer@csc.uniben.edu',
      role: UserRole.LECTURER,
      department: 'Department of Computer Science',
    });
    await Course.create({
      code: 'CSC 401',
      name: 'Distributed Systems',
      department: 'Department of Computer Science',
      units: 3,
      lecturer: lecturer._id,
    });

    const res = await request(app)
      .put(`/api/v1/admin/departments/${String(department!._id)}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Department of Computing' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Department of Computing');

    const updatedUser = await User.findById(lecturer._id);
    const updatedCourse = await Course.findOne({ code: 'CSC 401' });
    expect(updatedUser!.department).toBe('Department of Computing');
    expect(updatedCourse!.department).toBe('Department of Computing');
  });
});

describe('DELETE /api/v1/admin/departments/:id', () => {
  it('blocks deletion while users or courses still reference it', async () => {
    const token = await adminToken();

    const department = await Department.findOne({
      name: 'Department of Physics',
    });

    await createUserWithToken({
      email: 'phys@uniben.edu',
      role: UserRole.STUDENT,
      department: 'Department of Physics',
    });

    const res = await request(app)
      .delete(`/api/v1/admin/departments/${String(department!._id)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(await Department.findById(department!._id)).not.toBeNull();
  });

  it('deletes a department that nothing references', async () => {
    const token = await adminToken();

    const department = await Department.create({
      name: 'Department of Archaeology',
      code: 'ARC',
      faculty: 'Faculty of Arts',
    });

    const res = await request(app)
      .delete(`/api/v1/admin/departments/${String(department._id)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(await Department.findById(department._id)).toBeNull();
  });
});
