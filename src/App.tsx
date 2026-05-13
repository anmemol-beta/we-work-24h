import { useMemo } from "react";
import { groupByWeek, groupByYear, loadAllEntries } from "./lib/entries";
import { Timeline } from "./components/Timeline";

export default function App() {
  const entries = useMemo(() => loadAllEntries(), []);
  const weeks = useMemo(() => groupByWeek(entries), [entries]);
  const years = useMemo(() => groupByYear(weeks), [weeks]);
  const allDummy = entries.length > 0 && entries.every((e) => e.dummy);
  const someDummy = entries.some((e) => e.dummy);

  return (
    <div className="app">
      <header className="app__header">
        <h1>we work 24h</h1>
        <p className="app__subtitle">
          <span className="tag tag--hunjun">Hunjun · Korea</span>
          <span className="tag tag--hyoungseo">Hyoungseo · Boston</span>
        </p>
      </header>
      {someDummy && (
        <div
          className="dummy-banner"
          role="status"
          aria-label="placeholder content notice"
        >
          <strong>
            {allDummy ? "Placeholder content." : "Some entries are placeholders."}
          </strong>
          <span>
            Real entries will be written by Hunjun and Hyoungseo. None of the
            text below is real yet.
          </span>
        </div>
      )}
      <Timeline years={years} />
      <footer className="app__footer">
        UTC+9 ⇄ UTC−4 · 13h apart
      </footer>
    </div>
  );
}
