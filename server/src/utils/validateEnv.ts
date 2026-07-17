import dotenv from 'dotenv';
import { cleanEnv, str, port, url, email, num, makeValidator } from 'envalid';
dotenv.config();

const validateEnv = (): void => {
  const extendedEmail = makeValidator((input: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Extract email from "Display Name <email@domain.com>" format if present
    const emailPart = input.match(/<([^>]+)>/)?.[1] || input;
    if (!emailRegex.test(emailPart)) {
      throw new Error(`Invalid email address: "${emailPart}"`);
    }
    return input;
  });

  cleanEnv(process.env, {
    NODE_ENV: str({ choices: ['development', 'test', 'production'] }),
    PORT: num({ default: 4000 }),
    MONGODB_URI: url(),
    FRONTEND_URL: url(),
    ALLOWED_ORIGINS: str({ default: '' }),
    API_URL: url(),
    LOG_LEVEL: str({
      choices: ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'],
    }),
    // The clock a session's ongoing/completed status is resolved against, so
    // the answer does not change with the host's timezone.
    CAMPUS_TIMEZONE: str({ default: 'Africa/Lagos' }),
    JWT_ACCESS_SECRET: str(),
    JWT_REFRESH_SECRET: str(),
    SMTP_HOST: str(),
    SMTP_PORT: port(),
    SMTP_USER: str(),
    SMTP_PASS: str(),
    EMAIL_FROM: extendedEmail(),
    SUPPORT_EMAIL: email(),
    ADMIN_NAME: str(),
    ADMIN_EMAIL: email(),
    ADMIN_PASSWORD: str(),
    ADMIN_DEPARTMENT: str({ default: 'Department of Computer Science' }),
  });
};

export default validateEnv;
