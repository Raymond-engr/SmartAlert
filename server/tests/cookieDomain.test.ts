import { cookieDomain } from '../src/services/token.service';

describe('refresh cookie Domain attribute', () => {
  const original = process.env.FRONTEND_URL;

  afterEach(() => {
    process.env.FRONTEND_URL = original;
  });

  it('is omitted for localhost', () => {
    process.env.FRONTEND_URL = 'http://localhost:3000';
    expect(cookieDomain()).toBeUndefined();
  });

  it('is omitted for a LAN IP, so phone testing keeps its session', () => {
    // A Domain of "192.168.1.5" is invalid per RFC 6265 and makes browsers
    // discard the cookie outright, which logs the user out on every reload.
    process.env.FRONTEND_URL = 'http://192.168.1.5:3000';
    expect(cookieDomain()).toBeUndefined();
  });

  it('is omitted for an IPv6 host', () => {
    process.env.FRONTEND_URL = 'http://[::1]:3000';
    expect(cookieDomain()).toBeUndefined();
  });

  it('is kept for a real hostname', () => {
    process.env.FRONTEND_URL = 'https://smartalert.uniben.edu.ng';
    expect(cookieDomain()).toBe('smartalert.uniben.edu.ng');
  });

  it('falls back to the default when unset', () => {
    delete process.env.FRONTEND_URL;
    expect(cookieDomain()).toBeUndefined();
  });
});
