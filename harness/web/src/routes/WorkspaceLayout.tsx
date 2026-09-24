import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { ChatPanel } from "../components/ChatPanel";
import { CostModal } from "../components/CostModal";
import { LogDrawer } from "../components/LogDrawer";
import { ProjectStateBadge } from "../components/badges";
import { SettingsBanner, ToolGapChip, useToolGaps } from "../components/SettingsBanner";
import { Button, IconButton } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Icon, type IconName } from "../components/ui/Icon";
import { Spinner } from "../components/ui/Spinner";
import { errorMessage } from "../lib/api";
import { cn } from "../lib/cn";
import { docTitle } from "../lib/format";
import { useProject, useRefreshProject, useRefreshRuns, useRuns } from "../lib/queries";
import { useProjectSocket } from "../lib/projectSocket";
import { RunCenterProvider, useRunCenter } from "../state/RunCenter";
import type { ProjectDetail } from "../lib/types";

const CHAT_KEY = "harness.chat.open";

export function WorkspaceLayout() {
  const { projectId = "" } = useParams();
  const project = useProject(projectId);
  const navigate = useNavigate();

  if (project.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center gap-2.5 text-paper-mute">
        <Spinner size={16} />
        <span className="font-mono text-[12px]">loading {projectId}</span>
      </div>
    );
  }

  if (project.error || !project.data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <EmptyState
          icon="alert"
          title="That project will not open"
          body={
            <>
              <span className="font-mono text-[12px] text-paper-dim">{projectId}</span> — {errorMessage(project.error)}.
              It may have been deleted on disk, or the harness backend may be down.
            </>
          }
          action={
            <>
              <Button icon="refresh" onClick={() => void project.refetch()}>
                Try again
              </Button>
              <Button variant="primary" icon="back" onClick={() => void navigate("/")}>
                All projects
              </Button>
            </>
          }
        />
      </div>
    );
  }

  return (
    <RunCenterProvider projectId={projectId}>
      <Workspace project={project.data} />
    </RunCenterProvider>
  );
}

