import { cn } from "../lib/cn";
import { parseProvenance } from "../lib/format";
import { Badge } from "./ui/Badge";
import type { AssetEntry, ProjectState, RunStatus, Tier } from "../lib/types";
import { ASSET_CLASS_LABELS, PROJECT_STATE_LABELS } from "../lib/types";

export function RunStatusBadge({ status }: { status: RunStatus | null }) {
  if (status === "running") return <Badge tone="live" dot pulse>running</Badge>;
  if (status === "done") return <Badge tone="ok" dot>done</Badge>;
  if (status === "failed") return <Badge tone="bad" dot>failed</Badge>;
  return <Badge tone="muted" dot>idle</Badge>;
}

export function ProjectStateBadge({ state }: { state: ProjectState }) {
  const tone = state === "assets_ready" ? "ok" : state === "new" ? "muted" : "ember";
  return <Badge tone={tone}>{PROJECT_STATE_LABELS[state] ?? state}</Badge>;
}

export function ClassBadge({ value }: { value: AssetEntry["asset_class"] }) {
  return <Badge tone="outline">{ASSET_CLASS_LABELS[value] ?? value}</Badge>;
}

const TIER_TONE: Record<Tier, "ember" | "neutral" | "muted"> = {
  hero: "ember",
  mid: "neutral",
  background: "muted",
};

export function TierBadge({ value }: { value: Tier }) {
  return <Badge tone={TIER_TONE[value] ?? "neutral"}>{value}</Badge>;
}

/** Compact three-segment pipeline meter: brief → images → build. */
export function StateDots({ entry, className }: { entry: AssetEntry; className?: string }) {
  const steps: Array<[string, boolean, string]> = [
    ["B", entry.has_brief, entry.has_brief ? "Brief written" : "No brief yet"],
    ["I", entry.has_images, entry.has_images ? "Reference images generated" : "No reference images yet"],
    ["M", entry.has_build, entry.has_build ? "Blender build present" : "Not built in Blender"],
  ];
  return (
    <span className={cn("inline-flex items-center gap-px overflow-hidden rounded border border-line-strong", className)}>
      {steps.map(([letter, done, title]) => (
        <span
          key={letter}
          title={title}
          className={cn(
            "flex h-[17px] w-[17px] items-center justify-center font-mono text-[9.5px] font-semibold leading-none",
            done ? "bg-ok/15 text-ok" : "bg-ink-800 text-paper-faint",
          )}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}

export function StateBadges({ entry }: { entry: AssetEntry }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone={entry.has_brief ? "ok" : "muted"}>{entry.has_brief ? "brief" : "no brief"}</Badge>
      <Badge tone={entry.has_images ? "ok" : "muted"}>{entry.has_images ? "images" : "no images"}</Badge>
      <Badge tone={entry.has_build ? "ok" : "muted"}>{entry.has_build ? "build" : "no build"}</Badge>
      {entry.stale ? (
        <Badge tone="warn" title="A source document changed after this asset was written">
          stale
        </Badge>
      ) : null}
      {entry.in_slice ? <Badge tone="ember">in slice</Badge> : null}
    </div>
  );
}

export function ProvenanceChips({ refs, max = 3 }: { refs: string[]; max?: number }) {
  if (!refs || refs.length === 0) {
    return <span className="font-mono text-[11px] text-paper-faint">added by hand</span>;
  }
  const shown = refs.slice(0, max);
  const rest = refs.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((ref) => {
        const { doc, anchor } = parseProvenance(ref);
        return (
          <span
            key={ref}
            title={ref}
            className="inline-flex items-center gap-1 rounded border border-line bg-ink-800 px-1.5 py-[2px] font-mono text-[10.5px] leading-none text-paper-mute"
          >
            {doc}
            {anchor ? <span className="text-paper-faint">/ {anchor}</span> : null}
          </span>
        );
      })}
      {rest > 0 ? <span className="font-mono text-[10.5px] text-paper-faint">+{rest}</span> : null}
    </span>
  );
}
