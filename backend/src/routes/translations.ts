import { Router, Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

type UpsertTranslationItem = {
  code?: string;
  text?: string;
  description?: string;
};

type BulkUpsertBody = {
  lang?: string;
  items?: UpsertTranslationItem[];
};

router.get('/admin/terms', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = typeof req.query.lang === 'string' ? req.query.lang : 'en';
    const normalizedLang = lang.trim().toLowerCase();

    const terms = await prisma.translationTerm.findMany({
      orderBy: { code: 'asc' },
      include: {
        values: {
          where: { lang: normalizedLang },
          select: {
            text: true,
            updatedAt: true,
          },
          take: 1,
        },
      },
    });

    res.json({
      lang: normalizedLang,
      count: terms.length,
      terms: terms.map((term) => ({
        code: term.code,
        description: term.description,
        text: term.values[0]?.text ?? '',
        updatedAt: term.values[0]?.updatedAt ?? null,
      })),
    });
  } catch (error) {
    console.error('Get translation terms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const lang = typeof req.query.lang === 'string' ? req.query.lang : 'en';

    const rows = await prisma.translationValue.findMany({
      where: { lang },
      include: {
        term: {
          select: {
            code: true,
          },
        },
      },
    });

    const translations: Record<string, string> = {};
    rows.forEach((row) => {
      translations[row.term.code] = row.text;
    });

    res.json({
      lang,
      count: rows.length,
      translations,
    });
  } catch (error) {
    console.error('Get translations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/bulk-upsert', authenticate, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { lang, items } = req.body as BulkUpsertBody;

    if (!lang || typeof lang !== 'string') {
      res.status(400).json({ error: 'lang is required' });
      return;
    }

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'items must be a non-empty array' });
      return;
    }

    const normalizedLang = lang.trim().toLowerCase();
    const validItems = items
      .map((item) => ({
        code: typeof item.code === 'string' ? item.code.trim() : '',
        text: typeof item.text === 'string' ? item.text : '',
        description:
          item.description === undefined
            ? undefined
            : typeof item.description === 'string'
              ? item.description
              : '',
      }))
      .filter((item) => item.code.length > 0 && item.text.length > 0);

    if (validItems.length === 0) {
      res.status(400).json({ error: 'no valid translation items provided' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      for (const item of validItems) {
        const term = await tx.translationTerm.upsert({
          where: { code: item.code },
          create: {
            code: item.code,
            description: item.description ?? null,
          },
          update: item.description !== undefined ? { description: item.description } : {},
        });

        await tx.translationValue.upsert({
          where: {
            termId_lang: {
              termId: term.id,
              lang: normalizedLang,
            },
          },
          create: {
            termId: term.id,
            lang: normalizedLang,
            text: item.text,
          },
          update: {
            text: item.text,
          },
        });
      }

      return validItems.length;
    });

    res.json({
      lang: normalizedLang,
      upserted: result,
    });
  } catch (error) {
    console.error('Bulk upsert translations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
