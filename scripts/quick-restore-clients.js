const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function restoreClients() {
  try {
    console.log('📋 Restoring basic client users...');
    
    // Create some sample clients for testing the renewal system
    const sampleClients = [
      { name: 'Adrianna Roubaki', email: 'ad.roubaki@gmail.com' },
      { name: 'Alice Smith', email: 'alice.smith@gmail.com' },
      { name: 'Bob Johnson', email: 'bob.johnson@gmail.com' },
      { name: 'Carol Davis', email: 'carol.davis@gmail.com' },
      { name: 'David Wilson', email: 'david.wilson@gmail.com' },
    ];
    
    let createdCount = 0;
    
    for (let i = 0; i < sampleClients.length; i++) {
      const client = sampleClients[i];
      const password = `10000${i + 1}`; // 6-character passwords: 100001, 100002, etc.
      const hashedPassword = await bcrypt.hash(password, 10);
      
      try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: client.email }
        });
        
        if (!existingUser) {
          await prisma.user.create({
            data: {
              name: client.name,
              email: client.email,
              password: hashedPassword,
              role: 'user',
              approved: true,
            }
          });
          
          console.log(`✅ Created: ${client.name} (${client.email}) - Password: ${password}`);
          createdCount++;
        } else {
          console.log(`⏭️ Skipped: ${client.name} (already exists)`);
        }
      } catch (error) {
        console.error(`❌ Error creating ${client.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Import completed: ${createdCount} new clients created`);
    console.log('🔑 All client passwords are 6 characters: 100001, 100002, etc.');
    
  } catch (error) {
    console.error('Error during client restoration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreClients(); 