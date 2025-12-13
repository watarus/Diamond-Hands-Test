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
  onMessageShown?: (message: string) => void;
}

// ローカルフォールバック（API失敗時用）
const LOCAL_FALLBACK = [
  "🚨 速報: ビットコイン、1時間で30%暴落",
  "⚠️ SECがCoinbaseを提訴、全取引所閉鎖の危機",
  "🔴 あなたのウォレットがハッキングされました",
  "📉 イーサリアム創設者が全ETHを売却",
  "💀 Base チェーン、51%攻撃を受ける",
];

// 60秒超えたら良いニュース（フォールバック）
const GOOD_NEWS_FALLBACK = [
  "🚀 ビットコイン、史上最高値を更新！",
  "💎 あなたは真のダイヤモンドハンズだ！",
  "🎉 Base、取引量で全チェーン1位に！",
  "✨ ETH ETF承認、機関投資家が殺到！",
  "🌟 あなたの握力は伝説級です！",
  "💰 クジラがBTCを大量購入中！",
  "🔥 NFT市場が再び活況！",
  "⭐ Coinbase株が急騰！",
  "🏆 FUDに負けなかった勇者よ！",
  "💫 暗号資産の未来は明るい！",
];

export function FudTicker({ isActive, elapsedTime, onMessageShown }: FudTickerProps) {
  const [messages, setMessages] = useState<FudMessage[]>([]);
  const messageIdRef = useRef(0);

  // FUDバッファ（APIから10個ずつ取得してここにストック）
  const fudBufferRef = useRef<string[]>([]);
  const isFetchingFudRef = useRef(false);

  // Good Newsバッファ（APIから10個ずつ取得）
  const goodNewsBufferRef = useRef<string[]>([]);
  const isFetchingGoodNewsRef = useRef(false);

  // FUD APIから10個取得してバッファに追加
  const fetchFuds = useCallback(async () => {
    if (isFetchingFudRef.current) return;
    isFetchingFudRef.current = true;

    try {
      const res = await fetch("/api/fud");
      if (res.ok) {
        const data = await res.json();
        if (data.fuds && Array.isArray(data.fuds)) {
          fudBufferRef.current.push(...data.fuds);
          console.log(`FUD buffer: +${data.fuds.length}, total: ${fudBufferRef.current.length}`);
        }
      }
    } catch (e) {
      console.error("FUD fetch error:", e);
    } finally {
      isFetchingFudRef.current = false;
    }
  }, []);

  // Good News APIから10個取得してバッファに追加
  const fetchGoodNews = useCallback(async () => {
    if (isFetchingGoodNewsRef.current) return;
    isFetchingGoodNewsRef.current = true;

    try {
      const res = await fetch("/api/good-news");
      if (res.ok) {
        const data = await res.json();
        if (data.news && Array.isArray(data.news)) {
          goodNewsBufferRef.current.push(...data.news);
          console.log(`Good news buffer: +${data.news.length}, total: ${goodNewsBufferRef.current.length}`);
        }
      }
    } catch (e) {
      console.error("Good news fetch error:", e);
    } finally {
      isFetchingGoodNewsRef.current = false;
    }
  }, []);

  // バッファから1個取得（なければフォールバック）、60秒超えたら良いニュース
  const getNextMessage = useCallback((isDiamondMode: boolean): string => {
    // 60秒超えたら良いニュースを返す
    if (isDiamondMode) {
      // バッファにあれば先頭から取る
      if (goodNewsBufferRef.current.length > 0) {
        const news = goodNewsBufferRef.current.shift()!;

        // 残り少なくなったら補充
        if (goodNewsBufferRef.current.length < 5 && !isFetchingGoodNewsRef.current) {
          fetchGoodNews();
        }

        return news;
      }

      // バッファ空ならフォールバック
      return GOOD_NEWS_FALLBACK[Math.floor(Math.random() * GOOD_NEWS_FALLBACK.length)];
    }

    // FUDモード: バッファにあれば先頭から取る
    if (fudBufferRef.current.length > 0) {
      const fud = fudBufferRef.current.shift()!;

      // 残り少なくなったら補充
      if (fudBufferRef.current.length < 5 && !isFetchingFudRef.current) {
        fetchFuds();
      }

      return fud;
    }

    // バッファ空ならフォールバック
    return LOCAL_FALLBACK[Math.floor(Math.random() * LOCAL_FALLBACK.length)];
  }, [fetchFuds, fetchGoodNews]);

  // 初期フェッチ（FUD）
  useEffect(() => {
    fetchFuds();
  }, [fetchFuds]);

  // 55秒に近づいたらGood Newsを先読みフェッチ
  useEffect(() => {
    if (isActive && elapsedTime >= 55 && elapsedTime < 60 && goodNewsBufferRef.current.length === 0) {
      fetchGoodNews();
    }
  }, [isActive, elapsedTime, fetchGoodNews]);

  // Diamond mode check
  const isDiamondMode = elapsedTime >= 60;

  // Add new message (FUD or good news)
  const addMessage = useCallback(() => {
    const text = getNextMessage(isDiamondMode);
    const id = messageIdRef.current++;

    // Report the message to game state (strip emojis for NFT)
    // eslint-disable-next-line no-misleading-character-class
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim();
    onMessageShown?.(cleanText);

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
  }, [getNextMessage, onMessageShown, isDiamondMode]);

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

  // Spawn messages based on elapsed time
  const lastSpawnRef = useRef(0);
  useEffect(() => {
    if (!isActive) return;

    // Calculate spawn interval and count based on elapsed time
    const getSpawnConfig = () => {
      // 60秒超えたら良いニュースモード（穏やかに）
      if (elapsedTime >= 60) return { interval: 2000, count: 1 };

      // FUDモード: 序盤は少なく、終盤に向けて徐々に増加（ただし控えめ）
      if (elapsedTime < 5)  return { interval: 2500, count: 1 };
      if (elapsedTime < 15) return { interval: 2000, count: 1 };
      if (elapsedTime < 25) return { interval: 1500, count: 2 };
      if (elapsedTime < 35) return { interval: 1200, count: 2 };
      if (elapsedTime < 45) return { interval: 1000, count: 2 };
      if (elapsedTime < 52) return { interval: 800, count: 3 };
      if (elapsedTime < 57) return { interval: 700, count: 3 };
      return { interval: 600, count: 3 }; // ラスト3秒も3個に軽減
    };

    const now = Date.now();
    const { interval, count } = getSpawnConfig();

    if (now - lastSpawnRef.current >= interval) {
      lastSpawnRef.current = now;
      // Spawn multiple messages at once
      for (let i = 0; i < count; i++) {
        setTimeout(() => addMessage(), i * 100);
      }
    }
  }, [isActive, elapsedTime, addMessage]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`fud-ticker absolute whitespace-nowrap font-bold drop-shadow-lg ${
            isDiamondMode ? "text-diamond" : "text-fud"
          }`}
          style={{
            top: `${msg.top}%`,
            fontSize: `${msg.fontSize}px`,
            ["--duration" as string]: `${msg.duration}s`,
            textShadow: isDiamondMode
              ? "0 0 10px rgba(0, 212, 255, 0.5)"
              : "0 0 10px rgba(255, 51, 51, 0.5)",
          }}
        >
          {msg.text}
        </div>
      ))}
    </div>
  );
}
