const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🔍 Testing API endpoint /api/classes...\n');
    
    const response = await fetch('http://localhost:3000/api/classes');
    
    if (!response.ok) {
      console.log('❌ API responded with status:', response.status);
      return;
    }
    
    const data = await response.json();
    console.log(`📊 API returned ${data.length} classes\n`);
    
    // Group by day
    const byDay = {};
    data.forEach(cls => {
      if (!byDay[cls.day]) {
        byDay[cls.day] = [];
      }
      byDay[cls.day].push(cls);
    });
    
    console.log('📅 Classes by day:');
    Object.keys(byDay).forEach(day => {
      console.log(`${day}: ${byDay[day].length} classes`);
    });
    
    // Show Saturday classes if any
    const saturdayClasses = data.filter(cls => cls.day.toLowerCase().includes('sat'));
    if (saturdayClasses.length > 0) {
      console.log('\n⚠️  SATURDAY CLASSES FROM API:');
      saturdayClasses.forEach(cls => {
        console.log(`- ${cls.name} at ${cls.time} on ${cls.date} (${cls.enabled ? 'ENABLED' : 'DISABLED'})`);
      });
    } else {
      console.log('\n✅ No Saturday classes found in API response');
    }
    
    // Show next few classes
    console.log('\nNext 5 classes from API:');
    data.slice(0, 5).forEach(cls => {
      console.log(`- ${cls.day} ${cls.date} ${cls.time} - ${cls.name} (${cls.enabled ? 'ENABLED' : 'DISABLED'})`);
    });
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testAPI(); 
 
 
 
 