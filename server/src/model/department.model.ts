import mongoose, { Document, Schema } from 'mongoose';

// Department interface extending Mongoose Document
export interface IDepartment extends Document {
  name: string;
  code: string;
  faculty: string;
  createdAt: Date;
  updatedAt: Date;
}

// Department Schema Definition
const DepartmentSchema: Schema<IDepartment> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      uppercase: true,
      trim: true,
    },
    faculty: {
      type: String,
      required: [true, 'Faculty is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
// `name` is already uniquely indexed via `unique: true` on the field above.
DepartmentSchema.index({ faculty: 1 });

export default mongoose.model<IDepartment>(
  'Department',
  DepartmentSchema,
  'Departments'
);
