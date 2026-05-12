import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENTRIES_DIR = path.resolve(__dirname, "data/entries");
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
}

interface Entry {
  person: "hunjun" | "hyoungseo";
  week: string;
  date: string;
  tz: string;
  /** Hour 0-23 in `tz` at this entry's moment. */
  hourInTz: number;
  /** Absolute UTC milliseconds for sorting and moment clustering. */
  utcMillis: number;
  location?: string;
  title?: string;
  bodyHtml: string;
  slug: string;
  dummy: boolean;
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

function loadEntries(): Entry[] {
  marked.setOptions({ gfm: true, breaks: true });
  const files = fs
    .readdirSync(ENTRIES_DIR)
    .filter((f) => ENTRY_FILE_RE.test(f));
  return files.map((file) => {
    const slug = file.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(ENTRIES_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const fm = data as FrontMatter;

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

    const tz = fm.tz ?? HOME_TZ[fm.person];
    if (!isValidTz(tz)) {
      throw new Error(`[entries] ${slug}: invalid IANA timezone '${tz}'`);
    }

    const dt = new Date(dateIso);
    return {
      person: fm.person,
      week: fm.week,
      date: dateIso,
      tz,
      hourInTz: hourInTz(dt, tz),
      utcMillis: dt.getTime(),
      location: fm.location,
      title: fm.title,
      bodyHtml: marked.parse(content.trim()) as string,
      slug,
      dummy: fm.dummy === true,
    };
  });
}

function entriesPlugin(): Plugin {
  return {
    name: "we-work-24h:entries",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const entries = loadEntries();
      return `export default ${JSON.stringify(entries)};`;
    },
    configureServer(server) {
      const invalidate = (file: string) => {
        if (!file.startsWith(ENTRIES_DIR) || !file.endsWith(".md")) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.add(ENTRIES_DIR);
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
