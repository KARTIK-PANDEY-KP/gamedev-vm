import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon, type IconName } from "./Icon";

/** Every empty state says what to do next — never just "nothing here". */
export function EmptyState({
  icon,
  title,
  body,
  action,
  secondary,
  className,
  compact = false,
}: {
  icon?: IconName;
  title: string;
  body: ReactNode;
  action?: ReactNode;
  secondary?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rise flex flex-col items-center justify-center text-center",
        compact ? "gap-2.5 px-5 py-8" : "gap-3.5 px-6 py-16",
        className,
      )}
    >
      {icon ? (
        <span className="mb-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-ink-800 text-ember/80">
          <Icon name={icon} size={19} />
        </span>
      ) : null}
      <h3 className={cn("font-display text-paper", compact ? "text-xl" : "text-[26px]")} style={{ lineHeight: 1.15 }}>
        {title}
      </h3>
      <p className="max-w-[46ch] text-[13px] leading-relaxed text-paper-mute">{body}</p>
      {action ? <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
      {secondary ? <div className="mt-1 text-[12px] text-paper-faint">{secondary}</div> : null}
    </div>
  );
}
