import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import { createAuthRouter } from '../../src/api/auth-routes';

// Inline mock types to avoid importing auth-service.ts (which pulls in uuid/argon2/jsonwebtoken)
interface AuthTokenPayload {
  sub: string;
  username: string;
  role: string;
  jti: string;
}

interface AuthResult {
  token: string;
  user: { id: string; username: string; role: string };
}

class AuthError extends Error {
  code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// Mock auth-service module so AuthError instanceof checks work inside auth-routes
vi.mock('../../src/services/auth-service', () => ({
  AuthError,
}));

function createMockAuthService() {
  return {
    register: vi.fn<(username: string, password: string) => Promise<AuthResult>>(),
    login: vi.fn<(username: string, password: string) => Promise<AuthResult>>(),
    logout: vi.fn<(token: string) => void>(),
    verifyToken: vi.fn<(token: string) => AuthTokenPayload>(),
  };
}

/**
 * Helper: simulate an HTTP request through the Express router and capture the response.
 * Uses Express internals so we don't need supertest as a dependency.
 */
async function simulateRequest(
  app: express.Express,
  method: 'post',
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve) => {
    const req = {
      method: method.toUpperCase(),
      url: path,
      headers: { 'content-type': 'application/json', ...(headers ?? {}) },
      body,
    };

    let statusCode = 200;
    let responseBody: unknown;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        resolve({ status: statusCode, body: responseBody });
        return this;
      },
      send(data: unknown) {
        responseBody = data;
        resolve({ status: statusCode, body: responseBody });
        return this;
      },
    };

    // Use Express app handle to process the mock request
    app.handle(req as any, res as any, () => {
      resolve({ status: 404, body: { error: 'Not found' } });
    });
  });
}

function createApp(authService: ReturnType<typeof createMockAuthService>) {
  const app = express();
  app.use(express.json());
  app.use('/auth', createAuthRouter(authService as any));
  return app;
}

describe('POST /auth/register', () => {
  it('returns 201 with token and user on successful registration', async () => {
    const authService = createMockAuthService();
    const mockResult: AuthResult = {
      token: 'jwt-token-123',
      user: { id: 'user-1', username: 'newuser', role: 'user' },
    };
    authService.register.mockResolvedValue(mockResult);
    const app = createApp(authService);

    const res = await simulateRequest(app, 'post', '/auth/register', {
      username: 'newuser',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(mockResult);
    expect(authService.register).toHaveBeenCalledWith('newuser', 'password123');
  });

  it('returns 400 when username is missing', async () => {
    const authService = createMockAuthService();
    const app = createApp(authService);

    const res = await simulateRequest(app, 'post', '/auth/register', {
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Username and password are required' });
  });

  it('returns 400 when password is missing', async () => {
    const authService = createMockAuthService();
    const app = createApp(authService);

    const res = await simulateRequest(app, 'post', '/auth/register', {
      username: 'newuser',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Username and password are required' });
  });

  it('returns 409 when username already exists', async () => {
    const authService = createMockAuthService();
    authService.register.mockRejectedValue(
      new AuthError('Username already exists', 'USERNAME_TAKEN'),
    );
    const app = createApp(authService);

    const res = await simulateRequest(app, 'post', '/auth/register', {
      username: 'existing',
      password: 'password123',
    });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ error: 'Username already exists' });
  });
});

describe('POST /auth/login', () => {
  it('returns 200 with token and user on successful login', async () => {
    const authService = createMockAuthService();
    const mockResult: AuthResult = {
      token: 'jwt-token-456',
      user: { id: 'user-1', username: 'testuser', role: 'user' },
    };
    authService.login.mockResolvedValue(mockResult);
    const app = createApp(authService);

    const res = await simulateRequest(app, 'post', '/auth/login', {
      username: 'testuser',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockResult);
    expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
  });

  it('returns 400 when username is missing', async () => {
    const authService = createMockAuthService();
    const app = createApp(authService);

    const res = await simulateRequest(app, 'post', '/auth/login', {
      password: 'password123',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Username and password are required' });
  });

  it('returns 400 when password is missing', async () => {
    const authService = createMockAuthService();
    const app = createApp(authService);

    const res = await simulateRequest(app, 'post', '/auth/login', {
      username: 'testuser',
    });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Username and password are required' });
  });

  it('returns 401 when credentials are invalid', async () => {
    const authService = createMockAuthService();
    authService.login.mockRejectedValue(
      new AuthError('Invalid username or password', 'INVALID_CREDENTIALS'),
    );
    const app = createApp(authService);

    const res = await simulateRequest(app, 'post', '/auth/login', {
      username: 'testuser',
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid username or password' });
  });
});

describe('POST /auth/logout', () => {
  it('returns 200 on successful logout', async () => {
    const authService = createMockAuthService();
    const mockPayload: AuthTokenPayload = {
      sub: 'user-1',
      username: 'testuser',
      role: 'user',
      jti: 'jti-123',
    };
    authService.verifyToken.mockReturnValue(mockPayload);
    authService.logout.mockReturnValue(undefined);
    const app = createApp(authService);

    const res = await simulateRequest(
      app,
      'post',
      '/auth/logout',
      {},
      { authorization: 'Bearer valid-token' },
    );

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: 'Logged out successfully' });
    expect(authService.logout).toHaveBeenCalledWith('valid-token');
  });

  it('returns 401 when no token is provided', async () => {
    const authService = createMockAuthService();
    const app = createApp(authService);

    const res = await simulateRequest(app, 'post', '/auth/logout', {});

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Missing or malformed Authorization header' });
  });

  it('returns 401 when token is invalid', async () => {
    const authService = createMockAuthService();
    authService.verifyToken.mockImplementation(() => {
      throw new AuthError('Invalid token', 'INVALID_TOKEN');
    });
    const app = createApp(authService);

    const res = await simulateRequest(
      app,
      'post',
      '/auth/logout',
      {},
      { authorization: 'Bearer invalid-token' },
    );

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
  });
});
