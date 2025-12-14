"use client";

interface TimerProps {
  elapsed: number;
  threshold: number;
}

export function Timer({ elapsed, threshold }: TimerProps) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = Math.floor(elapsed % 60);

  const progress = Math.min((elapsed / threshold) * 100, 100);
  const isDiamondHands = elapsed >= threshold;

  return (
    <div className="text-center space-y-4">
      {/* Timer Display */}
      <div
        className={`
          font-mono text-6xl font-bold tracking-widest
          ${isDiamondHands ? "text-diamond" : "text-white"}
        `}
      >
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-md mx-auto">
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={`
              h-full transition-all duration-100 ease-linear
              ${isDiamondHands ? "bg-diamond" : "bg-gradient-to-r from-paper to-diamond"}
            `}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0s</span>
          <span className="text-diamond">{threshold}s = Diamond Hands 💎</span>
        </div>
      </div>

      {/* Status Message */}
      {isDiamondHands && (
        <div className="text-diamond text-xl font-bold animate-pulse">
          💎 DIAMOND HANDS ACHIEVED! 💎
        </div>
      )}
    </div>
  );
}
