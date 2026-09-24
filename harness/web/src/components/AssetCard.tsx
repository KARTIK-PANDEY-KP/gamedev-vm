import { Link } from "react-router";
import { ClassBadge, StateDots, TierBadge } from "./badges";
import { RefImage } from "./RefImage";
import { Badge } from "./ui/Badge";
import { REF_VIEWS, type AssetEntry } from "../lib/types";

export function AssetCard({
  projectId,
  entry,
  imageVersion,
}: {
  projectId: string;
  entry: AssetEntry;
  imageVersion: number;
}) {
  return (
    <Link
      to={`/p/${projectId}/assets/${entry.id}`}
      className="surface group flex flex-col overflow-hidden rounded-[var(--radius-panel)] border border-line bg-ink-850 transition-all duration-200 hover:border-ember/35 hover:bg-ink-800"
    >
      <div className="grid grid-cols-4 gap-px bg-line">
        {REF_VIEWS.map((view) => (
          <RefImage
            key={view}
            projectId={projectId}
            assetId={entry.id}
            view={view}
            version={imageVersion}
            expected={entry.has_images}
            className="border-0"
          />
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 truncate text-[13.5px] font-medium leading-snug text-paper">
            {entry.name || entry.id}
          </h3>
          <StateDots entry={entry} className="shrink-0" />
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <ClassBadge value={entry.asset_class} />
          <TierBadge value={entry.tier} />
          {entry.stale ? (
            <Badge tone="warn" title="A source doc changed after this asset was written">
              stale
            </Badge>
          ) : null}
          {!entry.in_slice ? <Badge tone="muted">out of slice</Badge> : null}
        </div>
      </div>
    </Link>
  );
}
