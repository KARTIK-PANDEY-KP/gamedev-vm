import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useParams } from "react-router";
import { ProvenanceChips, StateDots } from "../components/badges";
import { Button, IconButton } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Select, Toggle } from "../components/ui/Field";
import { Icon } from "../components/ui/Icon";
import { Panel } from "../components/ui/Panel";
import { Spinner } from "../components/ui/Spinner";
import { api, errorMessage } from "../lib/api";
import { cn } from "../lib/cn";
import { pluralise, slugify } from "../lib/format";
import { useAcceptManifest, useProject } from "../lib/queries";
import { ASSET_CLASSES, ASSET_CLASS_LABELS, TIERS, type AssetEntry } from "../lib/types";
import { useRunCenter } from "../state/RunCenter";

export function ManifestView() {
  const { projectId = "" } = useParams();
  const project = useProject(projectId);
  const accept = useAcceptManifest(projectId);
  const { start, starting } = useRunCenter();

  const server = useMemo<AssetEntry[]>(() => project.data?.manifest?.entries ?? [], [project.data]);
  const accepted = project.data?.manifest?.accepted ?? false;

  const [draft, setDraft] = useState<AssetEntry[]>(server);
  const added = useRef<Set<string>>(new Set());
  const serverKey = JSON.stringify(server);

  // Server wins whenever the manifest changes underneath us.
  useEffect(() => {
    setDraft(server);
    added.current = new Set();
  }, [serverKey, server]);

  const dirty = JSON.stringify(draft) !== serverKey;
  const counts = useMemo(() => diffCounts(server, draft), [server, draft]);

  const patch = (id: string, changes: Partial<AssetEntry>) =>
    setDraft((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)));

  const rename = (entry: AssetEntry, name: string) => {
    if (!added.current.has(entry.id)) {
      patch(entry.id, { name });
      return;
    }
    // Rows added by hand keep an id that tracks the name until first accept.
    const nextId = slugify(name) || entry.id;
    const taken = draft.some((other) => other.id === nextId && other.id !== entry.id);
    const id = taken ? entry.id : nextId;
    if (id !== entry.id) {
      added.current.delete(entry.id);
      added.current.add(id);
    }
    setDraft((prev) => prev.map((row) => (row.id === entry.id ? { ...row, name, id } : row)));
  };

  const addRow = () => {
    const id = `new-asset-${draft.length + 1}-${Math.random().toString(36).slice(2, 6)}`;
    added.current.add(id);
    setDraft((prev) => [
      ...prev,
      {
        id,
        name: "",
        asset_class: "prop",
        tier: "mid",
        in_slice: true,
        derived_from: [],
        has_brief: false,
        has_images: false,
        has_build: false,
        stale: false,
      },
    ]);
  };

  if (project.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-paper-faint">
        <Spinner size={14} />
        <span className="font-mono text-[12px]">loading manifest</span>
      </div>
    );
  }

  if (server.length === 0 && draft.length === 0) {
    const noDocs = (project.data?.docs ?? []).length === 0;
    return (
      <div className="p-6">
        <Panel className="min-h-[420px] justify-center">
          <EmptyState
            icon="manifest"
            title={noDocs ? "Write the design docs first" : "No asset list yet"}
            body={
              noDocs
                ? "The asset list is read out of the art bible and level design docs. Generate the design set, then come back and derive it."
                : "The harness reads the design docs and proposes every asset the slice needs — name, class, tier, and where in the docs it came from. You edit the list and accept it. Nothing is generated before that."
            }
            action={
              <Button
                variant="primary"
                size="lg"
                icon="spark"
                disabled={noDocs}
                loading={starting !== null}
                onClick={() =>
                  void start({ label: "Derive asset list", request: (extra) => api.runManifest(projectId, extra) })
                }
              >
                Derive asset list
              </Button>
            }
            secondary={noDocs ? undefined : "Writes projects/{id}/assets/manifest.json"}
          />
        </Panel>
      </div>
    );
  }

  const inSlice = draft.filter((entry) => entry.in_slice).length;

  return (
    <div className="flex min-h-full flex-col gap-4 p-6">
      {!accepted ? (
        <div className="rise flex items-start gap-3 rounded-[var(--radius-panel)] border border-ember/30 bg-ember/[0.07] px-4 py-3">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-ember" />
          <div>
            <p className="text-[13px] font-semibold text-ember">This list has not been accepted</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-paper-dim">
              No brief is written and no image is generated until you accept it. Rename, reclassify, drop what the
              slice does not need, then press Accept list.
            </p>
          </div>
        </div>
      ) : null}

      <Panel
        flush
        className="flex-1"
        title={
          <span className="flex items-center gap-2.5">
            Asset list
            <span className="font-mono text-[10.5px] normal-case tracking-normal text-paper-faint">
              {pluralise(draft.length, "asset")} · {inSlice} in slice
            </span>
          </span>
        }
        actions={
          <>
            {dirty ? (
              <span className="mr-1 font-mono text-[11px] text-warn">
                {[
                  counts.added ? `+${counts.added}` : null,
                  counts.removed ? `-${counts.removed}` : null,
                  counts.changed ? `~${counts.changed}` : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </span>
            ) : null}
            <Button size="sm" variant="ghost" icon="plus" onClick={addRow}>
              Add row
            </Button>
            <Button size="sm" variant="ghost" disabled={!dirty} onClick={() => setDraft(server)}>
              Revert
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon="check"
              loading={accept.isPending}
              disabled={draft.length === 0 || draft.some((entry) => !entry.name.trim())}
              onClick={() => accept.mutate(draft)}
            >
              {accepted ? "Re-accept list" : "Accept list"}
            </Button>
          </>
        }
        footer={
          accept.error ? (
            <p className="text-[12px] text-bad">{errorMessage(accept.error)}</p>
          ) : (
            <p className="text-[11.5px] text-paper-faint">
              Accepting writes the list back to manifest.json and marks it approved. Existing briefs and images are
              kept; assets you drop stop being listed.
            </p>
          )
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-[13px]">
            <thead>
              <tr className="sticky top-0 z-10 bg-ink-850/95 backdrop-blur">
                <Th className="w-9 text-right">#</Th>
                <Th>Name</Th>
                <Th className="w-[136px]">Class</Th>
                <Th className="w-[118px]">Tier</Th>
                <Th className="w-[72px] text-center">Slice</Th>
                <Th className="w-[240px]">From</Th>
                <Th className="w-[78px] text-center">State</Th>
                <Th className="w-9" />
              </tr>
            </thead>
            <tbody>
              {draft.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={cn(
                    "border-t border-line transition-colors hover:bg-ink-800/60",
                    !entry.in_slice && "opacity-55",
                  )}
                >
                  <td className="px-2 py-1.5 text-right font-mono text-[11px] text-paper-faint">{index + 1}</td>
                  <td className="py-1.5 pr-3">
                    <input
                      value={entry.name}
                      placeholder="name this asset"
                      onChange={(event) => rename(entry, event.target.value)}
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-[13px] text-paper transition-colors placeholder:text-bad/70 hover:border-line-strong focus:border-ember/60 focus:bg-ink-900 focus:outline-none"
                    />
                    {added.current.has(entry.id) ? (
                      <span className="ml-2 font-mono text-[10px] text-ember/70">new</span>
                    ) : (
                      <span className="ml-2 font-mono text-[10px] text-paper-faint/70">{entry.id}</span>
                    )}
                  </td>
                  <td className="py-1.5 pr-3">
                    <Select
                      value={entry.asset_class}
                      onChange={(event) => patch(entry.id, { asset_class: event.target.value as AssetEntry["asset_class"] })}
                    >
                      {ASSET_CLASSES.map((value) => (
                        <option key={value} value={value}>
                          {ASSET_CLASS_LABELS[value]}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-1.5 pr-3">
                    <Select
                      value={entry.tier}
                      onChange={(event) => patch(entry.id, { tier: event.target.value as AssetEntry["tier"] })}
                    >
                      {TIERS.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-1.5 text-center">
                    <div className="flex justify-center">
                      <Toggle
                        checked={entry.in_slice}
                        onChange={(next) => patch(entry.id, { in_slice: next })}
                        label={`${entry.name || entry.id} in vertical slice`}
                      />
                    </div>
                  </td>
                  <td className="py-1.5 pr-3">
                    <ProvenanceChips refs={entry.derived_from ?? []} max={2} />
                  </td>
                  <td className="py-1.5 text-center">
                    <StateDots entry={entry} />
                  </td>
                  <td className="py-1.5 pr-1">
                    <IconButton
                      icon="trash"
                      label={`Remove ${entry.name || entry.id}`}
                      className="hover:text-bad"
                      onClick={() => setDraft((prev) => prev.filter((row) => row.id !== entry.id))}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <th className={cn("micro border-b border-line-strong px-2 py-2 text-left text-paper-faint", className)}>
      {children}
    </th>
  );
}

function diffCounts(server: AssetEntry[], draft: AssetEntry[]) {
  const before = new Map(server.map((entry) => [entry.id, entry]));
  const after = new Map(draft.map((entry) => [entry.id, entry]));
  let added = 0;
  let changed = 0;
  for (const [id, entry] of after) {
    const previous = before.get(id);
    if (!previous) added += 1;
    else if (JSON.stringify(previous) !== JSON.stringify(entry)) changed += 1;
  }
  let removed = 0;
  for (const id of before.keys()) if (!after.has(id)) removed += 1;
  return { added, changed, removed };
}
