# Data

Weekly entries live in `entries/`. One markdown file per entry. Filename
convention:

```
{ISO-week}-{person}-{NN}-{short-slug}.md
```

e.g. `2026-W19-hunjun-01-flight.md`. The `NN` keeps weekly entries in order
when sorted by filename; it's not parsed.

Frontmatter:

```yaml
---
person: hunjun | hyoungseo   # required
week: 2026-W19               # required, ISO week
date: 2026-05-11T23:10:00-04:00   # required, ISO 8601 with offset
tz: America/New_York         # optional; defaults per person
                             #   hunjun → Asia/Seoul
                             #   hyoungseo → America/New_York
location: optional short location
title: optional short title
dummy: true                  # optional; marks the entry as a placeholder
---
```

The `tz` field is what determines two things:

1. **Time-of-day tint on the card** — the hour-in-`tz` picks one of eight
   "sky" colors (deepnight, dawn, sunrise, morning, midday, afternoon, sunset,
   night).
2. **Together vs apart layout** — a week is rendered with a single shared
   spine if both people's most recent `tz` (as of the week's end) is the
   same; otherwise the spine splits into two and the columns spread apart.

Entries within ±90 minutes of each other (regardless of side) are clustered
into a single "moment" and rendered on the same horizontal row, so
contemporaneous events line up across the two columns.

Entries with `dummy: true` are rendered with a dashed border, a small
"placeholder" badge, and trigger a banner at the top of the page. Drop the
field (or set it to `false`) once you write real content.

The body is plain markdown. Times are rendered in each side's local timezone
(Korea / Boston) regardless of the offset written in `date`.
