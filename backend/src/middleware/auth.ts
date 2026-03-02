import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type TokenRole = 'user' | 'admin';

type AuthTokenPayload = {
  userId: number;
  role?: TokenRole;
  isAdmin?: boolean;
};

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userRole?: TokenRole;
      isAdmin?: boolean;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'No authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as AuthTokenPayload;
    const role = decoded.role === 'admin' ? 'admin' : 'user';
    const isAdmin = decoded.isAdmin ?? role === 'admin';

    req.userId = decoded.userId;
    req.userRole = role;
    req.isAdmin = isAdmin;

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!req.isAdmin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
};
