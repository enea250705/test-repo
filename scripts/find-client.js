const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findClient() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'ilirionai@gmail.com' },
      select: { id: true, name: true, email: true, createdAt: true }
    });
    
    if (user) {
      console.log('✅ Found client:');
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('\n📋 Password Location:');
      console.log('   Check the file: client-passwords-6chars.txt');
      console.log('   Passwords follow pattern: 100001, 100002, etc.');
    } else {
      console.log('❌ Client not found with email: ilirionai@gmail.com');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

findClient(); 