const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixPasswords() {
  console.log('🔧 Fixing all client passwords...\n');

  try {
    // Get all regular users
    const users = await prisma.user.findMany({
      where: { role: 'user' },
      orderBy: { createdAt: 'asc' }
    });

    console.log(`👥 Found ${users.length} users to fix`);

    const passwordMapping = [];
    let fixed = 0;
    let errors = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      try {
        // Generate 6-digit password: 100001, 100002, etc.
        const passwordNumber = String(i + 1).padStart(2, '0');
        const newPassword = `1000${passwordNumber}`;

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        });

        passwordMapping.push({
          name: user.name,
          email: user.email,
          password: newPassword
        });

        console.log(`✅ Fixed ${user.name} (${user.email}) - Password: ${newPassword}`);
        fixed++;

      } catch (error) {
        console.error(`❌ Error fixing ${user.email}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Password Fix Summary:');
    console.log(`✅ Successfully fixed: ${fixed}`);
    console.log(`❌ Errors: ${errors}`);

    console.log('\n📋 CORRECTED PASSWORD LIST:');
    console.log('=' .repeat(70));
    passwordMapping.forEach((user, index) => {
      console.log(`${String(index + 1).padStart(2)} ${user.name.padEnd(25)} ${user.email.padEnd(35)} ${user.password}`);
    });
    console.log('=' .repeat(70));

    // Test one login to verify
    console.log('\n🧪 Testing first user login...');
    if (passwordMapping.length > 0) {
      const testUser = passwordMapping[0];
      const loginTest = await testLoginCredentials(testUser.email, testUser.password);
      if (loginTest) {
        console.log('✅ Login test PASSED - Passwords are working!');
      } else {
        console.log('❌ Login test FAILED - There might still be an issue');
      }
    }

  } catch (error) {
    console.error('❌ Password fix failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function testLoginCredentials(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) return false;

    const isValid = await bcrypt.compare(password, user.password);
    return isValid;
  } catch (error) {
    console.error('Test failed:', error.message);
    return false;
  }
}

// Run the fix
fixPasswords().catch(console.error); 
 
 
 
 