import { useEffect, useRef } from "react";
import { cn } from "../lib/cn";
import { clockTime } from "../lib/format";
import type { RunEvent } from "../lib/types";

const KIND_STYLE: Record<string, { label: string; text: string; chip: string }> = {
  status: { label: "status", text: "text-ember", chip: "text-ember/80" },
  log: { label: "log", text: "text-paper-dim", chip: "text-paper-faint" },
  tool: { label: "tool", text: "text-live", chip: "text-live/75" },
  error: { label: "error", text: "text-bad", chip: "text-bad/80" },
  result: { label: "result", text: "text-ok", chip: "text-ok/80" },
};

export function RunEvents({
  events,
  className,
  emptyHint = "Waiting for the first event…",
  autoScroll = true,
}: {
  events: RunEvent[];
  className?: string;
  emptyHint?: string;
  autoScroll?: boolean;
}) {
  const scroller = useRef<HTMLDivElement | null>(null);
  const pinned = useRef(true);

  useEffect(() => {
    const node = scroller.current;
    if (!node || !autoScroll || !pinned.current) return;
    node.scrollTop = node.scrollHeight;
  }, [events, autoScroll]);

  const onScroll = () => {
    const node = scroller.current;
    if (!node) return;
    pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 48;
  };

  if (events.length === 0) {
    return (
      <div className={cn("flex items-center px-4 py-5 font-mono text-[11.5px] text-paper-faint", className)}>
        {emptyHint}
      </div>
    );
  }

  return (
    <div ref={scroller} onScroll={onScroll} className={cn("overflow-y-auto px-1 py-1.5", className)}>
      {events.map((event, index) => {
        const style = KIND_STYLE[event.kind] ?? KIND_STYLE.log;
        return (
          <div
            key={`${event.ts}-${index}`}
            className={cn(
              "group flex gap-2.5 rounded px-2.5 py-[3px] font-mono text-[11.5px] leading-[1.55] hover:bg-ink-800/70",
              event.kind === "error" && "bg-bad/[0.06]",
            )}
          >
            <span className="shrink-0 select-none text-paper-faint/70">{clockTime(event.ts)}</span>
            <span className={cn("w-[44px] shrink-0 select-none text-right text-[10px] uppercase tracking-wider", style.chip)}>
              {style.label}
            </span>
            <span className={cn("min-w-0 whitespace-pre-wrap break-words", style.text)}>{event.text}</span>
          </div>
        );
      })}
    </div>
  );
}
