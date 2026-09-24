import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { AssetEntry } from "./types";

export const qk = {
  settings: ["settings"] as const,
  projects: ["projects"] as const,
  project: (id: string) => ["project", id] as const,
  doc: (id: string, doc: string) => ["doc", id, doc] as const,
  asset: (id: string, assetId: string) => ["asset", id, assetId] as const,
  runs: (id: string) => ["runs", id] as const,
  run: (runId: string) => ["run", runId] as const,
  chat: (id: string, scope: string) => ["chat", id, scope] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: api.settings,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useProjects() {
  return useQuery({ queryKey: qk.projects, queryFn: api.listProjects });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: qk.project(id ?? ""),
    queryFn: () => api.getProject(id as string),
    enabled: Boolean(id),
  });
}

export function useDoc(projectId: string | undefined, doc: string | undefined, exists: boolean) {
  return useQuery({
    queryKey: qk.doc(projectId ?? "", doc ?? ""),
    queryFn: () => api.getDoc(projectId as string, doc as string),
    enabled: Boolean(projectId && doc && exists),
  });
}

export function useAsset(projectId: string | undefined, assetId: string | undefined) {
  return useQuery({
    queryKey: qk.asset(projectId ?? "", assetId ?? ""),
    queryFn: () => api.getAsset(projectId as string, assetId as string),
    enabled: Boolean(projectId && assetId),
  });
}

export function useRuns(projectId: string | undefined) {
  return useQuery({
    queryKey: qk.runs(projectId ?? ""),
    queryFn: () => api.listRuns(projectId as string),
    enabled: Boolean(projectId),
    // A safety net under the websocket: keep the list honest while work is live.
    refetchInterval: (query) => (query.state.data?.some((run) => run.status === "running") ? 4000 : false),
  });
}

export function useChatHistory(projectId: string | undefined, scope: string | null) {
  return useQuery({
    queryKey: qk.chat(projectId ?? "", scope ?? ""),
    queryFn: () => api.getChat(projectId as string, scope as string),
    enabled: Boolean(projectId && scope),
    retry: 0,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; idea: string }) => api.createProject(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.projects });
    },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteProject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.projects });
    },
  });
}

export function useSaveDoc(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { doc: string; markdown: string }) => api.saveDoc(projectId, vars.doc, vars.markdown),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: qk.doc(projectId, vars.doc) });
      void qc.invalidateQueries({ queryKey: qk.project(projectId) });
    },
  });
}

export function useAcceptManifest(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries: AssetEntry[]) => api.acceptManifest(projectId, entries),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.project(projectId) });
    },
  });
}

/** Just the run list — for `run_started` / `run_finished` notices. */
export function useRefreshRuns(projectId: string | undefined) {
  const qc = useQueryClient();
  return useCallback(() => {
    if (!projectId) return;
    void qc.invalidateQueries({ queryKey: qk.runs(projectId) });
  }, [projectId, qc]);
}

/** Everything a finished run or a `project_updated` notice could have changed. */
export function useRefreshProject(projectId: string | undefined) {
  const qc = useQueryClient();
  return useCallback(() => {
    if (!projectId) return;
    void qc.invalidateQueries({ queryKey: qk.project(projectId) });
    void qc.invalidateQueries({ queryKey: qk.runs(projectId) });
    void qc.invalidateQueries({ queryKey: ["doc", projectId] });
    void qc.invalidateQueries({ queryKey: ["asset", projectId] });
    void qc.invalidateQueries({ queryKey: ["chat", projectId] });
    void qc.invalidateQueries({ queryKey: qk.projects });
  }, [projectId, qc]);
}
