import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Notification from '../models/notification.model';
import { NotFoundError } from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import { toAlert, toAlerts } from '../../utils/serializers';

class NotificationController {
  /**
   * Full, reverse-chronological alert history for the logged-in student
   * (Section 8 of the PRD, and the Notification History screen in Section 6).
   */
  myNotifications = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const student = req.user!;

      const notifications = await Notification.find({
        recipients: student._id,
      })
        .populate('course', 'code name')
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: toAlerts(notifications, student._id as Types.ObjectId),
      });
    }
  );

  /**
   * The count behind the sidebar badge. Split from the history endpoint so a
   * layout that only needs the number does not have to pull every alert the
   * student has ever received.
   */
  unreadCount = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const student = req.user!;

      const count = await Notification.countDocuments({
        recipients: student._id,
        readBy: { $ne: student._id },
      });

      res.status(200).json({ success: true, data: { count } });
    }
  );

  /**
   * Marks one alert read for the calling student only.
   *
   * $addToSet rather than $push so that re-opening an alert cannot add a
   * duplicate id, and the filter includes `recipients` so a student cannot
   * mark an alert that was never addressed to them.
   */
  markRead = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const student = req.user!;

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipients: student._id },
      { $addToSet: { readBy: student._id } },
      { new: true }
    ).populate('course', 'code name');

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    res.status(200).json({
      success: true,
      data: toAlert(notification, student._id as Types.ObjectId),
    });
  });

  /**
   * "Mark all as read" on the notification history screen.
   */
  markAllRead = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const student = req.user!;

      const result = await Notification.updateMany(
        { recipients: student._id, readBy: { $ne: student._id } },
        { $addToSet: { readBy: student._id } }
      );

      res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
        data: { updated: result.modifiedCount },
      });
    }
  );

  /**
   * Everything sent for a course a lecturer teaches. Not in the original API
   * table, but the natural counterpart to the student history endpoint, and
   * useful for a lecturer confirming an alert actually went out.
   */
  byCourse = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const notifications = await Notification.find({
        course: req.params.courseId,
      })
        .populate('course', 'code name')
        .sort({ createdAt: -1 });

      // No viewer id: a lecturer is not a recipient, so every alert here
      // serializes as read rather than lighting up their screen as unread.
      res.status(200).json({ success: true, data: toAlerts(notifications) });
    }
  );
}

export default new NotificationController();
