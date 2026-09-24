import { DOC_TITLES, type DocName } from "./types";

const UNITS: Array<[number, string]> = [
  [60, "s"],
  [60, "m"],
  [24, "h"],
  [7, "d"],
];

export function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function relativeTime(iso: string | null | undefined, now = Date.now()): string {
  const date = parseDate(iso);
  if (!date) return "—";
  let delta = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (delta < 5) return "just now";
  let unit = "s";
  for (const [size, next] of UNITS) {
    if (delta < size) break;
    delta = Math.floor(delta / size);
    unit = next;
  }
  if (unit === "d" && delta > 4) return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${delta}${unit} ago`;
}

export function clockTime(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (!date) return "--:--:--";
  return date.toLocaleTimeString(undefined, { hour12: false });
}

export function dateLabel(iso: string | null | undefined): string {
  const date = parseDate(iso);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function duration(from: string | null | undefined, to: string | null | undefined): string {
  const start = parseDate(from);
  if (!start) return "—";
  const end = parseDate(to) ?? new Date();
  const seconds = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export function money(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${value.toFixed(2)}`;
}

export function docTitle(name: string): string {
  const known = DOC_TITLES[name as DocName];
  if (known) return known;
  const base = name.replace(/\.md$/, "").replace(/[-_]/g, " ");
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/** "art-bible.md#asset-table" -> { doc: "art-bible", anchor: "asset table" } */
export function parseProvenance(ref: string): { doc: string; anchor: string | null } {
  const [file, anchor] = ref.split("#");
  return {
    doc: (file ?? ref).replace(/\.md$/, ""),
    anchor: anchor ? anchor.replace(/[-_]/g, " ") : null,
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
