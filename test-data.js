import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function addTestData() {
  try {
    // First, let's create some test entries
    await prisma.jobListing.createMany({
      data: [
        {
          positionTitle: 'Senior Engineer (H1B)',
          company: 'Tech Corp',
          postingDate: new Date(),
          h1bSponsored: true,
          isNewGrad: false,
          contentHash: 'test-h1b-1'
        },
        {
          positionTitle: 'Junior Developer (New Grad)',
          company: 'Startup Inc',
          postingDate: new Date(),
          h1bSponsored: false,
          isNewGrad: true,
          contentHash: 'test-newgrad-1'
        },
        {
          positionTitle: 'Full Stack Engineer (H1B+New Grad)',
          company: 'Growth Co',
          postingDate: new Date(),
          h1bSponsored: true,
          isNewGrad: true,
          contentHash: 'test-both-1'
        },
        {
          positionTitle: 'Product Manager',
          company: 'Enterprise Ltd',
          postingDate: new Date(),
          h1bSponsored: false,
          isNewGrad: false,
          contentHash: 'test-neither-1'
        }
      ],
      skipDuplicates: true
    });
    
    console.log('Test data added successfully');
  } catch (error) {
    console.error('Error adding test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestData(); 