import { Router, type Request, type Response } from 'express';
import type { AuthService } from '../services/auth-service.js';
import { AuthError } from '../services/auth-service.js';
import { createAuthMiddleware } from './auth-middleware.js';

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();
  const authMiddleware = createAuthMiddleware(authService);

  router.post('/register', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Username and password must be strings' });
      return;
    }

    try {
      const result = await authService.register(username, password);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof AuthError && err.code === 'USERNAME_TAKEN') {
        res.status(409).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Username and password must be strings' });
      return;
    }

    try {
      const result = await authService.login(username, password);
      res.status(200).json(result);
    } catch (err) {
      if (err instanceof AuthError && err.code === 'INVALID_CREDENTIALS') {
        res.status(401).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/logout', authMiddleware, (req: Request, res: Response) => {
    const token = req.headers.authorization!.slice(7);

    try {
      authService.logout(token);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
