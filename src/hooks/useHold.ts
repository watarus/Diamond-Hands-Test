"use client";

import { useRef, useCallback } from "react";

interface HoldGameOptions {
  moveThreshold?: number;
  onStart?: () => void;
  onSuccess?: (durationMs: number) => void;
  onFail?: (reason: "moved" | "canceled") => void;
}

export const useHold = ({
  moveThreshold = 10,
  onStart,
  onSuccess,
  onFail,
}: HoldGameOptions = {}) => {
  const startTimeRef = useRef<number | null>(null);
  const startCoordRef = useRef<{ x: number; y: number } | null>(null);
  const isHoldingRef = useRef(false);

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.hypot(x2 - x1, y2 - y1);
  };

  // PointerDown
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Left click (0) or touch only
      if (e.button !== 0) return;

      // Set pointer capture - events will be received even if pointer leaves element
      (e.target as Element).setPointerCapture(e.pointerId);

      isHoldingRef.current = true;
      startTimeRef.current = performance.now();
      startCoordRef.current = { x: e.clientX, y: e.clientY };

      if (onStart) onStart();
    },
    [onStart]
  );

  // PointerMove
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isHoldingRef.current || !startCoordRef.current) return;

      const distance = getDistance(
        startCoordRef.current.x,
        startCoordRef.current.y,
        e.clientX,
        e.clientY
      );

      if (distance > moveThreshold) {
        isHoldingRef.current = false;
        startTimeRef.current = null;
        startCoordRef.current = null;
        if (onFail) onFail("moved");
      }
    },
    [moveThreshold, onFail]
  );

  // PointerUp
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isHoldingRef.current || !startTimeRef.current) return;

      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;

      isHoldingRef.current = false;
      startTimeRef.current = null;
      startCoordRef.current = null;

      if (onSuccess) onSuccess(duration);
    },
    [onSuccess]
  );

  // PointerCancel
  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      if (isHoldingRef.current) {
        isHoldingRef.current = false;
        startTimeRef.current = null;
        startCoordRef.current = null;
        if (onFail) onFail("canceled");
      }
    },
    [onFail]
  );

  return {
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onPointerLeave: handlePointerCancel,
    },
    getIsHolding: () => isHoldingRef.current,
  };
};
