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
  const holdHandlers = useHold(
    () => {
      if (!disabled) onHoldStart();
    },
    onHoldEnd
  );

  return (
    <button
      {...holdHandlers}
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
