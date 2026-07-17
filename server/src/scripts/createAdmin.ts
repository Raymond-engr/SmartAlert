import mongoose from 'mongoose';
import User, { UserRole } from '../model/user.model';
import connectDB from '../db/database';
import validateEnv from '../utils/validateEnv';
import logger from '../utils/logger';
import { LAUNCH_DEPARTMENT } from '../utils/departments';

validateEnv();

export const createAdminUser = async (): Promise<void> => {
  try {
    await connectDB();
    logger.info('Connected to database');

    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      logger.error('Add ADMIN_EMAIL and ADMIN_PASSWORD to the .env file.');
      return;
    }

    const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (adminExists) {
      logger.info('Admin user already exists');
      return;
    }

    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'System Administrator',
      email: process.env.ADMIN_EMAIL.toLowerCase(),
      password: process.env.ADMIN_PASSWORD,
      role: UserRole.ADMIN,
      department: process.env.ADMIN_DEPARTMENT || LAUNCH_DEPARTMENT,
      isActive: true,
    });

    logger.info(`Admin user created with email: ${admin.email}`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Error creating admin user:', error);
    } else {
      logger.error('Unknown error occurred while creating admin user');
    }
  } finally {
    await mongoose.disconnect();
  }
};

createAdminUser();
