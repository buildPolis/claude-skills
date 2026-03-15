import express from 'express';
import http from 'node:http';
import type { Database } from '../db/sqlite.js';
import { AuthService } from '../services/auth-service.js';
import { createAuthRouter } from './auth-routes.js';

export interface ApiServerOptions {
  db: Database;
  jwtSecret: string;
  jwtExpiresIn: string;
  port: number;
}

export function createApiServer(options: ApiServerOptions): http.Server {
  const { db, jwtSecret, jwtExpiresIn, port } = options;

  const app = express();
  app.use(express.json());

  const authService = new AuthService(db, jwtSecret, jwtExpiresIn);
  const authRouter = createAuthRouter(authService);
  app.use('/auth', authRouter);

  const server = http.createServer(app);
  server.listen(port);

  return server;
}
