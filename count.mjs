import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function count() {
  try {
    const count = await prisma.jobListing.count();
    console.log('Total job listings:', count);
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

count();
