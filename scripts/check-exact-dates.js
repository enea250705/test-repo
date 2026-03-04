const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExactDates() {
  try {
    console.log('🔍 Checking exact date calculations...\n');
    
    // Get current date info
    const now = new Date();
    console.log(`Current date/time: ${now.toISOString()}`);
    console.log(`Current local date: ${now.toLocaleDateString()}`);
    console.log(`Current date only: ${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    
    // Get a few packages to check
    const packages = await prisma.package.findMany({
      include: {
        user: { select: { name: true } }
      },
      take: 5
    });
    
    console.log('\n📅 Package Date Analysis:');
    console.log('=' .repeat(70));
    
    packages.forEach((pkg, index) => {
      const startDate = new Date(pkg.startDate);
      const endDate = new Date(pkg.endDate);
      
      console.log(`\n${index + 1}. ${pkg.user.name}`);
      console.log(`   Start Date (Raw): ${pkg.startDate}`);
      console.log(`   Start Date (Parsed): ${startDate.toISOString()}`);
      console.log(`   Start Date (Local): ${startDate.toLocaleDateString()}`);
      console.log(`   End Date (Raw): ${pkg.endDate}`);
      console.log(`   End Date (Parsed): ${endDate.toISOString()}`);
      console.log(`   End Date (Local): ${endDate.toLocaleDateString()}`);
      
      // Different calculation methods
      const method1 = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const method2 = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Calculate using date-only (no time)
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      const method3 = Math.ceil((endDateOnly.getTime() - nowDateOnly.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`   Days remaining (Math.ceil): ${method1}`);
      console.log(`   Days remaining (Math.floor): ${method2}`);
      console.log(`   Days remaining (date-only): ${method3}`);
      
      // Check if dates are exactly as expected
      const expectedStart = new Date('2025-06-06');
      const expectedEnd = new Date('2025-07-06');
      
      console.log(`   Expected start: ${expectedStart.toLocaleDateString()}`);
      console.log(`   Expected end: ${expectedEnd.toLocaleDateString()}`);
      console.log(`   Start matches: ${startDate.toDateString() === expectedStart.toDateString()}`);
      console.log(`   End matches: ${endDate.toDateString() === expectedEnd.toDateString()}`);
      
      // Manual calculation
      if (now.toDateString() === expectedStart.toDateString()) {
        console.log(`   🎯 If today is start date, should be 30 days remaining`);
      }
    });
    
    console.log('\n🕒 Time Information:');
    console.log(`Server timezone offset: ${now.getTimezoneOffset()} minutes`);
    console.log(`Is daylight saving time: ${now.getTimezoneOffset() !== new Date(2025, 0, 1).getTimezoneOffset()}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkExactDates(); 
 
 
 
 