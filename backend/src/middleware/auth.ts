import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';

type TokenRole = 'user' | 'admin';

type AuthTokenPayload = {
  userId: number;
  role?: TokenRole;
  isAdmin?: boolean;
  tokenVersion?: number;
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

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

  let decoded: AuthTokenPayload;
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = jwt.verify(token, secret);
    if (typeof payload === 'string' || typeof payload.userId !== 'number' ||
        !Number.isSafeInteger(payload.userId) || payload.userId <= 0 ||
        (payload.tokenVersion !== undefined &&
          (typeof payload.tokenVersion !== 'number' || !Number.isSafeInteger(payload.tokenVersion) || payload.tokenVersion < 0))) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    decoded = { userId: payload.userId, tokenVersion: payload.tokenVersion };
  } catch {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, tokenVersion: true },
    });
    if (!user || user.tokenVersion !== (decoded.tokenVersion ?? 0)) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const role = user.role === 'admin' ? 'admin' : 'user';
    req.userId = user.id;
    req.userRole = role;
    req.isAdmin = role === 'admin';

    next();
  } catch (error) {
    console.error('Authentication lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
