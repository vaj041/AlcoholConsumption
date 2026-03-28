import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Get all drinks for logged-in user
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const drinks = await prisma.drink.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(drinks);
  } catch (error) {
    console.error('Get drinks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new drink
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, volumeMl, alcoholPct } = req.body;

    if (!name || !volumeMl || alcoholPct === undefined) {
      res.status(400).json({ error: 'Name, volumeMl, and alcoholPct are required' });
      return;
    }

    const drink = await prisma.drink.create({
      data: {
        name,
        volumeMl: parseInt(volumeMl),
        alcoholPct: parseFloat(alcoholPct),
        userId: req.userId!,
      },
    });

    res.status(201).json(drink);
  } catch (error) {
    console.error('Create drink error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a drink
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, volumeMl, alcoholPct } = req.body;

    // Check if drink belongs to user
    const existingDrink = await prisma.drink.findFirst({
      where: {
        id: parseInt(id as string),
        userId: req.userId,
      },
    });

    if (!existingDrink) {
      res.status(404).json({ error: 'Drink not found' });
      return;
    }

    const drink = await prisma.drink.update({
      where: { id: parseInt(id as string) },
      data: {
        name,
        volumeMl: volumeMl ? parseInt(volumeMl) : undefined,
        alcoholPct: alcoholPct !== undefined ? parseFloat(alcoholPct) : undefined,
      },
    });

    res.json(drink);
  } catch (error) {
    console.error('Update drink error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a drink
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if drink belongs to user
    const existingDrink = await prisma.drink.findFirst({
      where: {
        id: parseInt(id as string),
        userId: req.userId,
      },
    });

    if (!existingDrink) {
      res.status(404).json({ error: 'Drink not found' });
      return;
    }

    await prisma.drink.delete({
      where: { id: parseInt(id as string) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete drink error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
