import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRIES_DIR = path.resolve(__dirname, "data/entries");
const IMAGES_DIR = path.resolve(__dirname, "public/images");
const VIRTUAL_ID = "virtual:entries";
const RESOLVED_ID = "\0" + VIRTUAL_ID;
const ENTRY_FILE_RE = /^\d{4}-W\d{1,2}-.*\.md$/;
const WEEK_RE = /^\d{4}-W\d{1,2}$/;

interface FrontMatter {
  person?: "hunjun" | "hyoungseo";
  week?: string;
  date?: string | Date;
  tz?: string;
  location?: string;
  title?: string;
  dummy?: boolean;
  allDay?: boolean;
  overlay?: string;
}

interface Entry {
  person: "hunjun" | "hyoungseo";
  week: string;
  date: string;
  tz: string;
  /** Hour 0-23 in `tz` at this entry's moment. Meaningless when allDay. */
  hourInTz: number;
  /** Absolute UTC milliseconds for sorting and moment clustering.
   *  All-day entries anchor at noon UTC of the date. */
  utcMillis: number;
  /** "YYYY-MM-DD" extracted from the frontmatter date, used to render
   *  all-day entries without timezone conversion. */
  ymd: string;
  allDay: boolean;
  location?: string;
  title?: string;
  bodyHtml: string;
  slug: string;
  dummy: boolean;
  overlay?: string;
}

const HOME_TZ = {
  hunjun: "Asia/Seoul",
  hyoungseo: "America/New_York",
} as const;

function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function hourInTz(date: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    hour12: false,
  });
  return parseInt(fmt.format(date), 10);
}

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function resolveImageHref(
  href: string,
  slug: string,
  baseUrl: string,
): string {
  // External URLs pass through untouched.
  if (/^(https?:)?\/\//.test(href) || href.startsWith("data:")) return href;
  // Site-absolute paths get the base prefix.
  if (href.startsWith("/")) {
    return baseUrl.replace(/\/$/, "") + href;
  }
  // Otherwise it's a local image — must live under public/images/.
  const filename = href.replace(/^\.?\//, "");
  if (filename.includes("..")) {
    throw new Error(
      `[entries] ${slug}: image '${href}' must not contain '..'`,
    );
  }
  const filepath = path.join(IMAGES_DIR, filename);
  if (!fs.existsSync(filepath)) {
    throw new Error(
      `[entries] ${slug}: referenced image not found: public/images/${filename}`,
    );
  }
  return baseUrl.replace(/\/$/, "") + "/images/" + filename;
}

const YT_PATTERNS = [
  /^https?:\/\/youtu\.be\/([\w-]{11})/,
  /^https?:\/\/(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
  /^https?:\/\/(?:www\.)?youtube\.com\/embed\/([\w-]{11})/,
];

function extractYouTubeId(href: string): string | null {
  for (const re of YT_PATTERNS) {
    const m = href.match(re);
    if (m) return m[1];
  }
  return null;
}

function configureMarked(slug: string, baseUrl: string) {
  marked.setOptions({ gfm: true, breaks: true });
  marked.use({
    renderer: {
      image(token) {
        const { href, title, text } = token;
        const resolved = resolveImageHref(href, slug, baseUrl);
        const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
        return `<img src="${escapeAttr(resolved)}" alt="${escapeAttr(text)}"${titleAttr} loading="lazy">`;
      },
      link(token) {
        const ytId = extractYouTubeId(token.href);
        if (ytId) {
          const titleAttr = token.title
            ? ` title="${escapeAttr(token.title)}"`
            : token.text
            ? ` title="${escapeAttr(token.text)}"`
            : "";
          return `<iframe class="video-embed" src="https://www.youtube.com/embed/${ytId}"${titleAttr} loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
        }
        return false;
      },
    },
  });
}

function loadEntries(baseUrl: string): Entry[] {
  const files = fs
    .readdirSync(ENTRIES_DIR)
    .filter((f) => ENTRY_FILE_RE.test(f));
  return files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(ENTRIES_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const fm = data as FrontMatter;
    // Reconfigure marked per entry so image href errors blame the right slug.
    configureMarked(slug, baseUrl);

    // Fail-fast validation — any of these throws halts the build.
    if (!fm.person) throw new Error(`[entries] ${slug}: missing 'person'`);
    if (fm.person !== "hunjun" && fm.person !== "hyoungseo") {
      throw new Error(
        `[entries] ${slug}: invalid person '${fm.person}' (expected hunjun|hyoungseo)`,
      );
    }
    if (!fm.week) throw new Error(`[entries] ${slug}: missing 'week'`);
    if (!WEEK_RE.test(fm.week)) {
      throw new Error(
        `[entries] ${slug}: invalid week '${fm.week}' (expected YYYY-Wnn)`,
      );
    }
    if (!fm.date) throw new Error(`[entries] ${slug}: missing 'date'`);
    const dateIso =
      fm.date instanceof Date ? fm.date.toISOString() : String(fm.date);
    if (Number.isNaN(Date.parse(dateIso))) {
      throw new Error(`[entries] ${slug}: unparseable date '${dateIso}'`);
    }
    if (fm.dummy !== undefined && typeof fm.dummy !== "boolean") {
      throw new Error(`[entries] ${slug}: 'dummy' must be boolean if present`);
    }
    if (fm.allDay !== undefined && typeof fm.allDay !== "boolean") {
      throw new Error(`[entries] ${slug}: 'allDay' must be boolean if present`);
    }

    const tz = fm.tz ?? HOME_TZ[fm.person];
    if (!isValidTz(tz)) {
      throw new Error(`[entries] ${slug}: invalid IANA timezone '${tz}'`);
    }

    const allDay = fm.allDay === true;
    const dt = new Date(dateIso);
    const ymd = dateIso.slice(0, 10);
    // All-day entries anchor at noon UTC so two same-date entries (potentially
    // in different tzs) cluster into the same "moment" cleanly.
    const utcMillis = allDay
      ? Date.parse(ymd + "T12:00:00Z")
      : dt.getTime();

    let overlay: string | undefined;
    if (fm.overlay !== undefined) {
      if (typeof fm.overlay !== "string") {
        throw new Error(`[entries] ${slug}: 'overlay' must be a string if present`);
      }
      overlay = resolveImageHref(fm.overlay, slug, baseUrl);
    }

    return {
      person: fm.person,
      week: fm.week,
      date: dateIso,
      tz,
      hourInTz: hourInTz(dt, tz),
      utcMillis,
      ymd,
      allDay,
      location: fm.location,
      title: fm.title,
      bodyHtml: marked.parse(content.trim()) as string,
      slug,
      dummy: fm.dummy === true,
      overlay,
    };
  });
}

function entriesPlugin(): Plugin {
  let baseUrl = "/";
  return {
    name: "we-work-24h:entries",
    configResolved(config) {
      baseUrl = config.base;
    },
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const entries = loadEntries(baseUrl);
      return `export default ${JSON.stringify(entries)};`;
    },
    configureServer(server) {
      const invalidate = (file: string) => {
        const isEntry =
          file.startsWith(ENTRIES_DIR) && file.endsWith(".md");
        const isImage = file.startsWith(IMAGES_DIR);
        if (!isEntry && !isImage) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.add(ENTRIES_DIR);
      server.watcher.add(IMAGES_DIR);
      server.watcher.on("change", invalidate);
      server.watcher.on("add", invalidate);
      server.watcher.on("unlink", invalidate);
    },
  };
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/we-work-24h/" : "/",
  plugins: [react(), entriesPlugin()],
});
