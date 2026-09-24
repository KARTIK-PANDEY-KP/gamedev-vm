import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "./Icon";

const CONTROL =
  "w-full rounded-md border border-line-strong bg-ink-900 text-paper placeholder:text-paper-faint " +
  "transition-colors focus:border-ember/60 focus:outline-none focus:ring-1 focus:ring-ember/25 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

export function Label({ children, hint, htmlFor }: { children: ReactNode; hint?: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between gap-3">
      <span className="micro text-paper-mute">{children}</span>
      {hint ? <span className="text-[11px] text-paper-faint">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-9 px-3 text-[13px]", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROL, "resize-none px-3 py-2.5 text-[13px] leading-relaxed", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, "h-8 appearance-none pl-2.5 pr-7 text-[12px]", className)} {...rest}>
        {children}
      </select>
      <Icon
        name="chevronDown"
        size={13}
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-paper-faint"
      />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border transition-colors duration-200",
        checked ? "border-ember/60 bg-ember/25" : "border-line-strong bg-ink-750",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      <span
        className={cn(
          "absolute top-[2px] h-3 w-3 rounded-full transition-all duration-200",
          checked ? "left-[15px] bg-ember" : "left-[2px] bg-ink-600",
        )}
      />
    </button>
  );
}
