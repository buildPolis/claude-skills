import { describe, it, expect, vi } from 'vitest';
import type { Request, Response } from 'express';
import { createAuthMiddleware } from '../../src/api/auth-middleware';
import type { AuthenticatedRequest } from '../../src/api/auth-middleware';

// Inline mock types to avoid importing auth-service.ts (which pulls in uuid/argon2/jsonwebtoken)
interface AuthTokenPayload {
  sub: string;
  username: string;
  role: string;
  jti: string;
}

class AuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

function createMockAuthService(verifyTokenImpl?: (token: string) => AuthTokenPayload) {
  return {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    verifyToken: vi.fn(verifyTokenImpl ?? (() => { throw new AuthError('Invalid token', 'INVALID_TOKEN'); })),
  };
}

function createMockResponse() {
  const res: Partial<Response> & { _status?: number; _body?: unknown } = {};
  const jsonFn = (body: unknown) => {
    res._body = body;
    return res as Response;
  };
  res.status = vi.fn((code: number) => {
    res._status = code;
    return { json: jsonFn } as unknown as Response;
  });
  res.json = vi.fn(jsonFn);
  return res as Response & { _status?: number; _body?: unknown };
}

describe('authMiddleware', () => {
  it('returns 401 when no Authorization header is present', () => {
    const authService = createMockAuthService();
    const middleware = createAuthMiddleware(authService as any);
    const req = { headers: {} } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res._status).toBe(401);
    expect(res._body).toEqual({ error: 'Missing or malformed Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when Authorization header does not start with Bearer', () => {
    const authService = createMockAuthService();
    const middleware = createAuthMiddleware(authService as any);
    const req = { headers: { authorization: 'Basic abc123' } } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res._status).toBe(401);
    expect(res._body).toEqual({ error: 'Missing or malformed Authorization header' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', () => {
    const authService = createMockAuthService(() => {
      throw new AuthError('Invalid token', 'INVALID_TOKEN');
    });
    const middleware = createAuthMiddleware(authService as any);
    const req = { headers: { authorization: 'Bearer invalid-token' } } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res._status).toBe(401);
    expect(res._body).toEqual({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token has been blacklisted', () => {
    const authService = createMockAuthService(() => {
      throw new AuthError('Token has been revoked', 'TOKEN_REVOKED');
    });
    const middleware = createAuthMiddleware(authService as any);
    const req = { headers: { authorization: 'Bearer blacklisted-token' } } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    middleware(req, res, next);

    expect(res._status).toBe(401);
    expect(res._body).toEqual({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and attaches user info to req for a valid token', () => {
    const mockPayload: AuthTokenPayload = {
      sub: 'user-id-123',
      username: 'testuser',
      role: 'user',
      jti: 'jti-abc',
    };
    const authService = createMockAuthService(() => mockPayload);
    const middleware = createAuthMiddleware(authService as any);
    const req = { headers: { authorization: 'Bearer valid-token' } } as Request;
    const res = createMockResponse();
    const next = vi.fn();

    middleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBeUndefined();

    const authenticatedReq = req as AuthenticatedRequest;
    expect(authenticatedReq.user).toBeDefined();
    expect(authenticatedReq.user.sub).toBe('user-id-123');
    expect(authenticatedReq.user.username).toBe('testuser');
    expect(authenticatedReq.user.role).toBe('user');
    expect(authenticatedReq.user.jti).toBe('jti-abc');
  });
});
