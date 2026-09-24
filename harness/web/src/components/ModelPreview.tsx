import "@google/model-viewer";
import type { CSSProperties } from "react";

export type ModelViewerStyle = CSSProperties;

/** `model-viewer` is a web component, so React needs its shape declared. */
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": {
        src: string;
        alt?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string;
        "environment-image"?: string;
        exposure?: string;
        style?: CSSProperties;
        class?: string;
      };
    }
  }
}

interface ModelPreviewProps {
  src: string;
  label: string;
}

/** The built mesh, turntabling. Drag to orbit, scroll to zoom. */
export function ModelPreview({ src, label }: ModelPreviewProps) {
  return (
    <div className="overflow-hidden rounded border border-line bg-ink-950">
      <model-viewer
        src={src}
        alt={label}
        camera-controls
        auto-rotate
        shadow-intensity="0.6"
        exposure="1.1"
        style={{ width: "100%", height: "320px", backgroundColor: "transparent" }}
      />
      <p className="border-t border-line px-3 py-2 font-mono text-[11px] text-paper-faint">
        drag to orbit · scroll to zoom
      </p>
    </div>
  );
}
