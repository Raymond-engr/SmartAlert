import request from 'supertest';
import app from '../src/app';
import User, { UserRole } from '../src/model/user.model';
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

describe('POST /api/v1/auth/register', () => {
  it('registers a new student and returns an access token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Israel Adjekofori',
      email: 'israel@csc.uniben.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      department: 'Department of Computer Science',
      matricNumber: 'PSC2207846',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.role).toBe(UserRole.STUDENT);

    const stored = await User.findOne({ email: 'israel@csc.uniben.edu' }).select(
      '+password'
    );
    expect(stored?.password).not.toBe('Password123!'); // hashed, not plaintext
  });

  it('rejects a request with missing required fields', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      email: 'incomplete@csc.uniben.edu',
    });

    expect(res.status).toBe(400);
    expect(res.body.status ?? res.body.success).toBeDefined();
  });

  it('rejects self-registration as admin', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Sneaky Admin',
      email: 'sneaky@csc.uniben.edu',
      password: 'Password123!',
      role: UserRole.ADMIN,
      department: 'Department of Computer Science',
    });

    expect(res.status).toBe(400);
  });

  it('rejects an unknown department', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'New Student',
      email: 'newstudent@csc.uniben.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      department: 'Department of Wizardry',
    });

    expect(res.status).toBe(400);
  });

  it('rejects a duplicate email', async () => {
    await createUserWithToken({
      email: 'duplicate@csc.uniben.edu',
      role: UserRole.STUDENT,
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Duplicate Person',
      email: 'duplicate@csc.uniben.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      department: 'Department of Computer Science',
    });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('logs in with correct credentials', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Login Test',
      email: 'login@csc.uniben.edu',
      password: 'Password123!',
      role: UserRole.STUDENT,
      department: 'Department of Computer Science',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'login@csc.uniben.edu',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects an incorrect password', async () => {
    await createUserWithToken({
      email: 'wrongpass@csc.uniben.edu',
      role: UserRole.STUDENT,
      password: 'CorrectPass123!',
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'wrongpass@csc.uniben.edu',
      password: 'WrongPass123!',
    });

    expect(res.status).toBe(401);
  });

  it('rejects login for a deactivated account', async () => {
    await createUserWithToken({
      email: 'inactive@csc.uniben.edu',
      role: UserRole.STUDENT,
      isActive: false,
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'inactive@csc.uniben.edu',
      password: 'Password123!',
    });

    expect(res.status).toBe(401);
  });

  it('rejects an unknown email with the same message as a wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'nobody@csc.uniben.edu',
      password: 'WhoKnows123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('GET /api/v1/auth/me', () => {
  it('returns the profile for a valid token', async () => {
    const { token, user } = await createUserWithToken({
      email: 'profile@csc.uniben.edu',
      role: UserRole.LECTURER,
    });

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(user.email);
  });

  it('rejects a request without a token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('rejects a request with a malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(401);
  });
});
