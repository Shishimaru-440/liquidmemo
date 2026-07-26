"use client";

import { useEffect, useRef } from "react";
import type { InboxEvent } from "@/lib/types";

/** Subscribes to the server's SSE stream of external inbox file changes. */
export function useInboxEvents(onEvent: (event: InboxEvent) => void) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as InboxEvent;
        handlerRef.current(event);
      } catch {
        // heartbeat comments etc. arrive without onmessage firing; ignore any stray parse issue
      }
    };
    return () => source.close();
  }, []);
}
