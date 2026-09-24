import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { ProjectStateBadge } from "../components/badges";
import { SettingsBanner } from "../components/SettingsBanner";
import { Button, IconButton } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Input, Label, Textarea } from "../components/ui/Field";
import { Icon } from "../components/ui/Icon";
import { Modal } from "../components/ui/Modal";
import { Panel } from "../components/ui/Panel";
import { Spinner } from "../components/ui/Spinner";
import { errorMessage } from "../lib/api";
import { dateLabel, relativeTime } from "../lib/format";
import { useCreateProject, useDeleteProject, useProjects } from "../lib/queries";
import type { ProjectSummary } from "../lib/types";

const IDEA_PLACEHOLDER = "a first-person game where you play a lighthouse keeper during a storm";

export function ProjectsPage() {
  const projects = useProjects();
  const [toDelete, setToDelete] = useState<ProjectSummary | null>(null);
  const remove = useDeleteProject();

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1180px] px-6 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="micro mb-3 text-ember">Harness</p>
          <h1 className="max-w-[20ch] font-display text-[42px] leading-[1.05] tracking-[-0.01em] text-paper">
            A game idea, taken <em className="italic text-ember">all the way down</em> to assets.
          </h1>
          <p className="mt-3 max-w-[62ch] text-[13.5px] leading-relaxed text-paper-mute">
            Each project holds five design docs, a derived asset list you approve by hand, four reference images per
            asset and a Blender build. Every step runs as a job you can watch.
          </p>
        </div>
        <dl className="flex gap-6 pb-1">
          <Stat label="Projects" value={projects.data ? String(projects.data.length) : "—"} />
          <Stat
            label="Ready"
            value={projects.data ? String(projects.data.filter((p) => p.state === "assets_ready").length) : "—"}
          />
        </dl>
      </header>

      <SettingsBanner className="mb-7" />

      <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_368px]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="micro text-paper-mute">Projects</h2>
            {projects.isFetching ? <Spinner size={12} className="text-paper-faint" /> : null}
          </div>

          {projects.isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((index) => (
                <div key={index} className="h-[86px] animate-pulse rounded-[var(--radius-panel)] border border-line bg-ink-850/60" />
              ))}
            </div>
          ) : projects.error ? (
            <Panel>
              <EmptyState
                icon="alert"
                compact
                title="The harness is not answering"
                body={
                  <>
                    {errorMessage(projects.error)}. Start the backend and this list fills in — it serves this page too,
                    so a blank list usually means the process is down.
                  </>
                }
                action={
                  <Button icon="refresh" onClick={() => void projects.refetch()}>
                    Try again
                  </Button>
                }
              />
            </Panel>
          ) : (projects.data ?? []).length === 0 ? (
            <Panel>
              <EmptyState
                icon="spark"
                compact
                title="Nothing started yet"
                body="Describe a game in the form on the right. The harness writes the vision, game design, art bible, level design and audio docs from it — then you derive the asset list."
              />
            </Panel>
          ) : (
            <ul className="space-y-2">
              {(projects.data ?? []).map((project, index) => (
                <li key={project.id} className="rise" style={{ animationDelay: `${index * 40}ms` }}>
                  <ProjectRow project={project} onDelete={() => setToDelete(project)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <CreateProjectForm />
        </aside>
      </div>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        eyebrow="This cannot be undone"
        title={`Delete ${toDelete?.name ?? ""}?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToDelete(null)}>
              Keep it
            </Button>
            <Button
              variant="danger"
              icon="trash"
              loading={remove.isPending}
              onClick={() => {
                if (!toDelete) return;
                remove.mutate(toDelete.id, { onSettled: () => setToDelete(null) });
              }}
            >
              Delete project
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-paper-dim">
          Everything under <code className="font-mono text-[12px] text-ember">projects/{toDelete?.id}</code> goes: the
          design docs, the manifest, every brief, reference image and build.
        </p>
      </Modal>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="micro text-paper-faint">{label}</dt>
      <dd className="mt-1.5 font-mono text-[22px] leading-none text-paper-dim">{value}</dd>
    </div>
  );
}

function ProjectRow({ project, onDelete }: { project: ProjectSummary; onDelete: () => void }) {
  return (
    <div className="group relative">
      <Link
        to={`/p/${project.id}/design`}
        className="surface block rounded-[var(--radius-panel)] border border-line bg-ink-850 px-4 py-3.5 transition-all duration-200 hover:border-ember/35 hover:bg-ink-800"
      >
        <div className="flex items-center gap-3">
          <h3 className="truncate text-[15px] font-medium tracking-[-0.01em] text-paper">{project.name}</h3>
          <ProjectStateBadge state={project.state} />
          <span className="ml-auto flex items-center gap-3 pr-7 font-mono text-[10.5px] text-paper-faint">
            <span title={dateLabel(project.created_at)}>{relativeTime(project.created_at)}</span>
            <span className="hidden sm:inline">{project.id}</span>
          </span>
        </div>
        <p className="mt-2 line-clamp-2 max-w-[86ch] text-[12.5px] leading-relaxed text-paper-mute">{project.idea}</p>
        <Icon
          name="chevronRight"
          size={15}
          className="absolute right-3.5 top-4 text-paper-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ember"
        />
      </Link>
      <IconButton
        icon="trash"
        label={`Delete ${project.name}`}
        onClick={onDelete}
        className="absolute bottom-3 right-3 opacity-0 transition-opacity hover:text-bad group-hover:opacity-100"
      />
    </div>
  );
}

function CreateProjectForm() {
  const navigate = useNavigate();
  const create = useCreateProject();
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !idea.trim() || create.isPending) return;
    create.mutate(
      { name: name.trim(), idea: idea.trim() },
      {
        onSuccess: (project) => {
          setName("");
          setIdea("");
          void navigate(`/p/${project.id}/design`);
        },
      },
    );
  };

  return (
    <Panel title="New project" subtitle="Two fields. The docs come from the idea.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="project-name">Name</Label>
          <Input
            id="project-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Lighthouse Keeper"
            maxLength={80}
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="project-idea" hint={`${idea.length} chars`}>
            Idea
          </Label>
          <Textarea
            id="project-idea"
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            placeholder={IDEA_PLACEHOLDER}
            rows={9}
            className="min-h-[190px]"
          />
          <p className="mt-2 text-[11.5px] leading-relaxed text-paper-faint">
            Write it the way you would tell a friend. Mood, camera, what the player does. Detail here saves rewriting
            the design docs later.
          </p>
        </div>

        {create.error ? (
          <p className="rounded border border-bad/30 bg-bad/[0.08] px-3 py-2 text-[12px] text-bad">
            {errorMessage(create.error)}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          icon="plus"
          className="w-full"
          loading={create.isPending}
          disabled={!name.trim() || !idea.trim()}
        >
          Create project
        </Button>
      </form>
    </Panel>
  );
}
