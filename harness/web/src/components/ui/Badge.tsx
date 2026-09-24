import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type BadgeTone = "neutral" | "muted" | "ember" | "ok" | "bad" | "warn" | "live" | "outline";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-line-strong bg-ink-750 text-paper-dim",
  muted: "border-line bg-ink-800 text-paper-faint",
  ember: "border-ember/35 bg-ember/12 text-ember",
  ok: "border-ok/30 bg-ok/10 text-ok",
  bad: "border-bad/35 bg-bad/12 text-bad",
  warn: "border-warn/30 bg-warn/10 text-warn",
  live: "border-live/35 bg-live/12 text-live",
  outline: "border-line-strong bg-transparent text-paper-mute",
};

export function Badge({
  tone = "neutral",
  children,
  dot = false,
  pulse = false,
  title,
  className,
  mono = false,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  title?: string;
  className?: string;
  mono?: boolean;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded border px-1.5 py-[3px] text-[10px] font-semibold uppercase leading-none tracking-[0.08em]",
        mono && "font-mono tracking-[0.04em]",
        TONES[tone],
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full bg-current", pulse && "beacon")} /> : null}
      {children}
    </span>
  );
}
