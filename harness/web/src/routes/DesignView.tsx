import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Markdown } from "../components/Markdown";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { Panel } from "../components/ui/Panel";
import { Spinner } from "../components/ui/Spinner";
import { Tabs, type TabItem } from "../components/ui/Tabs";
import { api, errorMessage } from "../lib/api";
import { docTitle, parseProvenance, relativeTime } from "../lib/format";
import { useDoc, useProject, useSaveDoc } from "../lib/queries";
import { DOC_NAMES } from "../lib/types";
import { useRunCenter } from "../state/RunCenter";

export function DesignView() {
  const { projectId = "", doc } = useParams();
  const navigate = useNavigate();
  const project = useProject(projectId);
  const { start, starting } = useRunCenter();
  const save = useSaveDoc(projectId);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmRewrite, setConfirmRewrite] = useState(false);

  const present = useMemo(() => new Set((project.data?.docs ?? []).map((entry) => entry.name)), [project.data]);
  const staleDocs = useMemo(() => {
    const set = new Set<string>();
    for (const asset of project.data?.assets ?? []) {
      if (!asset.stale) continue;
      for (const ref of asset.derived_from ?? []) set.add(parseProvenance(ref).doc);
    }
    return set;
  }, [project.data]);

  const firstPresent = DOC_NAMES.find((name) => present.has(name));
  const active = doc ?? firstPresent ?? null;

  // Land on a real doc so the chat scope becomes `design:<doc>`.
  useEffect(() => {
    if (!doc && firstPresent) navigate(`/p/${projectId}/design/${firstPresent}`, { replace: true });
  }, [doc, firstPresent, navigate, projectId]);

  const content = useDoc(projectId, active ?? undefined, Boolean(active && present.has(active)));

  useEffect(() => {
    setEditing(false);
  }, [active]);

  const generate = () =>
    void start({ label: "Generate design set", request: (extra) => api.runDesign(projectId, extra) });

  const meta = (project.data?.docs ?? []).find((entry) => entry.name === active);
  const dirty = editing && draft !== (content.data?.markdown ?? "");

  if (project.isLoading) return <Loading />;

  if (present.size === 0) {
    return (
      <div className="p-6">
        <Panel className="min-h-[420px] justify-center">
          <EmptyState
            icon="design"
            title="No design set yet"
            body="The harness reads the project idea and writes five documents: vision, game design, art bible, level design and audio. Everything downstream — the asset list, the briefs, the images — is derived from them."
            action={
              <Button variant="primary" size="lg" icon="spark" onClick={generate} loading={starting !== null}>
                Generate design set
              </Button>
            }
            secondary="Writes projects/{id}/design/*.md. Watch it in the run log below."
          />
        </Panel>
      </div>
    );
  }

  const tabs: TabItem[] = DOC_NAMES.map((name) => ({
    value: name,
    label: docTitle(name),
    dim: !present.has(name),
    title: present.has(name) ? undefined : "Not written yet",
    badge: staleDocs.has(name) ? (
      <Badge tone="warn" title="Assets derived from this doc were written before the last change">
        stale
      </Badge>
    ) : !present.has(name) ? (
      <span className="font-mono text-[10px] text-paper-faint">—</span>
    ) : undefined,
  }));

  return (
    <div className="flex min-h-full flex-col p-6">
      <Panel
        className="min-h-[560px] flex-1"
        flush
        title={
          <span className="flex items-center gap-2.5">
            Design
            {meta?.updated_at ? (
              <span className="font-mono text-[10.5px] normal-case tracking-normal text-paper-faint">
                edited {relativeTime(meta.updated_at)}
              </span>
            ) : null}
          </span>
        }
        actions={
          editing ? (
            <>
              <span className="mr-1 text-[11.5px] text-paper-faint">{dirty ? "unsaved changes" : "no changes"}</span>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={save.isPending}>
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                icon="check"
                loading={save.isPending}
                onClick={() => {
                  if (!active) return;
                  save.mutate({ doc: active, markdown: draft }, { onSuccess: () => setEditing(false) });
                }}
              >
                Save
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="ghost" icon="refresh" onClick={() => setConfirmRewrite(true)}>
                Rewrite all five
              </Button>
              <Button
                size="sm"
                icon="pencil"
                disabled={!content.data}
                onClick={() => {
                  setDraft(content.data?.markdown ?? "");
                  setEditing(true);
                }}
              >
                Edit
              </Button>
            </>
          )
        }
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center gap-3 px-1">
            <Tabs
              className="flex-1"
              items={tabs}
              value={active ?? ""}
              onChange={(next) => {
                if (editing) return;
                navigate(`/p/${projectId}/design/${next}`);
              }}
            />
          </div>
          {editing ? (
            <p className="border-b border-line bg-ink-800/50 px-4 py-1.5 text-[11.5px] text-paper-faint">
              Editing — save or cancel to switch documents.
            </p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {active && !present.has(active) ? (
              <EmptyState
                icon="design"
                compact
                title={`No ${docTitle(active).toLowerCase()} doc`}
                body="This one was not written. Rewriting the design set produces all five documents from the project idea; single-document edits go through the chat panel."
                action={
                  <Button variant="primary" icon="spark" onClick={generate} loading={starting !== null}>
                    Generate design set
                  </Button>
                }
              />
            ) : content.isLoading ? (
              <Loading />
            ) : content.error ? (
              <EmptyState
                icon="alert"
                compact
                title="That document will not load"
                body={errorMessage(content.error)}
                action={
                  <Button icon="refresh" onClick={() => void content.refetch()}>
                    Try again
                  </Button>
                }
              />
            ) : editing ? (
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                spellCheck={false}
                className="h-full min-h-[520px] w-full resize-none bg-ink-950 px-7 py-6 font-mono text-[12.5px] leading-[1.75] text-paper-dim focus:outline-none"
              />
            ) : (
              <div className="px-7 py-7">
                <Markdown text={content.data?.markdown ?? ""} />
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Modal
        open={confirmRewrite}
        onClose={() => setConfirmRewrite(false)}
        eyebrow="Overwrites hand edits"
        title="Rewrite all five documents?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmRewrite(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon="refresh"
              onClick={() => {
                setConfirmRewrite(false);
                generate();
              }}
            >
              Rewrite design set
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-paper-dim">
          This runs the design step again and replaces vision, game design, art bible, level design and audio with new
          text. Anything you typed into them is lost. To change one document without touching the others, ask for it in
          the chat panel instead.
        </p>
      </Modal>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-20 text-paper-faint">
      <Spinner size={14} />
      <span className="font-mono text-[12px]">loading</span>
    </div>
  );
}
