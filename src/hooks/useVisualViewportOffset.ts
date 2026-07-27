"use client";

import { useEffect } from "react";

/**
 * iOS Safari doesn't actually resize the layout viewport when the on-screen keyboard
 * opens — it shrinks the *visual* viewport and scrolls the page underneath it, which
 * drags position:fixed elements (anchored to the layout viewport) along for the ride
 * even when html/body themselves can't scroll. Tracking window.visualViewport and
 * exposing its offset as a CSS var lets fixed elements re-anchor to wherever the
 * visual viewport's top actually is.
 */
export function useVisualViewportOffset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      document.documentElement.style.setProperty("--vv-offset-top", `${vv.offsetTop}px`);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);
}
