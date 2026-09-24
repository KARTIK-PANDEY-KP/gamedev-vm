/** Shapes from harness/API.md. Fields the contract leaves open are optional. */

export const ASSET_CLASSES = [
  "character",
  "prop",
  "kit_piece",
  "environment",
  "material",
  "vfx",
  "ui",
] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];

export const TIERS = ["hero", "mid", "background"] as const;
export type Tier = (typeof TIERS)[number];

export const REF_VIEWS = ["front", "left", "back", "right"] as const;
export type RefView = (typeof REF_VIEWS)[number];

export const DOC_NAMES = ["vision", "game-design", "art-bible", "level-design", "audio"] as const;
export type DocName = (typeof DOC_NAMES)[number];

export type ProjectState = "new" | "design_ready" | "manifest_ready" | "assets_ready";

export type AssetEntry = {
  id: string;
  name: string;
  asset_class: AssetClass;
  tier: Tier;
  in_slice: boolean;
  derived_from: string[];
  has_brief: boolean;
  has_images: boolean;
  has_build: boolean;
  stale: boolean;
};

export type RunKind = "design" | "refine" | "manifest" | "brief" | "images" | "build";
export type RunStatus = "running" | "done" | "failed";
export type RunEventKind = "status" | "log" | "tool" | "error" | "result";

export type RunEvent = {
  ts: string;
  kind: RunEventKind;
  text: string;
};

export type Run = {
  id: string;
  project_id: string;
  kind: RunKind;
  scope: string | null;
  status: RunStatus;
  started_at: string;
  ended_at: string | null;
  events?: RunEvent[];
};

export type ProjectSummary = {
  id: string;
  name: string;
  idea: string;
  state: ProjectState;
  created_at: string;
};

export type DocRef = {
  name: string;
  title?: string;
  updated_at?: string;
};

export type Manifest = {
  accepted: boolean;
  entries: AssetEntry[];
};

export type ProjectDetail = ProjectSummary & {
  docs: DocRef[];
  manifest: Manifest | null;
  assets: AssetEntry[];
};

export type DocContent = {
  name: string;
  markdown: string;
  updated_at?: string;
};

export type AssetBuild = {
  path?: string;
  log?: string;
  status?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type AssetDetail = {
  entry: AssetEntry;
  brief_markdown: string | null;
  images: Partial<Record<string, string>>;
  build: AssetBuild | null;
  build_files?: Partial<Record<string, string>>;
};

export type ImageModelInfo = {
  name?: string;
  model?: string;
  size?: string;
  quality?: string;
  price_per_image_usd?: number;
  [key: string]: unknown;
};

export type Settings = {
  openai_key_present: boolean;
  codex_present: boolean;
  runtimes?: Record<string, boolean>;
  blender?: { present: boolean; path: string | null; version: string | null };
  blender_present: boolean;
  image_model?: ImageModelInfo | null;
};

/** Every run-starting endpoint answers with this. Cost fields appear when the
 *  call would spend money and has not been confirmed yet. */
export type RunStart = {
  run_id?: string | null;
  planned_images?: number | null;
  estimated_cost_usd?: number | null;
};

export type ChatRole = "user" | "assistant" | "system";

export type ChatMessage = {
  role: ChatRole;
  text: string;
  ts: string;
  run_id?: string | null;
};

export type ChatScope = string;

export type ProjectSocketEvent = {
  type: "project_updated" | "run_started" | "run_finished";
  run_id?: string;
  kind?: RunKind;
  scope?: string | null;
  status?: RunStatus;
  [key: string]: unknown;
};

export const DOC_TITLES: Record<DocName, string> = {
  vision: "Vision",
  "game-design": "Game design",
  "art-bible": "Art bible",
  "level-design": "Level design",
  audio: "Audio",
};

export const PROJECT_STATE_LABELS: Record<ProjectState, string> = {
  new: "New",
  design_ready: "Design ready",
  manifest_ready: "Manifest ready",
  assets_ready: "Assets ready",
};

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  character: "character",
  prop: "prop",
  kit_piece: "kit piece",
  environment: "environment",
  material: "material",
  vfx: "vfx",
  ui: "ui",
};

export type BuildCheck = {
  name: string;
  measured: string;
  pass: boolean;
};
