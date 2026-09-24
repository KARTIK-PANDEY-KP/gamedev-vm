import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type TabItem = {
  value: string;
  label: string;
  badge?: ReactNode;
  dim?: boolean;
  title?: string;
};

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex items-stretch gap-0.5 overflow-x-auto border-b border-line", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            title={item.title}
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "group relative flex items-center gap-2 whitespace-nowrap px-3.5 py-2.5 text-[13px] transition-colors",
              active ? "text-paper" : item.dim ? "text-paper-faint hover:text-paper-mute" : "text-paper-mute hover:text-paper-dim",
            )}
          >
            <span className={cn(active && "font-medium")}>{item.label}</span>
            {item.badge}
            <span
              className={cn(
                "absolute inset-x-2 -bottom-px h-0.5 rounded-full transition-all duration-200",
                active ? "bg-ember" : "bg-transparent group-hover:bg-ink-600",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
