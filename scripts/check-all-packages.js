const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllPackages() {
  try {
    console.log('📊 All Packages by Start Date:\n');
    
    const packages = await prisma.package.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { startDate: 'asc' }
    });
    
    const now = new Date();
    console.log(`Today: ${now.toLocaleDateString()}\n`);
    
    // Group by start date
    const byStartDate = {};
    
    packages.forEach(pkg => {
      const startDate = new Date(pkg.startDate);
      const endDate = new Date(pkg.endDate);
      const startKey = startDate.toLocaleDateString();
      
      const remaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (!byStartDate[startKey]) {
        byStartDate[startKey] = [];
      }
      
      byStartDate[startKey].push({
        name: pkg.user.name,
        email: pkg.user.email,
        remaining: remaining,
        endDate: endDate.toLocaleDateString()
      });
    });
    
    // Display grouped results
    Object.keys(byStartDate).sort().forEach(startDate => {
      const pkgs = byStartDate[startDate];
      console.log(`📅 Started ${startDate}:`);
      
      pkgs.forEach(pkg => {
        console.log(`   ${pkg.name} - ${pkg.remaining} days left (ends ${pkg.endDate})`);
      });
      
      console.log(`   → Total: ${pkgs.length} packages\n`);
    });
    
    // Summary
    const june6Packages = packages.filter(pkg => {
      const start = new Date(pkg.startDate);
      return start.toDateString() === new Date('2025-06-06').toDateString();
    });
    
    console.log('📈 Summary:');
    console.log(`Packages that started today (June 6th): ${june6Packages.length}`);
    
    if (june6Packages.length > 0) {
      const remaining = Math.ceil((new Date(june6Packages[0].endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`These should have ${remaining} days remaining`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllPackages(); 
 
 
 
 