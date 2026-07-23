import mongoose, { Document, Schema, Types } from 'mongoose';

// Course interface extending Mongoose Document
export interface ICourse extends Document {
  code: string;
  name: string;
  department: string;
  units: number;
  lecturer: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Course Schema Definition
const CourseSchema: Schema<ICourse> = new Schema(
  {
    code: {
      type: String,
      required: [true, 'Course code is required'],
      uppercase: true,
      trim: true,
      // Stored with a space, e.g. 'CSC 401'
    },
    name: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    units: {
      type: Number,
      required: [true, 'Credit units are required'],
      min: [1, 'A course must carry at least 1 unit'],
      max: [6, 'A course cannot carry more than 6 units'],
    },
    lecturer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A course must be assigned to a lecturer'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
CourseSchema.index({ code: 1 }, { unique: true });
CourseSchema.index({ lecturer: 1 }); // Lecturer dashboard session scoping
CourseSchema.index({ department: 1 });
CourseSchema.index({ code: 'text', name: 'text' }); // Enrolment search

export default mongoose.model<ICourse>('Course', CourseSchema, 'Courses');
