import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'node:crypto';
import axios from 'axios';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimit';
import { logAdminAction } from '../utils/auditLog';
import { getMailjetConfig, sendPasswordResetEmail } from '../utils/passwordResetEmail';

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

const newPasswordSchema = z.string().min(6).max(128)
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72);

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: newPasswordSchema,
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  language: z.enum(['en', 'cs']).default('en'),
});

const resetPasswordSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  newPassword: newPasswordSchema,
});

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

const getAuthToken = (user: { id: number; role: string; tokenVersion: number }): string => {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  const payload = {
    userId: user.id,
    role: user.role,
    isAdmin: user.role === 'admin',
    tokenVersion: user.tokenVersion,
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

router.post('/change-password', authenticate, authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_PASSWORD_INPUT' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
      res.status(400).json({ error: 'CURRENT_PASSWORD_INCORRECT' });
      return;
    }

    const password = await bcrypt.hash(parsed.data.newPassword, 10);
    const result = await prisma.user.updateMany({
      where: { id: user.id, password: user.password },
      data: {
        password,
        tokenVersion: { increment: 1 },
        passwordResetTokenHash: null,
        passwordResetExpires: null,
      },
    });
    if (result.count !== 1) {
      res.status(409).json({ error: 'PASSWORD_CHANGE_CONFLICT' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/forgot-password', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_EMAIL' });
    return;
  }

  const config = getMailjetConfig();
  if (!config) {
    console.error('Password reset email is not configured');
    res.status(503).json({ error: 'PASSWORD_RESET_UNAVAILABLE' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true } });
    if (user) {
      const token = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(token).digest('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetTokenHash: tokenHash, passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) },
      });

      try {
        await sendPasswordResetEmail(config, user.email, token, parsed.data.language);
      } catch (error) {
        await prisma.user.updateMany({
          where: { id: user.id, passwordResetTokenHash: tokenHash },
          data: { passwordResetTokenHash: null, passwordResetExpires: null },
        });
        const detail = axios.isAxiosError(error)
          ? { status: error.response?.status, code: error.code }
          : { message: error instanceof Error ? error.message : 'Unknown delivery error' };
        console.error('Password reset email delivery failed:', detail);
      }
    }
    res.status(202).json({ success: true });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/reset-password', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'INVALID_RESET_INPUT' });
    return;
  }

  try {
    const tokenHash = createHash('sha256').update(parsed.data.token).digest('hex');
    const password = await bcrypt.hash(parsed.data.newPassword, 10);
    const result = await prisma.user.updateMany({
      where: { passwordResetTokenHash: tokenHash, passwordResetExpires: { gt: new Date() } },
      data: {
        password,
        tokenVersion: { increment: 1 },
        passwordResetTokenHash: null,
        passwordResetExpires: null,
      },
    });
    if (result.count !== 1) {
      res.status(400).json({ error: 'INVALID_OR_EXPIRED_RESET_TOKEN' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
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
