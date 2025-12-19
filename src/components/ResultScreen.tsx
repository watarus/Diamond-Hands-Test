"use client";

import { useState, useEffect } from "react";
import type { GameResult } from "@/hooks/useGame";
import { useMint } from "@/hooks/useMint";
import { DIAMOND_HANDS_ADDRESS } from "@/lib/contracts";
import { sdk } from "@farcaster/miniapp-sdk";
import { useComposeCast } from "@coinbase/onchainkit/minikit";

type Platform = "base" | "farcaster" | "browser";

// Share Button Component
function ShareButton({
  shareTarget,
  duration,
  isDiamondHands,
  isMinted,
  tokenId,
  currentPlatform,
}: {
  shareTarget: "native" | "twitter";
  duration: number;
  isDiamondHands: boolean;
  isMinted?: boolean;
  tokenId?: string;
  currentPlatform: Platform;
}) {
  const { composeCast } = useComposeCast();
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";

  // Build share URL - use home page with shared param for mini app compatibility
  // tokenId is included so OG image can fetch FUDs from contract
  let resultUrl = `${siteUrl}/?shared=true&duration=${Math.floor(duration)}`;
  if (isMinted) {
    resultUrl += "&minted=true";
  }
  if (tokenId) {
    resultUrl += `&tokenId=${tokenId}`;
  }

  const emoji = isDiamondHands ? "💎" : "📄";
  const title = isDiamondHands ? "Diamond Hands" : "Paper Hands";
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const resultText = isDiamondHands
    ? `${timeStr} FUDに耐え抜いた！`
    : `${timeStr}で心が折れた...`;

  const handleShare = async () => {
    if (shareTarget === "native") {
      const text = `${emoji} ${title}! ${resultText} - Diamond Hands Test on Base`;

      if (currentPlatform === "base") {
        // In Base app: use composeCast from OnchainKit MiniKit
        composeCast({
          text,
          embeds: [resultUrl],
        });
      } else if (currentPlatform === "farcaster") {
        // In Farcaster: share to Warpcast via SDK
        const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(resultUrl)}`;
        try {
          await sdk.actions.openUrl(composeUrl);
        } catch {
          window.open(composeUrl, "_blank");
        }
      } else {
        // In browser: share to Warpcast
        const composeUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(resultUrl)}`;
        window.open(composeUrl, "_blank");
      }
    } else {
      // Twitter/X
      const text = `${emoji} ${title}! ${timeStr} ${isDiamondHands ? "FUDに耐え抜いた！" : "で心が折れた..."} #DiamondHandsTest #Base ${resultUrl}`;
      const webUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;

      if (currentPlatform === "farcaster" || currentPlatform === "base") {
        // In mini app: use SDK to open external URL
        try {
          await sdk.actions.openUrl(webUrl);
        } catch {
          window.open(webUrl, "_blank");
        }
      } else {
        window.open(webUrl, "_blank");
      }
    }
  };

  // Dynamic button label based on platform
  const getNativeShareLabel = () => {
    if (currentPlatform === "farcaster") return "💬 Farcaster";
    if (currentPlatform === "base") return "🔵 Base";
    return "💬 Warpcast";
  };

  return (
    <button
      onClick={handleShare}
      className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm transition-all"
    >
      {shareTarget === "native" ? getNativeShareLabel() : "𝕏 Twitter"}
    </button>
  );
}

// External Link Component (uses SDK in Mini App, regular link in browser)
function ExternalLink({ href, children, className, platform }: { href: string; children: React.ReactNode; className?: string; platform: Platform }) {
  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (platform === "browser") {
      window.open(href, "_blank");
    } else {
      try {
        await sdk.actions.openUrl(href);
      } catch {
        window.open(href, "_blank");
      }
    }
  };

  return (
    <button onClick={handleClick} className={className}>
      {children}
    </button>
  );
}

// FUD positions for preview (12 positions)
const FUD_POSITIONS = [
  { top: 8, left: 5 },
  { top: 15, left: 50 },
  { top: 22, left: 10 },
  { top: 29, left: 55 },
  { top: 36, left: 5 },
  { top: 43, left: 50 },
  { top: 50, left: 8 },
  { top: 57, left: 52 },
  { top: 64, left: 5 },
  { top: 71, left: 50 },
  { top: 78, left: 10 },
  { top: 85, left: 55 },
];

// NFT Preview Component - uses messages passed from parent (already supplemented)
function NftPreview({ duration, isDiamondHands, txHash, messages, platform }: { duration: number; isDiamondHands: boolean; txHash?: string; messages: string[]; platform: Platform }) {
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-900 rounded-xl">
      <div className={`relative w-56 h-56 rounded-lg flex flex-col items-center justify-center overflow-hidden ${isDiamondHands ? "bg-gradient-to-br from-cyan-400 to-blue-600" : "bg-gradient-to-br from-gray-600 to-gray-800"}`}>
        {/* Messages (FUD for Paper, Good News for Diamond) */}
        {messages.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {messages.slice(0, 12).map((msg, i) => (
              <span
                key={i}
                className={`absolute text-[7px] font-bold whitespace-nowrap ${isDiamondHands ? "text-cyan-200" : "text-red-500"}`}
                style={{
                  top: `${FUD_POSITIONS[i]?.top || 50}%`,
                  left: `${FUD_POSITIONS[i]?.left || 50}%`,
                  opacity: 0.7,
                }}
              >
                {msg}
              </span>
            ))}
          </div>
        )}
        <span className="text-6xl z-10 drop-shadow-lg">{isDiamondHands ? "💎" : "📄"}</span>
        <span className="text-white font-bold mt-2 z-10 drop-shadow-lg">{isDiamondHands ? "DIAMOND HANDS" : "PAPER HANDS"}</span>
        <span className="text-white/80 text-sm z-10 drop-shadow">{timeStr}</span>
      </div>
      <p className="text-green-400 text-sm">✓ Minted successfully!</p>
      {txHash && (
        <ExternalLink
          href={`https://basescan.org/tx/${txHash}`}
          className="text-blue-400 hover:text-blue-300 text-xs underline"
          platform={platform}
        >
          View on BaseScan
        </ExternalLink>
      )}
      <ExternalLink
        href={`https://opensea.io/assets/base/${DIAMOND_HANDS_ADDRESS}`}
        className="text-blue-400 hover:text-blue-300 text-xs underline"
        platform={platform}
      >
        View on OpenSea
      </ExternalLink>
    </div>
  );
}

