import { v4 as uuidv4 } from 'uuid';
import * as argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import type { Database } from '../db/sqlite.js';

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
}

export interface AuthTokenPayload {
  sub: string;
  username: string;
  role: string;
  jti: string;
}

export interface AuthResult {
  token: string;
  user: { id: string; username: string; role: string };
}

export class AuthService {
  private db: Database;
  private jwtSecret: string;
  private jwtExpiresIn: string;

  constructor(db: Database, jwtSecret: string, jwtExpiresIn: string) {
    this.db = db;
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
  }

  async register(username: string, password: string): Promise<AuthResult> {
    const existing = this.db
      .prepare('SELECT id FROM users WHERE username = ?')
      .get(username) as UserRow | undefined;

    if (existing) {
      throw new AuthError('Username already exists', 'USERNAME_TAKEN');
    }

    const id = uuidv4();
    const passwordHash = await argon2.hash(password);
    const now = new Date().toISOString();

    this.db
      .prepare(
        'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
      )
      .run(id, username, passwordHash, 'user', now);

    const token = this.signToken({ id, username, role: 'user' });
    return { token, user: { id, username, role: 'user' } };
  }

  async login(username: string, password: string): Promise<AuthResult> {
    const user = this.db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username) as UserRow | undefined;

    if (!user) {
      throw new AuthError('Invalid username or password', 'INVALID_CREDENTIALS');
    }

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) {
      throw new AuthError('Invalid username or password', 'INVALID_CREDENTIALS');
    }

    const token = this.signToken({ id: user.id, username: user.username, role: user.role });
    return { token, user: { id: user.id, username: user.username, role: user.role } };
  }

  logout(token: string): void {
    const payload = this.decodeToken(token);
    if (!payload) {
      throw new AuthError('Invalid token', 'INVALID_TOKEN');
    }

    const exp = (payload as jwt.JwtPayload).exp;
    const expiresAt = exp ? new Date(exp * 1000).toISOString() : new Date().toISOString();

    this.db
      .prepare('INSERT OR IGNORE INTO token_blacklist (token_jti, expires_at) VALUES (?, ?)')
      .run(payload.jti, expiresAt);
  }

  verifyToken(token: string): AuthTokenPayload {
    const payload = this.decodeToken(token);
    if (!payload) {
      throw new AuthError('Invalid token', 'INVALID_TOKEN');
    }

    const blacklisted = this.db
      .prepare('SELECT token_jti FROM token_blacklist WHERE token_jti = ?')
      .get(payload.jti);

    if (blacklisted) {
      throw new AuthError('Token has been revoked', 'TOKEN_REVOKED');
    }

    return payload;
  }

  private signToken(user: { id: string; username: string; role: string }): string {
    const jti = uuidv4();
    return jwt.sign(
      { sub: user.id, username: user.username, role: user.role, jti },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn },
    );
  }

  private decodeToken(token: string): AuthTokenPayload | null {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload & AuthTokenPayload;
      return payload;
    } catch {
      return null;
    }
  }
}

export class AuthError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}
