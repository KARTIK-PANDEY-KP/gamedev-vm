import { Suspense, lazy } from "react";
import { cn } from "../lib/cn";

type RendererProps = { text: string };

/** micromark and its plugins are the bulk of the bundle; load them on demand. */
const Renderer = lazy(async () => {
  const [{ default: ReactMarkdown }, { default: remarkGfm }] = await Promise.all([
    import("react-markdown"),
    import("remark-gfm"),
  ]);
  return {
    default: ({ text }: RendererProps) => <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>,
  };
});

export function Markdown({ text, tight = false, className }: { text: string; tight?: boolean; className?: string }) {
  return (
    <div className={cn("md", tight && "md-tight", className)}>
      <Suspense fallback={<pre className="whitespace-pre-wrap font-sans text-paper-faint">{text}</pre>}>
        <Renderer text={text} />
      </Suspense>
    </div>
  );
}
