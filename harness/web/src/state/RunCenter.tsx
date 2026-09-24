import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { api, errorMessage } from "../lib/api";
import { useRefreshProject } from "../lib/queries";
import { useRunStream, type RunStreamState } from "../lib/runStream";
import type { RunStart, RunStatus } from "../lib/types";

export type StartRunOptions = {
  /** Shown in the cost dialog and in the drawer while the call is in flight. */
  label: string;
  /** Called once without extras, and again with `{confirmed: true}` if the
   *  backend answered with a cost estimate instead of starting. */
  request: (extra: Record<string, unknown>) => Promise<RunStart>;
  onStarted?: (runId: string) => void;
};

type PendingCost = {
  label: string;
  plannedImages: number | null;
  estimatedCostUsd: number | null;
};

type RunCenterValue = {
  activeRunId: string | null;
  stream: RunStreamState;
  starting: string | null;
  lastError: string | null;
  /** Bumped when an images run ends, so <img> tags re-fetch the new bytes. */
  imageVersion: number;
  drawerOpen: boolean;
  pendingCost: PendingCost | null;
  confirming: boolean;
  start: (options: StartRunOptions) => Promise<void>;
  watch: (runId: string) => void;
  setDrawerOpen: (open: boolean) => void;
  dismissError: () => void;
  confirmCost: () => Promise<void>;
  cancelCost: () => void;
};

const RunCenterContext = createContext<RunCenterValue | null>(null);

function needsConfirmation(result: RunStart): boolean {
  return (
    (result.estimated_cost_usd != null && result.estimated_cost_usd > 0) ||
    (result.planned_images != null && result.planned_images > 0 && !result.run_id)
  );
}

export function RunCenterProvider({ projectId, children }: { projectId: string; children: ReactNode }) {
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingCost, setPendingCost] = useState<PendingCost | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const pendingOptions = useRef<StartRunOptions | null>(null);

  const stream = useRunStream(activeRunId);
  const refresh = useRefreshProject(projectId);

  // Reset when the workspace switches projects, then adopt any run already in flight —
  // a step started before this page loaded is still the run the user wants to watch.
  useEffect(() => {
    setActiveRunId(null);
    setPendingCost(null);
    pendingOptions.current = null;

    let cancelled = false;
    api
      .listRuns(projectId)
      .then((runs) => {
        if (cancelled) return;
        const live = runs.find((run) => run.status === "running");
        if (live) setActiveRunId(live.id);
      })
      .catch(() => {
        /* the settings banner already reports an unreachable backend */
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // A run that reaches a terminal state has changed something on disk.
  const lastStatus = useRef<RunStatus | null>(null);
  useEffect(() => {
    const status = stream.status;
    if (status && status !== lastStatus.current && status !== "running") {
      refresh();
      if (stream.run?.kind === "images") setImageVersion(Date.now());
    }
    lastStatus.current = status;
  }, [stream.status, stream.run?.kind, refresh]);

  const attach = useCallback((result: RunStart, options: StartRunOptions) => {
    if (!result.run_id) {
      setLastError(`${options.label}: the backend did not return a run id`);
      return;
    }
    setActiveRunId(result.run_id);
    setDrawerOpen(true);
    options.onStarted?.(result.run_id);
  }, []);

  const start = useCallback(
    async (options: StartRunOptions) => {
      setLastError(null);
      setStarting(options.label);
      try {
        const result = await options.request({});
        if (needsConfirmation(result)) {
          pendingOptions.current = options;
          setPendingCost({
            label: options.label,
            plannedImages: result.planned_images ?? null,
            estimatedCostUsd: result.estimated_cost_usd ?? null,
          });
          return;
        }
        attach(result, options);
      } catch (error) {
        setLastError(`${options.label}: ${errorMessage(error)}`);
      } finally {
        setStarting(null);
      }
    },
    [attach],
  );

  const confirmCost = useCallback(async () => {
    const options = pendingOptions.current;
    if (!options) return;
    setConfirming(true);
    try {
      const result = await options.request({ confirmed: true });
      attach(result, options);
      setPendingCost(null);
      pendingOptions.current = null;
    } catch (error) {
      setLastError(`${options.label}: ${errorMessage(error)}`);
      setPendingCost(null);
      pendingOptions.current = null;
    } finally {
      setConfirming(false);
    }
  }, [attach]);

  const cancelCost = useCallback(() => {
    setPendingCost(null);
    pendingOptions.current = null;
  }, []);

  const watch = useCallback((runId: string) => {
    setActiveRunId(runId);
    setDrawerOpen(true);
  }, []);

  const value = useMemo<RunCenterValue>(
    () => ({
      activeRunId,
      stream,
      starting,
      lastError,
      imageVersion,
      drawerOpen,
      pendingCost,
      confirming,
      start,
      watch,
      setDrawerOpen,
      dismissError: () => setLastError(null),
      confirmCost,
      cancelCost,
    }),
    [
      activeRunId,
      stream,
      starting,
      lastError,
      imageVersion,
      drawerOpen,
      pendingCost,
      confirming,
      start,
      watch,
      confirmCost,
      cancelCost,
    ],
  );

  return <RunCenterContext.Provider value={value}>{children}</RunCenterContext.Provider>;
}

export function useRunCenter(): RunCenterValue {
  const value = useContext(RunCenterContext);
  if (!value) throw new Error("useRunCenter must be used inside a RunCenterProvider");
  return value;
}
