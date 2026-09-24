import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Panel({
  title,
  subtitle,
  actions,
  footer,
  children,
  className,
  bodyClassName,
  flush = false,
  tone = "default",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
  tone?: "default" | "sunken";
}) {
  return (
    <section
      className={cn(
        "surface flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-line",
        tone === "sunken" ? "bg-ink-950" : "bg-ink-850",
        className,
      )}
    >
      {title || actions ? (
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-ink-800/60 px-3.5 py-2.5">
          <div className="min-w-0">
            <h2 className="micro truncate text-paper-mute">{title}</h2>
            {subtitle ? <p className="mt-1 truncate text-[12px] text-paper-faint">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("min-h-0 flex-1", flush ? "" : "p-4", bodyClassName)}>{children}</div>
      {footer ? <footer className="shrink-0 border-t border-line bg-ink-800/60 px-3.5 py-2.5">{footer}</footer> : null}
    </section>
  );
}
