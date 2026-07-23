import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// User roles in the system
export enum UserRole {
  ADMIN = 'admin',
  LECTURER = 'lecturer',
  STUDENT = 'student',
}

// User interface extending Mongoose Document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  department: string;
  matricNumber?: string;
  isActive: boolean;
  refreshToken?: string;
  lastLogin?: Date;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// User Schema Definition
const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    matricNumber: {
      type: String,
      trim: true,
      uppercase: true,
      required: false,
      // Students only. Not used for authentication, kept for identification.
    },
    isActive: {
      type: Boolean,
      default: true,
      // Admins deactivate rather than delete accounts, so history is preserved.
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLogin: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Using custom createdAt field
  }
);

// Indexes for performance optimization
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ role: 1, department: 1, isActive: 1 }); // Admin user filtering

UserSchema.pre<IUser>('save', async function (next) {
  if (this.password && this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema, 'Users');
