import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Calculate pure alcohol in grams: volumeMl * (alcoholPct / 100) * 0.789
const calculatePureAlcohol = (volumeMl: number, alcoholPct: number): number => {
  return volumeMl * (alcoholPct / 100) * 0.789;
};

// Get statistics for a date range
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).json({ error: 'from and to date parameters are required' });
      return;
    }

    const entries = await prisma.entry.findMany({
      where: {
        userId: req.userId,
        date: {
          gte: new Date(from as string),
          lte: new Date(to as string),
        },
      },
      include: {
        drink: true,
      },
      orderBy: { date: 'asc' },
    });

    // Calculate statistics
    let totalPureAlcoholGrams = 0;
    let totalPureAlcoholMl = 0;
    const dailyStats: Record<string, { date: string; grams: number; ml: number; entries: number }> = {};

    entries.forEach((entry) => {
      const pureAlcoholGrams = calculatePureAlcohol(entry.drink.volumeMl, entry.drink.alcoholPct) * entry.quantity;
      const pureAlcoholMl = (entry.drink.volumeMl * (entry.drink.alcoholPct / 100)) * entry.quantity;

      totalPureAlcoholGrams += pureAlcoholGrams;
      totalPureAlcoholMl += pureAlcoholMl;

      const dateKey = entry.date.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { date: dateKey, grams: 0, ml: 0, entries: 0 };
      }
      dailyStats[dateKey].grams += pureAlcoholGrams;
      dailyStats[dateKey].ml += pureAlcoholMl;
      dailyStats[dateKey].entries += entry.quantity;
    });

    res.json({
      period: {
        from: from as string,
        to: to as string,
      },
      total: {
        pureAlcoholGrams: Math.round(totalPureAlcoholGrams * 100) / 100,
        pureAlcoholMl: Math.round(totalPureAlcoholMl * 100) / 100,
        entries: entries.length,
      },
      daily: Object.values(dailyStats).map((day) => ({
        ...day,
        grams: Math.round(day.grams * 100) / 100,
        ml: Math.round(day.ml * 100) / 100,
      })),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
