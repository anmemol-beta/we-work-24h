/// <reference types="vite/client" />

declare module "virtual:entries" {
  export interface BuildTimeEntry {
    person: "hunjun" | "hyoungseo";
    week: string;
    date: string;
    tz: string;
    hourInTz: number;
    utcMillis: number;
    location?: string;
    title?: string;
    bodyHtml: string;
    slug: string;
    dummy: boolean;
  }
  const entries: BuildTimeEntry[];
  export default entries;
}
