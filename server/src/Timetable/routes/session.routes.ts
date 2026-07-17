import { Router } from 'express';
import { z } from 'zod';
import sessionController from '../controllers/session.controller';
import validateRequest from '../../middleware/validateRequest';
import {
  authenticateToken,
  authorize,
} from '../../middleware/auth.middleware';
import { UserRole } from '../../model/user.model';
import { WEEK_DAYS, SessionStatus } from '../models/timetableSession.model';

const router = Router();

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id format');
const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format');

const createSessionSchema = z.object({
  body: z.object({
    course: objectId,
    day: z.enum(WEEK_DAYS),
    startTime: timeString,
    endTime: timeString,
    venue: z.string().min(1, 'Venue is required'),
  }),
});

const updateSessionSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    day: z.enum(WEEK_DAYS).optional(),
    startTime: timeString.optional(),
    endTime: timeString.optional(),
    venue: z.string().min(1).optional(),
    status: z.nativeEnum(SessionStatus).optional(),
  }),
});

const rescheduleSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    day: z.enum(WEEK_DAYS),
    startTime: timeString,
    endTime: timeString,
    venue: z.string().min(1, 'Venue is required'),
  }),
});

const idSchema = z.object({ params: z.object({ id: objectId }) });

router.use(authenticateToken);

router.get('/', sessionController.list);
router.get('/:id', validateRequest(idSchema), sessionController.getById);

router.post(
  '/',
  authorize(UserRole.ADMIN),
  validateRequest(createSessionSchema),
  sessionController.create
);
router.put(
  '/:id',
  authorize(UserRole.ADMIN),
  validateRequest(updateSessionSchema),
  sessionController.update
);
router.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  validateRequest(idSchema),
  sessionController.delete
);

// The dual-channel alert pipeline. Owner-checked inside the controller
// because "owner" here means "teaches the course", not a field on the
// session itself.
router.patch(
  '/:id/cancel',
  authorize(UserRole.LECTURER),
  validateRequest(idSchema),
  sessionController.cancel
);
router.patch(
  '/:id/reschedule',
  authorize(UserRole.LECTURER),
  validateRequest(rescheduleSchema),
  sessionController.reschedule
);

export default router;
