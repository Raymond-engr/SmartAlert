import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/**
 * Test environment configuration.
 *
 * Values are set before anything else is imported, since token.service.ts
 * and email.service.ts both call validateEnv() at module load time. The
 * in-memory Mongo URI is filled in inside beforeAll once the server starts.
 */
process.env.NODE_ENV = 'test';
process.env.PORT = '4000';
process.env.API_URL = 'http://localhost:4000/api/v1';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/smartalert-test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.SMTP_HOST = 'smtp.example.test';
process.env.SMTP_PORT = '465';
process.env.SMTP_USER = 'test@example.test';
process.env.SMTP_PASS = 'test-smtp-pass';
process.env.EMAIL_FROM = 'SmartAlert <test@example.test>';
process.env.SUPPORT_EMAIL = 'support@example.test';
process.env.ADMIN_NAME = 'Test Admin';
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.ADMIN_PASSWORD = 'AdminPass123!';
process.env.ADMIN_DEPARTMENT = 'Department of Computer Science';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGODB_URI);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});
