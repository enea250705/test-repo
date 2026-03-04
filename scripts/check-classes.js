const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClasses() {
  console.log('🔍 Checking all classes in the database...\n');

  try {
    const classes = await prisma.class.findMany({
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    console.log(`📊 Total Classes Found: ${classes.length}\n`);

    if (classes.length === 0) {
      console.log('❌ No classes found in database!');
      return;
    }

    // Group by day of week
    const classesByDay = {};
    classes.forEach(cls => {
      const dayName = cls.day.toLowerCase();
      if (!classesByDay[dayName]) {
        classesByDay[dayName] = [];
      }
      classesByDay[dayName].push(cls);
    });

    console.log('📅 Classes by Day of Week:');
    console.log('=' .repeat(50));
    Object.keys(classesByDay).forEach(day => {
      const dayClasses = classesByDay[day];
      console.log(`${day.toUpperCase()}: ${dayClasses.length} classes`);
      dayClasses.slice(0, 3).forEach(cls => {
        console.log(`  • ${cls.name} at ${cls.time} (${cls.enabled ? 'ENABLED' : 'DISABLED'})`);
      });
    });

    // Check for Saturday classes specifically
    const saturdayClasses = classes.filter(cls => cls.day.toLowerCase() === 'saturday');
    
    if (saturdayClasses.length > 0) {
      console.log('\n⚠️  SATURDAY CLASSES FOUND:');
      console.log('=' .repeat(50));
      saturdayClasses.forEach(cls => {
        const date = new Date(cls.date).toLocaleDateString('en-US');
        console.log(`📅 ${date} - ${cls.time} - ${cls.name}`);
        console.log(`   ID: ${cls.id}`);
        console.log(`   Enabled: ${cls.enabled ? 'YES' : 'NO'}`);
        console.log('');
      });
    }

    // Check enabled vs disabled
    const enabledCount = classes.filter(cls => cls.enabled).length;
    const disabledCount = classes.filter(cls => !cls.enabled).length;
    
    console.log('\n📊 Class Status Summary:');
    console.log(`✅ Enabled: ${enabledCount}`);
    console.log(`❌ Disabled: ${disabledCount}`);

  } catch (error) {
    console.error('❌ Error checking classes:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkClasses(); 