import { IUser } from '../model/user.model';

/**
 * Attaches the authenticated user document to the Express Request, so every
 * controller downstream of `authenticateToken` can read `req.user` without a
 * local cast.
 */
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export {};
