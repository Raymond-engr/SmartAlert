import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { UnauthorizedError } from '../utils/customErrors';
import validateEnv from '../utils/validateEnv';
import logger from '../utils/logger';

validateEnv();

/**
 * The `Domain` attribute for the refresh cookie, or `undefined` to leave it
 * off entirely — which is the right answer almost always.
 *
 * Omitting Domain gives a host-only cookie: the browser stores it against the
 * API's own host and sends it back only there. That is the entire lifecycle of
 * this cookie. It is httpOnly, so the frontend cannot read it under any
 * scoping, and the only code that ever consumes it is the refresh endpoint.
 *
 * Deriving the value from FRONTEND_URL, as this once did, is worse than
 * redundant. A server may only set a cookie for itself or a parent of itself,
 * so an API on smartalert-api.onrender.com naming smartalert.vercel.app is
 * rejected outright — the browser drops the cookie rather than trimming the
 * attribute. Login still looks fine, because the access token is held in
 * memory, and then the first reload finds no refresh cookie and bounces the
 * user back to the login screen.
 *
 * Set COOKIE_DOMAIN only when the API and the frontend sit on subdomains of
 * one parent you control, and set it to that shared parent — COOKIE_DOMAIN=
 * smartalert.ng for api.smartalert.ng and app.smartalert.ng. Naming either
 * sibling instead fails the same rule. Cross-site delivery does not need this
 * and never did: that is what SameSite=None with Secure is for.
 */
export function cookieDomain(): string | undefined {
  const configured = (process.env.COOKIE_DOMAIN || '').trim();
  return configured === '' ? undefined : configured;
}

interface BlacklistedTokenDocument extends mongoose.Document {
  token: string;
  expiresAt: Date;
}

const BlacklistedTokenSchema = new mongoose.Schema<BlacklistedTokenDocument>({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    expires: 0,
  },
});

const BlacklistedToken = mongoose.model<BlacklistedTokenDocument>(
  'BlacklistedToken',
  BlacklistedTokenSchema,
  'BlacklistedTokens'
);

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
}

class TokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET as string;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET as string;

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets must be defined in environment variables');
    }
  }

  generateTokens(payload: TokenPayload): GeneratedTokens {
    const now = Math.floor(Date.now() / 1000);

    const accessToken = jwt.sign(
      {
        ...payload,
        iat: now,
        exp: now + 15 * 60, // 15 minutes
      },
      this.accessTokenSecret
    );

    const refreshToken = jwt.sign(
      {
        ...payload,
        iat: now,
        exp: now + 7 * 24 * 60 * 60, // 7 days
      },
      this.refreshTokenSecret
    );

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      return jwt.verify(token, this.accessTokenSecret) as TokenPayload;
    } catch (error) {
      logger.error('Error verifying access token:', error);
      throw new UnauthorizedError('Invalid access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      logger.info('Verifying refresh token:', `${token.substring(0, 8)}...`);
      const isBlacklisted = await BlacklistedToken.exists({ token });
      if (isBlacklisted) {
        logger.error('Token is blacklisted');
        throw new UnauthorizedError('Token has been revoked');
      }

      const decoded = jwt.verify(
        token,
        this.refreshTokenSecret
      ) as TokenPayload;
      logger.info('Token verified successfully for user:', decoded);
      return decoded;
    } catch (error) {
      logger.error(
        'Token verification failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async blacklistToken(token: string, expiresAt: Date): Promise<void> {
    await BlacklistedToken.create({
      token,
      expiresAt,
    });
  }

  async rotateRefreshToken(
    oldToken: string,
    payload: TokenPayload
  ): Promise<GeneratedTokens> {
    const tokens = this.generateTokens(payload);

    // Blacklist old token
    const decoded = jwt.decode(oldToken) as TokenPayload;
    if (decoded?.exp) {
      await this.blacklistToken(oldToken, new Date(decoded.exp * 1000));
    }

    return tokens;
  }

  setRefreshTokenCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
      domain: cookieDomain(),
    });
  }

  clearRefreshTokenCookie(res: Response): void {
    // The attributes have to match the ones the cookie was set with or the
    // browser treats this as clearing a different cookie and leaves the real
    // one in place — so signing out would not actually end the session.
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      domain: cookieDomain(),
    });
  }
}

export default new TokenService();
