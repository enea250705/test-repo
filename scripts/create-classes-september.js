const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// September 2026 schedule — classes resume Monday September 7.
// Time strings follow the existing live-database convention:
// mornings use 12-hour form ("9:00 AM"), evenings use 24-hour form ("17:00 PM").
const TIME_SLOTS = {
  Monday:    ['9:00 AM', '10:00 AM', '17:00 PM', '18:00 PM', '19:00 PM', '20:00 PM'],
  Tuesday:   ['8:00 AM', '9:00 AM', '17:00 PM', '18:00 PM', '19:00 PM', '20:00 PM'],
  Wednesday: ['9:00 AM', '10:00 AM', '17:00 PM', '18:00 PM', '19:00 PM'],
  Thursday:  ['8:00 AM', '9:00 AM', '17:00 PM', '18:00 PM', '19:00 PM', '20:00 PM'],
  Friday:    ['8:00 AM', '9:00 AM', '10:00 AM'],
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const START_DATE = '2026-09-07'; // Monday
const END_DATE   = '2026-09-30'; // Wednesday

const CLASS_NAME = 'CrossFit Class';
const CAPACITY = 5;

function* dateRange(startIso, endIso) {
  const end = new Date(endIso + 'T00:00:00.000Z');
  for (let d = new Date(startIso + 'T00:00:00.000Z'); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    yield new Date(d);
  }
}

async function main() {
  console.log(`=== Creating September classes (${START_DATE} → ${END_DATE}) ===\n`);

  const toCreate = [];

  for (const date of dateRange(START_DATE, END_DATE)) {
    const day = DAYS[date.getUTCDay()];
    const slots = TIME_SLOTS[day];
    if (!slots) continue; // weekend

    for (const time of slots) {
      const existing = await prisma.class.findFirst({
        where: {
          time,
          date: {
            gte: new Date(date.toISOString().split('T')[0] + 'T00:00:00.000Z'),
            lte: new Date(date.toISOString().split('T')[0] + 'T23:59:59.999Z'),
          },
        },
      });

      if (existing) {
        console.log(`  ${date.toISOString().split('T')[0]} ${time} — already exists (skipped)`);
        continue;
      }

      toCreate.push({
        name: CLASS_NAME,
        day,
        date,
        time,
        capacity: CAPACITY,
        currentBookings: 0,
        enabled: true,
        paymentMethod: 'Cash',
      });
    }
  }

  if (toCreate.length > 0) {
    const result = await prisma.class.createMany({ data: toCreate, skipDuplicates: true });
    console.log(`\nCreated ${result.count} class rows.\n`);
  } else {
    console.log('\nNothing to create.\n');
  }

  // ── Verification ──────────────────────────────────────────────────────────
  console.log('=== Verifying September schedule ===\n');

  const rows = await prisma.class.findMany({
    where: {
      date: {
        gte: new Date('2026-09-01T00:00:00.000Z'),
        lte: new Date('2026-09-30T23:59:59.999Z'),
      },
    },
    orderBy: [{ date: 'asc' }],
  });

  const byDate = {};
  for (const cls of rows) {
    const d = cls.date.toISOString().split('T')[0];
    (byDate[d] ||= []).push(cls);
  }

  for (const [date, list] of Object.entries(byDate).sort()) {
    console.log(`${date} (${list[0].day}): ${list.length} — ${list.map(c => c.time).join(', ')}`);
  }

  console.log(`\nTotal September classes: ${rows.length}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
