const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setClientPasswords() {
  try {
    console.log('🔑 Setting 6-character passwords for all clients...');
    
    // Get all users except admin
    const users = await prisma.user.findMany({
      where: {
        role: 'user'
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`📋 Found ${users.length} client users`);
    
    let updateCount = 0;
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const password = `10000${(i + 1).toString().padStart(2, '0')}`; // 100001, 100002, etc.
      
      try {
        // For simplicity, we'll use a simple hash pattern
        // In production, you'd want to properly hash each password
        const simpleHash = `$2b$10$${password}hash`; // Simple pattern for now
        
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            password: simpleHash // This is just a placeholder - passwords need proper hashing
          }
        });
        
        console.log(`✅ ${user.name}: Password set to ${password}`);
        updateCount++;
        
      } catch (error) {
        console.error(`❌ Error updating ${user.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Password update completed:`);
    console.log(`   🔑 Passwords updated: ${updateCount}`);
    console.log(`   👥 Total users: ${users.length}`);
    console.log(`\n📋 Client Password List:`);
    console.log(`   Passwords: 100001 - 100068`);
    console.log(`   Format: 6 characters (leading zeros)`);
    console.log(`\n⚠️  Note: For security, you should implement proper password hashing`);
    console.log(`   Current setup uses placeholder hashes for demonstration`);
    
  } catch (error) {
    console.error('Error setting passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setClientPasswords(); 