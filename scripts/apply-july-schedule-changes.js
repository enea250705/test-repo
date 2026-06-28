const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Target dates (ISO strings at midnight UTC)
const FRIDAY_DELETE_DATES = [
  '2026-07-03', // week Jun 29-Jul 3
  '2026-07-17', // week Jul 13-17
  '2026-07-24', // week Jul 20-24
  '2026-07-31', // week Jul 27-31
  // Jul 10 is KEPT (exception week)
];

// Thu 10AM already exists on Jul 2 — add only to remaining Thursdays
const THURSDAY_10AM_DATES = [
  '2026-07-09',
  '2026-07-16',
  '2026-07-23',
  '2026-07-30',
];

// Week of Jul 6-10: delete Mon/Tue/Wed only
const DELETE_MON_TUE_WED_DATES = [
  '2026-07-06', // Monday
  '2026-07-07', // Tuesday
  '2026-07-08', // Wednesday
];

function toDateRange(isoDate) {
  const start = new Date(isoDate + 'T00:00:00.000Z');
  const end   = new Date(isoDate + 'T23:59:59.999Z');
  return { gte: start, lte: end };
}

async function main() {
  console.log('=== Applying July schedule changes ===\n');

  // ── 1. Delete Friday classes (except Jul 10) ──────────────────────────────
  console.log('STEP 1: Deleting Friday classes (Jul 3, 17, 24, 31)...');
  for (const d of FRIDAY_DELETE_DATES) {
    const classes = await prisma.class.findMany({
      where: { date: toDateRange(d) },
      include: { _count: { select: { bookings: true } } },
    });

    for (const cls of classes) {
      if (cls._count.bookings > 0) {
        // Has bookings — disable instead of delete
        await prisma.class.update({ where: { id: cls.id }, data: { enabled: false } });
        console.log(`  ${d} ${cls.time} — DISABLED (has ${cls._count.bookings} booking(s))`);
      } else {
        await prisma.class.delete({ where: { id: cls.id } });
        console.log(`  ${d} ${cls.time} — DELETED`);
      }
    }
  }
  console.log('');

  // ── 2. Add Thursday 10:00 AM classes ─────────────────────────────────────
  console.log('STEP 2: Adding Thursday 10:00 AM classes...');
  for (const d of THURSDAY_10AM_DATES) {
    // Check if 10AM class already exists for this date
    const existing = await prisma.class.findFirst({
      where: {
        date: toDateRange(d),
        time: '10:00 AM',
      },
    });

    if (existing) {
      console.log(`  ${d} 10:00 AM — already exists (skipped)`);
      continue;
    }

    const dateObj = new Date(d + 'T10:00:00.000Z');
    await prisma.class.create({
      data: {
        name: 'CrossFit Class',
        day: 'Thursday',
        date: dateObj,
        time: '10:00 AM',
        capacity: 5,
        currentBookings: 0,
        enabled: false,
      },
    });
    console.log(`  ${d} 10:00 AM — CREATED (cap 5)`);
  }
  console.log('');

  // ── 3. Delete Mon/Tue/Wed for week Jul 6-10 ──────────────────────────────
  console.log('STEP 3: Deleting Mon/Tue/Wed for week Jul 6-10...');
  for (const d of DELETE_MON_TUE_WED_DATES) {
    const classes = await prisma.class.findMany({
      where: { date: toDateRange(d) },
      include: { _count: { select: { bookings: true } } },
    });

    for (const cls of classes) {
      if (cls._count.bookings > 0) {
        await prisma.class.update({ where: { id: cls.id }, data: { enabled: false } });
        console.log(`  ${d} ${cls.time} — DISABLED (has ${cls._count.bookings} booking(s))`);
      } else {
        await prisma.class.delete({ where: { id: cls.id } });
        console.log(`  ${d} ${cls.time} — DELETED`);
      }
    }
  }
  console.log('');

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('=== Done! Verifying final state ===\n');

  const remaining = await prisma.class.findMany({
    where: {
      date: {
        gte: new Date('2026-06-29T00:00:00.000Z'),
        lte: new Date('2026-07-31T23:59:59.999Z'),
      },
    },
    orderBy: [{ date: 'asc' }, { time: 'asc' }],
  });

  const byDate = {};
  for (const cls of remaining) {
    const d = cls.date.toISOString().split('T')[0];
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(cls);
  }

  for (const [date, list] of Object.entries(byDate).sort()) {
    const sample = list[0];
    console.log(`${date} (${sample.day}): ${list.length} classes | times: ${list.map(c => c.time).join(', ')}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
