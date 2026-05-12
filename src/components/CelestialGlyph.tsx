import type { TimeBucket } from "../lib/entries";

const DAY_BUCKETS = new Set<TimeBucket>([
  "sunrise",
  "morning",
  "midday",
  "afternoon",
  "sunset",
]);

interface Props {
  bucket: TimeBucket;
}

export function CelestialGlyph({ bucket }: Props) {
  return DAY_BUCKETS.has(bucket) ? <SunGlyph /> : <MoonGlyph />;
}

function SunGlyph() {
  return (
    <svg
      className="glyph glyph--sun"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <circle className="glyph__body" cx="12" cy="12" r="3.6" />
      <g
        className="glyph__rays"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      >
        <line x1="12" y1="2.4" x2="12" y2="5.2" />
        <line x1="12" y1="18.8" x2="12" y2="21.6" />
        <line x1="2.4" y1="12" x2="5.2" y2="12" />
        <line x1="18.8" y1="12" x2="21.6" y2="12" />
        <line x1="5.2" y1="5.2" x2="7.2" y2="7.2" />
        <line x1="16.8" y1="16.8" x2="18.8" y2="18.8" />
        <line x1="18.8" y1="5.2" x2="16.8" y2="7.2" />
        <line x1="5.2" y1="18.8" x2="7.2" y2="16.8" />
      </g>
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg
      className="glyph glyph--moon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="glyph__body"
        d="M 16 4 a 8 8 0 1 0 0 16 a 6 6 0 0 1 0 -16 Z"
      />
      <g className="glyph__stars" fill="currentColor">
        <circle cx="3.5" cy="6" r="0.7" />
        <circle cx="6.5" cy="20.5" r="0.55" />
        <circle cx="21" cy="9.5" r="0.65" />
      </g>
    </svg>
  );
}
