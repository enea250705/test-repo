const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  console.log('🔍 Checking database status...\n');

  try {
    // Check users
    const users = await prisma.user.findMany({
      include: {
        packages: true,
        bookings: {
          include: {
            class: true
          }
        }
      }
    });

    console.log(`👥 Total Users: ${users.length}`);
    console.log(`✅ Approved Users: ${users.filter(u => u.approved).length}`);
    console.log(`👤 Regular Users: ${users.filter(u => u.role === 'user').length}`);
    console.log(`🔐 Admin Users: ${users.filter(u => u.role === 'admin').length}\n`);

    // Check packages
    const packages = await prisma.package.findMany();
    console.log(`📦 Total Packages: ${packages.length}`);
    console.log(`🟢 Active Packages: ${packages.filter(p => p.active).length}`);
    
    const totalClasses = packages.reduce((sum, p) => sum + p.totalClasses, 0);
    const remainingClasses = packages.reduce((sum, p) => sum + p.classesRemaining, 0);
    const usedClasses = totalClasses - remainingClasses;
    
    console.log(`📊 Total Classes in Packages: ${totalClasses}`);
    console.log(`✅ Classes Used: ${usedClasses}`);
    console.log(`⏳ Classes Remaining: ${remainingClasses}\n`);

    // Check bookings
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        class: true
      }
    });

    console.log(`📅 Total Bookings: ${bookings.length}`);
    console.log(`✅ Completed Bookings: ${bookings.filter(b => b.status === 'completed').length}`);
    console.log(`🔄 Active Bookings: ${bookings.filter(b => b.status === 'confirmed').length}\n`);

    // Check classes
    const classes = await prisma.class.findMany();
    console.log(`🏋️ Total Classes: ${classes.length}`);
    console.log(`🟢 Enabled Classes: ${classes.filter(c => c.enabled).length}\n`);

    // Sample client data
    console.log('📋 Sample Client Data:');
    const sampleUsers = users.slice(0, 5);
    
    for (const user of sampleUsers) {
      const userPackages = user.packages;
      const userBookings = user.bookings;
      
      console.log(`\n👤 ${user.name} (${user.email})`);
      console.log(`   🔐 Password: [HASHED]`);
      console.log(`   ✅ Approved: ${user.approved}`);
      console.log(`   📦 Packages: ${userPackages.length}`);
      
      if (userPackages.length > 0) {
        const pkg = userPackages[0];
        console.log(`   📊 Classes: ${pkg.totalClasses - pkg.classesRemaining}/${pkg.totalClasses} done`);
        console.log(`   ⏳ Remaining: ${pkg.classesRemaining}`);
      }
      
      console.log(`   📅 Bookings: ${userBookings.length} (${userBookings.filter(b => b.status === 'completed').length} completed)`);
    }

    // Check for any issues
    console.log('\n🔧 System Health Check:');
    
    const usersWithoutPackages = users.filter(u => u.packages.length === 0 && u.role === 'user');
    if (usersWithoutPackages.length > 0) {
      console.log(`⚠️  ${usersWithoutPackages.length} users have no packages`);
    } else {
      console.log('✅ All users have packages');
    }

    const unapprovedUsers = users.filter(u => !u.approved);
    if (unapprovedUsers.length > 0) {
      console.log(`⚠️  ${unapprovedUsers.length} users are not approved`);
    } else {
      console.log('✅ All users are approved');
    }

    console.log('\n🎉 Database check completed successfully!');
    
    return {
      users: users.length,
      packages: packages.length,
      bookings: bookings.length,
      classes: classes.length,
      usedClasses,
      remainingClasses
    };

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  checkDatabase().catch(console.error);
}

module.exports = { checkDatabase }; 