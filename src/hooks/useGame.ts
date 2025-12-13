"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type GameState = "idle" | "holding" | "released";

export interface GameResult {
  duration: number;
  isDiamondHands: boolean;
  fudMessages: string[];
}

const DIAMOND_HANDS_THRESHOLD = 60; // 60秒以上でDiamond Hands

export function useGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [shownFudMessages, setShownFudMessages] = useState<string[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Add a FUD message to the list (called by FudTicker)
  const addFudMessage = useCallback((message: string) => {
    setShownFudMessages((prev) => {
      // Avoid duplicates and keep last 20
      if (prev.includes(message)) return prev;
      return [...prev, message].slice(-20);
    });
  }, []);

  const startGame = useCallback(() => {
    setGameState("holding");
    setElapsedTime(0);
    setResult(null);
    setShownFudMessages([]);
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
      fudMessages: shownFudMessages,
    });
  }, [shownFudMessages]);

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
    addFudMessage,
    DIAMOND_HANDS_THRESHOLD,
  };
}
