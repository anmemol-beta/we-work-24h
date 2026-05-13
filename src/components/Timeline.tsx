import type { Moment, WeekGroup, YearGroup } from "../lib/entries";
import { prettyWeek } from "../lib/time";
import { EntryCard } from "./EntryCard";

interface Props {
  years: YearGroup[];
}

export function Timeline({ years }: Props) {
  if (years.length === 0) {
    return <p className="empty">No entries yet.</p>;
  }
  return (
    <div className="timeline">
      {years.map((y) => (
        <section key={y.year} className="year">
          <h2 className="year__head">
            <span className="year__head-num">{y.year}</span>
          </h2>
          <ol className="year__weeks">
            {y.weeks.map((w) => (
              <WeekBlock key={w.week} week={w} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function WeekBlock({ week }: { week: WeekGroup }) {
  const cls = ["week", week.together ? "week--together" : "week--apart"];
  return (
    <li className={cls.join(" ")}>
      <div className="week__label">
        <span className="week__label-text">{prettyWeek(week.week)}</span>
        <span className="week__range">
          {week.start} → {week.end}
        </span>
      </div>
      <div className="week__grid">
        <span className="week__spine week__spine--left" aria-hidden />
        <span className="week__spine week__spine--right" aria-hidden />
        {week.moments.map((m) => (
          <MomentRow key={m.id} moment={m} />
        ))}
      </div>
    </li>
  );
}

function MomentRow({ moment }: { moment: Moment }) {
  return (
    <div className="moment">
      <div className="moment__col moment__col--hunjun">
        {moment.hunjun.map((e) => (
          <EntryCard key={e.slug} entry={e} />
        ))}
      </div>
      <span className="moment__node" aria-hidden />
      <div className="moment__col moment__col--hyoungseo">
        {moment.hyoungseo.map((e) => (
          <EntryCard key={e.slug} entry={e} />
        ))}
      </div>
    </div>
  );
}
