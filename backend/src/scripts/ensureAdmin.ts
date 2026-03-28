import { prisma } from '../prisma/client';

async function main(): Promise<void> {
  const adminCount = await prisma.user.count({
    where: { role: 'admin' },
  });

  if (adminCount > 0) {
    console.log('Admin already exists.');
    return;
  }

  const firstUser = await prisma.user.findFirst({
    orderBy: { id: 'asc' },
  });

  if (!firstUser) {
    console.log('No users found.');
    return;
  }

  await prisma.user.update({
    where: { id: firstUser.id },
    data: { role: 'admin' },
  });

  console.log(`Promoted user to admin: ${firstUser.email}`);
}

main()
  .catch((error) => {
    console.error('Ensure admin failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
