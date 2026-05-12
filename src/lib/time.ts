export function formatLocal(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** Format an all-day entry's date from its YYYY-MM-DD string, without any
 *  timezone conversion. */
export function formatYmd(ymd: string): string {
  // Parse as UTC noon so Intl never crosses a day boundary.
  const dt = new Date(ymd + "T12:00:00Z");
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "2-digit",
  }).format(dt);
}

/** "2026-W19" → "Week 19 · 2026" */
export function prettyWeek(weekLabel: string): string {
  const [year, w] = weekLabel.split("-W");
  return `Week ${w} · ${year}`;
}
