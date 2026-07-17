import nodemailer, { Transporter } from 'nodemailer';
import logger from '../utils/logger';
import validateEnv from '../utils/validateEnv';
import {
  sessionCancelledTemplate,
  sessionRescheduledTemplate,
  welcomeTemplate,
  SessionSlot,
} from '../templates/emails';

validateEnv();

class EmailService {
  private transporter: Transporter;
  private frontendUrl: string;
  private emailFrom: string;

  constructor() {
    if (
      !process.env.SMTP_HOST ||
      !process.env.SMTP_USER ||
      !process.env.SMTP_PASS
    ) {
      throw new Error(
        'SMTP configuration must be defined in environment variables'
      );
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // The alert fan-out sends one message per enrolled student at once.
      // Pooling reuses a single SMTP connection instead of opening one per
      // student, which is what keeps a 60-student course from tripping the
      // provider's connection limit.
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    this.frontendUrl = process.env.FRONTEND_URL || '';
    this.emailFrom = process.env.EMAIL_FROM || '';

    if (!this.frontendUrl || !this.emailFrom) {
      throw new Error(
        'FRONTEND_URL and EMAIL_FROM must be defined in environment variables'
      );
    }
  }

  /**
   * Verifies the SMTP credentials at boot so a misconfigured mailbox surfaces
   * in the logs on startup rather than at the moment a lecturer cancels a class.
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (error) {
      logger.error(
        'SMTP connection failed:',
        error instanceof Error ? error : String(error)
      );
      return false;
    }
  }

  async sendSessionCancelledEmail(
    to: string,
    name: string,
    courseCode: string,
    courseName: string,
    slot: SessionSlot
  ): Promise<void> {
    const subject = `Class Cancelled: ${courseCode}`;

    try {
      await this.transporter.sendMail({
        from: this.emailFrom,
        to,
        subject,
        html: sessionCancelledTemplate(
          name,
          courseCode,
          courseName,
          slot.day,
          slot.startTime,
          slot.endTime,
          slot.venue
        ),
      });
      logger.info(`Cancellation email sent to ${to} for ${courseCode}`);
    } catch (error) {
      logger.error(`Failed to send cancellation email to ${to}:`, error);
      throw error;
    }
  }

  async sendSessionRescheduledEmail(
    to: string,
    name: string,
    courseCode: string,
    courseName: string,
    previous: SessionSlot,
    updated: SessionSlot
  ): Promise<void> {
    const subject = `Class Rescheduled: ${courseCode}`;

    try {
      await this.transporter.sendMail({
        from: this.emailFrom,
        to,
        subject,
        html: sessionRescheduledTemplate(
          name,
          courseCode,
          courseName,
          previous,
          updated
        ),
      });
      logger.info(`Reschedule email sent to ${to} for ${courseCode}`);
    } catch (error) {
      logger.error(`Failed to send reschedule email to ${to}:`, error);
      throw error;
    }
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
    role: string,
    department: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.emailFrom,
        to,
        subject: 'Welcome to SmartAlert',
        html: welcomeTemplate(name, role, department),
      });
      logger.info(`Welcome email sent to ${to}`);
    } catch (error) {
      logger.error(`Failed to send welcome email to ${to}:`, error);
      throw error;
    }
  }
}

export default new EmailService();
