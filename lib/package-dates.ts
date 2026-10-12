// Package validity is based on the gym's local calendar (Greece), not server time.
export const GYM_TIME_ZONE = "Europe/Athens";

// A package runs until the first Saturday that is at least this many days after
// the start day. Starting on a Sunday gives exactly 4 weeks (Sunday -> 4th Saturday).
const MIN_DAYS_BEFORE_END = 22;
const SATURDAY = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

// Calendar date (year, month, day) of an instant in the gym's time zone,
// returned as a UTC-midnight Date so we can do plain day arithmetic on it.
function gymCalendarDay(date: Date): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: GYM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
}

// Offset (ms) of the gym's time zone from UTC at a given instant.
function gymOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: GYM_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

// Last millisecond of a calendar day (UTC-midnight Date) in the gym's time zone.
function gymEndOfDay(calendarDay: Date): Date {
  const localEnd = calendarDay.getTime() + DAY_MS - 1;
  return new Date(localEnd - gymOffsetMs(new Date(localEnd)));
}

// End date for a package starting at `start`: end of the first Saturday
// at least MIN_DAYS_BEFORE_END days later (gym local time).
export function calculatePackageEndDate(start: Date): Date {
  const day = gymCalendarDay(start);
  const earliest = new Date(day.getTime() + MIN_DAYS_BEFORE_END * DAY_MS);
  const daysToSaturday = (SATURDAY - earliest.getUTCDay() + 7) % 7;
  return gymEndOfDay(new Date(earliest.getTime() + daysToSaturday * DAY_MS));
}

// Start/end for a new package. If the current package is still valid, the new one
// starts right after it ends (so a Saturday end rolls into a Sunday start).
export function calculatePackagePeriod(
  currentEndDate?: Date | string | null,
  now: Date = new Date()
): { startDate: Date; endDate: Date } {
  const currentEnd = currentEndDate ? new Date(currentEndDate) : null;
  const startDate = currentEnd && currentEnd > now ? new Date(currentEnd.getTime() + 1) : now;
  return { startDate, endDate: calculatePackageEndDate(startDate) };
}

// "dd/mm/yyyy" in the gym's time zone, for "Valid until" labels.
export function formatValidUntil(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-GB", {
    timeZone: GYM_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
