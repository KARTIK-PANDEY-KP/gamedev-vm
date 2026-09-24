import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { Icon, type IconName } from "./Icon";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "link";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "border-ember/80 bg-ember text-ink-1000 font-semibold hover:bg-ember-bright hover:border-ember-bright shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_6px_18px_-10px_rgba(240,160,75,0.9)]",
  secondary: "border-line-strong bg-ink-750 text-paper hover:bg-ink-700 hover:border-ink-600",
  ghost: "border-transparent bg-transparent text-paper-dim hover:text-paper hover:bg-ink-800",
  danger: "border-line-strong bg-transparent text-bad hover:border-bad/60 hover:bg-bad/10",
  link: "border-transparent bg-transparent text-ember px-0 hover:text-ember-bright hover:underline underline-offset-4",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 gap-1.5 rounded px-2.5 text-[12px]",
  md: "h-9 gap-2 rounded-md px-3.5 text-[13px]",
  lg: "h-11 gap-2 rounded-md px-5 text-sm",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  children?: ReactNode;
};

export function Button({
  variant = "secondary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center border font-medium tracking-[-0.005em] transition-colors duration-150",
        "active:translate-y-px disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === "sm" ? 12 : 14} /> : icon ? <Icon name={icon} size={size === "sm" ? 13 : 15} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={size === "sm" ? 13 : 15} /> : null}
    </button>
  );
}

export function IconButton({
  icon,
  label,
  size = 15,
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: IconName; label: string; size?: number }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded border border-transparent text-paper-mute",
        "transition-colors hover:border-line-strong hover:bg-ink-750 hover:text-paper",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
