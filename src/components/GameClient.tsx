"use client";

import { useAccount } from "wagmi";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { getCapabilities } from "@wagmi/core";
import { wagmiConfig } from "@/providers/Providers";
import { base } from "wagmi/chains";
import { useGame } from "@/hooks/useGame";
import { useFrameSDK } from "@/hooks/useFrameSDK";
import { HoldButton } from "@/components/HoldButton";
import { Timer } from "@/components/Timer";
import { FudTicker } from "@/components/FudTicker";
import { ResultScreen } from "@/components/ResultScreen";
import { ConnectWallet } from "@/components/ConnectWallet";

// Shared result view component
function SharedResultView({ onStartGame }: { onStartGame: () => void }) {
  const searchParams = useSearchParams();
  const duration = parseInt(searchParams.get("duration") || "0");
  const isDiamond = duration >= 60;

  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="text-8xl">{isDiamond ? "💎" : "📄"}</div>
      <h1
        className={`text-4xl font-bold ${
          isDiamond ? "text-diamond" : "text-paper"
        }`}
      >
        {isDiamond ? "Diamond Hands!" : "Paper Hands..."}
      </h1>
      <div className="text-5xl font-mono font-bold text-white">
        {timeStr}
      </div>
      <p className={`text-lg ${isDiamond ? "text-diamond" : "text-paper"}`}>
        {isDiamond ? "FUDに耐え抜いた！" : "心が折れた..."}
      </p>
      <button
        onClick={onStartGame}
        className="mt-4 px-8 py-4 bg-diamond text-black font-bold text-lg rounded-xl hover:opacity-80 transition-all"
      >
        自分も挑戦する
      </button>
    </div>
  );
}

function GameContent() {
  const { platform } = useFrameSDK();
  const { isConnected, address } = useAccount();
  const searchParams = useSearchParams();
  const isSharedView = searchParams.get("shared") === "true";
  const [showGame, setShowGame] = useState(false);
  const hasLoggedCapabilities = useRef(false);

  // Log wallet capabilities when connected
  useEffect(() => {
    // Always send wallet state to server for debugging
    fetch("/api/debug/paymaster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "wallet_state",
        address: address || null,
        isConnected,
        hasLoggedCapabilities: hasLoggedCapabilities.current,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    if (!address || hasLoggedCapabilities.current) return;

    const logCapabilities = async () => {
      try {
        const capabilities = await getCapabilities(wagmiConfig, {
          account: address,
        });

        const baseCapabilities = capabilities[base.id];
        const supportsPaymaster = !!baseCapabilities?.paymasterService?.supported;

        // Send to server for logging
        fetch("/api/debug/paymaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "capabilities",
            account: address,
            capabilities,
            supportsPaymaster,
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});

        hasLoggedCapabilities.current = true;
      } catch (e) {
        // Send error to server for logging
        fetch("/api/debug/paymaster", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "capabilities_error",
            account: address,
            error: e instanceof Error ? e.message : String(e),
            supportsPaymaster: "unknown",
            timestamp: new Date().toISOString(),
          }),
        }).catch(() => {});
        hasLoggedCapabilities.current = true;
      }
    };

    logCapabilities();
  }, [address, isConnected]);

  const {
    gameState,
    elapsedTime,
    result,
    startGame,
    endGame,
    resetGame,
    addMessage,
    DIAMOND_HANDS_THRESHOLD,
  } = useGame();

  // Progressive screen effects based on elapsed time
  const getScreenEffects = () => {
    if (gameState !== "holding") return "";

    // 60秒超えたらダイヤモンドモード（明るい背景）
    if (elapsedTime >= 60) {
      return "diamond-mode";
    }

    const effects: string[] = [];

    if (elapsedTime > 30) effects.push("screen-shake");
    if (elapsedTime > 45) effects.push("screen-flicker");
    if (elapsedTime > 50) {
      effects.length = 0; // Clear previous
      effects.push("screen-shake-intense");
    }
    if (elapsedTime > 55) {
      effects.length = 0;
      effects.push("chaos-mode");
    }

    return effects.join(" ");
  };

  // Show red flash overlay in final seconds (not after 60s)
  const showRedFlash = gameState === "holding" && elapsedTime > 50 && elapsedTime < 60;
  const showWarningPulse = gameState === "holding" && elapsedTime > 45 && elapsedTime < 60;

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
        <ConnectWallet platform={platform} />
      </header>

      {/* FUD Ticker (shown while holding) */}
      <FudTicker isActive={gameState === "holding"} elapsedTime={elapsedTime} onMessageShown={addMessage} walletAddress={address} />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4 pt-20">
        {/* Shared view - when someone opens a shared link */}
        {isSharedView && !showGame && gameState === "idle" && (
          <SharedResultView onStartGame={() => setShowGame(true)} />
        )}

        {/* Game view */}
        {(!isSharedView || showGame) && (gameState === "idle" || gameState === "holding") && (
          <div className="flex flex-col items-center gap-8 text-center">
            {gameState === "idle" && (
              <>
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
              </>
            )}
            {gameState === "holding" && (
              <Timer elapsed={elapsedTime} threshold={DIAMOND_HANDS_THRESHOLD} />
            )}
            {/* Single HoldButton - never unmounts during hold */}
            <HoldButton
              onHoldStart={startGame}
              onHoldEnd={endGame}
              isHolding={gameState === "holding"}
            />
            {gameState === "idle" && (
              <p className="text-sm text-gray-600">
                ボタンを押し続けてスタート
              </p>
            )}
            {gameState === "holding" && (
              <p className={`text-lg font-bold animate-pulse ${
                elapsedTime >= 60 ? "text-diamond" : "text-fud"
              }`}>
                {elapsedTime >= 60
                  ? "💎 Diamond Hands達成！どこまでいける？"
                  : "離すな！FUDに負けるな！"}
              </p>
            )}
          </div>
        )}

        {gameState === "released" && result && (
          <ResultScreen
            result={result}
            onPlayAgain={resetGame}
            isConnected={isConnected}
            address={address}
            platform={platform}
          />
        )}
      </div>

    </main>
  );
}

// Wrap in Suspense for useSearchParams
export function GameClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <GameContent />
    </Suspense>
  );
}
