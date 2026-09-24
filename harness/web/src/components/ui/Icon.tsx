import type { ReactNode } from "react";

export type IconName =
  | "design"
  | "manifest"
  | "assets"
  | "runs"
  | "plus"
  | "back"
  | "send"
  | "chevronDown"
  | "chevronRight"
  | "pencil"
  | "check"
  | "close"
  | "image"
  | "cube"
  | "alert"
  | "key"
  | "refresh"
  | "trash"
  | "terminal"
  | "spark"
  | "tool"
  | "chat"
  | "clock"
  | "filter"
  | "dot"
  | "coin";

const GLYPHS: Record<IconName, ReactNode> = {
  design: (
    <>
      <path d="M7 3h7.5L19 7.5V21H7z" />
      <path d="M14 3v5h5" />
      <path d="M10 12h6M10 15.5h6M10 8.5h2.5" />
    </>
  ),
  manifest: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="M4 9.5h16M9.5 9.5V19" />
    </>
  ),
  assets: (
    <>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </>
  ),
  runs: <path d="M3 12h3.5l2.5 7 4-15 2.5 8H21" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  back: <path d="M10 18.5 3.5 12 10 5.5M3.5 12H20" />,
  send: <path d="M21 3.5 3.5 10.8l7 2.7 2.7 7L21 3.5z" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  pencil: (
    <>
      <path d="M4 20h4L20 8l-4-4L4 16v4z" />
      <path d="m14.5 5.5 4 4" />
    </>
  ),
  check: <path d="m4.5 12.5 5 5L20 6.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  image: (
    <>
      <path d="M3.5 5h17v14h-17z" />
      <path d="m3.5 16 4.5-4.5 3.5 3.5 3-3 6 6" />
      <circle cx="8.75" cy="9.25" r="1.25" />
    </>
  ),
  cube: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 12.2 20 7.6M12 12.2V21M12 12.2 4 7.6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 4 21 20H3L12 4z" />
      <path d="M12 10v4.5M12 17.4v.1" />
    </>
  ),
  key: (
    <>
      <circle cx="8.5" cy="15.5" r="3.5" />
      <path d="M11 13 20 4M17 7l2.5 2.5M14.5 9.5 17 12" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20.5 3.5v4.2h-4.2" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M10 7V4.5h4V7" />
      <path d="m6.8 7 1 12.5h8.4L17.2 7" />
    </>
  ),
  terminal: (
    <>
      <path d="M4 5h16v14H4z" />
      <path d="m8 10 2.5 2L8 14M13 14.5h3.5" />
    </>
  ),
  spark: <path d="m12 3.5 1.9 5.1 5.1 1.9-5.1 1.9-1.9 5.1-1.9-5.1L5 10.5l5.1-1.9L12 3.5z" />,
  tool: (
    <>
      <path d="M20.2 5.3a4.6 4.6 0 0 1-6 6L5.6 19.9a1.7 1.7 0 0 1-2.4-2.4l8.6-8.6a4.6 4.6 0 0 1 6-6l-2.9 2.9 2.4 2.4 2.9-2.9z" />
    </>
  ),
  chat: <path d="M4 5h16v11h-9l-5.5 4.2V16H4V5z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  filter: <path d="M4 5h16l-6.2 7.3V19l-3.6 2v-8.7L4 5z" />,
  dot: <circle cx="12" cy="12" r="4.5" fill="currentColor" stroke="none" />,
  coin: (
    <>
      <ellipse cx="12" cy="7" rx="7.5" ry="3.2" />
      <path d="M4.5 7v10c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2V7" />
      <path d="M4.5 12c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2" />
    </>
  ),
};

export function Icon({
  name,
  size = 16,
  className,
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS[name]}
    </svg>
  );
}
