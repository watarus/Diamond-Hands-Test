"use client";

import { useHold } from "@/hooks/useHold";

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
  const { handlers } = useHold({
    moveThreshold: 50, // 50px tolerance for finger movement
    onStart: () => {
      if (!disabled) onHoldStart();
    },
    onSuccess: () => {
      onHoldEnd();
    },
    onFail: (reason) => {
      console.log("Hold failed:", reason);
      onHoldEnd();
    },
  });

  return (
    <button
      {...handlers}
      disabled={disabled}
      style={{
        width: "256px",
        height: "256px",
        borderRadius: "50%",
        border: "none",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        outline: "none",
      }}
      className={`
        hold-button
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
    >
      {isHolding ? (
        <span className="animate-pulse">HOLDING...</span>
      ) : (
        <span>HOLD</span>
      )}
    </button>
  );
}
