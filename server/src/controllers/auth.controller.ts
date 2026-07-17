import { Request, Response } from 'express';
import User, { UserRole } from '../model/user.model';
import tokenService from '../services/token.service';
import emailService from '../services/email.service';
import {
  UnauthorizedError,
  BadRequestError,
  DuplicateKeyError,
} from '../utils/customErrors';
import asyncHandler from '../utils/asyncHandler';
import logger from '../utils/logger';
import { isValidDepartment } from '../utils/departments';
import { toUser, SerializedUser } from '../utils/serializers';

interface IAuthResponse {
  success: boolean;
  accessToken?: string;
  message?: string;
  user?: SerializedUser;
}

class AuthController {
  /**
   * Self-service registration for students and lecturers.
   *
   * Admin accounts are deliberately not creatable here: they are seeded with
   * `npm run seed:admin` or created by an existing admin, so that nobody can
   * hand themselves the master schedule by picking a role from a dropdown.
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email, password, role, department, matricNumber } = req.body;

    logger.info(`Registration attempt for email: ${email}`);

    if (role === UserRole.ADMIN) {
      throw new BadRequestError(
        'Admin accounts cannot be self-registered. Contact the department administrator.'
      );
    }

    if (!isValidDepartment(department)) {
      throw new BadRequestError(
        'Unknown department. Please choose a department from the list.'
      );
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      logger.warn(`Registration blocked, email already in use: ${email}`);
      throw new DuplicateKeyError('email', email);
    }

    // The pre-save hook on the schema hashes this with bcrypt before it lands
    // in the database; a plaintext password is never persisted.
    const user = await User.create({
      name,
      email,
      password,
      role,
      department,
      matricNumber: role === UserRole.STUDENT ? matricNumber : undefined,
      isActive: true,
    });

    const userId = String(user._id);
    const tokens = tokenService.generateTokens({
      userId,
      email: user.email,
      role: user.role,
    });

    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    tokenService.setRefreshTokenCookie(res, tokens.refreshToken);

    // A failed welcome email must not fail the registration.
    try {
      await emailService.sendWelcomeEmail(
        user.email,
        user.name,
        user.role,
        user.department
      );
    } catch (error) {
      logger.error('Failed to send welcome email:', error);
    }

    logger.info(`Registration successful for ${email} as ${role}`);

    const response: IAuthResponse = {
      success: true,
      accessToken: tokens.accessToken,
      user: toUser(user),
    };

    res.status(201).json(response);
  });

  /**
   * One login endpoint for all three roles. The role comes back in the
   * response so the client can route to the right dashboard.
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    logger.info(`Login attempt for email: ${email}`);

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    // The same message for an unknown email and a wrong password, so the
    // endpoint cannot be used to enumerate who has an account.
    if (!user || !(await user.comparePassword(password))) {
      logger.warn(`Failed login attempt for: ${email}`);
      throw new UnauthorizedError('Invalid email or password');
    }

    if (!user.isActive) {
      logger.warn(`Inactive account attempted login: ${email}`);
      throw new UnauthorizedError(
        'Your account is not active. Please contact the department administrator.'
      );
    }

    const userId = String(user._id);
    const tokens = tokenService.generateTokens({
      userId,
      email: user.email,
      role: user.role,
    });

    user.refreshToken = tokens.refreshToken;
    user.lastLogin = new Date();
    await user.save();

    tokenService.setRefreshTokenCookie(res, tokens.refreshToken);
    logger.info(`Login successful for ${email} (${user.role})`);

    const response: IAuthResponse = {
      success: true,
      accessToken: tokens.accessToken,
      user: toUser(user),
    };

    res.status(200).json(response);
  });

  refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token is required');
      }

      const decoded = await tokenService.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.userId);

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Your account is not active');
      }

      const userId = String(user._id);
      const tokens = await tokenService.rotateRefreshToken(refreshToken, {
        userId,
        email: user.email,
        role: user.role,
      });

      user.refreshToken = tokens.refreshToken;
      await user.save();

      tokenService.setRefreshTokenCookie(res, tokens.refreshToken);

      const response: IAuthResponse = {
        success: true,
        accessToken: tokens.accessToken,
      };

      res.status(200).json(response);
    }
  );

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      try {
        const decoded = await tokenService.verifyRefreshToken(refreshToken);
        await tokenService.blacklistToken(
          refreshToken,
          new Date(decoded.exp! * 1000)
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Invalid token during logout:', errorMessage);
      }
    }

    tokenService.clearRefreshTokenCookie(res);

    const response: IAuthResponse = {
      success: true,
      message: 'Logged out successfully',
    };

    res.status(200).json(response);
  });

  verifyToken = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user!;

      res.status(200).json({
        success: true,
        user: {
          id: String(user._id),
          role: user.role,
        },
      });
    }
  );

  /**
   * The profile screen shared by all three roles.
   */
  getProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user!;

      const response: IAuthResponse = {
        success: true,
        user: toUser(user),
      };

      res.status(200).json(response);
    }
  );

  /**
   * Edit-profile, available to every role.
   *
   * Email and role are not editable here: changing an email would silently
   * redirect a student's alerts, and changing a role would be a privilege
   * escalation. Both are admin operations.
   */
  updateProfile = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const user = req.user!;
      const { name, department, matricNumber, password } = req.body;

      if (department && !isValidDepartment(department)) {
        throw new BadRequestError(
          'Unknown department. Please choose a department from the list.'
        );
      }

      if (name) user.name = name;
      if (department) user.department = department;
      if (matricNumber && user.role === UserRole.STUDENT) {
        user.matricNumber = matricNumber;
      }
      if (password) user.password = password; // re-hashed by the pre-save hook

      await user.save();
      logger.info(`Profile updated for ${user.email}`);

      const response: IAuthResponse = {
        success: true,
        message: 'Profile updated successfully',
        user: toUser(user),
      };

      res.status(200).json(response);
    }
  );
}

export default new AuthController();
