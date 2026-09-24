import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "../lib/api";
import { cn } from "../lib/cn";
import { relativeTime } from "../lib/format";
import { useChatHistory } from "../lib/queries";
import { useRunCenter } from "../state/RunCenter";
import type { ChatMessage } from "../lib/types";
import { Markdown } from "./Markdown";
import { Button } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { Spinner } from "./ui/Spinner";

type Props = {
  projectId: string;
  /** `design`, `design:<doc>`, `manifest` or `asset:<id>` — from API.md. */
  scope: string;
  /** Human wording for what a message will act on. */
  target: string;
};

export function ChatPanel({ projectId, scope, target }: Props) {
  const { data, isLoading, error } = useChatHistory(projectId, scope);
  const { start, stream, starting } = useRunCenter();
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string[]>([]);
  const scroller = useRef<HTMLDivElement | null>(null);
  const lastCount = useRef(0);

  const messages: ChatMessage[] = data ?? [];

  useEffect(() => {
    if (messages.length !== lastCount.current) {
      lastCount.current = messages.length;
      setPending([]);
    }
  }, [messages.length]);

  useEffect(() => {
    setDraft("");
    setPending([]);
    lastCount.current = 0;
  }, [scope]);

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages.length, pending.length, stream.events.length]);

  const runningHere = stream.status === "running" && stream.run?.scope === scope;
  const busy = starting !== null || runningHere;

  const send = () => {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    setPending((prev) => [...prev, text]);
    void start({
      label: `Chat — ${target}`,
      request: (extra) => api.sendChat(projectId, scope, text, extra),
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-line px-3.5 py-2.5">
        <Icon name="chat" size={14} className="text-ember/80" />
        <h2 className="micro text-paper-mute">Chat</h2>
        <span
          title="Messages are sent with this scope"
          className="ml-auto truncate rounded border border-line bg-ink-800 px-1.5 py-[3px] font-mono text-[10.5px] leading-none text-paper-mute"
        >
          {scope}
        </span>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-3.5 py-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-[12px] text-paper-faint">
            <Spinner size={12} /> loading history
          </div>
        ) : null}

        {error ? (
          <p className="rounded border border-warn/25 bg-warn/[0.07] px-3 py-2 text-[12px] text-warn">
            No history for this scope yet ({errorMessage(error)}).
          </p>
        ) : null}

        {!isLoading && messages.length === 0 && pending.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line-strong px-3.5 py-4">
            <p className="font-display text-[17px] leading-snug text-paper">Ask for a change to {target}.</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-paper-mute">
              Say what is wrong or what you want instead — “the keeper should read older and heavier”, “cut the
              props down to eight”. The harness reruns the agent with this in context and writes the result back to
              disk. Everything it does shows up in the run log below.
            </p>
          </div>
        ) : null}

        {messages.map((message, index) => (
          <Message key={`${message.ts}-${index}`} message={message} />
        ))}

        {pending.map((text, index) => (
          <Bubble key={`pending-${index}`} meta="sending" muted>
            {text}
          </Bubble>
        ))}

        {runningHere ? (
          <div className="flex items-start gap-2 rounded-lg border border-live/25 bg-live/[0.06] px-3 py-2.5">
            <Spinner size={12} className="mt-0.5 shrink-0 text-live" />
            <div className="min-w-0">
              <p className="micro text-live">working</p>
              <p className="mt-1 truncate font-mono text-[11.5px] text-paper-mute">
                {stream.events.at(-1)?.text ?? "starting…"}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-line bg-ink-800/50 p-2.5">
        <textarea
          value={draft}
          rows={3}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              event.preventDefault();
              send();
            }
          }}
          placeholder={`Refine ${target}…`}
          className="w-full resize-none rounded-md border border-line-strong bg-ink-900 px-3 py-2.5 text-[13px] leading-relaxed text-paper placeholder:text-paper-faint focus:border-ember/60 focus:outline-none focus:ring-1 focus:ring-ember/25"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-[10.5px] text-paper-faint">⌘↵ to send</span>
          <Button variant="primary" size="sm" icon="send" onClick={send} disabled={!draft.trim() || busy}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <Bubble meta={relativeTime(message.ts)}>
        {message.text}
      </Bubble>
    );
  }
  if (message.role === "system") {
    return (
      <p className="px-1 font-mono text-[11px] leading-relaxed text-paper-faint">{message.text}</p>
    );
  }
  return (
    <div className="px-1">
      <div className="micro mb-1.5 flex items-center gap-2 text-paper-faint">
        <span className="text-ember/80">harness</span>
        <span>{relativeTime(message.ts)}</span>
      </div>
      <Markdown text={message.text} tight />
    </div>
  );
}

function Bubble({
  children,
  meta,
  muted = false,
}: {
  children: string;
  meta: string;
  muted?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border-l-2 border-ember/60 bg-ink-800 px-3 py-2.5",
        muted && "opacity-60",
      )}
    >
      <div className="micro mb-1.5 flex items-center gap-2 text-paper-faint">
        <span>you</span>
        <span>{meta}</span>
      </div>
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-paper-dim">{children}</p>
    </div>
  );
}
