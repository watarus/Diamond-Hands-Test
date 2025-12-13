"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface FudMessage {
  id: number;
  text: string;
  top: number;
  duration: number;
  fontSize: number;
}

interface FudTickerProps {
  isActive: boolean;
  elapsedTime: number;
}

// Fallback FUD messages when API is not available
const FALLBACK_FUDS = [
  "🚨 速報: ビットコイン、1時間で30%暴落",
  "⚠️ SECがCoinbaseを提訴、全取引所閉鎖の危機",
  "🔴 あなたのウォレットがハッキングされました",
  "📉 イーサリアム創設者が全ETHを売却",
  "💀 Base チェーン、51%攻撃を受ける",
  "🚨 Binanceが破産申請を検討中",
  "⚠️ 米国、仮想通貨全面禁止法案を可決",
  "🔴 Tether、準備金不足で崩壊の兆し",
  "📉 NFT市場、99.9%の価値を失う",
  "💀 主要取引所がハッキングされ全資産流出",
  "🚨 中国、マイニングを完全禁止",
  "⚠️ あなたの秘密鍵が流出しています",
  "🔴 仮想通貨冬の時代、さらに5年続く見込み",
  "📉 ステーブルコイン全種がデペッグ",
  "💀 DeFiプロトコルで$500M規模のエクスプロイト",
  "🚨 ETF申請、全て却下される",
  "⚠️ 大口クジラが大量売り開始",
  "🔴 マイニング報酬、明日からゼロに",
  "📉 取引手数料が10倍に高騰",
  "💀 主要ブリッジがハッキング、資金凍結",
];

export function FudTicker({ isActive, elapsedTime }: FudTickerProps) {
  const [messages, setMessages] = useState<FudMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messageIdRef = useRef(0);
  const lastFetchRef = useRef(0);

  // Fetch FUD from API
  const fetchFud = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch("/api/fud");
      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      return data.fud;
    } catch {
      // Fallback to local FUD
      return FALLBACK_FUDS[Math.floor(Math.random() * FALLBACK_FUDS.length)];
    }
  }, []);

  // Get random FUD (either from API or fallback)
  const getRandomFud = useCallback(async (): Promise<string> => {
    const now = Date.now();
    // Rate limit API calls to every 2 seconds
    if (now - lastFetchRef.current < 2000 || isLoading) {
      return FALLBACK_FUDS[Math.floor(Math.random() * FALLBACK_FUDS.length)];
    }

    lastFetchRef.current = now;
    setIsLoading(true);
    const fud = await fetchFud();
    setIsLoading(false);
    return fud;
  }, [fetchFud, isLoading]);

  // Add new FUD message
  const addMessage = useCallback(async () => {
    const text = await getRandomFud();
    const id = messageIdRef.current++;

    // Random position and styling
    const top = Math.random() * 80 + 5; // 5-85% from top
    const duration = 8 + Math.random() * 4; // 8-12 seconds
    const fontSize = 16 + Math.random() * 12; // 16-28px

    setMessages((prev) => [
      ...prev,
      { id, text, top, duration, fontSize },
    ]);

    // Remove message after animation completes
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, duration * 1000);
  }, [getRandomFud]);

  // Initial FUD when game starts
  const hasStartedRef = useRef(false);
  useEffect(() => {
    if (isActive && !hasStartedRef.current) {
      hasStartedRef.current = true;
      addMessage();
    }
    if (!isActive) {
      hasStartedRef.current = false;
      setMessages([]);
    }
  }, [isActive, addMessage]);

  // Spawn FUD messages based on elapsed time
  const lastSpawnRef = useRef(0);
  useEffect(() => {
    if (!isActive) return;

    // Calculate spawn interval and count based on elapsed time
    const getSpawnConfig = () => {
      if (elapsedTime < 10) return { interval: 8000, count: 1 };
      if (elapsedTime < 20) return { interval: 6000, count: 1 };
      if (elapsedTime < 35) return { interval: 3500, count: 1 };
      if (elapsedTime < 45) return { interval: 1500, count: 1 };
      if (elapsedTime < 52) return { interval: 600, count: 2 };  // 2個同時
      if (elapsedTime < 57) return { interval: 300, count: 3 };  // 3個同時
      return { interval: 150, count: 4 }; // ラスト3秒は4個同時で0.15秒ごと
    };

    const now = Date.now();
    const { interval, count } = getSpawnConfig();

    if (now - lastSpawnRef.current >= interval) {
      lastSpawnRef.current = now;
      // Spawn multiple FUDs at once
      for (let i = 0; i < count; i++) {
        setTimeout(() => addMessage(), i * 50);
      }
    }
  }, [isActive, elapsedTime, addMessage]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className="fud-ticker absolute whitespace-nowrap text-fud font-bold drop-shadow-lg"
          style={{
            top: `${msg.top}%`,
            fontSize: `${msg.fontSize}px`,
            ["--duration" as string]: `${msg.duration}s`,
            textShadow: "0 0 10px rgba(255, 51, 51, 0.5)",
          }}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
