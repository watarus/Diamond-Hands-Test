"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useGame } from "@/hooks/useGame";
import { useMint } from "@/hooks/useMint";
import { useFrameSDK } from "@/hooks/useFrameSDK";
import { HoldButton } from "@/components/HoldButton";
import { Timer } from "@/components/Timer";
import { FudTicker } from "@/components/FudTicker";
import { ResultScreen } from "@/components/ResultScreen";
import { ConnectWallet } from "@/components/ConnectWallet";

export default function Home() {
  const { isSDKLoaded } = useFrameSDK();
  const { isConnected, address } = useAccount();
  const {
    gameState,
    elapsedTime,
    result,
    startGame,
    endGame,
    resetGame,
    DIAMOND_HANDS_THRESHOLD,
  } = useGame();

  const { mint, hash, isPending, isConfirming, isConfirmed, error } = useMint();

  // Show error message
  useEffect(() => {
    if (error) {
      console.error("Minting error:", error);
      alert("Minting failed. Please try again.");
    }
  }, [error]);

  const handleMint = async () => {
    if (!isConnected || !result || !address) return;
    mint(address, result.duration);
  };

  const isMinting = isPending || isConfirming;

  // Progressive screen effects based on elapsed time
  const getScreenEffects = () => {
    if (gameState !== "holding") return "";

    const effects: string[] = [];

    if (elapsedTime > 30) effects.push("screen-shake");
    if (elapsedTime > 45) effects.push("screen-flicker");
    if (elapsedTime > 50) {
      effects.length = 0; // Clear previous
      effects.push("screen-shake-intense", "screen-flicker");
    }
    if (elapsedTime > 55) {
      effects.length = 0;
      effects.push("chaos-mode");
    }

    return effects.join(" ");
  };

  // Show red flash overlay in final seconds
  const showRedFlash = gameState === "holding" && elapsedTime > 50;
  const showWarningPulse = gameState === "holding" && elapsedTime > 45;

  return (
    <main className={`min-h-screen relative ${getScreenEffects()}`}>
      {/* Red flash overlay for final seconds */}
      {showRedFlash && (
        <div className="fixed inset-0 pointer-events-none z-40 red-flash" />
      )}
      {/* Warning pulse border */}
      {showWarningPulse && (
        <div className="fixed inset-0 pointer-events-none z-30 warning-pulse" />
      )}
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-between items-center bg-gradient-to-b from-background to-transparent">
        <h1 className="text-xl font-bold">
          💎 Diamond Hands Test
        </h1>
        <ConnectWallet />
      </header>

      {/* FUD Ticker (shown while holding) */}
      <FudTicker isActive={gameState === "holding"} elapsedTime={elapsedTime} />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-20">
        {gameState === "idle" && (
          <div className="flex flex-col items-center gap-8 text-center">
            <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-diamond to-paper bg-clip-text text-transparent">
              握力測定
            </h2>
            <p className="text-gray-400 max-w-md">
              FUDに耐えてボタンを押し続けろ。
              <br />
              60秒以上耐えれば「Diamond Hands」の称号を得られる。
              <br />
              途中で離したら「Paper Hands」の烙印を押される。
            </p>
            <HoldButton
              onHoldStart={startGame}
              onHoldEnd={endGame}
              isHolding={false}
            />
            <p className="text-sm text-gray-600">
              ボタンを押し続けてスタート
            </p>
          </div>
        )}

        {gameState === "holding" && (
          <div className="flex flex-col items-center gap-8">
            <Timer elapsed={elapsedTime} threshold={DIAMOND_HANDS_THRESHOLD} />
            <HoldButton
              onHoldStart={startGame}
              onHoldEnd={endGame}
              isHolding={true}
            />
            <p className="text-fud text-lg font-bold animate-pulse">
              離すな！FUDに負けるな！
            </p>
          </div>
        )}

        {gameState === "released" && result && (
          <ResultScreen
            result={result}
            onPlayAgain={resetGame}
            onMint={handleMint}
            isMinting={isMinting}
            isConnected={isConnected}
            isMinted={isConfirmed}
            txHash={hash}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 p-4 text-center text-sm text-gray-600">
        Built on Base | 大喜利.hack vibecoding mini hackathon
      </footer>
    </main>
  );
}
