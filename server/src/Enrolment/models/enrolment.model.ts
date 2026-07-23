import mongoose, { Document, Schema, Types } from 'mongoose';

// Enrolment interface extending Mongoose Document
export interface IEnrolment extends Document {
  student: Types.ObjectId;
  course: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Enrolment Schema Definition
const EnrolmentSchema: Schema<IEnrolment> = new Schema(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
EnrolmentSchema.index({ student: 1, course: 1 }, { unique: true }); // No duplicate enrolments
EnrolmentSchema.index({ course: 1 }); // Alert fan-out: every student on a course

export default mongoose.model<IEnrolment>(
  'Enrolment',
  EnrolmentSchema,
  'Enrolments'
);
