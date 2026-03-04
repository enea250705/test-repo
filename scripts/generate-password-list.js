const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generatePasswordList() {
  console.log('📋 Generating complete password list for all clients...\n');

  try {
    // Get all regular users (not admins)
    const users = await prisma.user.findMany({
      where: { role: 'user' },
      select: { 
        name: true, 
        email: true, 
        createdAt: true 
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`👥 Found ${users.length} clients\n`);
    console.log('🔐 NEW 6-CHARACTER PASSWORDS:');
    console.log('=' .repeat(80));

    // Generate the password list
    users.forEach((user, index) => {
      const userIndex = index + 1;
      // Generate 6-character password: 100001, 100002, 100003, etc.
      const password = userIndex > 99 ? `10${userIndex.toString().padStart(4, '0')}` : `10000${userIndex.toString().padStart(1, '0')}`;
      
      console.log(`${userIndex.toString().padStart(2, ' ')}) ${user.name.padEnd(25)} ${user.email.padEnd(35)} Password: ${password}`);
    });

    console.log('=' .repeat(80));
    console.log(`\n✅ Total: ${users.length} clients with 6-character passwords`);
    console.log('\n💡 Instructions for clients:');
    console.log('   • Use your email address as username');
    console.log('   • Use the 6-digit password shown above');
    console.log('   • All accounts are pre-approved and ready to use');
    console.log('   • Class packages and booking history are already set up');

  } catch (error) {
    console.error('❌ Error generating password list:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
generatePasswordList().catch(console.error); 