"use client";

import { useCallback, useEffect, useRef } from "react";

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
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (!disabled) {
        onHoldStart();
      }
    },
    [disabled, onHoldStart]
  );

  const handleEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (isHolding) {
        onHoldEnd();
      }
    },
    [isHolding, onHoldEnd]
  );

  // Handle mouse leaving the button while holding
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isHolding) {
        onHoldEnd();
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, [isHolding, onHoldEnd]);

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onContextMenu={(e) => e.preventDefault()}
      disabled={disabled}
      className={`
        hold-button
        w-64 h-64 rounded-full
        flex items-center justify-center
        text-3xl font-bold uppercase tracking-wider
        transition-all duration-200
        select-none touch-none
        ${
          isHolding
            ? "bg-diamond text-black scale-95 holding"
            : "bg-gradient-to-br from-diamond/80 to-diamond/40 text-white hover:scale-105"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {isHolding ? (
        <span className="animate-pulse">HOLDING...</span>
      ) : (
        <span>HOLD</span>
      )}
    </button>
  );
}
