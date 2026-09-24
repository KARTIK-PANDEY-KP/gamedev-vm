import { lazy, Suspense } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Markdown } from "../components/Markdown";
import { RefImage } from "../components/RefImage";
import { ClassBadge, ProvenanceChips, StateBadges, TierBadge } from "../components/badges";
import { Button, IconButton } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Icon } from "../components/ui/Icon";
import { Panel } from "../components/ui/Panel";
import { Spinner } from "../components/ui/Spinner";
import { api, errorMessage } from "../lib/api";
import { useAsset, useProject, useSettings } from "../lib/queries";
import { REF_VIEWS, type AssetBuild, type BuildCheck } from "../lib/types";

const ModelPreview = lazy(() =>
  import("../components/ModelPreview").then((m) => ({ default: m.ModelPreview })),
);
import { useRunCenter } from "../state/RunCenter";

export function AssetDetailView() {
  const { projectId = "", assetId = "" } = useParams();
  const navigate = useNavigate();
  const project = useProject(projectId);
  const asset = useAsset(projectId, assetId);
  const { start, starting, imageVersion } = useRunCenter();
  const { data: settings } = useSettings();

  const fallback = (project.data?.assets ?? []).find((entry) => entry.id === assetId) ?? null;
  const entry = asset.data?.entry ?? fallback;

  if (asset.isLoading && !entry) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-paper-faint">
        <Spinner size={14} />
        <span className="font-mono text-[12px]">loading {assetId}</span>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="p-6">
        <Panel className="min-h-[360px] justify-center">
          <EmptyState
            icon="alert"
            title="No such asset"
            body={
              <>
                <span className="font-mono text-[12px] text-paper-dim">{assetId}</span> is not in this project's
                manifest{asset.error ? ` — ${errorMessage(asset.error)}` : ""}. It may have been removed the last time
                the list was accepted.
              </>
            }
            action={
              <Button variant="primary" icon="back" onClick={() => void navigate(`/p/${projectId}/assets`)}>
                Back to assets
              </Button>
            }
          />
        </Panel>
      </div>
    );
  }

  const images = asset.data?.images ?? {};
  const build = asset.data?.build ?? null;
  const brief = asset.data?.brief_markdown ?? null;
  const busy = starting !== null;

  const runImages = (views?: string[]) =>
    void start({
      label: views ? `Regenerate ${views[0]} reference` : `Generate references — ${entry.name}`,
      request: (extra) => api.runImages(projectId, entry.id, { ...(views ? { views } : null), ...extra }),
    });

  return (
    <div className="flex min-h-full flex-col gap-4 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            to={`/p/${projectId}/assets`}
            className="micro inline-flex items-center gap-1.5 text-paper-faint transition-colors hover:text-paper-dim"
          >
            <Icon name="back" size={12} /> Assets
          </Link>
          <h1 className="mt-2 truncate font-display text-[30px] leading-none text-paper">{entry.name || entry.id}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ClassBadge value={entry.asset_class} />
            <TierBadge value={entry.tier} />
            <StateBadges entry={entry} />
            <span className="font-mono text-[11px] text-paper-faint">{entry.id}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            icon="design"
            loading={busy}
            onClick={() =>
              void start({
                label: `${entry.has_brief ? "Rewrite" : "Write"} brief — ${entry.name}`,
                request: (extra) => api.runBrief(projectId, entry.id, extra),
              })
            }
          >
            {entry.has_brief ? "Rewrite brief" : "Write brief"}
          </Button>
          <Button
            variant={entry.has_brief && !entry.has_images ? "primary" : "secondary"}
            icon="image"
            loading={busy}
            disabled={!entry.has_brief}
            title={entry.has_brief ? undefined : "Write the brief first — the images are generated from it"}
            onClick={() => runImages()}
          >
            {entry.has_images ? "Regenerate images" : "Generate images"}
          </Button>
          <Button
            icon="cube"
            loading={busy}
            disabled={!entry.has_images || settings?.blender_present === false}
            title={
              settings?.blender_present === false
                ? "Blender was not found on this machine"
                : entry.has_images
                  ? undefined
                  : "Generate the reference images first"
            }
            onClick={() =>
              void start({
                label: `Build in Blender — ${entry.name}`,
                request: (extra) => api.runBuild(projectId, entry.id, extra),
              })
            }
          >
            Build in Blender
          </Button>
        </div>
      </div>

      {entry.stale ? (
        <div className="flex items-start gap-3 rounded-[var(--radius-panel)] border border-warn/30 bg-warn/[0.06] px-4 py-3">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-warn" />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-warn">Out of date with its sources</p>
            <p className="mt-0.5 text-[12.5px] leading-relaxed text-paper-dim">
              A design document changed after this brief was written. Rewrite the brief to pick the change up — the
              images and the build are generated from the brief, so they will be stale too.
            </p>
            <div className="mt-2">
              <ProvenanceChips refs={entry.derived_from ?? []} max={6} />
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,400px)]">
        <Panel
          title="Brief"
          subtitle={entry.derived_from?.length ? undefined : "Added by hand — no document provenance"}
          flush
          className="min-h-[360px]"
          actions={
            entry.derived_from?.length ? <ProvenanceChips refs={entry.derived_from} max={3} /> : null
          }
        >
          <div className="h-full overflow-y-auto px-6 py-5">
            {brief ? (
              <Markdown text={brief} />
            ) : (
              <EmptyState
                compact
                icon="design"
                title="No brief yet"
                body="The brief is the written description this asset is built from — silhouette, materials, scale, the things the references must agree on. Write it before generating images."
                action={
                  <Button
                    variant="primary"
                    icon="spark"
                    loading={busy}
                    onClick={() =>
                      void start({
                        label: `Write brief — ${entry.name}`,
                        request: (extra) => api.runBrief(projectId, entry.id, extra),
                      })
                    }
                  >
                    Write brief
                  </Button>
                }
              />
            )}
          </div>
        </Panel>

        <div className="flex min-h-0 flex-col gap-4">
          <Panel
            title="References"
            subtitle={entry.has_images ? undefined : "Four orthographic views, generated from the brief"}
            actions={
              entry.has_images ? (
                <IconButton icon="refresh" label="Regenerate all four views" onClick={() => runImages()} />
              ) : null
            }
          >
            <div className="grid grid-cols-2 gap-2">
              {REF_VIEWS.map((view) => (
                <figure key={view} className="group relative">
                  <RefImage
                    projectId={projectId}
                    assetId={entry.id}
                    view={view}
                    version={imageVersion}
                    expected={entry.has_images}
                    src={images[view]}
                    large
                    className="rounded"
                  />
                  <figcaption className="absolute left-1.5 top-1.5 rounded bg-ink-1000/75 px-1.5 py-[3px] font-mono text-[9.5px] uppercase tracking-wider text-paper-dim backdrop-blur-[1px]">
                    {view}
                  </figcaption>
                  {entry.has_images ? (
                    <IconButton
                      icon="refresh"
                      label={`Regenerate the ${view} view`}
                      onClick={() => runImages([view])}
                      className="absolute right-1 top-1 bg-ink-1000/70 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100"
                    />
                  ) : null}
                </figure>
              ))}
            </div>
          </Panel>

          <Panel title="Blender build" className="min-h-[150px]">
            <BuildOutput build={build} hasBuild={entry.has_build} files={asset.data?.build_files ?? {}} name={entry.name} />
          </Panel>
        </div>
      </div>
    </div>
  );
}

