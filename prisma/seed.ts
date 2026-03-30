import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create tribes
  const tribes = await Promise.all(
    ['Retail', 'Finance', 'Telco', 'Cross'].map((name) =>
      prisma.tribe.upsert({ where: { name }, update: {}, create: { name } })
    )
  );
  console.log(`Created ${tribes.length} tribes`);

  // Create users
  const hash = await bcrypt.hash('password123', 10);
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@frisol.com' },
      update: {},
      create: { email: 'admin@frisol.com', passwordHash: hash, name: 'Admin Usuario', role: 'admin', active: true },
    }),
    prisma.user.upsert({
      where: { email: 'csm@frisol.com' },
      update: {},
      create: { email: 'csm@frisol.com', passwordHash: hash, name: 'CSM Usuario', role: 'csm', active: true, tribeId: tribes[0].id },
    }),
    prisma.user.upsert({
      where: { email: 'po@frisol.com' },
      update: {},
      create: { email: 'po@frisol.com', passwordHash: hash, name: 'PO Usuario', role: 'po', active: true },
    }),
    prisma.user.upsert({
      where: { email: 'dev@frisol.com' },
      update: {},
      create: { email: 'dev@frisol.com', passwordHash: hash, name: 'Dev Usuario', role: 'dev', active: true, tribeId: tribes[1].id },
    }),
  ]);
  console.log(`Created ${users.length} users`);

  console.log('Seed complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
