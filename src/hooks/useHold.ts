"use client";

import { useRef, useCallback, useEffect } from "react";

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

  // Stable callback refs - won't cause handler recreation
  const onStartRef = useRef(onStart);
  const onSuccessRef = useRef(onSuccess);
  const onFailRef = useRef(onFail);

  useEffect(() => {
    onStartRef.current = onStart;
    onSuccessRef.current = onSuccess;
    onFailRef.current = onFail;
  });

  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.hypot(x2 - x1, y2 - y1);
  };

  // PointerDown - no dependencies, uses refs for stability
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      console.log("[useHold] PointerDown", { button: e.button, pointerId: e.pointerId, pointerType: e.pointerType });

      // Left click (0) or touch only
      if (e.button !== 0) {
        console.log("[useHold] Ignoring non-left click");
        return;
      }

      // Set pointer capture - events will be received even if pointer leaves element
      (e.target as Element).setPointerCapture(e.pointerId);
      console.log("[useHold] Pointer captured");

      isHoldingRef.current = true;
      startTimeRef.current = performance.now();
      startCoordRef.current = { x: e.clientX, y: e.clientY };

      console.log("[useHold] Calling onStart, isHoldingRef:", isHoldingRef.current);
      onStartRef.current?.();
    },
    [] // Empty deps - handler is stable
  );

  // PointerMove - uses ref for moveThreshold
  const moveThresholdRef = useRef(moveThreshold);
  moveThresholdRef.current = moveThreshold;

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isHoldingRef.current || !startCoordRef.current) return;

      const distance = getDistance(
        startCoordRef.current.x,
        startCoordRef.current.y,
        e.clientX,
        e.clientY
      );

      if (distance > moveThresholdRef.current) {
        console.log("[useHold] PointerMove - moved too much", { distance, moveThreshold: moveThresholdRef.current });
        isHoldingRef.current = false;
        startTimeRef.current = null;
        startCoordRef.current = null;
        onFailRef.current?.("moved");
      }
    },
    [] // Empty deps - handler is stable
  );

  // PointerUp
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      console.log("[useHold] PointerUp", { isHolding: isHoldingRef.current, hasStartTime: !!startTimeRef.current });

      if (!isHoldingRef.current || !startTimeRef.current) {
        console.log("[useHold] PointerUp - ignored (not holding)");
        return;
      }

      const endTime = performance.now();
      const duration = endTime - startTimeRef.current;

      console.log("[useHold] PointerUp - success", { duration });

      isHoldingRef.current = false;
      startTimeRef.current = null;
      startCoordRef.current = null;

      onSuccessRef.current?.(duration);
    },
    [] // Empty deps - handler is stable
  );

  // PointerCancel
  const handlePointerCancel = useCallback(
    (e: React.PointerEvent) => {
      console.log("[useHold] PointerCancel", { isHolding: isHoldingRef.current });

      if (isHoldingRef.current) {
        isHoldingRef.current = false;
        startTimeRef.current = null;
        startCoordRef.current = null;
        onFailRef.current?.("canceled");
      }
    },
    [] // Empty deps - handler is stable
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
