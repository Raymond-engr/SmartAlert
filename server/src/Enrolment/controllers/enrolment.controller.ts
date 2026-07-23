import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Enrolment from '../models/enrolment.model';
import Course from '../../Timetable/models/course.model';
import {
  BadRequestError,
  DuplicateKeyError,
  NotFoundError,
} from '../../utils/customErrors';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import { toCourse, toUser } from '../../utils/serializers';

class EnrolmentController {
  /**
   * Enrols the logged-in student in a course. The unique compound index on
   * (student, course) is the actual guard against duplicates; the findOne
   * below only exists to return a clearer 409 instead of a raw Mongo error.
   */
  enrol = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const student = req.user!;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      throw new BadRequestError('courseId must reference an existing course');
    }

    const existing = await Enrolment.findOne({
      student: student._id,
      course: courseId,
    });
    if (existing) {
      throw new DuplicateKeyError('course', course.code);
    }

    const enrolment = await Enrolment.create({
      student: student._id,
      course: courseId,
    });

    await enrolment.populate({
      path: 'course',
      select: 'code name department units lecturer',
      populate: { path: 'lecturer', select: 'name email' },
    });

    logger.info(`${student.email} enrolled in ${course.code}`);

    res.status(201).json({
      success: true,
      data: { id: String(enrolment._id), course: toCourse(enrolment.course) },
    });
  });

  myEnrolments = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const student = req.user!;
      const enrolments = await Enrolment.find({ student: student._id })
        .populate({
          path: 'course',
          select: 'code name department units lecturer',
          populate: { path: 'lecturer', select: 'name email' },
        })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: enrolments.map((e) => ({
          id: String(e._id),
          course: toCourse(e.course),
        })),
      });
    }
  );

  unenrol = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const student = req.user!;

    const enrolment = await Enrolment.findOneAndDelete({
      _id: req.params.id,
      student: student._id,
    });

    if (!enrolment) {
      throw new NotFoundError('Enrolment not found');
    }

    logger.info(`${student.email} unenrolled from course ${enrolment.course}`);

    res
      .status(200)
      .json({ success: true, message: 'Unenrolled successfully' });
  });

  /**
   * Admin view: every student enrolled in a given course, used by the
   * Master Schedule tab to show class size before it appears on Section 8.
   */
  byCourse = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const courseId = req.params.courseId as unknown as Types.ObjectId;
      const enrolments = await Enrolment.find({ course: courseId }).populate(
        'student',
        'name email matricNumber'
      );

      res.status(200).json({
        success: true,
        data: enrolments.map((e) => ({
          ...e.toObject(),
          student: toUser(e.student),
        })),
      });
    }
  );
}

export default new EnrolmentController();
