const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixPackageDates() {
  try {
    console.log('🔧 Fixing package end dates...\n');
    
    // Get all packages with wrong end dates
    const packages = await prisma.package.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    
    console.log(`Found ${packages.length} packages to fix\n`);
    
    let fixedCount = 0;
    
    for (const pkg of packages) {
      const startDate = new Date(pkg.startDate);
      const currentEndDate = new Date(pkg.endDate);
      
      // Calculate what the end date should be (30 days from start)
      const correctEndDate = new Date(startDate);
      correctEndDate.setDate(correctEndDate.getDate() + 30);
      
      const currentDuration = Math.ceil((currentEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (currentDuration !== 30) {
        console.log(`Fixing: ${pkg.user.name}`);
        console.log(`  Current: ${startDate.toLocaleDateString()} → ${currentEndDate.toLocaleDateString()} (${currentDuration} days)`);
        console.log(`  Correct: ${startDate.toLocaleDateString()} → ${correctEndDate.toLocaleDateString()} (30 days)`);
        
        // Update the package
        await prisma.package.update({
          where: { id: pkg.id },
          data: { endDate: correctEndDate }
        });
        
        fixedCount++;
        console.log(`  ✅ Fixed!\n`);
      } else {
        console.log(`✅ ${pkg.user.name} - Already correct (30 days)\n`);
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} packages!`);
    console.log('All packages now have 30-day durations.');
    
    // Verify the fix
    console.log('\n🔍 Verification:');
    const verifyPackages = await prisma.package.findMany({
      take: 5,
      include: {
        user: { select: { name: true } }
      }
    });
    
    verifyPackages.forEach(pkg => {
      const startDate = new Date(pkg.startDate);
      const endDate = new Date(pkg.endDate);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`${pkg.user.name}: ${duration} day duration, ${daysRemaining} days remaining`);
    });
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixPackageDates(); 
 
 
 
 