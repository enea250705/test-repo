const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDateShift() {
  try {
    console.log('🔍 Checking date shift issue...\n');
    
    // Get classes from June 9-14
    const classes = await prisma.class.findMany({
      where: {
        date: {
          gte: new Date('2025-06-09'),
          lte: new Date('2025-06-14')
        }
      },
      orderBy: { date: 'asc' },
      take: 10
    });
    
    console.log('Classes between June 9-14:');
    console.log('=' .repeat(80));
    
    classes.forEach(cls => {
      const dbDate = cls.date;
      const isoString = dbDate.toISOString();
      const localString = dbDate.toLocaleDateString('en-US');
      const dayOfWeek = dbDate.getDay(); // 0=Sunday, 6=Saturday
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const actualDay = dayNames[dayOfWeek];
      
      console.log(`${cls.day.padEnd(10)} | DB Date: ${isoString.split('T')[0]} | Local: ${localString} | Actual: ${actualDay} | ${cls.name}`);
    });
    
    // Show timezone info
    console.log('\n🌍 Timezone Information:');
    console.log(`Server timezone offset: ${new Date().getTimezoneOffset()} minutes`);
    console.log(`Current date: ${new Date().toISOString()}`);
    console.log(`Local date: ${new Date().toLocaleDateString('en-US')}`);
    
    // Test specific date parsing
    console.log('\n📅 Date Parsing Test:');
    const testDate = new Date('2025-06-09');
    console.log(`new Date('2025-06-09'): ${testDate.toISOString()}`);
    console.log(`Local display: ${testDate.toLocaleDateString('en-US')}`);
    console.log(`getDay(): ${testDate.getDay()} (${dayNames[testDate.getDay()]})`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDateShift(); 
 
 
 
 