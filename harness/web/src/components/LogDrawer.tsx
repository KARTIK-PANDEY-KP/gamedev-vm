import { Link } from "react-router";
import { cn } from "../lib/cn";
import { duration } from "../lib/format";
import { useRunCenter } from "../state/RunCenter";
import { RunStatusBadge } from "./badges";
import { RunEvents } from "./RunEvents";
import { Badge } from "./ui/Badge";
import { IconButton } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { Spinner } from "./ui/Spinner";
import type { Transport } from "../lib/runStream";

const TRANSPORT: Record<Transport, { label: string; tone: "live" | "warn" | "muted" | "bad" } | null> = {
  idle: null,
  connecting: { label: "reconnecting", tone: "warn" },
  live: { label: "socket", tone: "live" },
  polling: { label: "polling", tone: "warn" },
  closed: { label: "closed", tone: "muted" },
};

/** Docked, collapsible log for whatever run is currently attached. */
export function LogDrawer({ projectId }: { projectId: string }) {
  const { stream, drawerOpen, setDrawerOpen, activeRunId, starting, lastError, dismissError } = useRunCenter();
  const transport = TRANSPORT[stream.transport];
  const run = stream.run;
  const lastEvent = stream.events.at(-1);

  return (
    <div className="shrink-0 border-t border-line bg-ink-850/95 backdrop-blur">
      {lastError ? (
        <div className="flex items-start gap-2.5 border-b border-bad/25 bg-bad/[0.08] px-3.5 py-2 text-[12.5px] text-bad">
          <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 break-words">{lastError}</p>
          <IconButton icon="close" label="Dismiss error" onClick={dismissError} className="hover:text-bad" />
        </div>
      ) : null}

      <div className="flex h-10 items-center gap-3 px-3.5">
        <button
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="flex h-7 items-center gap-2 rounded px-1.5 text-paper-mute transition-colors hover:bg-ink-750 hover:text-paper"
          aria-expanded={drawerOpen}
        >
          <Icon name="chevronDown" size={14} className={cn("transition-transform", !drawerOpen && "rotate-180")} />
          <span className="micro">Run log</span>
        </button>

        {activeRunId ? (
          <>
            <RunStatusBadge status={stream.status} />
            {run ? (
              <span className="flex min-w-0 items-center gap-2 text-[12px] text-paper-dim">
                <span className="font-medium capitalize">{run.kind}</span>
                {run.scope ? <span className="truncate font-mono text-[11px] text-paper-mute">{run.scope}</span> : null}
                <span className="font-mono text-[11px] text-paper-faint">{run.id}</span>
                <span className="font-mono text-[11px] text-paper-faint">{duration(run.started_at, run.ended_at)}</span>
              </span>
            ) : null}
            {transport ? (
              <Badge tone={transport.tone} mono dot pulse={stream.transport === "live" && stream.status === "running"}>
                {transport.label}
              </Badge>
            ) : null}
          </>
        ) : starting ? (
          <span className="flex items-center gap-2 text-[12px] text-paper-mute">
            <Spinner size={12} /> {starting}…
          </span>
        ) : (
          <span className="text-[12px] text-paper-faint">
            Nothing attached — start a step, or open a run from the Runs view.
          </span>
        )}

        {!drawerOpen && lastEvent ? (
          <span className="ml-1 min-w-0 flex-1 truncate font-mono text-[11.5px] text-paper-faint">{lastEvent.text}</span>
        ) : (
          <span className="flex-1" />
        )}

        <Link
          to={`/p/${projectId}/runs`}
          className="micro rounded px-2 py-1 text-paper-faint transition-colors hover:bg-ink-750 hover:text-paper-dim"
        >
          All runs
        </Link>
      </div>

      {drawerOpen ? (
        <div className="border-t border-line bg-ink-950">
          {stream.error ? (
            <div className="border-b border-line px-3.5 py-1.5 font-mono text-[11px] text-warn">
              stream: {stream.error}
            </div>
          ) : null}
          <RunEvents
            events={stream.events}
            className="h-[248px]"
            emptyHint={
              activeRunId ? "Connected. Waiting for the first event…" : "No run attached. Start a step to watch it here."
            }
          />
        </div>
      ) : null}
    </div>
  );
}
