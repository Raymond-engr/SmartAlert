import { Request, Response } from 'express';
import User, { UserRole } from '../model/user.model';
import Course from '../Timetable/models/course.model';
import Department from '../model/department.model';
import {
  BadRequestError,
  NotFoundError,
  DuplicateKeyError,
} from '../utils/customErrors';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import {
  getFacultyDepartmentData,
  getDepartmentDirectory,
  loadDepartmentsFromDb,
} from '../utils/departments';
import { toUser, toUsers } from '../utils/serializers';

class AdminController {
  /**
   * Users tab: list every account, optionally filtered by role/department,
   * for the admin panel's user table (Section 6, screen 7).
   */
  listUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { role, department } = req.query;

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (department) filter.department = department;

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: toUsers(users) });
  });

  getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = await User.findById(req.params.id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      res.status(200).json({ success: true, data: toUser(user) });
    }
  );

  /**
   * Edit or deactivate a user (Section 8: PATCH /admin/users/:id).
   *
   * Accounts are deactivated rather than deleted, since the same account may
   * be a lecturer of record on past sessions and a hard delete would orphan
   * that history.
   */
  updateUser = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { name, department, role, isActive } = req.body;

      const user = await User.findById(req.params.id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      if (role && !Object.values(UserRole).includes(role)) {
        throw new BadRequestError('Invalid role');
      }

      if (name) user.name = name;
      if (department) user.department = department;
      if (role) user.role = role;
      if (typeof isActive === 'boolean') user.isActive = isActive;

      await user.save();
      const statusNote =
        typeof isActive === 'boolean' ? ` (isActive: ${isActive})` : '';
      logger.info(`Admin updated user ${user.email}${statusNote}`);

      res.status(200).json({ success: true, data: toUser(user) });
    }
  );

  /**
   * Departments tab: the reference list a Course or User form picks from.
   *
   * Both fields are read from the in-memory cache, which is kept in step with
   * the `Departments` collection by the create/update/delete handlers below.
   * `departments` carries each department's code alongside its name because
   * the admin table lists both. Counts are deliberately not returned: the
   * client already holds the users and courses it would count, and deriving
   * them here would mean two collection scans on a screen that re-renders on
   * every tab change.
   */
  listDepartments = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      res.status(200).json({
        success: true,
        data: {
          faculties: getFacultyDepartmentData(),
          departments: getDepartmentDirectory(),
        },
      });
    }
  );

  /**
   * Add a department to the canonical list. The unique `name` is what Users and
   * Courses are validated against, so a duplicate is rejected up front rather
   * than surfacing as a driver-level duplicate-key error.
   */
  createDepartment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { name, code, faculty } = req.body;

      const existing = await Department.findOne({ name });
      if (existing) {
        throw new DuplicateKeyError('name', name);
      }

      const department = await Department.create({ name, code, faculty });
      await loadDepartmentsFromDb();

      logger.info(`Admin created department ${department.name}`);

      res.status(201).json({
        success: true,
        data: {
          id: String(department._id),
          name: department.name,
          code: department.code,
          faculty: department.faculty,
        },
      });
    }
  );

  /**
   * Edit a department. Because Users and Courses persist the department by its
   * full name (not by id), a rename has to cascade: every record carrying the
   * old name is repointed to the new one in the same request, so the reference
   * list and the stored strings never drift apart.
   */
  updateDepartment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const { name, code, faculty } = req.body;

      const department = await Department.findById(req.params.id);
      if (!department) {
        throw new NotFoundError('Department not found');
      }

      const previousName = department.name;
      const isRename = typeof name === 'string' && name !== previousName;

      if (isRename) {
        const clash = await Department.findOne({ name });
        if (clash) {
          throw new DuplicateKeyError('name', name);
        }
      }

      if (typeof name === 'string') department.name = name;
      if (typeof code === 'string') department.code = code;
      if (typeof faculty === 'string') department.faculty = faculty;

      await department.save();

      if (isRename) {
        await Promise.all([
          User.updateMany(
            { department: previousName },
            { department: department.name }
          ),
          Course.updateMany(
            { department: previousName },
            { department: department.name }
          ),
        ]);
        logger.info(
          `Admin renamed department "${previousName}" to "${department.name}" and cascaded references`
        );
      }

      await loadDepartmentsFromDb();

      res.status(200).json({
        success: true,
        data: {
          id: String(department._id),
          name: department.name,
          code: department.code,
          faculty: department.faculty,
        },
      });
    }
  );

  /**
   * Remove a department from the canonical list, but only once nothing points
   * at it. Users and Courses store the name as a plain string with no foreign
   * key to enforce this, so the check is done explicitly here to avoid orphaned
   * references to a department that no longer exists.
   */
  deleteDepartment = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const department = await Department.findById(req.params.id);
      if (!department) {
        throw new NotFoundError('Department not found');
      }

      const [userCount, courseCount] = await Promise.all([
        User.countDocuments({ department: department.name }),
        Course.countDocuments({ department: department.name }),
      ]);

      if (userCount > 0 || courseCount > 0) {
        throw new BadRequestError(
          'Cannot delete a department that still has users or courses.'
        );
      }

      await department.deleteOne();
      await loadDepartmentsFromDb();

      logger.info(`Admin deleted department ${department.name}`);

      res.status(200).json({
        success: true,
        message: 'Department deleted',
      });
    }
  );
}

export default new AdminController();
