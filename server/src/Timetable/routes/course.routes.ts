import { Router } from 'express';
import { z } from 'zod';
import courseController from '../controllers/course.controller';
import validateRequest from '../../middleware/validateRequest';
import {
  authenticateToken,
  authorize,
} from '../../middleware/auth.middleware';
import { UserRole } from '../../model/user.model';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');

const units = z
  .number()
  .int()
  .min(1, 'A course must carry at least 1 unit')
  .max(6, 'A course cannot carry more than 6 units');

const createCourseSchema = z.object({
  body: z.object({
    code: z.string().min(2, 'Course code is required'),
    name: z.string().min(2, 'Course name is required'),
    department: z.string().min(1, 'Department is required'),
    units,
    lecturer: objectId,
  }),
});

const updateCourseSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    code: z.string().min(2).optional(),
    name: z.string().min(2).optional(),
    department: z.string().min(1).optional(),
    units: units.optional(),
    lecturer: objectId.optional(),
  }),
});

const idSchema = z.object({ params: z.object({ id: objectId }) });

// All routes require a logged-in user; only admin can mutate.
router.use(authenticateToken);

router.get('/', courseController.list);
router.get('/:id', validateRequest(idSchema), courseController.getById);

router.post(
  '/',
  authorize(UserRole.ADMIN),
  validateRequest(createCourseSchema),
  courseController.create
);
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateRequest(updateCourseSchema),
  courseController.update
);
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validateRequest(idSchema),
  courseController.delete
);

export default router;
