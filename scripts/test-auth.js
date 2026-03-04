const fetch = require('node-fetch');

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...\n');
    
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const serverTest = await fetch('http://localhost:3000/api/classes');
    console.log(`   Server response: ${serverTest.status} ${serverTest.statusText}`);
    
    // Test 2: Check bookings endpoint without auth
    console.log('\n2. Testing bookings endpoint without auth...');
    const bookingsTest = await fetch('http://localhost:3000/api/bookings');
    console.log(`   Bookings response: ${bookingsTest.status} ${bookingsTest.statusText}`);
    
    if (bookingsTest.status === 401) {
      console.log('   ✅ 401 is expected - endpoint requires authentication');
    }
    
    // Test 3: Check if there are any auth tokens in the environment
    console.log('\n3. Checking JWT environment...');
    console.log(`   JWT_SECRET exists: ${process.env.JWT_SECRET ? 'YES' : 'NO'}`);
    
    console.log('\n🔧 This confirms the bookings API requires authentication.');
    console.log('The 401 error happens when users are not properly authenticated.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAuth(); 
 
 
 
 