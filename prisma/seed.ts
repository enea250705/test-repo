import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('==========================================');
  console.log('Starting database seeding process...');
  console.log('==========================================');
  
  // Clean existing data
  console.log('Cleaning existing data...');
  try {
    await prisma.booking.deleteMany({});
    console.log('✓ Deleted all bookings');
  } catch (error) {
    console.error('Error deleting bookings:', error);
  }
  
  try {
    await prisma.class.deleteMany({});
    console.log('✓ Deleted all classes');
  } catch (error) {
    console.error('Error deleting classes:', error);
  }
  
  try {
    await prisma.user.deleteMany({});
    console.log('✓ Deleted all users');
  } catch (error) {
    console.error('Error deleting users:', error);
  }
  
  console.log('All existing data has been cleaned successfully');
  
  // Create admin user with the specified credentials
  console.log('Creating admin user with credentials:');
  console.log('Email: gymxam@gmail.com');
  console.log('Password: xamilakis1992');
  
  const adminPassword = await bcrypt.hash('xamilakis1992', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'gymxam@gmail.com',
      password: adminPassword,
      role: 'admin',
      approved: true
    }
  });
  console.log(`✓ Created admin user (ID: ${admin.id})`);
  
  console.log('==========================================');
  console.log('Seeding completed successfully!');
  console.log('==========================================');
  console.log('Admin login credentials:');
  console.log('Email: gymxam@gmail.com');
  console.log('Password: xamilakis1992');
  console.log('==========================================');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 