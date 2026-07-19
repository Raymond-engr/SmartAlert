import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { UnauthorizedError } from '../utils/customErrors';
import validateEnv from '../utils/validateEnv';
import logger from '../utils/logger';

validateEnv();

/**
 * The `Domain` attribute for the refresh cookie, or `undefined` to leave it
 * off entirely.
 *
 * RFC 6265 forbids a Domain that is an IP literal, and browsers respond by
 * dropping the whole cookie rather than ignoring just the attribute. That
 * matters when testing on a phone: the laptop is reached at something like
 * http://192.168.1.5:3000, so sending Domain=192.168.1.5 would silently lose
 * the refresh token. Sign-in would appear to work — the access token lives in
 * memory — and then every reload would land back on the login screen.
 *
 * Omitting Domain yields a host-only cookie, which is what we want in every
 * case except a real deployment serving the API from a sibling subdomain.
 */
export function cookieDomain(): string | undefined {
  const host = new URL(
    process.env.FRONTEND_URL || 'http://localhost:3001'
  ).hostname;

  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  const isIpv6 = host.includes(':');

  if (host === 'localhost' || isIpv4 || isIpv6) {
    return undefined;
  }
  return host;
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
    res.clearCookie('refreshToken');
  }
}

export default new TokenService();
