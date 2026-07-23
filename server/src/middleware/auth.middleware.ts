import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../utils/customErrors';
import tokenService from '../services/token.service';
import User, { UserRole } from '../model/user.model';

interface UserPayload {
  userId: string;
}

/**
 * Verifies the access token, loads the user, and attaches it to the request.
 *
 * The user is re-read from the database on every request rather than trusted
 * from the token body, so an account an admin deactivates loses access on its
 * next request instead of when its 15-minute token happens to expire.
 */
const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    const payload = (await tokenService.verifyAccessToken(
      token
    )) as UserPayload;
    const user = await User.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account is not active');
    }

    if (!Object.values(UserRole).includes(user.role)) {
      throw new ForbiddenError('Invalid user role');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restricts a route to a list of roles. Always mounted after
 * `authenticateToken`, e.g.
 *
 *   router.patch('/:id/cancel', authenticateToken, authorize(UserRole.LECTURER), ...)
 */
const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError(
          `Access denied: ${roles.join(' or ')} privileges required`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Convenience wrappers for the three roles, so a route file reads as a
 * sentence rather than as a pair of middleware.
 */
const authenticateAdminToken = [authenticateToken, authorize(UserRole.ADMIN)];
const authenticateLecturerToken = [
  authenticateToken,
  authorize(UserRole.LECTURER),
];
const authenticateStudentToken = [
  authenticateToken,
  authorize(UserRole.STUDENT),
];

// Rate limiting middleware for public endpoints
const rateLimiter = (limit: number, windowMs: number) => {
  const requests = new Map<string, number[]>();

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const ip = req.ip as string;
      const now = Date.now();

      // Clean old requests
      if (requests.has(ip)) {
        const userRequests = requests.get(ip) || [];
        const validRequests = userRequests.filter(
          (timestamp) => now - timestamp < windowMs
        );

        if (validRequests.length >= limit) {
          throw new UnauthorizedError('Rate limit exceeded');
        }

        requests.set(ip, [...validRequests, now]);
      } else {
        requests.set(ip, [now]);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export {
  authenticateToken,
  authorize,
  authenticateAdminToken,
  authenticateLecturerToken,
  authenticateStudentToken,
  rateLimiter,
};
