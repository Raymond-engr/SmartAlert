import { Types } from 'mongoose';
import Enrolment from '../Enrolment/models/enrolment.model';
import Notification, {
  INotification,
  NotificationType,
} from '../Notifications/models/notification.model';
import { ICourse } from '../Timetable/models/course.model';
import { ITimetableSession } from '../Timetable/models/timetableSession.model';
import { IUser } from '../model/user.model';
import { SessionSlot } from '../templates/emails';
import emailService from './email.service';
import { emitToUser } from '../sockets';
import logger from '../utils/logger';

/**
 * The Dual-Channel Notification Pipeline
 *
 * This is the core of SmartAlert (Chapter Four, Section 4.4.4). One lecturer
 * action fans out to two channels at once:
 *
 *   Socket.io  — instant, but only reaches students currently connected.
 *   Nodemailer — slower, but reaches every enrolled student regardless of
 *                connection state.
 *
 * Neither channel is a fallback for the other; both fire on every change, and
 * a Notification document records what was sent and to whom.
 *
 * It lives in a service rather than in the controller because cancel and
 * reschedule are the same pipeline with a different message, and because the
 * controller should not know what a transporter is.
 */

export const SESSION_UPDATE_EVENT = 'session:update';

export interface SessionUpdatePayload {
  sessionId: string;
  type: NotificationType;
  message: string;
  courseCode: string;
  courseName: string;
  status: string;
  day: string;
  startTime: string;
  endTime: string;
  venue: string;
  createdAt: string;
}

export interface DispatchResult {
  notification: INotification;
  recipientCount: number;
  socketsDelivered: number;
  emailsSent: number;
  emailsFailed: number;
}

interface DispatchInput {
  session: ITimetableSession;
  course: ICourse;
  type: NotificationType;
  /** Where the session sat before the change. Used by the reschedule email. */
  previous?: SessionSlot;
}

interface EnrolledStudent {
  _id: Types.ObjectId;
  name: string;
  email: string;
  notificationPreferences?: {
    inApp?: boolean;
    email?: boolean;
  };
}

class NotificationService {
  /**
   * Human-readable alert text. Kept in one place so the toast, the email
   * subject line, and the notification history all say the same thing.
   */
  buildMessage(
    type: NotificationType,
    course: ICourse,
    session: ITimetableSession,
    previous?: SessionSlot
  ): string {
    if (type === NotificationType.CANCELLED) {
      return `Your ${course.code} class on ${session.day}, ${session.startTime} has been cancelled.`;
    }

    const from = previous ? `${previous.day}, ${previous.startTime} (${previous.venue})` : 'its previous slot';

    return `Your ${course.code} class has been moved from ${from} to ${session.day}, ${session.startTime} (${session.venue}).`;
  }

  /**
   * Runs the pipeline for one changed session.
   *
   * Order matters: sockets go out first because they are the channel with a
   * five-second requirement against them, and the email fan-out is the slow
   * one. Emails are dispatched with Promise.allSettled so that a single
   * bounced address cannot abort the send to the rest of the class.
   */
  async dispatchSessionUpdate({
    session,
    course,
    type,
    previous,
  }: DispatchInput): Promise<DispatchResult> {
    const message = this.buildMessage(type, course, session, previous);

    // Every student registered on this course.
    const enrolments = await Enrolment.find({ course: course._id }).populate<{
      student: IUser;
    }>('student', 'name email isActive notificationPreferences');

    const students: EnrolledStudent[] = enrolments
      .filter((enrolment) => enrolment.student && enrolment.student.isActive)
      .map((enrolment) => ({
        _id: enrolment.student._id as Types.ObjectId,
        name: enrolment.student.name,
        email: enrolment.student.email,
        notificationPreferences: enrolment.student.notificationPreferences,
      }));

    const payload: SessionUpdatePayload = {
      sessionId: String(session._id),
      type,
      message,
      courseCode: course.code,
      courseName: course.name,
      status: session.status,
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
      venue: session.venue,
      createdAt: new Date().toISOString(),
    };

    // Channel 1: in-app, to students who are online right now and have not
    // switched the in-app channel off. A missing pref counts as opted in.
    let socketsDelivered = 0;
    students.forEach((student) => {
      if (student.notificationPreferences?.inApp === false) return;

      const delivered = emitToUser(
        String(student._id),
        SESSION_UPDATE_EVENT,
        payload
      );
      if (delivered) socketsDelivered += 1;
    });

    // Channel 2: email, to everyone, online or not.
    const updated: SessionSlot = {
      day: session.day,
      startTime: session.startTime,
      endTime: session.endTime,
      venue: session.venue,
    };

    const sendOne = (student: EnrolledStudent): Promise<void> => {
      if (type === NotificationType.CANCELLED) {
        return emailService.sendSessionCancelledEmail(
          student.email,
          student.name,
          course.code,
          course.name,
          updated
        );
      }

      return emailService.sendSessionRescheduledEmail(
        student.email,
        student.name,
        course.code,
        course.name,
        previous ?? updated,
        updated
      );
    };

    // Only students who have not switched the email channel off; a missing
    // pref counts as opted in.
    const emailRecipients = students.filter(
      (student) => student.notificationPreferences?.email !== false
    );

    const results = await Promise.allSettled(emailRecipients.map(sendOne));

    const emailsSent = results.filter((r) => r.status === 'fulfilled').length;
    const emailsFailed = results.length - emailsSent;

    if (emailsFailed > 0) {
      logger.warn(
        `${emailsFailed} of ${results.length} ${type} emails failed for ${course.code}`
      );
    }

    // The record of what was sent, which backs the student's history screen.
    const notification = await Notification.create({
      session: session._id,
      course: course._id,
      type,
      message,
      recipients: students.map((student) => student._id),
      emailsSent,
      emailsFailed,
    });

    logger.info(
      `${type} alert for ${course.code}: ${students.length} recipient(s), ` +
        `${socketsDelivered} in-app, ${emailsSent} email(s) sent, ${emailsFailed} failed`
    );

    return {
      notification,
      recipientCount: students.length,
      socketsDelivered,
      emailsSent,
      emailsFailed,
    };
  }
}

export default new NotificationService();
