import { Request, Response } from 'express';
import Course from '../models/course.model';
import User, { UserRole } from '../../model/user.model';
import Enrolment from '../../Enrolment/models/enrolment.model';
import {
  BadRequestError,
  NotFoundError,
  DuplicateKeyError,
} from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import { toCourse, toCourses } from '../../utils/serializers';

class CourseController {
  /**
   * List/search courses. Every role can read this endpoint: students need it
   * for enrolment search, lecturers and admins need it to pick a course when
   * building the schedule.
   */
  list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { search, department } = req.query;

    const filter: Record<string, unknown> = {};
    if (department) filter.department = department;
    if (search) {
      filter.$text = { $search: String(search) };
    }

    const courses = await Course.find(filter)
      .populate('lecturer', 'name email')
      .sort({ code: 1 });

    let enrolledIds: Set<string> | undefined;
    if (req.user!.role === UserRole.STUDENT) {
      const enrolments = await Enrolment.find({ student: req.user!._id }).select(
        'course'
      );
      enrolledIds = new Set(enrolments.map((e) => String(e.course)));
    }

    res.status(200).json({ success: true, data: toCourses(courses, enrolledIds) });
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const course = await Course.findById(req.params.id).populate(
      'lecturer',
      'name email'
    );

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    res.status(200).json({ success: true, data: toCourse(course) });
  });

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code, name, department, units, lecturer } = req.body;

    const lecturerUser = await User.findById(lecturer);
    if (!lecturerUser || lecturerUser.role !== UserRole.LECTURER) {
      throw new BadRequestError('lecturer must reference a valid lecturer account');
    }

    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) {
      throw new DuplicateKeyError('code', code);
    }

    const course = await Course.create({ code, name, department, units, lecturer });
    logger.info(`Course created: ${course.code} (lecturer: ${lecturerUser.email})`);

    res.status(201).json({ success: true, data: toCourse(course) });
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code, name, department, units, lecturer } = req.body;

    if (!code && !name && !department && !units && !lecturer) {
      throw new BadRequestError('At least one field is required');
    }

    if (lecturer) {
      const lecturerUser = await User.findById(lecturer);
      if (!lecturerUser || lecturerUser.role !== UserRole.LECTURER) {
        throw new BadRequestError(
          'lecturer must reference a valid lecturer account'
        );
      }
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    if (code) course.code = code;
    if (name) course.name = name;
    if (department) course.department = department;
    if (units) course.units = units;
    if (lecturer) course.lecturer = lecturer;

    await course.save();
    logger.info(`Course updated: ${course.code}`);

    res.status(200).json({ success: true, data: toCourse(course) });
  });

  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      throw new NotFoundError('Course not found');
    }

    logger.info(`Course deleted: ${course.code}`);
    res
      .status(200)
      .json({ success: true, message: 'Course deleted successfully' });
  });
}

export default new CourseController();
