const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPasswordValidation() {
  try {
    // Test with the first user from the password list
    const email = 'eneamuja87@gmail.com';
    const correctPassword = '100001';
    const wrongPassword = 'wrongpass';
    
    console.log('🔍 Testing password validation with user:', email);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 Found user:', user.name);
    console.log('✅ User approved:', user.approved);
    console.log('🔐 Password hash preview:', user.password.substring(0, 30) + '...');
    
    // Test correct password
    console.log('\n🧪 Testing password validation:');
    const validCheck = await bcrypt.compare(correctPassword, user.password);
    console.log(`   Correct password (${correctPassword}):`, validCheck ? '✅ VALID' : '❌ INVALID');
    
    // Test wrong password
    const invalidCheck = await bcrypt.compare(wrongPassword, user.password);
    console.log(`   Wrong password (${wrongPassword}):`, invalidCheck ? '🚨 VALID (PROBLEM!)' : '✅ INVALID (correct)');
    
    // Test empty password
    const emptyCheck = await bcrypt.compare('', user.password);
    console.log(`   Empty password:`, emptyCheck ? '🚨 VALID (PROBLEM!)' : '✅ INVALID (correct)');
    
    // Test another user to make sure it's not a specific user issue
    console.log('\n🔍 Testing with second user...');
    const user2 = await prisma.user.findMany({
      where: { role: 'user' },
      take: 1,
      skip: 1
    });
    
    if (user2[0]) {
      console.log('👤 Second user:', user2[0].name, '(' + user2[0].email + ')');
      const secondUserCheck = await bcrypt.compare('100002', user2[0].password);
      console.log(`   Password 100002:`, secondUserCheck ? '✅ VALID' : '❌ INVALID');
      
      const wrongSecondCheck = await bcrypt.compare('wrongpass', user2[0].password);
      console.log(`   Wrong password:`, wrongSecondCheck ? '🚨 VALID (PROBLEM!)' : '✅ INVALID (correct)');
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPasswordValidation(); 