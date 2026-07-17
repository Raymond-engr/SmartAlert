import mongoose from 'mongoose';
import connectDB from '../db/database';
import validateEnv from '../utils/validateEnv';
import logger from '../utils/logger';
import User, { UserRole } from '../model/user.model';
import Course from '../Timetable/models/course.model';
import TimetableSession from '../Timetable/models/timetableSession.model';
import Enrolment from '../Enrolment/models/enrolment.model';
import { LAUNCH_DEPARTMENT } from '../utils/departments';

validateEnv();

/**
 * Seeds one lecturer, three students, two courses, and a few timetable
 * sessions in the Department of Computer Science. Meant for local testing
 * with a REST client before the frontend exists — every id printed at the
 * end is enough to exercise the cancel/reschedule pipeline by hand.
 *
 * Safe to re-run: it skips any record whose email/code already exists rather
 * than duplicating it.
 */
const seedDemoData = async (): Promise<void> => {
  try {
    await connectDB();
    logger.info('Connected to database');

    const lecturer =
      (await User.findOne({ email: 'a.adjekofori@csc.uniben.edu' })) ??
      (await User.create({
        name: 'Dr. A. Adjekofori',
        email: 'a.adjekofori@csc.uniben.edu',
        password: 'Password123!',
        role: UserRole.LECTURER,
        department: LAUNCH_DEPARTMENT,
        isActive: true,
      }));

    const studentSeeds = [
      { name: 'Israel Adjekofori', email: 'israel.student@csc.uniben.edu', matricNumber: 'PSC2207846' },
      { name: 'Amaka Obi', email: 'amaka.obi@csc.uniben.edu', matricNumber: 'PSC2207812' },
      { name: 'Chinedu Eze', email: 'chinedu.eze@csc.uniben.edu', matricNumber: 'PSC2207833' },
    ];

    const students = [];
    for (const seed of studentSeeds) {
      const student =
        (await User.findOne({ email: seed.email })) ??
        (await User.create({
          ...seed,
          password: 'Password123!',
          role: UserRole.STUDENT,
          department: LAUNCH_DEPARTMENT,
          isActive: true,
        }));
      students.push(student);
    }

    const courseSeeds = [
      { code: 'CSC 401', name: 'Distributed Systems', units: 3 },
      { code: 'CSC 405', name: 'Machine Learning', units: 4 },
    ];

    const courses = [];
    for (const seed of courseSeeds) {
      const course =
        (await Course.findOne({ code: seed.code })) ??
        (await Course.create({
          ...seed,
          department: LAUNCH_DEPARTMENT,
          lecturer: lecturer._id,
        }));
      courses.push(course);
    }

    const sessionSeeds = [
      { course: courses[0], day: 'Monday' as const, startTime: '10:00', endTime: '12:00', venue: 'PSC Lecture Theatre 1' },
      { course: courses[1], day: 'Wednesday' as const, startTime: '14:00', endTime: '16:00', venue: 'PSC Lecture Theatre 2' },
    ];

    for (const seed of sessionSeeds) {
      const exists = await TimetableSession.findOne({
        course: seed.course._id,
        day: seed.day,
        startTime: seed.startTime,
      });
      if (!exists) {
        await TimetableSession.create({
          course: seed.course._id,
          day: seed.day,
          startTime: seed.startTime,
          endTime: seed.endTime,
          venue: seed.venue,
        });
      }
    }

    // Every student enrols in every course, so a single cancel/reschedule
    // call has more than one recipient to fan out to.
    for (const student of students) {
      for (const course of courses) {
        const exists = await Enrolment.findOne({
          student: student._id,
          course: course._id,
        });
        if (!exists) {
          await Enrolment.create({ student: student._id, course: course._id });
        }
      }
    }

    logger.info('Demo data seeded:');
    logger.info(`  Lecturer: ${lecturer.email} (id: ${lecturer._id})`);
    students.forEach((s) => logger.info(`  Student: ${s.email} (id: ${s._id})`));
    courses.forEach((c) => logger.info(`  Course: ${c.code} (id: ${c._id})`));
    logger.info('  Password for every seeded account: Password123!');
  } catch (error) {
    logger.error(
      'Error seeding demo data:',
      error instanceof Error ? error : String(error)
    );
  } finally {
    await mongoose.disconnect();
  }
};

seedDemoData();
