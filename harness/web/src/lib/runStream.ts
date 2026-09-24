import { useEffect, useState } from "react";
import { api, errorMessage, wsUrl } from "./api";
import type { Run, RunEvent, RunStatus } from "./types";

export type Transport = "idle" | "connecting" | "live" | "polling" | "closed";

export type RunStreamState = {
  run: Run | null;
  events: RunEvent[];
  status: RunStatus | null;
  transport: Transport;
  error: string | null;
};

const IDLE: RunStreamState = { run: null, events: [], status: null, transport: "idle", error: null };

const MAX_RECONNECTS = 4;
const POLL_INTERVAL = 1500;

function asEvent(raw: unknown): RunEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  const inner =
    candidate.event && typeof candidate.event === "object" ? (candidate.event as Record<string, unknown>) : candidate;
  if (typeof inner.text !== "string") return null;
  const kind = typeof inner.kind === "string" ? inner.kind : "log";
  return {
    ts: typeof inner.ts === "string" ? inner.ts : new Date().toISOString(),
    kind: kind as RunEvent["kind"],
    text: inner.text,
  };
}

const same = (a: RunEvent, b: RunEvent) => a.ts === b.ts && a.kind === b.kind && a.text === b.text;

/**
 * Follows one run.
 *
 * Seeds from `GET /api/runs/{id}` so a late subscriber still sees the history,
 * then streams `WS /api/ws/runs/{id}`. The socket replays the backlog before it
 * streams, so incoming frames are matched against what is already held and only
 * the genuinely new ones are appended. A socket that drops while the run is
 * still going is retried with backoff, and after a few failures the hook falls
 * back to polling REST, which is the authority on the final status.
 */
export function useRunStream(runId: string | null): RunStreamState {
  const [state, setState] = useState<RunStreamState>(IDLE);

  useEffect(() => {
    if (!runId) {
      setState(IDLE);
      return;
    }

    let disposed = false;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    // Mirror of the rendered event list, so the replay match does not need state.
    let known: RunEvent[] = [];
    let replayCursor = 0;
    let replaying = true;

    setState({ ...IDLE, transport: "connecting" });

    const patch = (next: Partial<RunStreamState>) => {
      if (!disposed) setState((prev) => ({ ...prev, ...next }));
    };

    const publish = (events: RunEvent[]) => {
      known = events;
      if (!disposed) setState((prev) => ({ ...prev, events }));
    };

    /** REST is authoritative; accept its list whenever it is not behind. */
    const absorb = (run: Run) => {
      if (disposed) return;
      const events = run.events ?? [];
      if (events.length >= known.length) {
        known = events;
        replayCursor = 0;
        replaying = true;
      }
      setState((prev) => ({
        ...prev,
        run,
        status: run.status,
        events: events.length >= prev.events.length ? events : prev.events,
        error: null,
      }));
    };

    const ingest = (event: RunEvent) => {
      if (disposed) return;
      if (replaying && replayCursor < known.length) {
        if (same(known[replayCursor] as RunEvent, event)) {
          replayCursor += 1;
          return;
        }
        replaying = false;
      }
      replaying = false;
      publish([...known, event]);
      replayCursor = known.length;
    };

    const poll = () => {
      patch({ transport: "polling" });
      const tick = async () => {
        if (disposed) return;
        try {
          const run = await api.getRun(runId);
          absorb(run);
          if (run.status !== "running") {
            patch({ transport: "closed" });
            return;
          }
        } catch (error) {
          patch({ error: errorMessage(error) });
        }
        if (!disposed) timer = setTimeout(() => void tick(), POLL_INTERVAL);
      };
      void tick();
    };

    const afterClose = async () => {
      if (disposed) return;
      let stillRunning = true;
      try {
        const run = await api.getRun(runId);
        absorb(run);
        stillRunning = run.status === "running";
      } catch (error) {
        patch({ error: errorMessage(error) });
      }
      if (disposed) return;
      if (!stillRunning) {
        patch({ transport: "closed" });
        return;
      }
      attempts += 1;
      if (attempts <= MAX_RECONNECTS) {
        patch({ transport: "connecting" });
        timer = setTimeout(connect, Math.min(4000, 400 * 2 ** (attempts - 1)));
      } else {
        poll();
      }
    };

    function connect() {
      if (disposed) return;
      // Every fresh socket replays from the beginning.
      replayCursor = 0;
      replaying = true;

      let sock: WebSocket;
      try {
        sock = new WebSocket(wsUrl(`/api/ws/runs/${encodeURIComponent(runId as string)}`));
      } catch {
        poll();
        return;
      }
      socket = sock;
      sock.onopen = () => {
        attempts = 0;
        patch({ transport: "live", error: null });
      };
      sock.onmessage = (message) => {
        if (disposed || typeof message.data !== "string") return;
        for (const line of message.data.split("\n")) {
          if (!line.trim()) continue;
          let parsed: unknown;
          try {
            parsed = JSON.parse(line);
          } catch {
            continue;
          }
          const event = asEvent(parsed);
          if (event) ingest(event);
        }
      };
      sock.onclose = () => {
        socket = null;
        void afterClose();
      };
    }

    void (async () => {
      try {
        const run = await api.getRun(runId);
        absorb(run);
        if (run.status !== "running") {
          patch({ transport: "closed" });
          return;
        }
      } catch (error) {
        patch({ error: errorMessage(error) });
      }
      connect();
    })();

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
    };
  }, [runId]);

  return state;
}
