const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugSaturday() {
  try {
    console.log('🔍 Debugging Saturday classes issue...\n');
    
    // Check database for any classes that might be Saturday
    console.log('1. Checking database for Saturday classes...');
    const allClasses = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        day: true,
        date: true,
        time: true,
        enabled: true
      },
      orderBy: { date: 'asc' }
    });
    
    console.log(`Total classes in DB: ${allClasses.length}`);
    
    // Check each day type
    const dayTypes = {};
    allClasses.forEach(cls => {
      dayTypes[cls.day] = (dayTypes[cls.day] || 0) + 1;
    });
    
    console.log('Day distribution:');
    Object.keys(dayTypes).forEach(day => {
      console.log(`  ${day}: ${dayTypes[day]} classes`);
    });
    
    // Check for any Saturday-like data
    const possibleSat = allClasses.filter(cls => 
      cls.day.toLowerCase().includes('sat') || 
      cls.day.toLowerCase().includes('6') ||
      new Date(cls.date).getDay() === 6
    );
    
    if (possibleSat.length > 0) {
      console.log('\n⚠️  Found possible Saturday classes:');
      possibleSat.forEach(cls => {
        const jsDate = new Date(cls.date);
        const dayOfWeek = jsDate.getDay(); // 0=Sunday, 6=Saturday
        console.log(`  - ${cls.name} on ${cls.date} (${cls.day}) - JS Day: ${dayOfWeek} ${dayOfWeek === 6 ? '(SATURDAY!)' : ''}`);
      });
    } else {
      console.log('\n✅ No Saturday classes found in database');
    }
    
    // Check upcoming classes specifically
    console.log('\n2. Checking upcoming classes (next 30 days)...');
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const upcomingClasses = await prisma.class.findMany({
      where: {
        date: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        }
      },
      orderBy: { date: 'asc' }
    });
    
    console.log(`Upcoming classes: ${upcomingClasses.length}`);
    
    upcomingClasses.slice(0, 15).forEach(cls => {
      const jsDate = new Date(cls.date);
      const dayOfWeek = jsDate.getDay();
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
      console.log(`  ${cls.date.toISOString().split('T')[0]} (${dayName}): ${cls.name} at ${cls.time} - DB says: "${cls.day}"`);
    });
    
    // Check if any dates fall on Saturday
    const saturdayDates = upcomingClasses.filter(cls => new Date(cls.date).getDay() === 6);
    if (saturdayDates.length > 0) {
      console.log('\n🚨 FOUND CLASSES ON SATURDAY DATES:');
      saturdayDates.forEach(cls => {
        const jsDate = new Date(cls.date);
        console.log(`  - ${cls.name} on ${cls.date} (${cls.day}) but date falls on SATURDAY!`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSaturday(); 
 
 
 
 