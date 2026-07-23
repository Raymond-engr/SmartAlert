import mongoose, { Document, Schema, Types } from 'mongoose';

// The two events that raise an alert
export enum NotificationType {
  CANCELLED = 'cancelled',
  RESCHEDULED = 'rescheduled',
}

// Notification interface extending Mongoose Document
export interface INotification extends Document {
  session: Types.ObjectId;
  course: Types.ObjectId;
  type: NotificationType;
  message: string;
  recipients: Types.ObjectId[];
  readBy: Types.ObjectId[];
  emailsSent: number;
  emailsFailed: number;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Schema Definition
const NotificationSchema: Schema<INotification> = new Schema(
  {
    session: {
      type: Schema.Types.ObjectId,
      ref: 'TimetableSession',
      required: [true, 'Session is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
      // Denormalised so the history endpoint can show the course code
      // without a second populate through the session.
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: [true, 'Notification type is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    recipients: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        // A subset of `recipients`. An alert is unread for a student until
        // their id lands here, which is what the dashboard's unread highlight
        // and the sidebar badge count are read from. Tracked per-student
        // rather than as a boolean because one Notification fans out to the
        // whole class, and each student reads it at their own time.
      },
    ],
    emailsSent: {
      type: Number,
      default: 0,
      // Delivery-channel bookkeeping for the comparison reported in Chapter Four.
    },
    emailsFailed: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
NotificationSchema.index({ recipients: 1, createdAt: -1 }); // Student history feed
NotificationSchema.index({ session: 1 });

export default mongoose.model<INotification>(
  'Notification',
  NotificationSchema,
  'Notifications'
);
