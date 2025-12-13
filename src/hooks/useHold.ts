"use client";

import { useRef, useCallback } from "react";

export const useHold = (
  onHoldStart: () => void,
  onHoldEnd: () => void
) => {
  const isHolding = useRef(false);
  const target = useRef<EventTarget | null>(null);

  const preventDefault = useCallback((event: Event) => {
    if ("touches" in event && (event as TouchEvent).touches.length < 2) {
      event.preventDefault();
    }
  }, []);

  const start = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      if (isHolding.current) return;

      // Prevent default touch behaviors
      if (event.target) {
        event.target.addEventListener("touchend", preventDefault, { passive: false });
        event.target.addEventListener("touchmove", preventDefault, { passive: false });
        event.target.addEventListener("contextmenu", preventDefault);
        target.current = event.target;
      }

      isHolding.current = true;
      onHoldStart();
    },
    [onHoldStart, preventDefault]
  );

  const end = useCallback(
    () => {
      if (!isHolding.current) return;

      // Clean up event listeners
      if (target.current) {
        target.current.removeEventListener("touchend", preventDefault);
        target.current.removeEventListener("touchmove", preventDefault);
        target.current.removeEventListener("contextmenu", preventDefault);
        target.current = null;
      }

      isHolding.current = false;
      onHoldEnd();
    },
    [onHoldEnd, preventDefault]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: () => end(),
    onMouseLeave: () => end(),
    onTouchEnd: () => end(),
    onTouchCancel: () => end(),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
};
