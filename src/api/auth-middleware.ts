import type { Request, Response, NextFunction } from 'express';
import type { AuthService, AuthTokenPayload } from '../services/auth-service.js';

export interface AuthenticatedRequest extends Request {
  user: AuthTokenPayload;
}

export function createAuthMiddleware(authService: AuthService) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or malformed Authorization header' });
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = authService.verifyToken(token);
      (req as AuthenticatedRequest).user = payload;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}
