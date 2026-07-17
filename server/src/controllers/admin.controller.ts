import { Request, Response } from 'express';
import User, { UserRole } from '../model/user.model';
import { BadRequestError, NotFoundError } from '../utils/customErrors';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import {
  getFacultyDepartmentData,
  getDepartmentDirectory,
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
   * Read-only in this phase (Section 1.2: single department for launch).
   *
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
}

export default new AdminController();
