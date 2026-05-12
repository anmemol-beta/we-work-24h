import type { Moment, WeekGroup } from "../lib/entries";
import { prettyWeek } from "../lib/time";
import { EntryCard } from "./EntryCard";

interface Props {
  weeks: WeekGroup[];
}

export function Timeline({ weeks }: Props) {
  if (weeks.length === 0) {
    return <p className="empty">No entries yet.</p>;
  }
  return (
    <ol className="timeline">
      {weeks.map((w) => (
        <WeekBlock key={w.week} week={w} />
      ))}
    </ol>
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
        <span className={`week__status week__status--${week.together ? "together" : "apart"}`}>
          {week.together ? "together" : "apart"}
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
      <div className="moment__col moment__col--hyoungseo">
        {moment.hyoungseo.map((e) => (
          <EntryCard key={e.slug} entry={e} />
        ))}
      </div>
    </div>
  );
}
