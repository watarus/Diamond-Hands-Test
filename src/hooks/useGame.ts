"use client";

import { useState, useCallback, useRef, useEffect } from "react";

export type GameState = "idle" | "holding" | "released";

export interface GameResult {
  duration: number;
  isDiamondHands: boolean;
  messages: string[]; // FUD (< 60s) or Good News (>= 60s)
}

const DIAMOND_HANDS_THRESHOLD = 60; // 60秒以上でDiamond Hands

export function useGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  const [shownMessages, setShownMessages] = useState<string[]>([]);

  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Add a message to the list (FUD or Good News)
  const addMessage = useCallback((message: string) => {
    setShownMessages((prev) => {
      if (prev.includes(message)) return prev;
      return [...prev, message].slice(-20);
    });
  }, []);

  // 60秒超えたらメッセージリストをクリア（NFTにはGood Newsだけ記録）
  const prevElapsedRef = useRef(0);
  useEffect(() => {
    if (prevElapsedRef.current < DIAMOND_HANDS_THRESHOLD && elapsedTime >= DIAMOND_HANDS_THRESHOLD) {
      setShownMessages([]);
    }
    prevElapsedRef.current = elapsedTime;
  }, [elapsedTime]);

  const startGame = useCallback(() => {
    setGameState("holding");
    setElapsedTime(0);
    setResult(null);
    setShownMessages([]);
    startTimeRef.current = Date.now();
    prevElapsedRef.current = 0;

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        setElapsedTime(elapsed);
      }
    }, 1000);
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
      messages: shownMessages,
    });
  }, [shownMessages]);

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
    addMessage,
    DIAMOND_HANDS_THRESHOLD,
  };
}
