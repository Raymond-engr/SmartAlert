import { Router } from 'express';
import { z } from 'zod';
import adminController from '../controllers/admin.controller';
import validateRequest from '../middleware/validateRequest';
import { authenticateToken, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../model/user.model';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');

const listUsersSchema = z.object({
  query: z.object({
    role: z.nativeEnum(UserRole).optional(),
    department: z.string().optional(),
  }),
});

const updateUserSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    name: z.string().min(2).optional(),
    department: z.string().min(1).optional(),
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.boolean().optional(),
  }),
});

const idSchema = z.object({ params: z.object({ id: objectId }) });

// Every route here is admin-only.
router.use(authenticateToken, authorize(UserRole.ADMIN));

router.get('/users', validateRequest(listUsersSchema), adminController.listUsers);
router.get('/users/:id', validateRequest(idSchema), adminController.getUserById);
router.patch(
  '/users/:id',
  validateRequest(updateUserSchema),
  adminController.updateUser
);

router.get('/departments', adminController.listDepartments);

export default router;
