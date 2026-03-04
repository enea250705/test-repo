const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSaturday() {
  try {
    // Check for Saturday classes
    const satClasses = await prisma.class.findMany({
      where: { 
        OR: [
          { day: { contains: 'saturday', mode: 'insensitive' } },
          { day: { contains: 'sat', mode: 'insensitive' } }
        ]
      },
      orderBy: { date: 'asc' }
    });
    
    console.log('🔍 Saturday classes found:', satClasses.length);
    
    if (satClasses.length > 0) {
      console.log('\nSATURDAY CLASSES:');
      satClasses.slice(0, 10).forEach(cls => {
        console.log(`${cls.date} - ${cls.time} - ${cls.name} (${cls.enabled ? 'ENABLED' : 'DISABLED'})`);
      });
    }
    
    // Check all unique day values
    const allDays = await prisma.class.findMany({
      select: { day: true },
      distinct: ['day']
    });
    
    console.log('\nAll unique day values in database:');
    allDays.forEach(d => console.log(`'${d.day}'`));
    
    // Check for classes from today forward
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcomingClasses = await prisma.class.findMany({
      where: {
        date: { gte: today }
      },
      orderBy: { date: 'asc' },
      take: 20
    });
    
    console.log('\nNext 20 upcoming classes:');
    upcomingClasses.forEach(cls => {
      const date = new Date(cls.date);
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
      console.log(`${cls.date.toISOString().split('T')[0]} (${dayName}) - ${cls.time} - ${cls.name} (${cls.enabled ? 'ENABLED' : 'DISABLED'})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSaturday(); 
 
 
 
 