import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AssetCard } from "../components/AssetCard";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Input, Select } from "../components/ui/Field";
import { Panel } from "../components/ui/Panel";
import { Spinner } from "../components/ui/Spinner";
import { cn } from "../lib/cn";
import { pluralise } from "../lib/format";
import { useProject } from "../lib/queries";
import { ASSET_CLASSES, ASSET_CLASS_LABELS, TIERS } from "../lib/types";
import { useRunCenter } from "../state/RunCenter";

export function AssetsView() {
  const { projectId = "" } = useParams();
  const navigate = useNavigate();
  const project = useProject(projectId);
  const { imageVersion } = useRunCenter();

  const [search, setSearch] = useState("");
  const [assetClass, setAssetClass] = useState("all");
  const [tier, setTier] = useState("all");
  const [only, setOnly] = useState<"all" | "slice" | "stale" | "no-brief" | "no-images">("all");

  const assets = project.data?.assets ?? [];
  const accepted = project.data?.manifest?.accepted ?? false;

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return assets.filter((entry) => {
      if (needle && !`${entry.name} ${entry.id}`.toLowerCase().includes(needle)) return false;
      if (assetClass !== "all" && entry.asset_class !== assetClass) return false;
      if (tier !== "all" && entry.tier !== tier) return false;
      if (only === "slice" && !entry.in_slice) return false;
      if (only === "stale" && !entry.stale) return false;
      if (only === "no-brief" && entry.has_brief) return false;
      if (only === "no-images" && entry.has_images) return false;
      return true;
    });
  }, [assets, search, assetClass, tier, only]);

  if (project.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-paper-faint">
        <Spinner size={14} />
        <span className="font-mono text-[12px]">loading assets</span>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="p-6">
        <Panel className="min-h-[420px] justify-center">
          <EmptyState
            icon="assets"
            title={accepted ? "No assets on this project" : "Accept the asset list first"}
            body={
              accepted
                ? "The manifest is accepted but holds no entries. Add rows in the Manifest view, or derive the list again from the design docs."
                : "Assets appear here once the derived list has been reviewed and accepted. Nothing is generated before that — it is the one gate in the pipeline."
            }
            action={
              <Button variant="primary" icon="manifest" onClick={() => void navigate(`/p/${projectId}/manifest`)}>
                Open the manifest
              </Button>
            }
          />
        </Panel>
      </div>
    );
  }

  const staleCount = assets.filter((entry) => entry.stale).length;

  return (
    <div className="flex min-h-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Filter by name…"
          className="h-8 w-[210px] text-[12px]"
        />
        <Select value={assetClass} onChange={(event) => setAssetClass(event.target.value)} className="w-[140px]">
          <option value="all">every class</option>
          {ASSET_CLASSES.map((value) => (
            <option key={value} value={value}>
              {ASSET_CLASS_LABELS[value]}
            </option>
          ))}
        </Select>
        <Select value={tier} onChange={(event) => setTier(event.target.value)} className="w-[124px]">
          <option value="all">every tier</option>
          {TIERS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-px overflow-hidden rounded border border-line-strong">
          {(
            [
              ["all", "all"],
              ["slice", "in slice"],
              ["no-brief", "no brief"],
              ["no-images", "no images"],
              ["stale", `stale${staleCount ? ` ${staleCount}` : ""}`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setOnly(value)}
              className={cn(
                "px-2.5 py-[6px] text-[11.5px] transition-colors",
                only === value ? "bg-ink-700 text-paper" : "bg-ink-850 text-paper-mute hover:bg-ink-800",
                value === "stale" && staleCount > 0 && only !== value && "text-warn",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="ml-auto font-mono text-[11px] text-paper-faint">
          {filtered.length === assets.length
            ? pluralise(assets.length, "asset")
            : `${filtered.length} / ${assets.length}`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <Panel className="flex-1 justify-center">
          <EmptyState
            compact
            icon="filter"
            title="Nothing matches"
            body="No asset on this project fits those filters. Widen them to see the rest of the list."
            action={
              <Button
                onClick={() => {
                  setSearch("");
                  setAssetClass("all");
                  setTier("all");
                  setOnly("all");
                }}
              >
                Clear filters
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(228px,1fr))]">
          {filtered.map((entry, index) => (
            <div key={entry.id} className="rise" style={{ animationDelay: `${Math.min(index, 12) * 28}ms` }}>
              <AssetCard projectId={projectId} entry={entry} imageVersion={imageVersion} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
