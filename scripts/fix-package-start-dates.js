const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPackageStartDates() {
  try {
    console.log('🔧 Fixing package start dates to show 20 days remaining...\n');
    
    const today = new Date('2025-06-06'); // June 6th, 2025
    
    // Calculate the correct start date: 10 days ago to show 20 remaining out of 30
    const correctStartDate = new Date(today);
    correctStartDate.setDate(correctStartDate.getDate() - 10); // May 27th, 2025
    
    // Calculate correct end date: 30 days from correct start
    const correctEndDate = new Date(correctStartDate);
    correctEndDate.setDate(correctEndDate.getDate() + 30); // June 26th, 2025
    
    console.log(`Today: ${today.toLocaleDateString()}`);
    console.log(`Correct start date: ${correctStartDate.toLocaleDateString()}`);
    console.log(`Correct end date: ${correctEndDate.toLocaleDateString()}`);
    console.log(`This will show: ${Math.ceil((correctEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days remaining\n`);
    
    // Get all packages that need to be updated to show 20 days remaining
    const packagesToFix = await prisma.package.findMany({
      where: {
        startDate: {
          gte: new Date('2025-05-31T00:00:00.000Z'), // Previous start date
          lt: new Date('2025-06-01T00:00:00.000Z')
        }
      },
      include: {
        user: { select: { name: true } }
      }
    });
    
    console.log(`Found ${packagesToFix.length} packages to update to 20 days remaining\n`);
    
    let fixedCount = 0;
    
    for (const pkg of packagesToFix) {
      console.log(`Fixing: ${pkg.user.name}`);
      
      const oldStart = new Date(pkg.startDate);
      const oldEnd = new Date(pkg.endDate);
      
      console.log(`  Old: ${oldStart.toLocaleDateString()} → ${oldEnd.toLocaleDateString()}`);
      console.log(`  New: ${correctStartDate.toLocaleDateString()} → ${correctEndDate.toLocaleDateString()}`);
      
      // Update the package with correct dates
      await prisma.package.update({
        where: { id: pkg.id },
        data: {
          startDate: correctStartDate,
          endDate: correctEndDate
        }
      });
      
      fixedCount++;
      console.log(`  ✅ Fixed!\n`);
    }
    
    console.log(`🎉 Fixed ${fixedCount} packages!`);
    console.log('All imported client packages now show 20 days remaining.');
    
    // Verify the fix
    console.log('\n🔍 Verification:');
    const verifyPackages = await prisma.package.findMany({
      where: {
        startDate: correctStartDate
      },
      include: {
        user: { select: { name: true } }
      },
      take: 5
    });
    
    verifyPackages.forEach(pkg => {
      const startDate = new Date(pkg.startDate);
      const endDate = new Date(pkg.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`${pkg.user.name}: Started ${startDate.toLocaleDateString()}, ${daysRemaining} days remaining`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixPackageStartDates(); 
 
 
 
 