const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePasswords() {
  console.log('🔐 Updating all client passwords to 6 characters...\n');

  try {
    // Get all users with their current data
    const users = await prisma.user.findMany({
      where: {
        role: 'user' // Only update regular users, not admins
      }
    });

    console.log(`👥 Found ${users.length} users to update`);

    let updated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Generate 6-character password based on user index
        // We'll use the pattern: 10000X where X is incremented
        const userIndex = users.indexOf(user) + 1;
        const newPassword = `10000${userIndex.toString().padStart(2, '0')}`; // 100001, 100002, etc.
        
        // If we have more than 99 users, use a different pattern
        const finalPassword = userIndex > 99 ? `10${userIndex.toString().padStart(4, '0')}` : newPassword;

        // Hash the new password
        const hashedPassword = await bcrypt.hash(finalPassword, 10);

        // Update the user's password
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });

        console.log(`✅ Updated ${user.name} (${user.email}) - New password: ${finalPassword}`);
        updated++;

      } catch (error) {
        console.error(`❌ Error updating ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Password Update Summary:');
    console.log(`✅ Successfully updated: ${updated}`);
    console.log(`❌ Errors: ${errors}`);

    // Show password list for reference
    console.log('\n📋 New Password Reference:');
    console.log('=' .repeat(50));
    
    const updatedUsers = await prisma.user.findMany({
      where: { role: 'user' },
      select: { name: true, email: true },
      orderBy: { createdAt: 'asc' }
    });

    updatedUsers.forEach((user, index) => {
      const userIndex = index + 1;
      const password = userIndex > 99 ? `10${userIndex.toString().padStart(4, '0')}` : `10000${userIndex.toString().padStart(2, '0')}`;
      console.log(`${userIndex.toString().padStart(2, ' ')}) ${user.name} - ${user.email} - Password: ${password}`);
    });

    console.log('=' .repeat(50));
    console.log('\n🎉 All passwords updated successfully!');
    console.log('💡 Share these new passwords with your clients.');

  } catch (error) {
    console.error('❌ Password update failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  updatePasswords().catch(console.error);
}

module.exports = { updatePasswords }; 