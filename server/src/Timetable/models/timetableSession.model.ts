import mongoose, { Document, Schema, Types } from 'mongoose';

// Lifecycle of a single weekly class session
export enum SessionStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  RESCHEDULED = 'rescheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export const WEEK_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type WeekDay = (typeof WEEK_DAYS)[number];

// TimetableSession interface extending Mongoose Document
export interface ITimetableSession extends Document {
  course: Types.ObjectId;
  day: WeekDay;
  startTime: string;
  endTime: string;
  venue: string;
  status: SessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

// TimetableSession Schema Definition
const TimetableSessionSchema: Schema<ITimetableSession> = new Schema(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'A session must belong to a course'],
    },
    day: {
      type: String,
      enum: WEEK_DAYS,
      required: [true, 'Day is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format'],
      // 24-hour clock, e.g. '10:00'
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must be in HH:mm format'],
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.SCHEDULED,
    },
  },
  {
    timestamps: true,
    collection: 'timetable',
  }
);

// Indexes for performance optimization
TimetableSessionSchema.index({ course: 1, day: 1 });
TimetableSessionSchema.index({ day: 1, startTime: 1 }); // Weekly grid ordering
TimetableSessionSchema.index({ status: 1 });

export default mongoose.model<ITimetableSession>(
  'TimetableSession',
  TimetableSessionSchema
);
