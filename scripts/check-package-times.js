const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPackageTimes() {
  try {
    console.log('🔍 Checking package time calculations...\n');
    
    // Get all active packages
    const packages = await prisma.package.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 15
    });
    
    console.log(`Found ${packages.length} packages\n`);
    
    const now = new Date();
    console.log(`Current date: ${now.toISOString()}\n`);
    
    console.log('📊 Package Analysis:');
    console.log('=' .repeat(80));
    
    packages.forEach((pkg, index) => {
      const startDate = new Date(pkg.startDate);
      const endDate = new Date(pkg.endDate);
      
      // Calculate different time measurements
      const totalDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const daysPassed = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      console.log(`\n${index + 1}. ${pkg.user.name} (${pkg.user.email.substring(0, 20)}...)`);
      console.log(`   Package: ${pkg.name}`);
      console.log(`   Classes: ${pkg.classesRemaining}/${pkg.totalClasses} remaining`);
      console.log(`   Started: ${startDate.toLocaleDateString()} (${daysPassed} days ago)`);
      console.log(`   Ends: ${endDate.toLocaleDateString()} (${daysRemaining} days remaining)`);
      console.log(`   Total duration: ${totalDuration} days`);
      console.log(`   Active: ${pkg.active ? 'YES' : 'NO'}`);
      
      // Identify potential issues
      if (daysRemaining < 0) {
        console.log(`   ⚠️  EXPIRED ${Math.abs(daysRemaining)} days ago!`);
      } else if (daysRemaining < 7) {
        console.log(`   ⚡ Expires soon (${daysRemaining} days)`);
      }
      
      if (totalDuration !== 30) {
        console.log(`   ⚠️  Unusual duration: ${totalDuration} days (expected 30)`);
      }
    });
    
    // Summary statistics
    const activePackages = packages.filter(pkg => pkg.active);
    const expiredPackages = packages.filter(pkg => {
      const endDate = new Date(pkg.endDate);
      return endDate < now;
    });
    const expiringSoon = packages.filter(pkg => {
      const endDate = new Date(pkg.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft > 0 && daysLeft < 7;
    });
    
    console.log('\n📈 Summary:');
    console.log('=' .repeat(40));
    console.log(`Total packages: ${packages.length}`);
    console.log(`Active packages: ${activePackages.length}`);
    console.log(`Expired packages: ${expiredPackages.length}`);
    console.log(`Expiring soon (< 7 days): ${expiringSoon.length}`);
    
    if (expiredPackages.length > 0) {
      console.log('\n🚨 Issues Found:');
      console.log('- Some packages are expired but still marked as active');
      console.log('- Package expiration cleanup might not be working');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPackageTimes(); 
 
 
 
 