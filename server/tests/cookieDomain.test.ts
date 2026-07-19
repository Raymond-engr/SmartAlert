import type { Response } from 'express';
import tokenService, { cookieDomain } from '../src/services/token.service';

describe('refresh cookie Domain attribute', () => {
  const originalCookieDomain = process.env.COOKIE_DOMAIN;
  const originalFrontendUrl = process.env.FRONTEND_URL;

  afterEach(() => {
    process.env.COOKIE_DOMAIN = originalCookieDomain;
    process.env.FRONTEND_URL = originalFrontendUrl;
  });

  it('is omitted when COOKIE_DOMAIN is unset', () => {
    delete process.env.COOKIE_DOMAIN;
    expect(cookieDomain()).toBeUndefined();
  });

  it('is omitted when COOKIE_DOMAIN is blank', () => {
    process.env.COOKIE_DOMAIN = '';
    expect(cookieDomain()).toBeUndefined();
  });

  it('is omitted when COOKIE_DOMAIN is only whitespace', () => {
    // an env file with a trailing space after the "=" is easy to write and
    // would otherwise produce Domain=" ", which no host can ever match
    process.env.COOKIE_DOMAIN = '   ';
    expect(cookieDomain()).toBeUndefined();
  });

  it('uses COOKIE_DOMAIN when a shared parent is configured', () => {
    process.env.COOKIE_DOMAIN = 'smartalert.ng';
    expect(cookieDomain()).toBe('smartalert.ng');
  });

  it('trims surrounding whitespace', () => {
    process.env.COOKIE_DOMAIN = ' smartalert.ng ';
    expect(cookieDomain()).toBe('smartalert.ng');
  });

  it('ignores FRONTEND_URL entirely', () => {
    // The API sets this cookie, so scoping it to the frontend's host made the
    // browser reject it outright on any split deployment. FRONTEND_URL is for
    // CORS; it must have no say in cookie scope.
    delete process.env.COOKIE_DOMAIN;
    process.env.FRONTEND_URL = 'https://smartalert.vercel.app';
    expect(cookieDomain()).toBeUndefined();
  });
});

describe('setting and clearing agree', () => {
  const original = process.env.COOKIE_DOMAIN;

  afterEach(() => {
    process.env.COOKIE_DOMAIN = original;
  });

  /** Captures the options each cookie call was made with. */
  function fakeResponse() {
    const set: Record<string, unknown>[] = [];
    const cleared: Record<string, unknown>[] = [];
    const res = {
      cookie: (_n: string, _v: string, opts: Record<string, unknown>) => {
        set.push(opts);
      },
      clearCookie: (_n: string, opts: Record<string, unknown>) => {
        cleared.push(opts);
      },
    } as unknown as Response;
    return { res, set, cleared };
  }

  it.each([
    ['unset', undefined],
    ['a shared parent', 'smartalert.ng'],
  ])('clears with the same scope it set, with COOKIE_DOMAIN %s', (_label, value) => {
    if (value === undefined) {
      delete process.env.COOKIE_DOMAIN;
    } else {
      process.env.COOKIE_DOMAIN = value;
    }

    const { res, set, cleared } = fakeResponse();
    tokenService.setRefreshTokenCookie(res, 'token');
    tokenService.clearRefreshTokenCookie(res);

    // a mismatch here means logout silently leaves the session alive
    expect(cleared[0].domain).toBe(set[0].domain);
    expect(cleared[0].path).toBe(set[0].path);
    expect(cleared[0].sameSite).toBe(set[0].sameSite);
    expect(cleared[0].secure).toBe(set[0].secure);
  });
});
