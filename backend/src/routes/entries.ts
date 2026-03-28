import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(authenticate);

// Get entries with optional date range filtering
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to } = req.query;

    const where: any = {
      userId: req.userId,
    };

    if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = new Date(from as string);
      }
      if (to) {
        where.date.lte = new Date(to as string);
      }
    }

    const entries = await prisma.entry.findMany({
      where,
      include: {
        drink: true,
      },
      orderBy: { date: 'desc' },
    });

    res.json(entries);
  } catch (error) {
    console.error('Get entries error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new entry
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, quantity, drinkId } = req.body;

    if (!date || !quantity || !drinkId) {
      res.status(400).json({ error: 'Date, quantity, and drinkId are required' });
      return;
    }

    // Verify drink belongs to user
    const drink = await prisma.drink.findFirst({
      where: {
        id: parseInt(drinkId),
        userId: req.userId,
      },
    });

    if (!drink) {
      res.status(404).json({ error: 'Drink not found' });
      return;
    }

    const entry = await prisma.entry.create({
      data: {
        date: new Date(date),
        quantity: parseInt(quantity),
        drinkId: parseInt(drinkId),
        userId: req.userId!,
      },
      include: {
        drink: true,
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Create entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an entry
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, quantity } = req.body;

    // Check if entry belongs to user
    const existingEntry = await prisma.entry.findFirst({
      where: {
        id: parseInt(id as string),
        userId: req.userId,
      },
    });

    if (!existingEntry) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (quantity !== undefined) updateData.quantity = parseFloat(quantity);

    const entry = await prisma.entry.update({
      where: { id: parseInt(id as string) },
      data: updateData,
      include: {
        drink: true,
      },
    });

    res.json(entry);
  } catch (error) {
    console.error('Update entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an entry
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if entry belongs to user
    const existingEntry = await prisma.entry.findFirst({
      where: {
        id: parseInt(id as string),
        userId: req.userId,
      },
    });

    if (!existingEntry) {
      res.status(404).json({ error: 'Entry not found' });
      return;
    }

    await prisma.entry.delete({
      where: { id: parseInt(id as string) },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete entry error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
