import { Router } from 'express';
import { z } from 'zod';
import notificationController from '../controllers/notification.controller';
import validateRequest from '../../middleware/validateRequest';
import {
  authenticateToken,
  authorize,
} from '../../middleware/auth.middleware';
import { UserRole } from '../../model/user.model';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');
const courseIdSchema = z.object({
  params: z.object({ courseId: objectId }),
});
const idSchema = z.object({ params: z.object({ id: objectId }) });

router.use(authenticateToken);

router.get(
  '/me',
  authorize(UserRole.STUDENT),
  notificationController.myNotifications
);

router.get(
  '/me/unread-count',
  authorize(UserRole.STUDENT),
  notificationController.unreadCount
);

// Mounted before '/:id/read' so that the literal path is matched rather than
// being read as an id.
router.patch(
  '/read-all',
  authorize(UserRole.STUDENT),
  notificationController.markAllRead
);

router.patch(
  '/:id/read',
  authorize(UserRole.STUDENT),
  validateRequest(idSchema),
  notificationController.markRead
);

router.get(
  '/course/:courseId',
  authorize(UserRole.ADMIN, UserRole.LECTURER),
  validateRequest(courseIdSchema),
  notificationController.byCourse
);

export default router;
