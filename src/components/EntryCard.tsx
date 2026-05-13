import type { Entry } from "../lib/entries";
import { formatLocal, formatYmd } from "../lib/time";
import { CelestialGlyph } from "./CelestialGlyph";

interface Props {
  entry: Entry;
}

export function EntryCard({ entry }: Props) {
  const classes = ["card", `card--${entry.person}`];
  if (entry.dummy) classes.push("card--dummy");
  if (entry.allDay) classes.push("card--all-day");

  const timeLabel = entry.allDay
    ? `${formatYmd(entry.ymd)} · all day`
    : formatLocal(entry.date, entry.tz);

  if (entry.overlay) classes.push("card--with-overlay");

  return (
    <article className={classes.join(" ")}>
      {entry.overlay && (
        <img className="card__overlay" src={entry.overlay} alt="" aria-hidden="true" />
      )}
      {!entry.allDay && <CelestialGlyph bucket={entry.timeBucket} />}
      <header className="card__head">
        <time dateTime={entry.allDay ? entry.ymd : entry.date} className="card__time">
          {timeLabel}
        </time>
        {entry.location && (
          <span className="card__location">{entry.location}</span>
        )}
        {entry.dummy && <span className="card__dummy-badge">placeholder</span>}
      </header>
      {entry.title && <h3 className="card__title">{entry.title}</h3>}
      <div
        className="card__body"
        dangerouslySetInnerHTML={{ __html: entry.bodyHtml }}
      />
    </article>
  );
}