function BuildOutput({
  build,
  hasBuild,
  files,
  name,
}: {
  build: AssetBuild | null;
  hasBuild: boolean;
  files: Partial<Record<string, string>>;
  name: string;
}) {
  if (!build && !hasBuild) {
    return (
      <p className="text-[12.5px] leading-relaxed text-paper-mute">
        Not built. Once the four references agree, Build in Blender turns them into a mesh and writes{" "}
        <code className="font-mono text-[11.5px] text-paper-faint">build/asset.glb</code> next to them.
      </p>
    );
  }

  const glb = files["asset.glb"];
  const render = files["render.png"];
  const checks = Array.isArray(build?.checks) ? (build?.checks as BuildCheck[]) : [];
  const failed = checks.filter((check) => !check.pass);
  const triangles = typeof build?.triangles === "number" ? build.triangles : null;
  const dims = Array.isArray(build?.dimensions_m) ? (build?.dimensions_m as number[]) : null;

  return (
    <div className="space-y-4">
      {render ? (
        <figure className="overflow-hidden rounded border border-line bg-ink-950">
          <img src={render} alt={`${name}, rendered`} className="w-full" />
          <figcaption className="border-t border-line px-3 py-2 font-mono text-[11px] text-paper-faint">
            render.png — materials and lighting from the brief
          </figcaption>
        </figure>
      ) : null}

      {glb ? (
        <Suspense fallback={<div className="h-[320px] rounded border border-line bg-ink-950" />}>
          <ModelPreview src={glb} label={`${name}, built mesh`} />
        </Suspense>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11.5px]">
        {build?.ok === true ? <span className="text-ok">all checks passed</span> : null}
        {build?.ok === false ? <span className="text-bad">checks failed</span> : null}
        {checks.length > 0 ? (
          <span className={failed.length ? "text-bad" : "text-paper-dim"}>
            {checks.length - failed.length}/{checks.length} checks
          </span>
        ) : null}
        {triangles != null ? <span className="text-paper-dim">{triangles.toLocaleString()} tris</span> : null}
        {dims ? (
          <span className="text-paper-dim">{dims.map((d) => d.toFixed(3)).join(" × ")} m</span>
        ) : null}
      </div>

      {checks.length > 0 ? (
        <details className="rounded border border-line bg-ink-950">
          <summary className="cursor-pointer px-3 py-2 text-[12px] text-paper-mute">
            Check report
          </summary>
          <ul className="max-h-[260px] space-y-1 overflow-auto px-3 pb-3">
            {checks.map((check) => (
              <li key={check.name} className="flex gap-2 font-mono text-[11px] leading-relaxed">
                <span className={check.pass ? "text-ok" : "text-bad"}>{check.pass ? "PASS" : "FAIL"}</span>
                <span className="text-paper-mute">{check.name}</span>
                <span className="ml-auto whitespace-nowrap text-paper-faint">{check.measured}</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {typeof build?.notes === "string" && build.notes ? (
        <p className="text-[12.5px] leading-relaxed text-paper-mute">{build.notes}</p>
      ) : null}

      <div className="flex flex-wrap gap-3 font-mono text-[11px]">
        {Object.entries(files).map(([file, url]) =>
          url ? (
            <a key={file} href={url} className="text-ember hover:underline" download>
              {file}
            </a>
          ) : null,
        )}
      </div>
    </div>
  );
}
