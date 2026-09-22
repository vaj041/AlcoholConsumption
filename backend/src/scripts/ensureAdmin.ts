import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../prisma/client';

const defaultAdminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'st.vajs@seznam.cz';
const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'xxxxxx';
const defaultDrink = {
  name: 'Pivo 10',
  volumeMl: 500,
  alcoholPct: 4.0,
};

async function main(): Promise<void> {
  let adminUser = await prisma.user.findUnique({
    where: { email: defaultAdminEmail.toLowerCase() },
  });

  if (adminUser) {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        role: 'admin',
      },
    });

    console.log(`Default admin already exists: ${adminUser.email}`);
  } else {
    const password = await bcrypt.hash(defaultAdminPassword, 10);

    adminUser = await prisma.user.create({
      data: {
        email: defaultAdminEmail.toLowerCase(),
        password,
        role: 'admin',
      },
    });

    console.log(`Created default admin: ${defaultAdminEmail}`);
  }

  const existingDrink = await prisma.drink.findFirst({
    where: {
      userId: adminUser.id,
      name: defaultDrink.name,
      volumeMl: defaultDrink.volumeMl,
      alcoholPct: defaultDrink.alcoholPct,
    },
  });

  if (existingDrink) {
    console.log(`Default drink already exists: ${existingDrink.name}`);
    return;
  }

  await prisma.drink.create({
    data: {
      ...defaultDrink,
      userId: adminUser.id,
    },
  });

  console.log(`Created default drink: ${defaultDrink.name}`);
}

main()
  .catch((error) => {
    console.error('Ensure admin failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
