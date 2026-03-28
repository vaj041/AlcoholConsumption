import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { logAdminAction } from '../utils/auditLog';

const router = Router();

const authCredentialsSchema = z
  .object({
    email: z.string().trim().email().max(255),
    password: z.string().min(6).max(128),
  })
  .transform(({ email, password }) => ({
    email: email.toLowerCase(),
    password,
  }));

const updateRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});

const listAuditLogsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 1))
    .pipe(z.number().int().min(1)),
  pageSize: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : 20))
    .pipe(z.number().int().min(1).max(100)),
});

const getAuthToken = (user: { id: number; role: string }): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const payload = {
    userId: user.id,
    role: user.role,
    isAdmin: user.role === 'admin',
  };

  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

// Register
router.post('/register', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedCredentials = authCredentialsSchema.safeParse(req.body);
    if (!parsedCredentials.success) {
      const firstError = parsedCredentials.error.issues[0]?.message || 'Invalid request body';
      res.status(400).json({ error: firstError });
      return;
    }

    const { email, password } = parsedCredentials.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const usersCount = await prisma.user.count();
    const role = usersCount === 0 ? 'admin' : 'user';

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    // Generate JWT token
    const token = getAuthToken(user);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedCredentials = authCredentialsSchema.safeParse(req.body);
    if (!parsedCredentials.success) {
      const firstError = parsedCredentials.error.issues[0]?.message || 'Invalid request body';
      res.status(400).json({ error: firstError });
      return;
    }

    const { email, password } = parsedCredentials.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate JWT token
    const token = getAuthToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user (protected route)
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin - list users
router.get('/admin/users', authenticate, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin - list audit logs
router.get('/admin/audit-logs', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedQuery = listAuditLogsQuerySchema.safeParse(req.query);
    if (!parsedQuery.success) {
      res.status(400).json({ error: 'Invalid pagination query' });
      return;
    }

    const { page, pageSize } = parsedQuery.data;
    const skip = (page - 1) * pageSize;

    const [total, rows] = await prisma.$transaction([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          actorUser: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      }),
    ]);

    const logs = rows.map((row) => {
      let parsedDetails: Record<string, unknown> | null = null;

      if (row.details) {
        try {
          parsedDetails = JSON.parse(row.details) as Record<string, unknown>;
        } catch {
          parsedDetails = null;
        }
      }

      return {
        id: row.id,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        details: parsedDetails,
        createdAt: row.createdAt,
        actorUser: row.actorUser,
      };
    });

    res.json({
      page,
      pageSize,
      total,
      logs,
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin - update user role
router.patch('/admin/users/:id/role', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(400).json({ error: 'Invalid user id' });
      return;
    }

    const parsedBody = updateRoleSchema.safeParse(req.body);
    if (!parsedBody.success) {
      res.status(400).json({ error: 'Role must be user or admin' });
      return;
    }

    const { role } = parsedBody.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (targetUser.role === role) {
      res.json(targetUser);
      return;
    }

    if (targetUser.role === 'admin' && role === 'user') {
      const adminCount = await prisma.user.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        res.status(400).json({ error: 'Cannot demote the last admin' });
        return;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (req.userId) {
      await logAdminAction({
        actorUserId: req.userId,
        action: 'user.role.update',
        targetType: 'user',
        targetId: String(updatedUser.id),
        details: {
          previousRole: targetUser.role,
          nextRole: updatedUser.role,
          targetEmail: updatedUser.email,
        },
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
