import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { createDatabase } from '../../src/db/sqlite';
import { initSchema } from '../../src/db/schema';
import { AuthService, AuthError } from '../../src/services/auth-service';
import type { Database } from '../../src/db/sqlite';

const TEST_DB_PATH = '/tmp/polis-agent-auth-service-test.db';
const JWT_SECRET = 'test-secret-key-for-unit-tests';
const JWT_EXPIRES_IN = '1h';

function cleanupDb() {
  for (const suffix of ['', '-wal', '-shm']) {
    const p = TEST_DB_PATH + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

let db: Database;
let authService: AuthService;

beforeEach(() => {
  cleanupDb();
  db = createDatabase(TEST_DB_PATH);
  initSchema(db);
  authService = new AuthService(db, JWT_SECRET, JWT_EXPIRES_IN);
});

afterEach(() => {
  db.close();
  cleanupDb();
});

describe('AuthService.register', () => {
  it('registers a new user and returns a valid JWT token', async () => {
    const result = await authService.register('testuser', 'password123');

    expect(result.user.username).toBe('testuser');
    expect(result.user.role).toBe('user');
    expect(result.user.id).toBeDefined();
    expect(result.token).toBeDefined();

    const decoded = jwt.verify(result.token, JWT_SECRET) as jwt.JwtPayload;
    expect(decoded.sub).toBe(result.user.id);
    expect(decoded.username).toBe('testuser');
    expect(decoded.role).toBe('user');
    expect(decoded.jti).toBeDefined();
  });

  it('stores the user in the database with a hashed password', async () => {
    await authService.register('testuser', 'password123');

    const row = db.prepare('SELECT * FROM users WHERE username = ?').get('testuser') as any;
    expect(row).toBeDefined();
    expect(row.username).toBe('testuser');
    expect(row.password_hash).not.toBe('password123');
    expect(row.password_hash.startsWith('$argon2')).toBe(true);
  });

  it('throws USERNAME_TAKEN when registering a duplicate username', async () => {
    await authService.register('testuser', 'password123');

    await expect(authService.register('testuser', 'other-password')).rejects.toThrow(AuthError);
    await expect(authService.register('testuser', 'other-password')).rejects.toMatchObject({
      code: 'USERNAME_TAKEN',
    });
  });
});

describe('AuthService.login', () => {
  it('logs in with correct credentials and returns a JWT token', async () => {
    const registered = await authService.register('testuser', 'password123');
    const result = await authService.login('testuser', 'password123');

    expect(result.user.username).toBe('testuser');
    expect(result.user.id).toBe(registered.user.id);
    expect(result.token).toBeDefined();
    expect(result.token).not.toBe(registered.token);
  });

  it('throws INVALID_CREDENTIALS for non-existent username', async () => {
    await expect(authService.login('nouser', 'password123')).rejects.toThrow(AuthError);
    await expect(authService.login('nouser', 'password123')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('throws INVALID_CREDENTIALS for wrong password', async () => {
    await authService.register('testuser', 'password123');

    await expect(authService.login('testuser', 'wrong-password')).rejects.toThrow(AuthError);
    await expect(authService.login('testuser', 'wrong-password')).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
    });
  });
});

describe('AuthService.logout', () => {
  it('adds the token jti to the blacklist', async () => {
    const { token } = await authService.register('testuser', 'password123');

    authService.logout(token);

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const blacklisted = db
      .prepare('SELECT token_jti FROM token_blacklist WHERE token_jti = ?')
      .get(decoded.jti);
    expect(blacklisted).toBeDefined();
  });

  it('throws INVALID_TOKEN for an invalid token', () => {
    expect(() => authService.logout('invalid-token')).toThrow(AuthError);
    expect(() => authService.logout('invalid-token')).toThrow('Invalid token');
  });

  it('is idempotent — logging out the same token twice does not throw', async () => {
    const { token } = await authService.register('testuser', 'password123');

    authService.logout(token);
    expect(() => authService.logout(token)).not.toThrow();
  });
});

describe('AuthService.verifyToken', () => {
  it('returns the token payload for a valid token', async () => {
    const { token, user } = await authService.register('testuser', 'password123');

    const payload = authService.verifyToken(token);

    expect(payload.sub).toBe(user.id);
    expect(payload.username).toBe('testuser');
    expect(payload.role).toBe('user');
    expect(payload.jti).toBeDefined();
  });

  it('throws INVALID_TOKEN for a malformed token', () => {
    expect(() => authService.verifyToken('not-a-jwt')).toThrow(AuthError);
    expect(() => authService.verifyToken('not-a-jwt')).toThrow('Invalid token');
  });

  it('throws INVALID_TOKEN for a token signed with a different secret', async () => {
    const fakeToken = jwt.sign({ sub: 'x', username: 'x', role: 'user', jti: 'x' }, 'wrong-secret');

    expect(() => authService.verifyToken(fakeToken)).toThrow(AuthError);
  });

  it('throws TOKEN_REVOKED for a blacklisted token', async () => {
    const { token } = await authService.register('testuser', 'password123');

    authService.logout(token);

    expect(() => authService.verifyToken(token)).toThrow(AuthError);
    expect(() => authService.verifyToken(token)).toThrow('Token has been revoked');
  });
});
