"use client";

import { useRef, useCallback } from "react";

interface UseHoldOptions {
  onStart?: () => void;
  onEnd?: () => void;
}

export const useHold = ({ onStart, onEnd }: UseHoldOptions = {}) => {
  const isHoldingRef = useRef(false);

  const handleStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // Prevent multi-touch
      if ("touches" in e && e.touches.length > 1) return;
      if (isHoldingRef.current) return;

      isHoldingRef.current = true;
      onStart?.();
    },
    [onStart]
  );

  const handleEnd = useCallback(() => {
    if (!isHoldingRef.current) return;

    isHoldingRef.current = false;
    onEnd?.();
  }, [onEnd]);

  const handleCancel = useCallback(() => {
    if (!isHoldingRef.current) return;

    isHoldingRef.current = false;
    onEnd?.();
  }, [onEnd]);

  return {
    handlers: {
      onTouchStart: handleStart,
      onTouchEnd: handleEnd,
      onTouchCancel: handleCancel,
      onMouseDown: handleStart,
      onMouseUp: handleEnd,
      onMouseLeave: handleCancel,
    },
    getIsHolding: () => isHoldingRef.current,
  };
};
