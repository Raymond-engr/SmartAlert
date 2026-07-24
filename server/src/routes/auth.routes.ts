import { Router } from 'express';
import { z } from 'zod';
import authController from '../controllers/auth.controller';
import validateRequest from '../middleware/validateRequest';
import {
  authenticateToken,
  rateLimiter,
} from '../middleware/auth.middleware';
import { UserRole } from '../model/user.model';

const router = Router();

const standardLimit = rateLimiter(20, 60 * 60 * 1000);

const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum([UserRole.STUDENT, UserRole.LECTURER]),
    department: z.string().min(1, 'Department is required'),
    matricNumber: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    department: z.string().min(1).optional(),
    matricNumber: z.string().optional(),
    password: z.string().min(8).optional(),
    notificationPreferences: z
      .object({
        inApp: z.boolean().optional(),
        email: z.boolean().optional(),
      })
      .optional(),
  }),
});

router.post(
  '/register',
  standardLimit,
  validateRequest(registerSchema),
  authController.register
);
router.post(
  '/login',
  standardLimit,
  validateRequest(loginSchema),
  authController.login
);
router.post('/refresh-token', standardLimit, authController.refreshToken);
router.post('/logout', authController.logout);

// Token verification route - protected by auth middleware
router.get('/verify-token', authenticateToken, authController.verifyToken);

router.get('/me', authenticateToken, authController.getProfile);
router.patch(
  '/me',
  authenticateToken,
  validateRequest(updateProfileSchema),
  authController.updateProfile
);

export default router;
