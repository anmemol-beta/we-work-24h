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

/** "2026-W19" → "Week 19 · 2026" */
export function prettyWeek(weekLabel: string): string {
  const [year, w] = weekLabel.split("-W");
  return `Week ${w} · ${year}`;
}
