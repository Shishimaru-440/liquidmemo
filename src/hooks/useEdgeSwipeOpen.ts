"use client";

import { useCallback, useRef } from "react";

const EDGE_ZONE_PX = 24; // only swipes starting within this many px of the left edge count
const OPEN_THRESHOLD_PX = 60;

/**
 * Returns pointer handlers (spread onto the page's root element) that open the sidebar
 * when the user swipes right starting from the screen's left edge — the standard
 * "edge swipe to open a drawer" gesture, alongside the hamburger button.
 */
export function useEdgeSwipeOpen(onOpen: () => void, enabled: boolean) {
  const trackingRef = useRef(false);
  const startXRef = useRef(0);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled || e.clientX > EDGE_ZONE_PX) {
        trackingRef.current = false;
        return;
      }
      trackingRef.current = true;
      startXRef.current = e.clientX;
    },
    [enabled]
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!trackingRef.current) return;
    if (e.clientX - startXRef.current > OPEN_THRESHOLD_PX) {
      trackingRef.current = false;
      onOpen();
    }
  }, [onOpen]);

  const stopTracking = useCallback(() => {
    trackingRef.current = false;
  }, []);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp: stopTracking,
    onPointerCancel: stopTracking,
  };
}
