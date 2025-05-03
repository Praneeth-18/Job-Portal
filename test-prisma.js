import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Available models:', Object.keys(prisma));
  
  try {
    const jobCount = await prisma.jobListing.count();
    console.log(`Number of job listings: ${jobCount}`);
  } catch (error) {
    console.error('Error counting job listings:', error);
  }
  
  try {
    const appCount = await prisma.userApplication.count();
    console.log(`Number of applications: ${appCount}`);
  } catch (error) {
    console.error('Error counting applications:', error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }); 