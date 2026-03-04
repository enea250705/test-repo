import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateAllClassCapacities() {
  try {
    // Update all classes to have a capacity of 5
    const updatedClasses = await prisma.class.updateMany({
      data: {
        capacity: 5,
      },
    });

    console.log(`Successfully updated ${updatedClasses.count} classes to have capacity of 5`);
  } catch (error) {
    console.error('Error updating class capacities:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateAllClassCapacities(); 