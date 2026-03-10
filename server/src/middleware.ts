import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from './auth.js';
import { JwtUser, RoleName } from './types.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing Authorization header' });
  }
  const token = auth.slice('Bearer '.length);
  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

export function requireRole(allowed: RoleName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthenticated' });
    if (!allowed.includes(req.user.roleName)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    return next();
  };
}
