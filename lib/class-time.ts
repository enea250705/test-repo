// Classes are stored with `date` at midnight UTC of the calendar day and `time`
// as a string like "9:00 AM" or "17:00 PM", both meaning local gym time.
export const GYM_TIMEZONE = "Europe/Athens"

// Offset (ms) of `timeZone` from UTC at the given instant
function timeZoneOffsetMs(timestamp: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(timestamp))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"))
  return asUtc - timestamp
}

// Actual start instant of a class, independent of the server's timezone
export function getClassStart(date: Date | string, time: string): Date {
  const day = new Date(date)
  const [hm, period] = time.trim().split(/\s+/)
  let [hour, minute] = hm.split(":").map(Number)
  if (period === "PM" && hour < 12) hour += 12
  if (period === "AM" && hour === 12) hour = 0

  const wallClockAsUtc = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, minute || 0)
  return new Date(wallClockAsUtc - timeZoneOffsetMs(wallClockAsUtc, GYM_TIMEZONE))
}

export function hoursUntilClass(date: Date | string, time: string): number {
  return (getClassStart(date, time).getTime() - Date.now()) / (1000 * 60 * 60)
}