interface ResultScreenProps {
  result: GameResult;
  onPlayAgain: () => void;
  isConnected: boolean;
  address?: `0x${string}`;
  platform: Platform;
}

export function ResultScreen({
  result,
  onPlayAgain,
  isConnected,
  address,
  platform,
}: ResultScreenProps) {
  const { duration, isDiamondHands, messages } = result;
  const [supplementedMessages, setSupplementedMessages] = useState<string[]>(messages);

  // Use the mint hook for sendCalls with paymaster support
  const {
    mint,
    hash: txHash,
    tokenId: mintedTokenId,
    isPending,
    isConfirming,
    isConfirmed: isMinted,
    error: mintError,
  } = useMint();

  const tokenId = mintedTokenId?.toString();
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);

  // Fetch additional messages if we don't have enough for NFT (need 12)
  // Diamond Hands: fetch good news, Paper Hands: fetch FUD
  useEffect(() => {
    if (messages.length < 12) {
      const apiUrl = isDiamondHands ? "/api/good-news" : "/api/fud";
      const dataKey = isDiamondHands ? "news" : "fuds";

      fetch(apiUrl)
        .then(res => res.json())
        .then(data => {
          if (data[dataKey] && Array.isArray(data[dataKey])) {
            // Combine with existing, avoid duplicates, take up to 12
            const combined = [...messages];
            for (const msg of data[dataKey]) {
              if (!combined.includes(msg) && combined.length < 12) {
                combined.push(msg);
              }
            }
            setSupplementedMessages(combined);
            console.log("[Mint] Supplemented messages:", messages.length, "->", combined.length);
          }
        })
        .catch(console.error);
    }
  }, [messages, isDiamondHands]);

  const handleMint = async () => {
    if (!address) return;
    await mint(address, duration, supplementedMessages);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 text-center">
      {/* NFT Preview after minting */}
      {isMinted ? (
        <NftPreview duration={duration} isDiamondHands={isDiamondHands} txHash={txHash} messages={supplementedMessages} platform={platform} />
      ) : (
        <>
          {/* Result Icon */}
          <div className="text-8xl">
            {isDiamondHands ? "💎" : "📄"}
          </div>

          {/* Title */}
          <h1
            className={`text-4xl md:text-6xl font-bold ${
              isDiamondHands ? "text-diamond" : "text-paper"
            }`}
          >
            {isDiamondHands ? "DIAMOND HANDS" : "PAPER HANDS"}
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-400">
            {isDiamondHands
              ? "あなたはFUDに耐えきった！真の握力の持ち主だ。"
              : "あなたはFUDに負けた...握力雑魚です。"}
          </p>

          {/* Duration */}
          <div className="bg-gray-900 rounded-xl p-6 min-w-[300px]">
            <p className="text-sm text-gray-500 mb-2">YOUR HODL TIME</p>
            <p className="font-mono text-4xl font-bold">
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </p>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        {!isMinted && isConnected && address && (
          <button
            onClick={handleMint}
            disabled={isPending || isConfirming}
            className={`
              px-8 py-4 rounded-xl font-bold text-lg w-full
              ${isDiamondHands
                ? "bg-diamond text-black hover:bg-diamond/80"
                : "bg-paper text-black hover:bg-paper/80"
              }
              ${(isPending || isConfirming) ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isPending
              ? "Waiting for wallet..."
              : isConfirming
              ? "Confirming..."
              : isDiamondHands
              ? "Mint Diamond Hands NFT 💎"
              : "Mint Paper Hands SBT 📄"}
          </button>
        )}

        {mintError && (
          <p className="text-red-500 text-sm">
            Error: {mintError.message}
          </p>
        )}

        {!isMinted && !isConnected && (
          <p className="text-gray-500 text-sm">
            ウォレットを接続してNFT/SBTをミント
          </p>
        )}

        <button
          onClick={onPlayAgain}
          className="px-8 py-4 rounded-xl font-bold text-lg bg-gray-800 text-white hover:bg-gray-700 transition-all duration-200"
        >
          Play Again
        </button>
      </div>

      {/* Share - only show after minting */}
      {isMinted && (
        <div className="flex flex-col gap-2">
          <p className="text-gray-500 text-sm">NFTをシェア</p>
          <div className="flex gap-2">
            <ShareButton
              shareTarget="native"
              duration={duration}
              isDiamondHands={isDiamondHands}
              isMinted={isMinted}
              tokenId={tokenId}
              currentPlatform={platform}
            />
            <ShareButton
              shareTarget="twitter"
              duration={duration}
              isDiamondHands={isDiamondHands}
              isMinted={isMinted}
              tokenId={tokenId}
              currentPlatform={platform}
            />
          </div>
        </div>
      )}
    </div>
  );
}
