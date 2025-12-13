"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type GameState = "idle" | "holding" | "released";

export interface GameResult {
  duration: number;
  isDiamondHands: boolean;
}

const DIAMOND_HANDS_THRESHOLD = 60; // 60秒以上でDiamond Hands

export function useGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = useCallback(() => {
    setGameState("holding");
    setElapsedTime(0);
    setResult(null);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);
      }
    }, 100);
  }, []);

  const endGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const finalTime = startTimeRef.current
      ? (Date.now() - startTimeRef.current) / 1000
      : 0;

    setGameState("released");
    setResult({
      duration: finalTime,
      isDiamondHands: finalTime >= DIAMOND_HANDS_THRESHOLD,
    });
  }, []);

  const resetGame = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setGameState("idle");
    setElapsedTime(0);
    setResult(null);
    startTimeRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    gameState,
    elapsedTime,
    result,
    startGame,
    endGame,
    resetGame,
    DIAMOND_HANDS_THRESHOLD,
  };
}
