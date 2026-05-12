import type { Entry } from "../lib/entries";
import { formatLocal } from "../lib/time";

interface Props {
  entry: Entry;
}

export function EntryCard({ entry }: Props) {
  const localTime = formatLocal(entry.date, entry.tz);
  const classes = [
    "card",
    `card--${entry.person}`,
    `card--time-${entry.timeBucket}`,
  ];
  if (entry.dummy) classes.push("card--dummy");

  return (
    <article className={classes.join(" ")}>
      <header className="card__head">
        <time dateTime={entry.date} className="card__time">
          {localTime}
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
