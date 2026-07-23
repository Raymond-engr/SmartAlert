import { Request, Response } from 'express';
import { Types } from 'mongoose';
import TimetableSession, {
  SessionStatus,
} from '../models/timetableSession.model';
import Course from '../models/course.model';
import Enrolment from '../../Enrolment/models/enrolment.model';
import { NotificationType } from '../../Notifications/models/notification.model';
import notificationService from '../../services/notification.service';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import { UserRole } from '../../model/user.model';
import { toSession, toSessions } from '../../utils/serializers';

class SessionController {
  /**
   * Scoped listing (Section 8, API spec): a lecturer sees only sessions on
   * courses they teach, a student sees only sessions on courses they are
   * enrolled in, and an admin sees the full master schedule.
   */
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    let courseIds: Types.ObjectId[] | undefined;

    if (user.role === UserRole.LECTURER) {
      const courses = await Course.find({ lecturer: user._id }).select('_id');
      courseIds = courses.map((c) => c._id as Types.ObjectId);
    } else if (user.role === UserRole.STUDENT) {
      const enrolments = await Enrolment.find({ student: user._id }).select(
        'course'
      );
      courseIds = enrolments.map((e) => e.course as Types.ObjectId);
    }
    // Admin: courseIds stays undefined, so no course filter is applied.

    const filter: Record<string, unknown> = {};
    if (courseIds) filter.course = { $in: courseIds };

    const sessions = await TimetableSession.find(filter)
      .populate({
        path: 'course',
        select: 'code name department lecturer',
        populate: { path: 'lecturer', select: 'name email' },
      })
      .sort({ day: 1, startTime: 1 });

    res.status(200).json({ success: true, data: toSessions(sessions, user) });
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const session = await TimetableSession.findById(req.params.id).populate({
      path: 'course',
      select: 'code name department lecturer',
      populate: { path: 'lecturer', select: 'name email' },
    });

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    res.status(200).json({ success: true, data: toSession(session, req.user!) });
  });

  /**
   * Adds a session to the master schedule. Admin only, per Section 8.
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { course, day, startTime, endTime, venue } = req.body;

    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      throw new BadRequestError('course must reference an existing course');
    }

    if (startTime >= endTime) {
      throw new BadRequestError('startTime must be earlier than endTime');
    }

    const session = await TimetableSession.create({
      course,
      day,
      startTime,
      endTime,
      venue,
    });

    logger.info(`Session added to schedule: ${courseDoc.code} ${day} ${startTime}`);

    res.status(201).json({ success: true, data: session });
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const session = await TimetableSession.findById(req.params.id);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    const { day, startTime, endTime, venue, status } = req.body;
    if (!day && !startTime && !endTime && !venue && !status) {
      throw new BadRequestError('At least one field is required');
    }

    if (day) session.day = day;
    if (startTime) session.startTime = startTime;
    if (endTime) session.endTime = endTime;
    if (venue) session.venue = venue;
    if (status) session.status = status;

    await session.save();
    res.status(200).json({ success: true, data: session });
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const session = await TimetableSession.findByIdAndDelete(req.params.id);
    if (!session) {
      throw new NotFoundError('Session not found');
    }

    res
      .status(200)
      .json({ success: true, message: 'Session removed from schedule' });
  });

  /**
   * Verifies that the acting lecturer actually teaches the course a session
   * belongs to. Shared by cancel and reschedule so ownership can't drift
   * between the two.
   */
  private async loadOwnedSession(
    sessionId: string,
    lecturerId: Types.ObjectId
  ) {
    const session = await TimetableSession.findById(sessionId).populate(
      'course'
    );

    if (!session) {
      throw new NotFoundError('Session not found');
    }

    const course = session.course as any;
    if (String(course.lecturer) !== String(lecturerId)) {
      throw new ForbiddenError('You do not teach this course');
    }

    return { session, course };
  }

  /**
   * The core real-time pipeline (Chapter Four, Section 4.4.4): update the
   * session's status, then fan the change out to every enrolled student
   * over both channels at once.
   */
  cancel = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = req.user!;
    const { session, course } = await this.loadOwnedSession(
      String(req.params.id),
      user._id as Types.ObjectId
    );

    if (session.status === SessionStatus.CANCELLED) {
      throw new BadRequestError('This session has already been cancelled');
    }

    session.status = SessionStatus.CANCELLED;
    await session.save();

    const result = await notificationService.dispatchSessionUpdate({
      session,
      course,
      type: NotificationType.CANCELLED,
    });

    res.status(200).json({
      success: true,
      message: 'Session cancelled and students notified',
      data: {
        // `course.lecturer` is left as a raw id by loadOwnedSession so the
        // ownership check can compare ids; the check having passed, the
        // acting user is that lecturer, so they can be attached directly.
        session: toSession(
          { ...session.toObject(), course: { ...course.toObject(), lecturer: user } },
          user
        ),
        recipientCount: result.recipientCount,
        socketsDelivered: result.socketsDelivered,
        emailsSent: result.emailsSent,
        emailsFailed: result.emailsFailed,
      },
    });
  });

  reschedule = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user!;
      const { day, startTime, endTime, venue } = req.body;

      if (startTime >= endTime) {
        throw new BadRequestError('startTime must be earlier than endTime');
      }

      const { session, course } = await this.loadOwnedSession(
        String(req.params.id),
        user._id as Types.ObjectId
      );

      // Captured before the mutation, so the email can show "was X, now Y".
      const previous = {
        day: session.day,
        startTime: session.startTime,
        endTime: session.endTime,
        venue: session.venue,
      };

      session.day = day;
      session.startTime = startTime;
      session.endTime = endTime;
      session.venue = venue;
      session.status = SessionStatus.RESCHEDULED;
      await session.save();

      const result = await notificationService.dispatchSessionUpdate({
        session,
        course,
        type: NotificationType.RESCHEDULED,
        previous,
      });

      res.status(200).json({
        success: true,
        message: 'Session rescheduled and students notified',
        data: {
          // `course.lecturer` is left as a raw id by loadOwnedSession so the
        // ownership check can compare ids; the check having passed, the
        // acting user is that lecturer, so they can be attached directly.
        session: toSession(
          { ...session.toObject(), course: { ...course.toObject(), lecturer: user } },
          user
        ),
          recipientCount: result.recipientCount,
          socketsDelivered: result.socketsDelivered,
          emailsSent: result.emailsSent,
          emailsFailed: result.emailsFailed,
        },
      });
    }
  );
}

export default new SessionController();
