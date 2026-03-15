import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import http from 'node:http';
import { createDatabase } from '../src/db/sqlite';
import { initSchema } from '../src/db/schema';
import { createApiServer } from '../src/api/server';
import type { Database } from '../src/db/sqlite';

const TEST_DB_PATH = '/tmp/polis-agent-auth-integration-test.db';
const JWT_SECRET = 'integration-test-secret-key';
const JWT_EXPIRES_IN = '1h';
const API_PORT = 0; // Let OS assign a random available port

function cleanupDb() {
  for (const suffix of ['', '-wal', '-shm']) {
    const p = TEST_DB_PATH + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
}

function request(
  server: http.Server,
  method: string,
  path: string,
  body?: Record<string, unknown>,
  headers?: Record<string, string>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const address = server.address() as { port: number };
    const data = body ? JSON.stringify(body) : undefined;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode!, body: JSON.parse(rawData) });
          } catch {
            resolve({ status: res.statusCode!, body: {} });
          }
        });
      },
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

let db: Database;
let server: http.Server;

beforeAll(async () => {
  cleanupDb();
  db = createDatabase(TEST_DB_PATH);
  initSchema(db);
  server = createApiServer({
    db,
    jwtSecret: JWT_SECRET,
    jwtExpiresIn: JWT_EXPIRES_IN,
    port: API_PORT,
  });
  await new Promise<void>((resolve) => {
    if (server.listening) {
      resolve();
    } else {
      server.on('listening', () => resolve());
    }
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
  db.close();
  cleanupDb();
});

describe('Auth integration: full flow', () => {
  it('register → login → access protected endpoint → logout → token is invalidated', async () => {
    // 1. Register a new user
    const registerRes = await request(server, 'POST', '/auth/register', {
      username: 'integrationuser',
      password: 'securePassword123',
    });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.token).toBeDefined();
    expect(registerRes.body.user).toMatchObject({
      username: 'integrationuser',
      role: 'user',
    });
    const registerToken = registerRes.body.token as string;

    // 2. Login with the same credentials
    const loginRes = await request(server, 'POST', '/auth/login', {
      username: 'integrationuser',
      password: 'securePassword123',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user).toMatchObject({
      username: 'integrationuser',
      role: 'user',
    });
    const loginToken = loginRes.body.token as string;
    expect(loginToken).not.toBe(registerToken);

    // 3. Use the login token to access a protected endpoint (logout itself is protected)
    const logoutRes = await request(server, 'POST', '/auth/logout', {}, {
      Authorization: `Bearer ${loginToken}`,
    });
    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.message).toBe('Logged out successfully');

    // 4. Verify the logged-out token is now invalidated
    const reusedTokenRes = await request(server, 'POST', '/auth/logout', {}, {
      Authorization: `Bearer ${loginToken}`,
    });
    expect(reusedTokenRes.status).toBe(401);
    expect(reusedTokenRes.body.error).toBeDefined();
  });

  it('register fails with duplicate username (409)', async () => {
    await request(server, 'POST', '/auth/register', {
      username: 'dupuser',
      password: 'password1',
    });

    const res = await request(server, 'POST', '/auth/register', {
      username: 'dupuser',
      password: 'password2',
    });
    expect(res.status).toBe(409);
  });

  it('login fails with wrong password (401)', async () => {
    await request(server, 'POST', '/auth/register', {
      username: 'wrongpwuser',
      password: 'correctPassword',
    });

    const res = await request(server, 'POST', '/auth/login', {
      username: 'wrongpwuser',
      password: 'wrongPassword',
    });
    expect(res.status).toBe(401);
  });

  it('login fails for non-existent user (401)', async () => {
    const res = await request(server, 'POST', '/auth/login', {
      username: 'nonexistent',
      password: 'anything',
    });
    expect(res.status).toBe(401);
  });

  it('protected endpoint rejects request without token (401)', async () => {
    const res = await request(server, 'POST', '/auth/logout', {});
    expect(res.status).toBe(401);
  });

  it('protected endpoint rejects request with invalid token (401)', async () => {
    const res = await request(server, 'POST', '/auth/logout', {}, {
      Authorization: 'Bearer invalid-token-value',
    });
    expect(res.status).toBe(401);
  });

  it('register rejects missing fields (400)', async () => {
    const noPassword = await request(server, 'POST', '/auth/register', {
      username: 'onlyuser',
    });
    expect(noPassword.status).toBe(400);

    const noUsername = await request(server, 'POST', '/auth/register', {
      password: 'onlypass',
    });
    expect(noUsername.status).toBe(400);
  });

  it('register token can also be used for authenticated requests', async () => {
    const registerRes = await request(server, 'POST', '/auth/register', {
      username: 'tokencheckuser',
      password: 'password123',
    });
    const token = registerRes.body.token as string;

    // The register token should work for logout (a protected endpoint)
    const logoutRes = await request(server, 'POST', '/auth/logout', {}, {
      Authorization: `Bearer ${token}`,
    });
    expect(logoutRes.status).toBe(200);
  });
});
