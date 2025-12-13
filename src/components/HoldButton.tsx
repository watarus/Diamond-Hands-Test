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
  const isHoldingRef = useRef(isHolding);

  // Keep ref in sync with prop
  useEffect(() => {
    isHoldingRef.current = isHolding;
  }, [isHolding]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (!disabled) {
        onHoldStart();
      }
    },
    [disabled, onHoldStart]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      onHoldEnd();
    },
    [onHoldEnd]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (!disabled) {
        onHoldStart();
      }
    },
    [disabled, onHoldStart]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onHoldEnd();
    },
    [onHoldEnd]
  );

  // Handle touch/mouse events outside the button
  useEffect(() => {
    const handleGlobalEnd = () => {
      if (isHoldingRef.current) {
        onHoldEnd();
      }
    };

    // For mouse
    window.addEventListener("mouseup", handleGlobalEnd);

    // For touch - use passive: false to allow preventDefault if needed
    window.addEventListener("touchend", handleGlobalEnd, { passive: true });
    window.addEventListener("touchcancel", handleGlobalEnd, { passive: true });

    return () => {
      window.removeEventListener("mouseup", handleGlobalEnd);
      window.removeEventListener("touchend", handleGlobalEnd);
      window.removeEventListener("touchcancel", handleGlobalEnd);
    };
  }, [onHoldEnd]);

  return (
    <button
      ref={buttonRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
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
      style={{ touchAction: "none" }}
    >
      {isHolding ? (
        <span className="animate-pulse">HOLDING...</span>
      ) : (
        <span>HOLD</span>
      )}
    </button>
  );
}
