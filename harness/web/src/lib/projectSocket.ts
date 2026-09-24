import { useEffect, useRef, useState } from "react";
import { wsUrl } from "./api";
import type { ProjectSocketEvent } from "./types";

/**
 * Keeps `WS /api/ws/projects/{id}` open for the whole workspace session and
 * reconnects for as long as the view is mounted. Returns the link state so the
 * header can say honestly whether the app is still hearing from the backend.
 */
export function useProjectSocket(
  projectId: string | undefined,
  onEvent: (event: ProjectSocketEvent) => void,
): { connected: boolean } {
  const [connected, setConnected] = useState(false);
  const handler = useRef(onEvent);
  handler.current = onEvent;

  useEffect(() => {
    if (!projectId) return;

    let disposed = false;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;

    const connect = () => {
      if (disposed) return;
      let sock: WebSocket;
      try {
        sock = new WebSocket(wsUrl(`/api/ws/projects/${encodeURIComponent(projectId)}`));
      } catch {
        schedule();
        return;
      }
      socket = sock;
      sock.onopen = () => {
        attempts = 0;
        if (!disposed) setConnected(true);
      };
      sock.onmessage = (message) => {
        if (disposed || typeof message.data !== "string") return;
        for (const line of message.data.split("\n")) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line) as ProjectSocketEvent;
            if (parsed && typeof parsed.type === "string") handler.current(parsed);
          } catch {
            /* a frame we cannot read is not worth tearing the socket down for */
          }
        }
      };
      sock.onclose = () => {
        socket = null;
        if (disposed) return;
        setConnected(false);
        schedule();
      };
    };

    const schedule = () => {
      attempts += 1;
      timer = setTimeout(connect, Math.min(10_000, 500 * 2 ** Math.min(attempts, 5)));
    };

    connect();

    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      if (socket) {
        socket.onclose = null;
        socket.close();
      }
      setConnected(false);
    };
  }, [projectId]);

  return { connected };
}
