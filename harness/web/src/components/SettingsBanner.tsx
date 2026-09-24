import { errorMessage } from "../lib/api";
import { useSettings } from "../lib/queries";
import { Icon } from "./ui/Icon";

export type ToolGap = { title: string; detail: string; tone: "bad" | "warn" };

export type ToolGaps = {
  gaps: ToolGap[];
  tone: "bad" | "warn" | null;
};

/** What is missing, and what each missing thing will break. */
export function useToolGaps(): ToolGaps {
  const { data, error } = useSettings();

  if (error) {
    return {
      tone: "bad",
      gaps: [
        {
          tone: "bad",
          title: "Cannot read /api/settings",
          detail: `${errorMessage(error)}. Nothing in this app will work until the harness backend is running.`,
        },
      ],
    };
  }

  if (!data) return { gaps: [], tone: null };

  const gaps: ToolGap[] = [];
  if (!data.openai_key_present) {
    gaps.push({
      tone: "warn",
      title: "No OpenAI key",
      detail:
        "Reference images cannot be generated. Design docs, the asset list, briefs and chat refinement are unaffected — they run on the agent CLI. Set OPENAI_API_KEY where the harness runs, then restart it.",
    });
  }
  const runtimes = data.runtimes ?? { codex: data.codex_present, claude: false };
  const installedRuntimes = Object.entries(runtimes)
    .filter(([, present]) => present)
    .map(([name]) => name);
  if (installedRuntimes.length === 0) {
    gaps.push({
      tone: "bad",
      title: "No agent runtime found",
      detail:
        "The steps that drive the agent — design set, asset list, briefs, builds — cannot start. Install the Codex CLI or Claude Code on this machine.",
    });
  }
  if (!data.blender_present) {
    gaps.push({
      tone: "warn",
      title: "Blender not found",
      detail:
        "Build in Blender will fail. Briefs and reference images are unaffected. If it is "
        + "installed somewhere unusual, set BLENDER_BIN to its executable and restart the harness.",
    });
  }

  const tone = gaps.length === 0 ? null : gaps.some((gap) => gap.tone === "bad") ? "bad" : "warn";
  return { gaps, tone };
}

export function SettingsBanner({ className }: { className?: string }) {
  const { gaps, tone } = useToolGaps();
  if (!tone || gaps.length === 0) return null;

  const edge = tone === "bad" ? "border-bad/35 bg-bad/[0.07]" : "border-warn/30 bg-warn/[0.06]";

  return (
    <div className={`rise space-y-2 rounded-[var(--radius-panel)] border px-4 py-3 ${edge} ${className ?? ""}`}>
      {gaps.map((gap) => {
        const accent = gap.tone === "bad" ? "text-bad" : "text-warn";
        return (
          <div key={gap.title} className="flex gap-3">
            <Icon name={gap.tone === "bad" ? "key" : "alert"} size={16} className={`mt-0.5 shrink-0 ${accent}`} />
            <div className="min-w-0">
              <p className={`text-[13px] font-semibold ${accent}`}>{gap.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-paper-dim">{gap.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ToolGapChip({ gaps, tone, open, onToggle }: ToolGaps & { open: boolean; onToggle: () => void }) {
  if (!tone || gaps.length === 0) return null;
  const accent = tone === "bad" ? "border-bad/40 text-bad hover:bg-bad/10" : "border-warn/35 text-warn hover:bg-warn/10";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className={`micro inline-flex items-center gap-1.5 rounded border px-2 py-1.5 transition-colors ${accent}`}
    >
      <Icon name="alert" size={12} />
      {gaps.length} missing
      <Icon name="chevronDown" size={11} className={open ? "rotate-180 transition-transform" : "transition-transform"} />
    </button>
  );
}
