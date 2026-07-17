import { Router } from 'express';
import authRoutes from './auth.routes';
import adminRoutes from './admin.routes';
import courseRoutes from '../Timetable/routes/course.routes';
import sessionRoutes from '../Timetable/routes/session.routes';
import enrolmentRoutes from '../Enrolment/routes/enrolment.routes';
import notificationRoutes from '../Notifications/routes/notification.routes';

const router = Router();

// Mount route groups
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/courses', courseRoutes);
router.use('/sessions', sessionRoutes);
router.use('/enrolments', enrolmentRoutes);
router.use('/notifications', notificationRoutes);

// Root route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SmartAlert API is running',
  });
});

export default router;
