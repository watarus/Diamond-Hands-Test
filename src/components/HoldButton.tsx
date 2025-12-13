"use client";

import { useRef, useCallback } from "react";

interface HoldButtonProps {
  onHoldStart: () => void;
  onHoldEnd: () => void;
  isHolding: boolean;
  disabled?: boolean;
}

export function HoldButton({
  onHoldStart,
  onHoldEnd,
  isHolding,
  disabled = false,
}: HoldButtonProps) {
  const isActiveRef = useRef(false);
  const targetRef = useRef<EventTarget | null>(null);

  const preventDefault = useCallback((e: Event) => {
    if (e.cancelable) {
      e.preventDefault();
    }
  }, []);

  const handleStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (disabled || isActiveRef.current) return;

      // Prevent default touch behaviors (scrolling, zooming, context menu)
      if (e.target) {
        e.target.addEventListener("touchend", preventDefault, { passive: false });
        e.target.addEventListener("touchmove", preventDefault, { passive: false });
        e.target.addEventListener("contextmenu", preventDefault);
        targetRef.current = e.target;
      }

      isActiveRef.current = true;
      onHoldStart();
    },
    [disabled, onHoldStart, preventDefault]
  );

  const handleEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isActiveRef.current) return;

      // Clean up event listeners
      if (targetRef.current) {
        targetRef.current.removeEventListener("touchend", preventDefault);
        targetRef.current.removeEventListener("touchmove", preventDefault);
        targetRef.current.removeEventListener("contextmenu", preventDefault);
        targetRef.current = null;
      }

      isActiveRef.current = false;
      onHoldEnd();
    },
    [onHoldEnd, preventDefault]
  );

  const handleCancel = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      // Same as handleEnd but for cancel/leave scenarios
      handleEnd(e);
    },
    [handleEnd]
  );

  return (
    <button
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onTouchCancel={handleCancel}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleCancel}
      onContextMenu={(e) => e.preventDefault()}
      disabled={disabled}
      className={`
        hold-button
        w-64 h-64 rounded-full
        flex items-center justify-center
        text-3xl font-bold uppercase tracking-wider
        transition-all duration-200
        select-none
        ${
          isHolding
            ? "bg-diamond text-black scale-95 holding"
            : "bg-gradient-to-br from-diamond/80 to-diamond/40 text-white hover:scale-105"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      style={{
        touchAction: "none",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    >
      {isHolding ? (
        <span className="animate-pulse">HOLDING...</span>
      ) : (
        <span>HOLD</span>
      )}
    </button>
  );
}
