"use client";

import { useEffect, useRef } from "react";

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
  const isPressedRef = useRef(false);

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handlePointerDown = (e: PointerEvent) => {
      e.preventDefault();
      if (disabled) return;

      isPressedRef.current = true;
      // Capture pointer to receive events even if pointer leaves element
      button.setPointerCapture(e.pointerId);
      onHoldStart();
    };

    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault();
      if (!isPressedRef.current) return;

      isPressedRef.current = false;
      button.releasePointerCapture(e.pointerId);
      onHoldEnd();
    };

    const handlePointerCancel = (e: PointerEvent) => {
      if (!isPressedRef.current) return;

      isPressedRef.current = false;
      button.releasePointerCapture(e.pointerId);
      onHoldEnd();
    };

    // Use native event listeners for better control
    button.addEventListener("pointerdown", handlePointerDown);
    button.addEventListener("pointerup", handlePointerUp);
    button.addEventListener("pointercancel", handlePointerCancel);
    button.addEventListener("lostpointercapture", handlePointerCancel);

    return () => {
      button.removeEventListener("pointerdown", handlePointerDown);
      button.removeEventListener("pointerup", handlePointerUp);
      button.removeEventListener("pointercancel", handlePointerCancel);
      button.removeEventListener("lostpointercapture", handlePointerCancel);
    };
  }, [disabled, onHoldStart, onHoldEnd]);

  return (
    <button
      ref={buttonRef}
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
