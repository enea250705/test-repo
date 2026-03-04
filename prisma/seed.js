const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting fresh seeding...');
  
  // Clean existing data - delete everything
  await prisma.booking.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.package.deleteMany();
  await prisma.class.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Deleted all existing data - creating fresh database');
  
  // Create admin user only
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      approved: true
    }
  });
  
  console.log('Created admin user');
  console.log('Fresh seeding completed successfully');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 