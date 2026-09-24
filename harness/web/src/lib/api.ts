import type {
  AssetDetail,
  AssetEntry,
  ChatMessage,
  DocContent,
  ProjectDetail,
  ProjectSummary,
  RefView,
  Run,
  RunStart,
  Settings,
} from "./types";

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string, path: string) {
    super(detail ? `${status} ${path} — ${detail}` : `${status} ${path}`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : null),
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(0, "the harness backend is not reachable", path);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const text = await res.text();
      try {
        const parsed = JSON.parse(text) as { detail?: unknown; error?: unknown };
        detail = String(parsed.detail ?? parsed.error ?? text).slice(0, 400);
      } catch {
        detail = text.slice(0, 400);
      }
    } catch {
      detail = res.statusText;
    }
    throw new ApiError(res.status, detail, path);
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? "{}" : JSON.stringify(body) });

const put = <T,>(path: string, body: unknown) =>
  request<T>(path, { method: "PUT", body: JSON.stringify(body) });

const p = (id: string) => `/api/projects/${encodeURIComponent(id)}`;

export const api = {
  settings: () => request<Settings>("/api/settings"),

  listProjects: () => request<ProjectSummary[]>("/api/projects"),
  createProject: (body: { name: string; idea: string }) => post<ProjectSummary>("/api/projects", body),
  getProject: (id: string) => request<ProjectDetail>(p(id)),
  deleteProject: (id: string) => request<{ ok: boolean }>(p(id), { method: "DELETE" }),

  getDoc: (id: string, doc: string) => request<DocContent>(`${p(id)}/docs/${encodeURIComponent(doc)}`),
  saveDoc: (id: string, doc: string, markdown: string) =>
    put<{ ok: boolean }>(`${p(id)}/docs/${encodeURIComponent(doc)}`, { markdown }),

  runDesign: (id: string, extra?: Record<string, unknown>) => post<RunStart>(`${p(id)}/steps/design`, extra ?? {}),
  runManifest: (id: string, extra?: Record<string, unknown>) => post<RunStart>(`${p(id)}/steps/manifest`, extra ?? {}),
  acceptManifest: (id: string, entries: AssetEntry[]) => post<{ ok: boolean }>(`${p(id)}/manifest/accept`, { entries }),

  getAsset: (id: string, assetId: string) => request<AssetDetail>(`${p(id)}/assets/${encodeURIComponent(assetId)}`),
  runBrief: (id: string, assetId: string, extra?: Record<string, unknown>) =>
    post<RunStart>(`${p(id)}/assets/${encodeURIComponent(assetId)}/brief`, extra ?? {}),
  runImages: (id: string, assetId: string, body?: Record<string, unknown>) =>
    post<RunStart>(`${p(id)}/assets/${encodeURIComponent(assetId)}/images`, body ?? {}),
  runBuild: (id: string, assetId: string, extra?: Record<string, unknown>) =>
    post<RunStart>(`${p(id)}/assets/${encodeURIComponent(assetId)}/build`, extra ?? {}),

  sendChat: (id: string, scope: string, message: string, extra?: Record<string, unknown>) =>
    post<RunStart>(`${p(id)}/chat`, { scope, message, ...extra }),
  getChat: (id: string, scope: string) =>
    request<ChatMessage[]>(`${p(id)}/chat/${encodeURIComponent(scope)}`),

  getRun: (runId: string) => request<Run>(`/api/runs/${encodeURIComponent(runId)}`),
  listRuns: (id: string) => request<Run[]>(`${p(id)}/runs`),
};

/** Reference image bytes. `bust` re-fetches after a regeneration. */
export function refUrl(projectId: string, assetId: string, view: RefView | string, bust?: string | number): string {
  const base = `${p(projectId)}/assets/${encodeURIComponent(assetId)}/refs/${encodeURIComponent(view)}.png`;
  return bust ? `${base}?v=${encodeURIComponent(String(bust))}` : base;
}

/** Same-origin in production; the dev server proxies /api/ws to the backend. */
export function wsUrl(path: string): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}${path}`;
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.detail || `request failed (${error.status})`;
  if (error instanceof Error) return error.message;
  return String(error);
}
