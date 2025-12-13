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

  const handleStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // Multi-touch prevention
      if ("touches" in e && e.touches.length > 1) return;

      // Get coordinates
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      isHoldingRef.current = true;
      startTimeRef.current = performance.now();
      startCoordRef.current = { x: clientX, y: clientY };

      onStart?.();
    },
    [onStart]
  );

  const handleMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isHoldingRef.current || !startCoordRef.current) return;

      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const distance = getDistance(
        startCoordRef.current.x,
        startCoordRef.current.y,
        clientX,
        clientY
      );

      if (distance > moveThreshold) {
        isHoldingRef.current = false;
        startTimeRef.current = null;
        startCoordRef.current = null;
        onFail?.("moved");
      }
    },
    [moveThreshold, onFail]
  );

  const handleEnd = useCallback(() => {
    if (!isHoldingRef.current || !startTimeRef.current) return;

    const endTime = performance.now();
    const duration = endTime - startTimeRef.current;

    isHoldingRef.current = false;
    startTimeRef.current = null;
    startCoordRef.current = null;

    onSuccess?.(duration);
  }, [onSuccess]);

  const handleCancel = useCallback(() => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      startTimeRef.current = null;
      startCoordRef.current = null;
      onFail?.("canceled");
    }
  }, [onFail]);

  return {
    handlers: {
      onTouchStart: handleStart,
      onTouchMove: handleMove,
      onTouchEnd: handleEnd,
      onTouchCancel: handleCancel,
      onMouseDown: handleStart,
      onMouseMove: handleMove,
      onMouseUp: handleEnd,
      onMouseLeave: handleCancel,
    },
    getIsHolding: () => isHoldingRef.current,
  };
};
