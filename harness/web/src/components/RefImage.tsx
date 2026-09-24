import { useEffect, useState } from "react";
import { refUrl } from "../lib/api";
import { cn } from "../lib/cn";
import { Icon } from "./ui/Icon";

/** A reference render, or an honest placeholder saying which view is missing. */
export function RefImage({
  projectId,
  assetId,
  view,
  version,
  expected,
  src,
  className,
  large = false,
}: {
  projectId: string;
  assetId: string;
  view: string;
  version: number;
  /** Whether the manifest claims this asset has images. */
  expected: boolean;
  /** URL from the asset detail payload, when the backend supplied one. */
  src?: string;
  className?: string;
  large?: boolean;
}) {
  const [broken, setBroken] = useState(!expected);

  useEffect(() => {
    setBroken(!expected);
  }, [expected, version]);

  if (broken) {
    return (
      <div
        title={`No ${view} reference yet`}
        className={cn(
          "flex aspect-square flex-col items-center justify-center gap-1.5 border border-line bg-ink-950 text-paper-faint",
          "bg-[repeating-linear-gradient(135deg,transparent,transparent_7px,rgba(255,255,255,0.022)_7px,rgba(255,255,255,0.022)_8px)]",
          className,
        )}
      >
        <Icon name="image" size={large ? 20 : 14} className="opacity-40" />
        <span className={cn("font-mono uppercase tracking-wider", large ? "text-[11px]" : "text-[9px]")}>{view}</span>
      </div>
    );
  }

  return (
    <img
      src={src ? `${src}${src.includes("?") ? "&" : "?"}v=${version}` : refUrl(projectId, assetId, view, version)}
      alt={`${view} reference`}
      loading="lazy"
      onError={() => setBroken(true)}
      className={cn("aspect-square w-full border border-line bg-ink-950 object-cover", className)}
    />
  );
}
