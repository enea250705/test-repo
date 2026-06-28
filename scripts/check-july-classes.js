const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkJulyClasses() {
  const start = new Date('2026-06-29T00:00:00.000Z');
  const end = new Date('2026-07-31T23:59:59.999Z');

  const classes = await prisma.class.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
    include: { _count: { select: { bookings: true } } }
  });

  console.log(`Found ${classes.length} classes from Jun 29 - Jul 31\n`);

  const byDate = {};
  for (const cls of classes) {
    const d = cls.date.toISOString().split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(cls);
  }

  for (const [date, list] of Object.entries(byDate).sort()) {
    const sample = list[0];
    console.log(`${date} (${sample.day}): ${list.length} classes | enabled: ${list.filter(c => c.enabled).length} | times: ${list.map(c => c.time).join(', ')}`);
  }

  await prisma.$disconnect();
}

checkJulyClasses().catch(e => { console.error(e); process.exit(1); });
