import { useParams } from "react-router";
import { RunStatusBadge } from "../components/badges";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Panel } from "../components/ui/Panel";
import { Spinner } from "../components/ui/Spinner";
import { errorMessage } from "../lib/api";
import { cn } from "../lib/cn";
import { clockTime, duration, relativeTime } from "../lib/format";
import { useRuns } from "../lib/queries";
import { useRunCenter } from "../state/RunCenter";
import type { Run } from "../lib/types";

export function RunsView() {
  const { projectId = "" } = useParams();
  const runs = useRuns(projectId);
  const { activeRunId, watch, setDrawerOpen } = useRunCenter();

  const list = runs.data ?? [];
  const running = list.filter((run) => run.status === "running");

  if (runs.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-paper-faint">
        <Spinner size={14} />
        <span className="font-mono text-[12px]">loading runs</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col gap-4 p-6">
      <Panel
        flush
        className="flex-1"
        title={
          <span className="flex items-center gap-2.5">
            Runs
            <span className="font-mono text-[10.5px] normal-case tracking-normal text-paper-faint">
              {list.length} recent{running.length > 0 ? ` · ${running.length} running` : ""}
            </span>
          </span>
        }
        actions={
          <Button size="sm" variant="ghost" icon="refresh" loading={runs.isFetching} onClick={() => void runs.refetch()}>
            Refresh
          </Button>
        }
        footer={
          <p className="text-[11.5px] text-paper-faint">
            Pick a run to replay its events in the log below. The harness keeps the most recent fifty.
          </p>
        }
      >
        {runs.error ? (
          <EmptyState
            compact
            icon="alert"
            title="Cannot list runs"
            body={errorMessage(runs.error)}
            action={
              <Button icon="refresh" onClick={() => void runs.refetch()}>
                Try again
              </Button>
            }
          />
        ) : list.length === 0 ? (
          <EmptyState
            compact
            icon="runs"
            title="No runs yet"
            body="Every step the harness takes — writing the design set, deriving the asset list, a brief, a batch of images, a Blender build — is recorded here with its full log. Start one from the Design or Manifest view."
          />
        ) : (
          <ul>
            {list.map((run) => (
              <RunRow
                key={run.id}
                run={run}
                active={run.id === activeRunId}
                onSelect={() => {
                  watch(run.id);
                  setDrawerOpen(true);
                }}
              />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function RunRow({ run, active, onSelect }: { run: Run; active: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-3 border-b border-line px-3.5 py-2.5 text-left transition-colors",
          active ? "bg-ink-800" : "hover:bg-ink-800/60",
        )}
      >
        <span
          className={cn("h-4 w-0.5 shrink-0 rounded-full", active ? "bg-ember" : "bg-transparent")}
          aria-hidden="true"
        />
        <RunStatusBadge status={run.status} />
        <span className="w-[76px] shrink-0 text-[13px] capitalize text-paper">{run.kind}</span>
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-paper-mute">{run.scope ?? "—"}</span>
        <span className="hidden shrink-0 font-mono text-[11px] text-paper-faint sm:inline">{run.id}</span>
        <span
          className="w-[86px] shrink-0 text-right font-mono text-[11px] text-paper-faint"
          title={clockTime(run.started_at)}
        >
          {relativeTime(run.started_at)}
        </span>
        <span className="w-[62px] shrink-0 text-right font-mono text-[11px] text-paper-dim">
          {duration(run.started_at, run.ended_at)}
        </span>
      </button>
    </li>
  );
}
