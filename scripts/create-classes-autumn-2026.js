const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Autumn 2026 schedule.
// Time strings follow the existing live-database convention:
// mornings use 12-hour form ("9:00 AM"), evenings use 24-hour form ("17:00 PM").
// Some rows created via the admin UI use "5:00 PM" — both forms are treated as
// the same slot when checking for duplicates.

// One-off additions for the week of 21–25 September.
const ONE_OFF = [
  { date: '2026-09-23', times: ['20:00 PM'] },                // Wednesday
  { date: '2026-09-25', times: ['17:00 PM', '18:00 PM'] },    // Friday
];

// Standing weekly template from Monday 28 September onward.
const TIME_SLOTS = {
  Monday:    ['8:00 AM', '9:00 AM', '10:00 AM', '17:00 PM', '18:00 PM', '19:00 PM', '20:00 PM'],
  Tuesday:   ['8:00 AM', '9:00 AM', '10:00 AM', '17:00 PM', '18:00 PM', '19:00 PM', '20:00 PM'],
  Wednesday: ['8:00 AM', '9:00 AM', '10:00 AM', '17:00 PM', '18:00 PM', '19:00 PM', '20:00 PM'],
  Thursday:  ['8:00 AM', '9:00 AM', '17:00 PM', '18:00 PM', '19:00 PM', '20:00 PM'],
  Friday:    ['8:00 AM', '9:00 AM', '10:00 AM', '17:00 PM', '18:00 PM'],
};

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const START_DATE = '2026-09-28'; // Monday
const END_DATE   = '2026-12-31'; // Thursday

const CLASS_NAME = 'CrossFit Class';
const CAPACITY = 5;
const ENABLED = false; // admin enables each week from the dashboard

function* dateRange(startIso, endIso) {
  const end = new Date(endIso + 'T00:00:00.000Z');
  for (let d = new Date(startIso + 'T00:00:00.000Z'); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    yield new Date(d);
  }
}

// "17:00 PM", "5:00 PM", "9:00 AM" -> minutes since midnight
function timeValue(timeStr) {
  const [time, period] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

async function existingTimesOn(date) {
  const iso = date.toISOString().split('T')[0];
  const rows = await prisma.class.findMany({
    where: { date: { gte: new Date(iso + 'T00:00:00.000Z'), lte: new Date(iso + 'T23:59:59.999Z') } },
    select: { time: true },
  });
  return new Set(rows.map(r => timeValue(r.time)));
}

function buildRow(date, time) {
  return {
    name: CLASS_NAME,
    day: DAYS[date.getUTCDay()],
    date,
    time,
    capacity: CAPACITY,
    currentBookings: 0,
    enabled: ENABLED,
    paymentMethod: 'Cash',
  };
}

async function main() {
  const toCreate = [];

  console.log('=== One-off additions (week of 21–25 Sep) ===');
  for (const { date: iso, times } of ONE_OFF) {
    const date = new Date(iso + 'T00:00:00.000Z');
    const existing = await existingTimesOn(date);
    for (const time of times) {
      if (existing.has(timeValue(time))) {
        console.log(`  ${iso} ${time} — already exists (skipped)`);
        continue;
      }
      toCreate.push(buildRow(date, time));
      console.log(`  ${iso} ${time} — will create`);
    }
  }

  console.log(`\n=== Weekly template (${START_DATE} → ${END_DATE}) ===`);
  for (const date of dateRange(START_DATE, END_DATE)) {
    const slots = TIME_SLOTS[DAYS[date.getUTCDay()]];
    if (!slots) continue; // weekend
    const existing = await existingTimesOn(date);
    for (const time of slots) {
      if (existing.has(timeValue(time))) continue;
      toCreate.push(buildRow(date, time));
    }
  }

  if (toCreate.length > 0) {
    const result = await prisma.class.createMany({ data: toCreate, skipDuplicates: true });
    console.log(`\nCreated ${result.count} class rows.\n`);
  } else {
    console.log('\nNothing to create.\n');
  }

  // ── Verification ──────────────────────────────────────────────────────────
  console.log('=== Verifying schedule (21 Sep → 31 Dec) ===\n');

  const rows = await prisma.class.findMany({
    where: { date: { gte: new Date('2026-09-21T00:00:00.000Z'), lte: new Date(END_DATE + 'T23:59:59.999Z') } },
    orderBy: [{ date: 'asc' }],
  });

  const byDate = {};
  for (const cls of rows) (byDate[cls.date.toISOString().split('T')[0]] ||= []).push(cls);

  for (const [date, list] of Object.entries(byDate).sort()) {
    list.sort((a, b) => timeValue(a.time) - timeValue(b.time));
    console.log(`${date} (${list[0].day}): ${list.length} — ${list.map(c => c.time).join(', ')}`);
  }

  console.log(`\nTotal classes 21 Sep → 31 Dec: ${rows.length}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
