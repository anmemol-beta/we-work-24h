import rawEntries from "virtual:entries";

export type Person = "hunjun" | "hyoungseo";

export type TimeBucket =
  | "deepnight"
  | "dawn"
  | "sunrise"
  | "morning"
  | "midday"
  | "afternoon"
  | "sunset"
  | "night";

export interface Entry {
  person: Person;
  week: string;
  date: string;
  tz: string;
  hourInTz: number;
  utcMillis: number;
  timeBucket: TimeBucket;
  location?: string;
  title?: string;
  bodyHtml: string;
  slug: string;
  dummy: boolean;
  ymd: string;
  allDay: boolean;
}

export interface Moment {
  hunjun: Entry[];
  hyoungseo: Entry[];
  /** Used as a stable React key. */
  id: string;
}

export interface WeekGroup {
  week: string;
  /** Both people in the same tz at week end → shared spine. */
  together: boolean;
  start: string;
  end: string;
  moments: Moment[];
}

export interface YearGroup {
  year: string;
  weeks: WeekGroup[];
}

export function groupByYear(weeks: WeekGroup[]): YearGroup[] {
  const byYear = new Map<string, WeekGroup[]>();
  for (const w of weeks) {
    const year = w.week.split("-")[0];
    let list = byYear.get(year);
    if (!list) {
      list = [];
      byYear.set(year, list);
    }
    list.push(w);
  }
  return [...byYear.entries()]
    .map(([year, list]) => ({ year, weeks: list }))
    .sort((a, b) => b.year.localeCompare(a.year));
}

const HOME_TZ: Record<Person, string> = {
  hunjun: "Asia/Seoul",
  hyoungseo: "America/New_York",
};

/** Within this window two events are considered "the same moment". */
const MOMENT_TOLERANCE_MS = 90 * 60 * 1000;

function bucketOfHour(hour: number): TimeBucket {
  if (hour < 4) return "deepnight";
  if (hour < 6) return "dawn";
  if (hour < 9) return "sunrise";
  if (hour < 11) return "morning";
  if (hour < 14) return "midday";
  if (hour < 17) return "afternoon";
  if (hour < 20) return "sunset";
  return "night";
}

export function loadAllEntries(): Entry[] {
  return rawEntries
    .map((e) => ({ ...e, timeBucket: bucketOfHour(e.hourInTz) }))
    .sort((a, b) => b.utcMillis - a.utcMillis);
}

interface IsoWeekBounds {
  startMs: number; // Monday 00:00 UTC
  endMs: number; // next Monday 00:00 UTC (exclusive)
}

function weekBoundsUtc(weekLabel: string): IsoWeekBounds {
  const [yearStr, weekStr] = weekLabel.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  // ISO week 1 is the week containing the year's first Thursday → the Monday
  // on/before Jan 4.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Dow = jan4.getUTCDay() || 7;
  const week1MondayMs = Date.UTC(year, 0, 4 - (jan4Dow - 1));
  const startMs = week1MondayMs + (week - 1) * 7 * 86_400_000;
  return { startMs, endMs: startMs + 7 * 86_400_000 };
}

function inferTzAt(
  entries: Entry[],
  person: Person,
  asOfMs: number,
): string {
  // Latest entry from this person at or before asOfMs wins.
  let best: Entry | null = null;
  for (const e of entries) {
    if (e.person !== person) continue;
    if (e.utcMillis > asOfMs) continue;
    if (!best || e.utcMillis > best.utcMillis) best = e;
  }
  return best?.tz ?? HOME_TZ[person];
}

function clusterIntoMoments(weekEntries: Entry[]): Moment[] {
  // Cluster oldest→newest so the 90-minute window walks forward in time,
  // then reverse so the page reads newest-first (same direction as weeks).
  const sorted = [...weekEntries].sort((a, b) => a.utcMillis - b.utcMillis);
  const moments: Moment[] = [];
  let lastMs = -Infinity;
  let current: Moment | null = null;
  for (const e of sorted) {
    if (current && e.utcMillis - lastMs < MOMENT_TOLERANCE_MS) {
      current[e.person].push(e);
    } else {
      current = { id: `${e.slug}-anchor`, hunjun: [], hyoungseo: [] };
      current[e.person].push(e);
      moments.push(current);
    }
    lastMs = e.utcMillis;
  }
  return moments.reverse();
}

export function groupByWeek(entries: Entry[]): WeekGroup[] {
  const byWeek = new Map<string, Entry[]>();
  for (const e of entries) {
    let bucket = byWeek.get(e.week);
    if (!bucket) {
      bucket = [];
      byWeek.set(e.week, bucket);
    }
    bucket.push(e);
  }

  const groups: WeekGroup[] = [];
  for (const [week, weekEntries] of byWeek) {
    const { startMs, endMs } = weekBoundsUtc(week);
    // Use end-of-week to decide "where are they now" for this week.
    const hunjunTz = inferTzAt(entries, "hunjun", endMs - 1);
    const hyoungseoTz = inferTzAt(entries, "hyoungseo", endMs - 1);
    groups.push({
      week,
      together: hunjunTz === hyoungseoTz,
      start: new Date(startMs).toISOString().slice(0, 10),
      end: new Date(endMs - 86_400_000).toISOString().slice(0, 10),
      moments: clusterIntoMoments(weekEntries),
    });
  }
  return groups.sort((a, b) => b.week.localeCompare(a.week));
}
