import { prisma } from '../prisma/client';

type AuditLogParams = {
  actorUserId: number;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
};

export const logAdminAction = async ({ actorUserId, action, targetType, targetId, details }: AuditLogParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        targetType,
        targetId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error('Audit log write error:', error);
  }
};
