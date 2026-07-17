import { Router } from 'express';
import { z } from 'zod';
import enrolmentController from '../controllers/enrolment.controller';
import validateRequest from '../../middleware/validateRequest';
import {
  authenticateToken,
  authorize,
} from '../../middleware/auth.middleware';
import { UserRole } from '../../model/user.model';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');

const enrolSchema = z.object({
  body: z.object({ courseId: objectId }),
});

const idSchema = z.object({ params: z.object({ id: objectId }) });
const courseIdSchema = z.object({
  params: z.object({ courseId: objectId }),
});

router.use(authenticateToken);

router.get('/me', authorize(UserRole.STUDENT), enrolmentController.myEnrolments);
router.post(
  '/',
  authorize(UserRole.STUDENT),
  validateRequest(enrolSchema),
  enrolmentController.enrol
);
router.delete(
  '/:id',
  authorize(UserRole.STUDENT),
  validateRequest(idSchema),
  enrolmentController.unenrol
);

router.get(
  '/course/:courseId',
  authorize(UserRole.ADMIN, UserRole.LECTURER),
  validateRequest(courseIdSchema),
  enrolmentController.byCourse
);

export default router;
