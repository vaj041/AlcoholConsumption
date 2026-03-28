import { prisma } from '../prisma/client';

type SeedDictionary = Record<string, string>;

const EN_SEED: SeedDictionary = {
  'settings.language.en': 'English',
  'settings.language.cs': 'Czech',
  'layout.menu.dashboard': 'Dashboard',
  'layout.menu.drinks': 'Drinks',
  'layout.menu.calendar': 'Calendar',
  'layout.menu.stats': 'Stats',
  'layout.menu.settings': 'Settings',
};

const CS_SEED: SeedDictionary = {
  'settings.language.en': 'Angličtina',
  'settings.language.cs': 'Čeština',
  'layout.menu.dashboard': 'Přehled',
  'layout.menu.drinks': 'Nápoje',
  'layout.menu.calendar': 'Kalendář',
  'layout.menu.stats': 'Statistiky',
  'layout.menu.settings': 'Nastavení',
};

async function upsertDictionary(lang: string, dictionary: SeedDictionary): Promise<number> {
  const entries = Object.entries(dictionary);

  await prisma.$transaction(async (tx) => {
    for (const [code, text] of entries) {
      const term = await tx.translationTerm.upsert({
        where: { code },
        create: { code },
        update: {},
      });

      await tx.translationValue.upsert({
        where: {
          termId_lang: {
            termId: term.id,
            lang,
          },
        },
        create: {
          termId: term.id,
          lang,
          text,
        },
        update: {
          text,
        },
      });
    }
  });

  return entries.length;
}

async function main(): Promise<void> {
  const enCount = await upsertDictionary('en', EN_SEED);
  const csCount = await upsertDictionary('cs', CS_SEED);

  console.log(`Seeded translations: en=${enCount}, cs=${csCount}`);
}

main()
  .catch((error) => {
    console.error('Seed translations failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