function Workspace({ project }: { project: ProjectDetail }) {
  const { pathname } = useLocation();
  const refresh = useRefreshProject(project.id);
  const refreshRuns = useRefreshRuns(project.id);
  const { watch } = useRunCenter();
  const runs = useRuns(project.id);
  const gaps = useToolGaps();

  const [gapsOpen, setGapsOpen] = useState(() => sessionStorage.getItem("harness.gaps.dismissed") !== "1");
  const [chatOpen, setChatOpen] = useState(() => localStorage.getItem(CHAT_KEY) !== "0");

  useEffect(() => {
    localStorage.setItem(CHAT_KEY, chatOpen ? "1" : "0");
  }, [chatOpen]);

  const { connected } = useProjectSocket(
    project.id,
    useCallback(
      (event) => {
        if (event.type === "run_started") {
          if (typeof event.run_id === "string") watch(event.run_id);
          refreshRuns();
          return;
        }
        // project_updated and run_finished both mean something on disk moved.
        refresh();
      },
      [refresh, refreshRuns, watch],
    ),
  );

  const { scope, target } = useMemo(() => deriveScope(pathname, project), [pathname, project]);
  const runningCount = (runs.data ?? []).filter((run) => run.status === "running").length;
  const entries = project.manifest?.entries ?? [];

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-line bg-ink-850/90 px-3 backdrop-blur">
        <Link
          to="/"
          className="group flex items-center gap-2 rounded px-1.5 py-1 text-paper-mute transition-colors hover:bg-ink-750 hover:text-paper"
          title="All projects"
        >
          <Icon name="back" size={15} />
          <span className="micro hidden sm:inline">Harness</span>
        </Link>

        <span className="h-4 w-px bg-line-strong" />

        <h1 className="truncate font-display text-[19px] leading-none text-paper">{project.name}</h1>
        <ProjectStateBadge state={project.state} />

        <div className="ml-auto flex items-center gap-2.5">
          <span
            title={connected ? "Subscribed to this project's event socket" : "Event socket down — views refresh on demand only"}
            className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-wider text-paper-faint"
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", connected ? "bg-ok beacon" : "bg-bad")} />
            {connected ? "live" : "offline"}
          </span>
          <ToolGapChip
            {...gaps}
            open={gapsOpen}
            onToggle={() => {
              const next = !gapsOpen;
              setGapsOpen(next);
              sessionStorage.setItem("harness.gaps.dismissed", next ? "0" : "1");
            }}
          />
          <IconButton
            icon={chatOpen ? "chevronRight" : "chat"}
            label={chatOpen ? "Hide chat" : "Show chat"}
            onClick={() => setChatOpen(!chatOpen)}
          />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav className="flex w-[186px] shrink-0 flex-col gap-0.5 border-r border-line bg-ink-900/60 p-2">
          <RailLink to={`/p/${project.id}/design`} icon="design" label="Design" hint={`${project.docs.length}/5`} />
          <RailLink
            to={`/p/${project.id}/manifest`}
            icon="manifest"
            label="Manifest"
            hint={entries.length > 0 ? String(entries.length) : undefined}
            flag={entries.length > 0 && !project.manifest?.accepted}
          />
          <RailLink
            to={`/p/${project.id}/assets`}
            icon="assets"
            label="Assets"
            hint={project.assets.length > 0 ? String(project.assets.length) : undefined}
            flag={project.assets.some((asset) => asset.stale)}
          />
          <RailLink
            to={`/p/${project.id}/runs`}
            icon="runs"
            label="Runs"
            hint={runningCount > 0 ? String(runningCount) : undefined}
            live={runningCount > 0}
          />

          <div className="mt-auto space-y-2 px-2 pb-1 pt-4">
            <p className="micro text-paper-faint">Idea</p>
            <p className="line-clamp-6 text-[11.5px] leading-relaxed text-paper-faint">{project.idea}</p>
            <p className="font-mono text-[10.5px] text-paper-faint/70">{project.id}</p>
          </div>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col">
          {gapsOpen ? <SettingsBanner className="mx-4 mt-3" /> : null}
          <main className="min-h-0 flex-1 overflow-y-auto">
            <Outlet />
          </main>
          <LogDrawer projectId={project.id} />
        </div>

        {chatOpen ? (
          <aside className="flex w-[352px] shrink-0 flex-col border-l border-line bg-ink-850/70">
            <ChatPanel projectId={project.id} scope={scope} target={target} />
          </aside>
        ) : null}
      </div>

      <CostModal />
    </div>
  );
}

function RailLink({
  to,
  icon,
  label,
  hint,
  flag = false,
  live = false,
}: {
  to: string;
  icon: IconName;
  label: string;
  hint?: string;
  flag?: boolean;
  live?: boolean;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors",
          isActive ? "bg-ink-800 text-paper" : "text-paper-mute hover:bg-ink-850 hover:text-paper-dim",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full transition-all",
              isActive ? "bg-ember" : "bg-transparent",
            )}
          />
          <Icon name={icon} size={15} className={isActive ? "text-ember" : "text-paper-faint group-hover:text-paper-mute"} />
          <span className={isActive ? "font-medium" : undefined}>{label}</span>
          {hint ? (
            <span
              className={cn(
                "ml-auto font-mono text-[10.5px]",
                live ? "text-live" : "text-paper-faint",
              )}
            >
              {hint}
            </span>
          ) : null}
          {flag ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-warn" title="Needs attention" /> : null}
        </>
      )}
    </NavLink>
  );
}

/** Chat scope follows the view, per API.md. */
function deriveScope(pathname: string, project: ProjectDetail): { scope: string; target: string } {
  const parts = pathname.split("/").filter(Boolean); // p, <id>, <view>, <rest>
  const view = parts[2];
  const rest = parts[3] ? decodeURIComponent(parts[3]) : null;

  if (view === "design") {
    if (rest) return { scope: `design:${rest}`, target: `the ${docTitle(rest).toLowerCase()} doc` };
    return { scope: "design", target: "the design set" };
  }
  if (view === "manifest") return { scope: "manifest", target: "the asset list" };
  if (view === "assets") {
    if (rest) {
      const entry = project.assets.find((asset) => asset.id === rest);
      return { scope: `asset:${rest}`, target: entry ? entry.name : rest };
    }
    return { scope: "manifest", target: "the asset list" };
  }
  return { scope: "design", target: "the design set" };
}
